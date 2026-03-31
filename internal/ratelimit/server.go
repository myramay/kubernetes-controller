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

package ratelimit

import (
	"net/http"

	"sigs.k8s.io/controller-runtime/pkg/webhook"
)

// WebhookServer wraps any webhook.Server and transparently applies the
// Middleware to every handler registered via Register().
//
// controller-runtime calls Register() once per webhook path during
// SetupWebhookWithManager.  By intercepting at that point we ensure
// ALL webhook paths — including any added by future kubebuilder scaffolding
// — are automatically rate-limited without further configuration.
//
// Usage in main.go:
//
//	inner := webhook.NewServer(webhook.Options{...})
//	srv   := ratelimit.NewWebhookServer(inner, ratelimit.DefaultConfig())
//	mgr, _ := ctrl.NewManager(cfg, ctrl.Options{WebhookServer: srv, ...})
type WebhookServer struct {
	// webhook.Server is the concrete server from controller-runtime.
	// Embedding the interface means we inherit all methods; only
	// Register is overridden below.
	webhook.Server

	middleware *Middleware
}

// NewWebhookServer wraps inner with rate limiting derived from cfg.
func NewWebhookServer(inner webhook.Server, cfg Config) *WebhookServer {
	return &WebhookServer{
		Server:     inner,
		middleware: New(cfg),
	}
}

// Register wraps hook with the rate-limiting middleware before forwarding
// the registration to the underlying server.  This is the sole override;
// all other webhook.Server methods (Start, StartedChecker, etc.) delegate
// transparently to the embedded inner server.
func (s *WebhookServer) Register(path string, hook http.Handler) {
	s.Server.Register(path, s.middleware.Wrap(hook))
}
