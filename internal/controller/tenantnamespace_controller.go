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

package controller

import (
	"context"
	"fmt"
	"time"

	corev1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/tools/record"
	"k8s.io/client-go/util/workqueue"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	ctrlOptions "sigs.k8s.io/controller-runtime/pkg/controller"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"

	tenancyv1 "github.com/myorg/tenant-operator/api/v1"
)

const (
	managedLabel       = "tenancy.example.com/managed"
	tenantLabel        = "tenancy.example.com/tenant"
	displayNameLabel   = "tenancy.example.com/displayName"
	conditionTypeReady = "Ready"
	maxStatusMsgLength = 256
)

// TenantNamespaceReconciler reconciles a TenantNamespace object
type TenantNamespaceReconciler struct {
	client.Client
	Scheme   *runtime.Scheme
	Recorder record.EventRecorder
}

//+kubebuilder:rbac:groups=tenancy.example.com,resources=tenantnamespaces,verbs=get;list;watch;update;patch
//+kubebuilder:rbac:groups=tenancy.example.com,resources=tenantnamespaces/status,verbs=get;update;patch
//+kubebuilder:rbac:groups=tenancy.example.com,resources=tenantnamespaces/finalizers,verbs=update
//+kubebuilder:rbac:groups="",resources=namespaces,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups="",resources=resourcequotas,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=networking.k8s.io,resources=networkpolicies,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups="",resources=events,verbs=create;patch

