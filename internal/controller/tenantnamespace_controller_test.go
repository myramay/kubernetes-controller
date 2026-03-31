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
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	corev1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"

	tenancyv1 "github.com/myorg/tenant-operator/api/v1"
)

const (
	timeout  = 10 * time.Second
	interval = 250 * time.Millisecond
	window   = 3 * time.Second
)

// makeTenant is a helper that returns a TenantNamespace with the given name.
func makeTenant(name, cpu, mem string, isolation bool) *tenancyv1.TenantNamespace {
	return &tenancyv1.TenantNamespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: name,
		},
		Spec: tenancyv1.TenantNamespaceSpec{
			DisplayName:      name + "-display",
			CpuLimit:         resource.MustParse(cpu),
			MemoryLimit:      resource.MustParse(mem),
			NetworkIsolation: isolation,
		},
	}
}

var _ = Describe("TenantNamespace Controller", func() {
	// All tests share a background context (provided by BeforeSuite).
	testCtx := context.Background()

	// ──────────────────────────────────────────────────────────────────────────
	// HAPPY PATH
	// ──────────────────────────────────────────────────────────────────────────
	Describe("Happy path", func() {
		const tenantName = "team-alpha"

		AfterEach(func() {
			By("cleaning up TenantNamespace")
			tn := &tenancyv1.TenantNamespace{}
			if err := k8sClient.Get(testCtx, types.NamespacedName{Name: tenantName}, tn); err == nil {
				_ = k8sClient.Delete(testCtx, tn)
			}
		})

		It("should provision namespace, quota, and network policy", func() {
			By("creating the TenantNamespace")
			tn := makeTenant(tenantName, "2", "2Gi", true)
			Expect(k8sClient.Create(testCtx, tn)).To(Succeed())

			By("waiting for status.Phase=Ready")
			Eventually(func(g Gomega) {
				got := &tenancyv1.TenantNamespace{}
				g.Expect(k8sClient.Get(testCtx, types.NamespacedName{Name: tenantName}, got)).To(Succeed())
				g.Expect(got.Status.Phase).To(Equal("Ready"))
			}, timeout, interval).Should(Succeed())

			By("asserting the Namespace exists with correct labels")
			ns := &corev1.Namespace{}
			Expect(k8sClient.Get(testCtx, types.NamespacedName{Name: tenantName}, ns)).To(Succeed())
			Expect(ns.Labels[managedLabel]).To(Equal("true"))
			Expect(ns.Labels[tenantLabel]).To(Equal(tenantName))

			By("asserting the ResourceQuota has correct limits")
			rq := &corev1.ResourceQuota{}
			Expect(k8sClient.Get(testCtx,
				types.NamespacedName{Name: tenantName + "-quota", Namespace: tenantName}, rq)).To(Succeed())
			cpu := resource.MustParse("2")
			mem := resource.MustParse("2Gi")
			Expect(rq.Spec.Hard[corev1.ResourceLimitsCPU]).To(Equal(cpu))
			Expect(rq.Spec.Hard[corev1.ResourceLimitsMemory]).To(Equal(mem))

			By("asserting the NetworkPolicy exists")
			np := &networkingv1.NetworkPolicy{}
			Expect(k8sClient.Get(testCtx,
				types.NamespacedName{Name: tenantName + "-isolation", Namespace: tenantName}, np)).To(Succeed())
		})
	})

	// ──────────────────────────────────────────────────────────────────────────
	// DRIFT RECOVERY
	// ──────────────────────────────────────────────────────────────────────────
	Describe("Drift recovery", func() {
		const tenantName = "team-beta"

		BeforeEach(func() {
			tn := makeTenant(tenantName, "2", "2Gi", true)
			Expect(k8sClient.Create(testCtx, tn)).To(Succeed())
			Eventually(func(g Gomega) {
				got := &tenancyv1.TenantNamespace{}
				g.Expect(k8sClient.Get(testCtx, types.NamespacedName{Name: tenantName}, got)).To(Succeed())
				g.Expect(got.Status.Phase).To(Equal("Ready"))
			}, timeout, interval).Should(Succeed())
		})

		AfterEach(func() {
			tn := &tenancyv1.TenantNamespace{}
			if err := k8sClient.Get(testCtx, types.NamespacedName{Name: tenantName}, tn); err == nil {
				_ = k8sClient.Delete(testCtx, tn)
			}
		})

		It("should recreate a manually deleted Namespace within 10s", func() {
			By("deleting the managed Namespace directly")
			ns := &corev1.Namespace{}
			Expect(k8sClient.Get(testCtx, types.NamespacedName{Name: tenantName}, ns)).To(Succeed())
			Expect(k8sClient.Delete(testCtx, ns)).To(Succeed())

			By("waiting for the Namespace to be recreated")
			Eventually(func(g Gomega) {
				recreated := &corev1.Namespace{}
				g.Expect(k8sClient.Get(testCtx, types.NamespacedName{Name: tenantName}, recreated)).To(Succeed())
				g.Expect(recreated.Labels[managedLabel]).To(Equal("true"))
			}, timeout, interval).Should(Succeed())
		})
	})

	// ──────────────────────────────────────────────────────────────────────────
	// SPEC UPDATES
	// Each It uses a distinct tenant name to avoid collisions when the previous
	// test's managed namespace is still Terminating in envtest.
	// ──────────────────────────────────────────────────────────────────────────
	Describe("Spec updates", func() {
		It("should delete NetworkPolicy when networkIsolation is set to false", func() {
			const tenantName = "team-gamma-np"

			By("creating and waiting for Ready")
			tn := makeTenant(tenantName, "2", "2Gi", true)
			Expect(k8sClient.Create(testCtx, tn)).To(Succeed())
			DeferCleanup(func() {
				t := &tenancyv1.TenantNamespace{}
				if err := k8sClient.Get(testCtx, types.NamespacedName{Name: tenantName}, t); err == nil {
					_ = k8sClient.Delete(testCtx, t)
				}
			})
			Eventually(func(g Gomega) {
				got := &tenancyv1.TenantNamespace{}
				g.Expect(k8sClient.Get(testCtx, types.NamespacedName{Name: tenantName}, got)).To(Succeed())
				g.Expect(got.Status.Phase).To(Equal("Ready"))
			}, timeout, interval).Should(Succeed())

			By("patching networkIsolation=false")
			current := &tenancyv1.TenantNamespace{}
			Expect(k8sClient.Get(testCtx, types.NamespacedName{Name: tenantName}, current)).To(Succeed())
			patch := client.MergeFrom(current.DeepCopy())
			current.Spec.NetworkIsolation = false
			Expect(k8sClient.Patch(testCtx, current, patch)).To(Succeed())

			By("asserting NetworkPolicy is deleted within 10s")
			Eventually(func(g Gomega) {
				np := &networkingv1.NetworkPolicy{}
				err := k8sClient.Get(testCtx,
					types.NamespacedName{Name: tenantName + "-isolation", Namespace: tenantName}, np)
				g.Expect(errors.IsNotFound(err)).To(BeTrue())
			}, timeout, interval).Should(Succeed())
		})

		It("should update ResourceQuota when cpuLimit increases", func() {
			const tenantName = "team-gamma-rq"

			By("creating and waiting for Ready")
			tn := makeTenant(tenantName, "2", "2Gi", true)
			Expect(k8sClient.Create(testCtx, tn)).To(Succeed())
			DeferCleanup(func() {
				t := &tenancyv1.TenantNamespace{}
				if err := k8sClient.Get(testCtx, types.NamespacedName{Name: tenantName}, t); err == nil {
					_ = k8sClient.Delete(testCtx, t)
				}
			})
			Eventually(func(g Gomega) {
				got := &tenancyv1.TenantNamespace{}
				g.Expect(k8sClient.Get(testCtx, types.NamespacedName{Name: tenantName}, got)).To(Succeed())
				g.Expect(got.Status.Phase).To(Equal("Ready"))
			}, timeout, interval).Should(Succeed())

			By("patching cpuLimit to 4")
			current := &tenancyv1.TenantNamespace{}
			Expect(k8sClient.Get(testCtx, types.NamespacedName{Name: tenantName}, current)).To(Succeed())
			patch := client.MergeFrom(current.DeepCopy())
			newCPU := resource.MustParse("4")
			current.Spec.CpuLimit = newCPU
			Expect(k8sClient.Patch(testCtx, current, patch)).To(Succeed())

			By("asserting ResourceQuota reflects the new limit")
			Eventually(func(g Gomega) {
				rq := &corev1.ResourceQuota{}
				g.Expect(k8sClient.Get(testCtx,
					types.NamespacedName{Name: tenantName + "-quota", Namespace: tenantName}, rq)).To(Succeed())
				g.Expect(rq.Spec.Hard[corev1.ResourceLimitsCPU]).To(Equal(newCPU))
			}, timeout, interval).Should(Succeed())
		})
	})

	// ──────────────────────────────────────────────────────────────────────────
	// SAFETY — DO NOT TOUCH FOREIGN NAMESPACES
	// ──────────────────────────────────────────────────────────────────────────
	Describe("Safety: foreign namespace protection", func() {
		const tenantName = "team-delta"

		AfterEach(func() {
			// Clean up the pre-existing namespace.
			existing := &corev1.Namespace{}
			if err := k8sClient.Get(testCtx, types.NamespacedName{Name: tenantName}, existing); err == nil {
				_ = k8sClient.Delete(testCtx, existing)
			}
			tn := &tenancyv1.TenantNamespace{}
			if err := k8sClient.Get(testCtx, types.NamespacedName{Name: tenantName}, tn); err == nil {
				_ = k8sClient.Delete(testCtx, tn)
			}
		})

		It("must never modify a foreign Namespace and must set status=Failed", func() {
			By("creating a plain Namespace with no managed label")
			preExisting := &corev1.Namespace{
				ObjectMeta: metav1.ObjectMeta{
					Name:   tenantName,
					Labels: map[string]string{"owner": "someone-else"},
				},
			}
			Expect(k8sClient.Create(testCtx, preExisting)).To(Succeed())
			originalVersion := preExisting.ResourceVersion

			By("creating a TenantNamespace with the same name")
			tn := makeTenant(tenantName, "2", "2Gi", true)
			Expect(k8sClient.Create(testCtx, tn)).To(Succeed())

			By("asserting the foreign Namespace is never modified (3s Consistently window)")
			Consistently(func(g Gomega) {
				ns := &corev1.Namespace{}
				g.Expect(k8sClient.Get(testCtx, types.NamespacedName{Name: tenantName}, ns)).To(Succeed())
				// The managed label must never be added to a namespace we did not create.
				g.Expect(ns.Labels[managedLabel]).NotTo(Equal("true"))
				// The resource version must not change — nothing mutated the namespace.
				g.Expect(ns.ResourceVersion).To(Equal(originalVersion))
			}, window, interval).Should(Succeed())

			By("asserting status.Phase eventually equals Failed")
			Eventually(func(g Gomega) {
				got := &tenancyv1.TenantNamespace{}
				g.Expect(k8sClient.Get(testCtx, types.NamespacedName{Name: tenantName}, got)).To(Succeed())
				g.Expect(got.Status.Phase).To(Equal("Failed"))
			}, timeout, interval).Should(Succeed())
		})
	})

	// ──────────────────────────────────────────────────────────────────────────
	// DELETION
	// ──────────────────────────────────────────────────────────────────────────
	Describe("Deletion", func() {
		const tenantName = "team-epsilon"

		It("should delete the managed Namespace and remove the finalizer", func() {
			By("creating the TenantNamespace")
			tn := makeTenant(tenantName, "2", "2Gi", false)
			Expect(k8sClient.Create(testCtx, tn)).To(Succeed())

			By("waiting for Ready")
			Eventually(func(g Gomega) {
				got := &tenancyv1.TenantNamespace{}
				g.Expect(k8sClient.Get(testCtx, types.NamespacedName{Name: tenantName}, got)).To(Succeed())
				g.Expect(got.Status.Phase).To(Equal("Ready"))
			}, timeout, interval).Should(Succeed())

			By("capturing the finalizer before deletion")
			current := &tenancyv1.TenantNamespace{}
			Expect(k8sClient.Get(testCtx, types.NamespacedName{Name: tenantName}, current)).To(Succeed())
			Expect(current.Finalizers).To(ContainElement(tenancyv1.TenantNamespaceFinalizer))

			By("deleting the TenantNamespace")
			Expect(k8sClient.Delete(testCtx, current)).To(Succeed())

			By("asserting the managed Namespace is eventually deleted or terminating")
			// envtest does not run the namespace lifecycle controller, so namespaces
			// remain in Terminating state rather than disappearing. We assert that
			// either the namespace is gone OR it has a DeletionTimestamp set.
			Eventually(func(g Gomega) {
				ns := &corev1.Namespace{}
				err := k8sClient.Get(testCtx, types.NamespacedName{Name: tenantName}, ns)
				if errors.IsNotFound(err) {
					return // fully gone — ideal
				}
				g.Expect(err).NotTo(HaveOccurred())
				g.Expect(ns.DeletionTimestamp).NotTo(BeNil())
			}, timeout, interval).Should(Succeed())

			By("asserting the TenantNamespace itself is eventually gone (finalizer removed)")
			Eventually(func(g Gomega) {
				gone := &tenancyv1.TenantNamespace{}
				err := k8sClient.Get(testCtx, types.NamespacedName{Name: tenantName}, gone)
				g.Expect(errors.IsNotFound(err)).To(BeTrue())
			}, timeout, interval).Should(Succeed())
		})
	})

	// ──────────────────────────────────────────────────────────────────────────
	// WEBHOOK VALIDATION
	// ──────────────────────────────────────────────────────────────────────────
	Describe("Webhook validation", func() {
		It("should reject a TenantNamespace with cpuLimit over 64 cores", func() {
			bad := &tenancyv1.TenantNamespace{
				ObjectMeta: metav1.ObjectMeta{Name: "webhook-test-cpu"},
				Spec: tenancyv1.TenantNamespaceSpec{
					DisplayName:      "Too Much CPU",
					CpuLimit:         resource.MustParse("200"),
					MemoryLimit:      resource.MustParse("2Gi"),
					NetworkIsolation: false,
				},
			}
			err := k8sClient.Create(testCtx, bad)
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("cpuLimit"))
		})

		It("should reject a TenantNamespace with an empty displayName", func() {
			bad := &tenancyv1.TenantNamespace{
				ObjectMeta: metav1.ObjectMeta{Name: "webhook-test-name"},
				Spec: tenancyv1.TenantNamespaceSpec{
					DisplayName:      "",
					CpuLimit:         resource.MustParse("2"),
					MemoryLimit:      resource.MustParse("2Gi"),
					NetworkIsolation: false,
				},
			}
			err := k8sClient.Create(testCtx, bad)
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("displayName"))
		})
	})
})
