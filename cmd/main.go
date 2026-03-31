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

package main

import (
	"crypto/tls"
	"flag"
	"os"

	// Import all Kubernetes client auth plugins (e.g. Azure, GCP, OIDC, etc.)
	// to ensure that exec-entrypoint and run can make use of them.
	_ "k8s.io/client-go/plugin/pkg/client/auth"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/cache"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/healthz"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"
	metricsserver "sigs.k8s.io/controller-runtime/pkg/metrics/server"
	"sigs.k8s.io/controller-runtime/pkg/webhook"

	tenancyv1 "github.com/myorg/tenant-operator/api/v1"
	"github.com/myorg/tenant-operator/internal/controller"
	"github.com/myorg/tenant-operator/internal/ratelimit"
	//+kubebuilder:scaffold:imports
)

var (
	scheme   = runtime.NewScheme()
	setupLog = ctrl.Log.WithName("setup")
)

func init() {
	utilruntime.Must(clientgoscheme.AddToScheme(scheme))
	utilruntime.Must(tenancyv1.AddToScheme(scheme))
	//+kubebuilder:scaffold:scheme
}

func main() {
	var metricsAddr string
	var enableLeaderElection bool
	var probeAddr string
	var secureMetrics bool
	var enableHTTP2 bool

	// ── CLI flags ─────────────────────────────────────────────────────────────
	//
	// OWASP A05 – Security Misconfiguration: all security-relevant parameters
	// are exposed as explicit flags so they can be reviewed in process lists,
	// deployment manifests, and audit logs rather than buried in code.
	//
	// Rate-limit tuning is handled through environment variables
	// (WEBHOOK_GLOBAL_RPS, WEBHOOK_PER_IP_RPS, WEBHOOK_GLOBAL_BURST,
	// WEBHOOK_PER_IP_BURST, WEBHOOK_MAX_BODY_BYTES) so they can be injected
	// via a Kubernetes Secret or ConfigMap without rebuilding the image.
	flag.StringVar(&metricsAddr, "metrics-bind-address", ":8080",
		"Address the metrics endpoint binds to.  In production the kube-rbac-proxy "+
			"sidecar restricts this to 127.0.0.1 and exposes an authenticated HTTPS "+
			"endpoint on :8443.")
	flag.StringVar(&probeAddr, "health-probe-bind-address", ":8081",
		"Address the liveness/readiness probe endpoint binds to.")
	flag.BoolVar(&enableLeaderElection, "leader-elect", true,
		"Enable leader election.  Required when running more than one replica.")
	flag.BoolVar(&secureMetrics, "metrics-secure", false,
		"Serve metrics over HTTPS.  In production this is handled by the "+
			"kube-rbac-proxy sidecar; set to true only when running without the proxy.")
	flag.BoolVar(&enableHTTP2, "enable-http2", false,
		"Enable HTTP/2 on the webhook and metrics servers.  Disabled by default to "+
			"mitigate CVE-2023-44487 (HTTP/2 Rapid Reset) and "+
			"CVE-2023-39325 (HTTP/2 Stream Cancellation).  "+
			"Only enable if your infrastructure requires HTTP/2.")

	opts := zap.Options{Development: true}
	opts.BindFlags(flag.CommandLine)
	flag.Parse()

	ctrl.SetLogger(zap.New(zap.UseFlagOptions(&opts)))

	// ── TLS hardening ─────────────────────────────────────────────────────────
	//
	// OWASP A02 – Cryptographic Failures:
	//
	//  1. HTTP/2 disabled by default (see flag above).
	//  2. Minimum TLS 1.2: TLS 1.0 and 1.1 are officially deprecated (RFC 8996)
	//     and vulnerable to BEAST, POODLE, CRIME, and DROWN attacks.
	//  3. Explicit cipher suite allowlist that:
	//       - requires ECDHE for forward secrecy (PFS)
	//       - requires AEAD mode (GCM / ChaCha20-Poly1305) to prevent
	//         padding-oracle attacks
	//       - excludes CBC, RC4, 3DES, and export-grade ciphers
	//     Note: Go's TLS stack ignores this list for TLS 1.3 (which enforces
	//     secure ciphers by design); the list applies to TLS 1.2 only.

	// hardneTLS returns a tls.Config option that applies the policy above.
	hardenTLS := func(c *tls.Config) {
		// OWASP A02: reject TLS < 1.2.
		c.MinVersion = tls.VersionTLS12

		// OWASP A02: allowlist of forward-secret, AEAD-only cipher suites.
		// Ordered by preference: ECDSA first (smaller keys, faster), then RSA.
		c.CipherSuites = []uint16{
			tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
			tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
			tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256,
			tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256,
		}
	}

	disableHTTP2 := func(c *tls.Config) {
		setupLog.Info("disabling http/2 to mitigate CVE-2023-44487 / CVE-2023-39325")
		c.NextProtos = []string{"http/1.1"}
	}

	// Build the TLS option chain.  hardenTLS always applies; disableHTTP2 is
	// conditional on the flag.
	tlsOpts := []func(*tls.Config){hardenTLS}
	if !enableHTTP2 {
		tlsOpts = append(tlsOpts, disableHTTP2)
	}

	// ── Webhook server with rate limiting ────────────────────────────────────
	//
	// OWASP A04 – Insecure Design: every path registered on the webhook server
	// is automatically wrapped with:
	//   • a global token-bucket limiter (default 50 req/s, burst 20)
	//   • a per-source-IP token-bucket limiter (default 10 req/s, burst 5)
	//   • a 1 MiB body-size cap to prevent memory exhaustion
	//   • Content-Type validation (POST must be application/json)
	//
	// All limits are configurable via environment variables:
	//   WEBHOOK_GLOBAL_RPS, WEBHOOK_GLOBAL_BURST
	//   WEBHOOK_PER_IP_RPS, WEBHOOK_PER_IP_BURST
	//   WEBHOOK_MAX_BODY_BYTES
	//
	// Invalid env-var values are logged and the defaults are preserved, so a
	// misconfigured variable does not silently disable rate limiting.
	// (OWASP A05 – Security Misconfiguration)
	rlCfg := ratelimit.DefaultConfig() // reads env vars, logs bad values
	setupLog.Info("webhook rate limiter configured",
		"globalRPS", rlCfg.GlobalRPS,
		"globalBurst", rlCfg.GlobalBurst,
		"perIPRPS", rlCfg.PerIPRPS,
		"perIPBurst", rlCfg.PerIPBurst,
		"maxBodyBytes", rlCfg.MaxBodyBytes,
	)

	innerWebhookServer := webhook.NewServer(webhook.Options{
		TLSOpts: tlsOpts,
	})
	// Wrap the concrete server so that every Register call automatically
	// applies rate-limiting middleware.
	webhookServer := ratelimit.NewWebhookServer(innerWebhookServer, rlCfg)

	// ── Manager ───────────────────────────────────────────────────────────────
	//
	// Cache is scoped to managed Namespaces only (OWASP A01 – Broken Access
	// Control / least-privilege data access): the controller only caches
	// Namespaces it created, rather than all Namespaces in the cluster.
	mgr, err := ctrl.NewManager(ctrl.GetConfigOrDie(), ctrl.Options{
		Scheme: scheme,
		Metrics: metricsserver.Options{
			BindAddress:   metricsAddr,
			SecureServing: secureMetrics,
			TLSOpts:       tlsOpts,
		},
		WebhookServer:          webhookServer,
		HealthProbeBindAddress: probeAddr,
		LeaderElection:         true,
		LeaderElectionID:       "tenant-operator-leader.example.com",
		Cache: cache.Options{
			ByObject: map[client.Object]cache.ByObject{
				&corev1.Namespace{}: {
					Label: labels.SelectorFromSet(labels.Set{
						"tenancy.example.com/managed": "true",
					}),
				},
			},
		},
	})
	if err != nil {
		setupLog.Error(err, "unable to start manager")
		os.Exit(1)
	}

	// ── Controller ────────────────────────────────────────────────────────────
	if err = (&controller.TenantNamespaceReconciler{
		Client:   mgr.GetClient(),
		Scheme:   mgr.GetScheme(),
		Recorder: mgr.GetEventRecorderFor("tenantnamespace-controller"),
	}).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "TenantNamespace")
		os.Exit(1)
	}

	// ── Webhooks ──────────────────────────────────────────────────────────────
	//
	// ENABLE_WEBHOOKS=false disables webhooks for local development without
	// cert-manager.  Never set this in production — the validating webhook is a
	// critical security gate that rejects malformed or out-of-bounds resource
	// requests before they reach the cluster.
	if os.Getenv("ENABLE_WEBHOOKS") != "false" {
		if err = (&tenancyv1.TenantNamespace{}).SetupWebhookWithManager(mgr); err != nil {
			setupLog.Error(err, "unable to create webhook", "webhook", "TenantNamespace")
			os.Exit(1)
		}
	} else {
		setupLog.Info("WARNING: webhooks disabled via ENABLE_WEBHOOKS=false — " +
			"input validation is NOT enforced; do not use this in production")
	}
	//+kubebuilder:scaffold:builder

	if err := mgr.AddHealthzCheck("healthz", healthz.Ping); err != nil {
		setupLog.Error(err, "unable to set up health check")
		os.Exit(1)
	}
	if err := mgr.AddReadyzCheck("readyz", healthz.Ping); err != nil {
		setupLog.Error(err, "unable to set up ready check")
		os.Exit(1)
	}

	setupLog.Info("starting manager")
	if err := mgr.Start(ctrl.SetupSignalHandler()); err != nil {
		setupLog.Error(err, "problem running manager")
		os.Exit(1)
	}
}