// Reconcile is the main reconciliation loop for TenantNamespace objects.
// It is idempotent: running it any number of times produces the same result.
func (r *TenantNamespaceReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := ctrl.LoggerFrom(ctx)

	// ── 1. FETCH ─────────────────────────────────────────────────────────────
	tenant := &tenancyv1.TenantNamespace{}
	if err := r.Get(ctx, req.NamespacedName, tenant); err != nil {
		if errors.IsNotFound(err) {
			// Object deleted before we could reconcile — nothing to do.
			return ctrl.Result{}, nil
		}
		log.Error(err, "failed to fetch TenantNamespace", "tenant", req.Name)
		return ctrl.Result{}, err
	}

	// ── 2. DELETION GUARD ────────────────────────────────────────────────────
	if !tenant.DeletionTimestamp.IsZero() {
		return r.handleDeletion(ctx, tenant)
	}

	// ── 3. FINALIZER REGISTRATION ────────────────────────────────────────────
	if !controllerutil.ContainsFinalizer(tenant, tenancyv1.TenantNamespaceFinalizer) {
		log.Info("adding finalizer", "tenant", tenant.Name)
		controllerutil.AddFinalizer(tenant, tenancyv1.TenantNamespaceFinalizer)
		if err := r.Update(ctx, tenant); err != nil {
			log.Error(err, "failed to add finalizer", "tenant", tenant.Name)
			return ctrl.Result{}, err
		}
		// Re-trigger via watch; continue on next cycle.
		return ctrl.Result{}, nil
	}

	// Snapshot the status before any mutations so we can issue a single
	// Status().Patch() at the end. Using Patch instead of Update prevents
	// conflicts when the spec is concurrently modified.
	statusBase := tenant.DeepCopy()

	// ── 4. MARK PROVISIONING IN-MEMORY ──────────────────────────────────────
	// We accumulate all status changes and flush them once at the end.
	tenant.Status.Phase = "Provisioning"
	setCondition(&tenant.Status.Conditions, metav1.Condition{
		Type:               conditionTypeReady,
		Status:             metav1.ConditionFalse,
		Reason:             "Provisioning",
		Message:            "reconcile in progress",
		ObservedGeneration: tenant.Generation,
	})

	// ── 5. CREATE OR UPDATE NAMESPACE ────────────────────────────────────────
	ns := &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{Name: tenant.Name},
	}
	op, err := controllerutil.CreateOrUpdate(ctx, r.Client, ns, func() error {
		// Safety check: if the namespace already exists, it must carry our managed label.
		if ns.ResourceVersion != "" {
			if ns.Labels[managedLabel] != "true" {
				return fmt.Errorf("namespace %q exists but is not managed by this operator", ns.Name)
			}
		}
		if ns.Labels == nil {
			ns.Labels = make(map[string]string)
		}
		ns.Labels[managedLabel] = "true"
		ns.Labels[tenantLabel] = tenant.Name
		// OWASP A03 – Injection: DisplayName is user-supplied and may contain
		// characters that are invalid in Kubernetes label values (the webhook
		// already rejects spaces, but we sanitize defensively here too so the
		// controller never sends a label value that the API server would reject).
		ns.Labels[displayNameLabel] = tenancyv1.SanitizeLabelValue(tenant.Spec.DisplayName)
		return controllerutil.SetControllerReference(tenant, ns, r.Scheme)
	})
	if err != nil {
		log.Error(err, "failed to reconcile namespace", "tenant", tenant.Name)
		return r.recordFailure(ctx, tenant, statusBase, "reconcileNamespace", err)
	}
	log.Info("namespace reconciled", "tenant", tenant.Name, "operation", op)

	// ── 6. CREATE OR UPDATE RESOURCEQUOTA ────────────────────────────────────
	quotaName := tenant.Name + "-quota"
	rq := &corev1.ResourceQuota{
		ObjectMeta: metav1.ObjectMeta{
			Name:      quotaName,
			Namespace: tenant.Name,
		},
	}
	op, err = controllerutil.CreateOrUpdate(ctx, r.Client, rq, func() error {
		rq.Spec.Hard = corev1.ResourceList{
			corev1.ResourceRequestsCPU:    tenant.Spec.CpuLimit,
			corev1.ResourceLimitsCPU:      tenant.Spec.CpuLimit,
			corev1.ResourceRequestsMemory: tenant.Spec.MemoryLimit,
			corev1.ResourceLimitsMemory:   tenant.Spec.MemoryLimit,
		}
		return controllerutil.SetControllerReference(tenant, rq, r.Scheme)
	})
	if err != nil {
		log.Error(err, "failed to reconcile resource quota",
			"tenant", tenant.Name, "quota", quotaName)
		return r.recordFailure(ctx, tenant, statusBase, "reconcileResourceQuota", err)
	}
	log.Info("resource quota reconciled", "tenant", tenant.Name, "operation", op)

	// ── 7. NETWORK POLICY ────────────────────────────────────────────────────
	npName := tenant.Name + "-isolation"
	if tenant.Spec.NetworkIsolation {
		np := &networkingv1.NetworkPolicy{
			ObjectMeta: metav1.ObjectMeta{
				Name:      npName,
				Namespace: tenant.Name,
			},
		}
		op, err = controllerutil.CreateOrUpdate(ctx, r.Client, np, func() error {
			np.Spec = networkingv1.NetworkPolicySpec{
				PodSelector: metav1.LabelSelector{}, // select all pods
				Ingress: []networkingv1.NetworkPolicyIngressRule{
					{
						// Allow intra-namespace traffic.
						From: []networkingv1.NetworkPolicyPeer{
							{PodSelector: &metav1.LabelSelector{}},
						},
					},
					{
						// Allow traffic from kube-system.
						From: []networkingv1.NetworkPolicyPeer{
							{
								NamespaceSelector: &metav1.LabelSelector{
									MatchLabels: map[string]string{
										"kubernetes.io/metadata.name": "kube-system",
									},
								},
							},
						},
					},
				},
				PolicyTypes: []networkingv1.PolicyType{
					networkingv1.PolicyTypeIngress,
				},
			}
			return controllerutil.SetControllerReference(tenant, np, r.Scheme)
		})
		if err != nil {
			log.Error(err, "failed to reconcile network policy",
				"tenant", tenant.Name, "networkPolicy", npName)
			return r.recordFailure(ctx, tenant, statusBase, "reconcileNetworkPolicy", err)
		}
		log.Info("network policy reconciled", "tenant", tenant.Name, "operation", op)
	} else {
		// NetworkIsolation disabled — delete the policy if it exists.
		existing := &networkingv1.NetworkPolicy{}
		err = r.Get(ctx, types.NamespacedName{Name: npName, Namespace: tenant.Name}, existing)
		if err == nil {
			if delErr := r.Delete(ctx, existing); delErr != nil && !errors.IsNotFound(delErr) {
				log.Error(delErr, "failed to delete network policy",
					"tenant", tenant.Name, "networkPolicy", npName)
				return r.recordFailure(ctx, tenant, statusBase, "deleteNetworkPolicy", delErr)
			}
			log.Info("network policy deleted", "tenant", tenant.Name, "networkPolicy", npName)
		} else if !errors.IsNotFound(err) {
			log.Error(err, "failed to look up network policy",
				"tenant", tenant.Name, "networkPolicy", npName)
			return r.recordFailure(ctx, tenant, statusBase, "lookupNetworkPolicy", err)
		}
	}

	// ── 8. SET READY STATUS ──────────────────────────────────────────────────
	// Accumulate all final status fields then issue a single Patch.
	// Patch avoids conflicts when spec was concurrently updated between the
	// start of this cycle and now.
	tenant.Status.Phase = "Ready"
	tenant.Status.NamespaceName = tenant.Name
	tenant.Status.LastSyncTime = metav1.Now()
	setCondition(&tenant.Status.Conditions, metav1.Condition{
		Type:               conditionTypeReady,
		Status:             metav1.ConditionTrue,
		Reason:             "Reconciled",
		Message:            "tenant namespace ready",
		ObservedGeneration: tenant.Generation,
	})
	if err := r.Status().Patch(ctx, tenant, client.MergeFrom(statusBase)); err != nil {
		log.Error(err, "failed to patch ready status", "tenant", tenant.Name)
		return ctrl.Result{}, err
	}

	r.Recorder.Event(tenant, corev1.EventTypeNormal, "Reconciled", "Tenant namespace ready")
	log.Info("reconcile complete", "tenant", tenant.Name)
	return ctrl.Result{}, nil
}

