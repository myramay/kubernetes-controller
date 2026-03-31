/*
Copyright 2026.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// Security model for this webhook package
// ========================================
//
// This file implements both the mutating and validating admission webhooks for
// the TenantNamespace CRD.  Together they form the primary input-validation
// boundary for the entire operator.
//
// OWASP A03 – Injection
//   All user-controlled fields are validated against strict allow-lists before
//   any object is persisted in etcd.  Validation uses field.ErrorList so that
//   ALL errors are reported in a single response rather than failing fast; this
//   prevents an attacker from probing limits one field at a time.
//
// OWASP A04 – Insecure Design
//   Bounds on CpuLimit and MemoryLimit prevent a single tenant from exhausting
//   cluster resources.  The defaults (1 CPU, 2 GiB) are intentionally modest;
//   legitimate tenants can raise them within the webhook-enforced ceiling.
//
// OWASP A05 – Security Misconfiguration
//   NetworkIsolation defaults to true (deny-by-default network posture) on
//   creation so that a tenant with no explicit preference is isolated rather
//   than open.  On updates the user's explicit value is preserved.
//
// OWASP A09 – Security Logging and Monitoring Failures
//   Every webhook invocation is logged with the resource name.  The name is
//   truncated before logging to prevent log-injection via crafted resource
//   names that contain newlines or control characters.

package v1

import (
	"fmt"
	"regexp"
	"strings"
	"unicode"

	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/util/validation"
	"k8s.io/apimachinery/pkg/util/validation/field"
	ctrl "sigs.k8s.io/controller-runtime"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/webhook"
	"sigs.k8s.io/controller-runtime/pkg/webhook/admission"
)

// tenantnamespacelog is the structured logger for this package.
var tenantnamespacelog = logf.Log.WithName("tenantnamespace-resource")

// displayNameRegexp is the allow-list for TenantNamespaceSpec.DisplayName.
//
// OWASP A03 – Injection: spaces are intentionally EXCLUDED even though they
// are human-readable, because DisplayName is written directly into a
// Kubernetes label value (tenancy.example.com/displayName).  Kubernetes label
// values must match ^(([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])?$ and do NOT
// allow whitespace.  Allowing spaces here would cause the API server to reject
// every Namespace write, creating a silent denial-of-service.
//
// If you need a free-form human label, add a separate `description` field and
// store it in an annotation rather than a label.
var displayNameRegexp = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9_.-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$`)

// Quantity bounds enforced by the admission webhook.
// These constants mirror the PRD requirements and are declared here (not in
// the controller) so that the validation boundary is co-located with the
// validation logic.
var (
	minCPU    = resource.MustParse("100m")
	maxCPU    = resource.MustParse("64")
	minMemory = resource.MustParse("128Mi")
	maxMemory = resource.MustParse("256Gi")
)

// maxLogNameLen is the maximum number of characters of a resource name that
// are emitted in log lines.  Truncating prevents log-injection attacks via
// crafted names containing newlines or ANSI escape codes.
//
// OWASP A09 – Security Logging and Monitoring Failures.
const maxLogNameLen = 128

// safeLogName returns a log-safe version of a resource name.
func safeLogName(name string) string {
	if len(name) > maxLogNameLen {
		name = name[:maxLogNameLen] + "…"
	}
	// Strip non-printable / control characters that could corrupt log lines.
	return strings.Map(func(r rune) rune {
		if unicode.IsPrint(r) {
			return r
		}
		return '?'
	}, name)
}

// SetupWebhookWithManager registers both webhooks with the controller manager.
func (r *TenantNamespace) SetupWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr).
		For(r).
		Complete()
}

//+kubebuilder:webhook:path=/mutate-tenancy-example-com-v1-tenantnamespace,mutating=true,failurePolicy=fail,sideEffects=None,groups=tenancy.example.com,resources=tenantnamespaces,verbs=create;update,versions=v1,name=mtenantnamespace.kb.io,admissionReviewVersions=v1

var _ webhook.Defaulter = &TenantNamespace{}

// Default implements webhook.Defaulter.
//
// Sets conservative defaults for zero-value spec fields before the object is
// written to etcd.  This is the last chance to apply safe defaults before the
// validating webhook runs, so it must never introduce invalid values.
func (r *TenantNamespace) Default() {
	tenantnamespacelog.Info("setting defaults", "name", safeLogName(r.Name))

	// Default CPU to 1 core — low enough to prevent accidental resource
	// exhaustion while leaving room for legitimate workloads.
	if r.Spec.CpuLimit.IsZero() {
		r.Spec.CpuLimit = resource.MustParse("1")
	}

	// Default memory to 2 GiB for the same reason.
	if r.Spec.MemoryLimit.IsZero() {
		r.Spec.MemoryLimit = resource.MustParse("2Gi")
	}

	// OWASP A05 – Security Misconfiguration / deny-by-default network posture:
	// NetworkIsolation defaults to true on NEW objects (ResourceVersion == "").
	//
	// We can only set deny-by-default on creation because Go's zero bool value
	// (false) is indistinguishable from an explicit opt-out at the API layer.
	// On updates the user's explicitly stored value is preserved.
	if r.ResourceVersion == "" && !r.Spec.NetworkIsolation {
		r.Spec.NetworkIsolation = true
	}
}

//+kubebuilder:webhook:path=/validate-tenancy-example-com-v1-tenantnamespace,mutating=false,failurePolicy=fail,sideEffects=None,groups=tenancy.example.com,resources=tenantnamespaces,verbs=create;update,versions=v1,name=vtenantnamespace.kb.io,admissionReviewVersions=v1

var _ webhook.Validator = &TenantNamespace{}

// ValidateCreate implements webhook.Validator.
//
// OWASP A03 – Injection: validates ALL user-controlled fields before the
// object enters etcd.  Returns a field.ErrorList aggregate so callers see
// every problem at once rather than discovering them one-by-one.
func (r *TenantNamespace) ValidateCreate() (admission.Warnings, error) {
	tenantnamespacelog.Info("validate create", "name", safeLogName(r.Name))

	// OWASP A03: validate that metadata.name is a legal DNS label.
	// The name becomes the child Namespace name; an invalid name would cause
	// every subsequent Namespace write to be rejected by the API server with a
	// confusing error.
	errs := validateTenantName(r.Name, field.NewPath("metadata").Child("name"))
	errs = append(errs, validateTenantNamespaceSpec(r.Spec, field.NewPath("spec"))...)

	if len(errs) > 0 {
		return nil, errs.ToAggregate()
	}
	return nil, nil
}

// ValidateUpdate implements webhook.Validator.
func (r *TenantNamespace) ValidateUpdate(old runtime.Object) (admission.Warnings, error) {
	tenantnamespacelog.Info("validate update", "name", safeLogName(r.Name))

	errs := validateTenantNamespaceSpec(r.Spec, field.NewPath("spec"))

	oldTN, ok := old.(*TenantNamespace)
	if !ok {
		// This should never happen: controller-runtime always passes the
		// correct type.  Return a validation error rather than panicking so
		// the API server gets a well-formed rejection.
		errs = append(errs, field.InternalError(field.NewPath("spec"),
			fmt.Errorf("unexpected old object type %T; expected *TenantNamespace", old)))
		return nil, errs.ToAggregate()
	}

	specPath := field.NewPath("spec")

	// OWASP A04 – Insecure Design: prevent resource-limit reductions.
	// Reducing limits on a live tenant can immediately evict running pods
	// (OOMKilled / CPU throttle) without the tenant's knowledge.
	if r.Spec.CpuLimit.Cmp(oldTN.Spec.CpuLimit) < 0 {
		errs = append(errs, field.Forbidden(
			specPath.Child("cpuLimit"),
			fmt.Sprintf(
				"reducing cpuLimit from %s to %s is not allowed; "+
					"doing so could evict running workloads without warning",
				oldTN.Spec.CpuLimit.String(), r.Spec.CpuLimit.String()),
		))
	}
	if r.Spec.MemoryLimit.Cmp(oldTN.Spec.MemoryLimit) < 0 {
		errs = append(errs, field.Forbidden(
			specPath.Child("memoryLimit"),
			fmt.Sprintf(
				"reducing memoryLimit from %s to %s is not allowed; "+
					"doing so could OOMKill running workloads without warning",
				oldTN.Spec.MemoryLimit.String(), r.Spec.MemoryLimit.String()),
		))
	}

	if len(errs) > 0 {
		return nil, errs.ToAggregate()
	}
	return nil, nil
}

// ValidateDelete implements webhook.Validator.  No additional validation is
// needed for delete; the finalizer logic in the controller enforces safe
// cleanup.
func (r *TenantNamespace) ValidateDelete() (admission.Warnings, error) {
	tenantnamespacelog.Info("validate delete", "name", safeLogName(r.Name))
	return nil, nil
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// validateTenantName checks that metadata.name is a valid DNS subdomain label.
//
// OWASP A03 – Injection: metadata.name is used as:
//   - the child Namespace name
//   - the prefix for ResourceQuota ("<name>-quota") and NetworkPolicy names
//   - the value of the tenancy.example.com/tenant label
//
// Kubernetes validates Namespace names as DNS labels (RFC 1123), but providing
// an explicit error here gives operators a clear, actionable message at object
// creation time rather than a cryptic API-server rejection at reconcile time.
func validateTenantName(name string, fldPath *field.Path) field.ErrorList {
	errs := field.ErrorList{}
	// k8s.io/apimachinery/pkg/util/validation.IsDNS1123Label returns a slice
	// of human-readable error strings; we forward them as field errors.
	for _, msg := range validation.IsDNS1123Label(name) {
		errs = append(errs, field.Invalid(fldPath, name,
			"TenantNamespace name must be a valid DNS label (used as Namespace name): "+msg))
	}
	return errs
}

// validateTenantNamespaceSpec validates all spec fields.
// It never panics — all errors are collected and returned together.
func validateTenantNamespaceSpec(spec TenantNamespaceSpec, fldPath *field.Path) field.ErrorList {
	errs := field.ErrorList{}

	// ── DisplayName ──────────────────────────────────────────────────────────
	// OWASP A03 – Injection: DisplayName is written directly into a Kubernetes
	// label value.  Label values must not contain whitespace; violating this
	// causes every Namespace reconcile to fail with an API-server rejection.
	dnPath := fldPath.Child("displayName")
	switch {
	case spec.DisplayName == "":
		errs = append(errs, field.Required(dnPath,
			"displayName is required"))
	case len(spec.DisplayName) > 63:
		// Kubernetes label values are capped at 63 characters.
		errs = append(errs, field.TooLong(dnPath, spec.DisplayName, 63))
	case !displayNameRegexp.MatchString(spec.DisplayName):
		errs = append(errs, field.Invalid(dnPath, spec.DisplayName,
			"displayName must start and end with an alphanumeric character and "+
				"may only contain alphanumerics, hyphens (-), underscores (_), and "+
				"dots (.).  Spaces are not permitted because the value is stored "+
				"as a Kubernetes label."))
	}

	// ── CpuLimit ─────────────────────────────────────────────────────────────
	// OWASP A04 – Insecure Design: hard ceiling prevents a single tenant from
	// consuming all cluster CPU.
	cpuPath := fldPath.Child("cpuLimit")
	if spec.CpuLimit.IsZero() {
		errs = append(errs, field.Required(cpuPath, "cpuLimit must not be zero"))
	} else {
		if spec.CpuLimit.Cmp(minCPU) < 0 {
			errs = append(errs, field.Invalid(cpuPath, spec.CpuLimit.String(),
				fmt.Sprintf("cpuLimit must be at least %s", minCPU.String())))
		}
		if spec.CpuLimit.Cmp(maxCPU) > 0 {
			errs = append(errs, field.Invalid(cpuPath, spec.CpuLimit.String(),
				fmt.Sprintf("cpuLimit must not exceed %s (cluster-wide ceiling)", maxCPU.String())))
		}
	}

	// ── MemoryLimit ──────────────────────────────────────────────────────────
	// OWASP A04 – Insecure Design: hard ceiling prevents memory exhaustion.
	memPath := fldPath.Child("memoryLimit")
	if spec.MemoryLimit.IsZero() {
		errs = append(errs, field.Required(memPath, "memoryLimit must not be zero"))
	} else {
		if spec.MemoryLimit.Cmp(minMemory) < 0 {
			errs = append(errs, field.Invalid(memPath, spec.MemoryLimit.String(),
				fmt.Sprintf("memoryLimit must be at least %s", minMemory.String())))
		}
		if spec.MemoryLimit.Cmp(maxMemory) > 0 {
			errs = append(errs, field.Invalid(memPath, spec.MemoryLimit.String(),
				fmt.Sprintf("memoryLimit must not exceed %s (cluster-wide ceiling)", maxMemory.String())))
		}
	}

	return errs
}

// SanitizeLabelValue converts a DisplayName into a string safe to use as a
// Kubernetes label value.
//
// OWASP A03 – Injection: label values must match the pattern
// ^(([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])?$ per the Kubernetes API.
// Storing an unsanitized DisplayName as a label would cause every Namespace
// write to be rejected, creating a denial-of-service.
//
// Transformation rules (applied in order):
//  1. Spaces and hyphens are mapped to '-'.
//  2. Characters outside [A-Za-z0-9_.-] are dropped.
//  3. Leading/trailing '-', '_', '.' are stripped (Kubernetes requires
//     alphanumeric start and end).
//  4. The result is truncated to 63 characters; trailing separators after
//     truncation are stripped again.
//
// This function is exported so the controller can use it without importing
// webhook internals.  The webhook's displayNameRegexp already rejects inputs
// that would sanitize to an empty string (e.g., a name consisting only of
// spaces), so an empty return value here always indicates programmer error.
func SanitizeLabelValue(s string) string {
	var b strings.Builder
	for _, r := range s {
		switch {
		case (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9'):
			b.WriteRune(r)
		case r == '_' || r == '.':
			b.WriteRune(r)
		case r == ' ' || r == '-':
			// Map spaces to hyphens so "My Team" → "My-Team".
			b.WriteRune('-')
		// All other characters are silently dropped.
		}
	}

	result := strings.Trim(b.String(), "-._")
	if len(result) > 63 {
		result = result[:63]
		result = strings.TrimRight(result, "-._")
	}
	return result
}
