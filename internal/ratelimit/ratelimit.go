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

// Package ratelimit provides HTTP middleware that enforces per-IP and global
// rate limits on the webhook admission server, following OWASP guidance:
//
//   - A04 Insecure Design: token-bucket rate limits prevent a single caller
//     from flooding the admission server and delaying cluster operations.
//   - A03 Injection: Content-Type validation ensures only well-formed JSON
//     payloads reach the admission decoder.
//   - A04 Insecure Design: MaxBytesReader caps memory consumption from
//     oversized request bodies.
//
// Rate limiting in Kubernetes admission webhook context:
// Although webhook callers are authenticated by the API server, we still
// apply defence-in-depth:
//   - Global limit: caps total admission review throughput regardless of source.
//   - Per-IP limit: prevents a single API-server shard or proxy from
//     monopolising the webhook process under misconfiguration.
//
// All 429 responses include a Retry-After header so callers can back off
// correctly rather than spinning.
package ratelimit

import (
	"net"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"

	"golang.org/x/time/rate"
	"sigs.k8s.io/controller-runtime/pkg/log"
)

var rlLog = log.Log.WithName("ratelimit")

// Limits on request body size.  Kubernetes admission review objects are small
// (kilobytes); 1 MiB is a generous ceiling that still prevents memory
// exhaustion from unexpectedly large payloads.
//
// OWASP A04 – Insecure Design.
const defaultMaxBodyBytes int64 = 1 << 20 // 1 MiB

// Default token-bucket parameters.  These values are intentionally
// conservative; operators in low-traffic clusters can raise them via
// environment variables (see Config.FromEnv).
const (
	defaultGlobalRPS    = float64(50) // total requests per second
	defaultGlobalBurst  = 20
	defaultPerIPRPS     = float64(10) // requests per second per source IP
	defaultPerIPBurst   = 5
	defaultIdleTimeout  = 15 * time.Minute // evict IP entries not seen for this long
	defaultCleanupEvery = 5 * time.Minute  // how often to run eviction
)

// Config holds all tunable parameters for the rate-limiting middleware.
// Zero values are replaced with the package defaults via DefaultConfig().
type Config struct {
	// GlobalRPS is the maximum total admission-review requests per second
	// across all callers combined.  Env: WEBHOOK_GLOBAL_RPS (float).
	GlobalRPS float64

	// GlobalBurst allows short bursts above GlobalRPS.
	// Env: WEBHOOK_GLOBAL_BURST (int).
	GlobalBurst int

	// PerIPRPS is the maximum admission-review requests per second for a
	// single source IP address.  Env: WEBHOOK_PER_IP_RPS (float).
	PerIPRPS float64

	// PerIPBurst allows short bursts above PerIPRPS per source IP.
	// Env: WEBHOOK_PER_IP_BURST (int).
	PerIPBurst int

	// MaxBodyBytes is the maximum allowed request body size in bytes.
	// Env: WEBHOOK_MAX_BODY_BYTES (int64).
	MaxBodyBytes int64

	// IPIdleTimeout is how long an IP entry is kept after its last request.
	IPIdleTimeout time.Duration

	// CleanupInterval is how often the background goroutine evicts stale IPs.
	CleanupInterval time.Duration
}

// DefaultConfig returns production-safe defaults for the rate-limiting
// middleware.  All values can be overridden via environment variables.
func DefaultConfig() Config {
	cfg := Config{
		GlobalRPS:       defaultGlobalRPS,
		GlobalBurst:     defaultGlobalBurst,
		PerIPRPS:        defaultPerIPRPS,
		PerIPBurst:      defaultPerIPBurst,
		MaxBodyBytes:    defaultMaxBodyBytes,
		IPIdleTimeout:   defaultIdleTimeout,
		CleanupInterval: defaultCleanupEvery,
	}
	cfg.applyEnv()
	return cfg
}

// applyEnv overrides fields from environment variables.
// Invalid values are logged and ignored so a misconfigured env variable does
// not silently disable rate limiting (OWASP A05 – Security Misconfiguration).
func (c *Config) applyEnv() {
	if v := os.Getenv("WEBHOOK_GLOBAL_RPS"); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil && f > 0 {
			c.GlobalRPS = f
		} else {
			rlLog.Info("WEBHOOK_GLOBAL_RPS is invalid, using default",
				"value", v, "default", c.GlobalRPS)
		}
	}
	if v := os.Getenv("WEBHOOK_GLOBAL_BURST"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			c.GlobalBurst = n
		} else {
			rlLog.Info("WEBHOOK_GLOBAL_BURST is invalid, using default",
				"value", v, "default", c.GlobalBurst)
		}
	}
	if v := os.Getenv("WEBHOOK_PER_IP_RPS"); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil && f > 0 {
			c.PerIPRPS = f
		} else {
			rlLog.Info("WEBHOOK_PER_IP_RPS is invalid, using default",
				"value", v, "default", c.PerIPRPS)
		}
	}
	if v := os.Getenv("WEBHOOK_PER_IP_BURST"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			c.PerIPBurst = n
		} else {
			rlLog.Info("WEBHOOK_PER_IP_BURST is invalid, using default",
				"value", v, "default", c.PerIPBurst)
		}
	}
	if v := os.Getenv("WEBHOOK_MAX_BODY_BYTES"); v != "" {
		if n, err := strconv.ParseInt(v, 10, 64); err == nil && n > 0 {
			c.MaxBodyBytes = n
		} else {
			rlLog.Info("WEBHOOK_MAX_BODY_BYTES is invalid, using default",
				"value", v, "default", c.MaxBodyBytes)
		}
	}
}