// handleDeletion runs the cleanup sequence when a TenantNamespace is being deleted.
func (r *TenantNamespaceReconciler) handleDeletion(
	ctx context.Context, tenant *tenancyv1.TenantNamespace,
) (ctrl.Result, error) {
	log := ctrl.LoggerFrom(ctx)
	log.Info("running deletion cleanup", "tenant", tenant.Name)

	ns := &corev1.Namespace{}
	err := r.Get(ctx, types.NamespacedName{Name: tenant.Name}, ns)
	if err != nil && !errors.IsNotFound(err) {
		log.Error(err, "failed to look up namespace during deletion", "tenant", tenant.Name)
		return ctrl.Result{}, err
	}

	if err == nil {
		// Namespace exists — verify it is ours before touching it.
		if !isManagedByTenant(ns, tenant) {
			log.Info("skipping deletion: namespace not owned by this TenantNamespace",
				"tenant", tenant.Name, "namespace", ns.Name)
		} else {
			if delErr := r.Delete(ctx, ns); delErr != nil && !errors.IsNotFound(delErr) {
				log.Error(delErr, "failed to delete namespace", "tenant", tenant.Name)
				return ctrl.Result{}, delErr
			}
			// Confirm the namespace is gone or at least Terminating before we
			// remove our finalizer. A Terminating namespace will not accept new
			// workloads and is considered effectively deleted for our purposes.
			check := &corev1.Namespace{}
			if getErr := r.Get(ctx, types.NamespacedName{Name: tenant.Name}, check); getErr == nil {
				if check.DeletionTimestamp.IsZero() {
					// Namespace is still active — requeue and wait.
					log.Info("namespace still terminating, requeuing", "tenant", tenant.Name)
					return ctrl.Result{RequeueAfter: 5 * time.Second}, nil
				}
				// Namespace has a DeletionTimestamp: treat as gone.
				log.Info("namespace is terminating, proceeding to remove finalizer", "tenant", tenant.Name)
			} else {
				log.Info("namespace deleted", "tenant", tenant.Name)
			}
		}
	}

	// Remove the finalizer — safe to do now.
	controllerutil.RemoveFinalizer(tenant, tenancyv1.TenantNamespaceFinalizer)
	if patchErr := r.Update(ctx, tenant); patchErr != nil {
		log.Error(patchErr, "failed to remove finalizer", "tenant", tenant.Name)
		return ctrl.Result{}, patchErr
	}
	log.Info("finalizer removed", "tenant", tenant.Name)
	return ctrl.Result{}, nil
}

