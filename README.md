# k8s-controller

A custom Kubernetes controller built with `controller-runtime`. Watches a custom resource, reconciles desired state against the cluster, and manages the full lifecycle of dependent objects.

![Go 1.22](https://img.shields.io/badge/Go-1.22+-blue) ![Kubernetes 1.28+](https://img.shields.io/badge/Kubernetes-1.28+-blue) ![controller-runtime](https://img.shields.io/badge/controller--runtime-latest-green)

---

## Overview

The reconciler follows the standard observe → diff → act pattern. All mutations go through server-side apply. On error, the request is requeued with exponential backoff.
```
CRD applied → API server → informer cache → work queue → reconcile loop → status update
```

---

## Project Structure
```
k8s-controller/
├── api/v1alpha1/
│   ├── types.go                   # CRD spec + status types
│   └── zz_generated.deepcopy.go
├── internal/controller/
│   ├── reconciler.go              # core reconcile loop
│   ├── reconciler_test.go
│   └── predicates.go              # event filter logic
├── config/
│   ├── crd/                       # generated CRD manifests
│   ├── rbac/                      # ClusterRole + binding
│   └── manager/                   # Deployment manifest
├── main.go
└── Makefile
```

---

## Prerequisites

- Go 1.22+
- `kubectl` configured against a cluster
- `controller-gen` and `kustomize` installed
- `kind` or `minikube` for local dev

---

## Quickstart
```bash
# 1. Clone and install deps
git clone https://github.com/you/k8s-controller && cd k8s-controller && go mod tidy

# 2. Generate CRD manifests and deepcopy
make generate && make manifests

# 3. Install CRDs into the cluster
make install

# 4. Run the controller locally (uses current kubeconfig context)
make run

# 5. Apply a sample resource
kubectl apply -f config/samples/v1alpha1_sample.yaml
```

---

## Reconcile Loop
```go
func (r *Reconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    // 1. fetch the custom resource
    obj := &apiv1alpha1.MyResource{}
    if err := r.Get(ctx, req.NamespacedName, obj); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }

    // 2. examine desired vs actual state
    if err := r.reconcileChildren(ctx, obj); err != nil {
        r.recorder.Event(obj, "Warning", "ReconcileFailed", err.Error())
        return ctrl.Result{}, err // requeue with backoff
    }

    // 3. update status subresource
    obj.Status.Phase = "Ready"
    return ctrl.Result{}, r.Status().Update(ctx, obj)
}
```

---

## Deploying to a Cluster
```bash
# build and push image
make docker-build docker-push IMG=your-registry/k8s-controller:v0.1.0

# deploy via kustomize
make deploy IMG=your-registry/k8s-controller:v0.1.0

# verify
kubectl get pods -n k8s-controller-system
```

---

## RBAC

Permissions are generated automatically from `+kubebuilder:rbac` markers in `reconciler.go`. The controller requires:

- `get, list, watch, create, update, patch, delete` on your custom resource
- `get, list, watch` on dependent resource types (e.g. Deployments, Services)
- `update` on `events` for recorder support

Run `make manifests` after changing markers to regenerate `config/rbac/`.

---

## Testing
```bash
# unit tests (envtest, no real cluster needed)
make test

# integration tests against a live kind cluster
make test-e2e
```

The test suite uses `envtest` to spin up a local API server and etcd. Tests exercise the real reconcile path with no client mocking.

> **Note:** The controller uses a single shared informer cache. Avoid direct API calls inside the reconcile loop — always read from the cache via `r.Get` and `r.List` to prevent thundering-herd on the API server.

---

## Contributing

Open an issue before submitting a large PR. Run `make lint` (golangci-lint) and `make test` before pushing. Commits follow the conventional commits format.