// ipEntry holds a token-bucket limiter and the last-seen timestamp for one IP.
type ipEntry struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// Middleware wraps HTTP handlers with per-IP and global rate limiting,
// body-size enforcement, and Content-Type validation.
type Middleware struct {
	cfg           Config
	globalLimiter *rate.Limiter

	mu         sync.Mutex
	ipLimiters map[string]*ipEntry
}

// New creates a Middleware with the given Config and starts the background
// cleanup goroutine that evicts stale per-IP entries.
func New(cfg Config) *Middleware {
	m := &Middleware{
		cfg:           cfg,
		globalLimiter: rate.NewLimiter(rate.Limit(cfg.GlobalRPS), cfg.GlobalBurst),
		ipLimiters:    make(map[string]*ipEntry),
	}
	go m.cleanupLoop()
	return m
}

// Wrap returns a new http.Handler that enforces all rate limits and validation
// checks before delegating to next.
func (m *Middleware) Wrap(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// ── Body-size cap ────────────────────────────────────────────────────
		// OWASP A04: cap request body to prevent memory exhaustion from
		// artificially large admission review payloads.  The 413 is returned
		// by MaxBytesReader when the limit is exceeded during io.Read.
		r.Body = http.MaxBytesReader(w, r.Body, m.cfg.MaxBodyBytes)

		// ── Content-Type validation ──────────────────────────────────────────
		// OWASP A03: reject non-JSON payloads before they reach the admission
		// decoder.  Only POST requests carry a body; GET is used for health
		// checks on the webhook server.
		if r.Method == http.MethodPost {
			ct := r.Header.Get("Content-Type")
			if ct != "application/json" {
				http.Error(w,
					"Content-Type must be application/json",
					http.StatusUnsupportedMediaType)
				return
			}
		}

		// ── Global token bucket ──────────────────────────────────────────────
		// OWASP A04: a global limiter prevents total admission flood regardless
		// of how many distinct source IPs are involved.
		if !m.globalLimiter.Allow() {
			retryAfter := retryAfterSeconds(m.cfg.GlobalRPS)
			rlLog.Info("global rate limit exceeded — returning 429",
				"path", r.URL.Path, "remoteAddr", r.RemoteAddr)
			w.Header().Set("Retry-After", retryAfter)
			w.Header().Set("Content-Type", "application/json")
			http.Error(w,
				`{"error":"global rate limit exceeded","retryAfter":"`+retryAfter+`s"}`,
				http.StatusTooManyRequests)
			return
		}

		// ── Per-IP token bucket ──────────────────────────────────────────────
		// OWASP A04: a per-IP limiter prevents a single API-server shard or
		// misconfigured proxy from monopolising the webhook process.
		ip := extractIP(r.RemoteAddr)
		if !m.getLimiter(ip).Allow() {
			retryAfter := retryAfterSeconds(m.cfg.PerIPRPS)
			rlLog.Info("per-IP rate limit exceeded — returning 429",
				"ip", ip, "path", r.URL.Path)
			w.Header().Set("Retry-After", retryAfter)
			w.Header().Set("Content-Type", "application/json")
			http.Error(w,
				`{"error":"per-IP rate limit exceeded","retryAfter":"`+retryAfter+`s"}`,
				http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// getLimiter returns the per-IP rate limiter for ip, creating it if necessary.
// All access is protected by the mutex so map writes are safe under
// concurrent requests.
func (m *Middleware) getLimiter(ip string) *rate.Limiter {
	m.mu.Lock()
	defer m.mu.Unlock()

	e, ok := m.ipLimiters[ip]
	if !ok {
		e = &ipEntry{
			limiter: rate.NewLimiter(rate.Limit(m.cfg.PerIPRPS), m.cfg.PerIPBurst),
		}
		m.ipLimiters[ip] = e
	}
	e.lastSeen = time.Now()
	return e.limiter
}

// cleanupLoop runs on a background goroutine and evicts per-IP entries that
// have not been seen for longer than cfg.IPIdleTimeout.  This bounds the
// memory consumed by the IP map even under sustained high-cardinality traffic.
func (m *Middleware) cleanupLoop() {
	ticker := time.NewTicker(m.cfg.CleanupInterval)
	defer ticker.Stop()
	for range ticker.C {
		threshold := time.Now().Add(-m.cfg.IPIdleTimeout)
		m.mu.Lock()
		for ip, e := range m.ipLimiters {
			if e.lastSeen.Before(threshold) {
				delete(m.ipLimiters, ip)
			}
		}
		m.mu.Unlock()
	}
}

// extractIP returns the host portion of a "host:port" address.
// If the address has no port (e.g. a Unix socket path), it is returned as-is.
func extractIP(remoteAddr string) string {
	host, _, err := net.SplitHostPort(remoteAddr)
	if err != nil {
		return remoteAddr
	}
	return host
}

// retryAfterSeconds computes a Retry-After value in whole seconds for a given
// rate (requests per second).  We always round up so clients back off by at
// least one full token-replenishment interval.
func retryAfterSeconds(rps float64) string {
	if rps <= 0 {
		return "1"
	}
	secs := int(1.0/rps) + 1
	return strconv.Itoa(secs)
}