// recordFailure updates status to Failed via Patch and emits a Warning event,
// then returns the original error so controller-runtime re-queues with
// exponential backoff. It never swallows the original error.
//
// statusBase must be a DeepCopy taken from the tenant BEFORE any status
// mutations in this reconcile cycle, so the Patch only sends the diff.
func (r *TenantNamespaceReconciler) recordFailure(
	ctx context.Context,
	tenant *tenancyv1.TenantNamespace,
	statusBase *tenancyv1.TenantNamespace,
	step string,
	originalErr error,
) (ctrl.Result, error) {
	log := ctrl.LoggerFrom(ctx)
	log.Error(originalErr, "reconcile step failed",
		"tenant", tenant.Name,
		"step", step,
		"error", originalErr.Error(),
	)

	msg := originalErr.Error()
	if len(msg) > maxStatusMsgLength {
		msg = msg[:maxStatusMsgLength]
	}

	tenant.Status.Phase = "Failed"
	setCondition(&tenant.Status.Conditions, metav1.Condition{
		Type:               conditionTypeReady,
		Status:             metav1.ConditionFalse,
		Reason:             "ReconcileError",
		Message:            msg,
		ObservedGeneration: tenant.Generation,
	})
	if statusErr := r.Status().Patch(ctx, tenant, client.MergeFrom(statusBase)); statusErr != nil {
		log.Error(statusErr, "additionally failed to patch failure status",
			"tenant", tenant.Name, "step", step)
	}

	r.Recorder.Event(tenant, corev1.EventTypeWarning, "ReconcileError",
		fmt.Sprintf("step %s failed: %s", step, msg))
	return ctrl.Result{}, originalErr
}

// setCondition upserts a condition in the list by Type.
func setCondition(conditions *[]metav1.Condition, newCond metav1.Condition) {
	newCond.LastTransitionTime = metav1.Now()
	for i, c := range *conditions {
		if c.Type == newCond.Type {
			// Preserve LastTransitionTime if the status did not change.
			if c.Status == newCond.Status {
				newCond.LastTransitionTime = c.LastTransitionTime
			}
			(*conditions)[i] = newCond
			return
		}
	}
	*conditions = append(*conditions, newCond)
}

// isManagedByTenant returns true only if the Namespace carries both the managed
// label and an owner reference pointing to the given TenantNamespace.
// This is the core safety gate: we never touch a Namespace we did not create.
func isManagedByTenant(ns *corev1.Namespace, tenant *tenancyv1.TenantNamespace) bool {
	if ns.Labels[managedLabel] != "true" {
		return false
	}
	for _, ref := range ns.OwnerReferences {
		if ref.UID == tenant.UID {
			return true
		}
	}
	return false
}

// SetupWithManager sets up the controller with the Manager.
// MaxConcurrentReconciles=5 allows parallel reconciliation of different tenants.
// The exponential rate limiter prevents runaway loops on persistent errors.
func (r *TenantNamespaceReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&tenancyv1.TenantNamespace{}).
		Owns(&corev1.Namespace{}).
		WithOptions(ctrlOptions.Options{
			MaxConcurrentReconciles: 5,
			RateLimiter: workqueue.NewItemExponentialFailureRateLimiter(
				5*time.Second,
				5*time.Minute,
			),
		}).
		Complete(r)
}

// Ensure resource package is used (imported for quota values).
var _ = resource.MustParse
