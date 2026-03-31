# TenantNamespace Operator

A production-patterned Kubernetes operator that automates tenant namespace
provisioning in shared clusters. Built with kubebuilder as a portfolio project
demonstrating controller-runtime patterns, admission webhooks, and Kubernetes
RBAC.

## What it does

Instead of manually creating namespaces, resource quotas, and network policies
for each team, platform engineers declare a single `TenantNamespace` resource:
```yaml
apiVersion: tenancy.example.com/v1
kind: TenantNamespace
metadata:
  name: team-payments
spec:
  displayName: "Payments Team"
  cpuLimit: "4"
  memoryLimit: "8Gi"
  networkIsolation: true
```

The controller handles the rest — and keeps reality in sync with the spec forever.

## What the controller manages

| Child resource | What it does |
|---|---|
| `Namespace` | Created with managed labels, owner reference for GC |
| `ResourceQuota` | Enforces CPU and memory limits declared in spec |
| `NetworkPolicy` | Isolates tenant traffic when `networkIsolation: true` |

## Architecture
```
TenantNamespace CR
      │
      ▼
┌─────────────────────────┐
│   Validating Webhook    │  Rejects bad input before it hits the cluster
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   Reconcile Loop        │  Observe → Compare → Act
│                         │
│  1. Add finalizer       │
│  2. Create Namespace    │
│  3. Apply ResourceQuota │
│  4. Apply NetworkPolicy │
│  5. Update status       │
└────────────┬────────────┘
             │
             ▼
      Managed Namespace
      + ResourceQuota
      + NetworkPolicy (optional)
```

## Safety properties

- **Never touches namespaces it did not create** — checks for
  `tenancy.example.com/managed=true` label and owner reference before
  any mutation or deletion
- **Finalizer-gated deletion** — child resources are confirmed deleted
  before the finalizer is removed
- **Admission webhook validation** — CPU, memory, and displayName are
  validated and bounded before any object is persisted
- **Least-privilege RBAC** — no wildcards, no cluster-admin, only the
  exact verbs the controller needs
- **Rate-limited reconcile** — exponential backoff prevents runaway loops
- **Leader election** — safe to run multiple replicas
- **Idempotent reconcile** — running it any number of times produces the
  same result as running it once

## Prerequisites

- Go 1.21+
- kubebuilder v3+
- kubectl
- kind
- Docker

## Running locally
```bash
kind create cluster --name tenant-test
make install
make run
```

In a second terminal:
```bash
kubectl apply -f config/samples/tenancy_v1_tenantnamespace.yaml
kubectl get tenantnamespace
kubectl get namespace
kubectl get resourcequota -n team-payments
kubectl get networkpolicy -n team-payments
```

## Running tests
```bash
make test
```

Uses envtest — no cluster required.

## Project structure
```
api/v1/                    CRD types and webhook logic
internal/controller/       Reconcile loop and tests
config/                    Kustomize manifests (CRD, RBAC, webhook)
cmd/main.go                Manager entrypoint
```

## What I would add before running this in production

- Prometheus metrics for reconcile latency and error rates
- Alerting on status.phase=Failed objects
- Namespace name collision detection across tenants
- Audit logging for all mutations
