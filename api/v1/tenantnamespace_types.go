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

package v1

import (
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// TenantNamespaceFinalizer is the finalizer added to all TenantNamespace objects.
// It ensures child resources are cleaned up before the object is removed from etcd.
const TenantNamespaceFinalizer = "tenancy.example.com/finalizer"

// TenantNamespaceSpec defines the desired state of TenantNamespace
type TenantNamespaceSpec struct {
	// DisplayName is a human-readable name for the tenant.
	// +kubebuilder:validation:Required
	DisplayName string `json:"displayName"`

	// CpuLimit is the maximum CPU the tenant namespace may consume.
	// +kubebuilder:validation:Required
	CpuLimit resource.Quantity `json:"cpuLimit"`

	// MemoryLimit is the maximum memory the tenant namespace may consume.
	// +kubebuilder:validation:Required
	MemoryLimit resource.Quantity `json:"memoryLimit"`

	// NetworkIsolation controls whether a deny-by-default NetworkPolicy is applied.
	// Defaults to true to ensure safe-by-default posture.
	NetworkIsolation bool `json:"networkIsolation"`
}

// TenantNamespaceStatus defines the observed state of TenantNamespace
type TenantNamespaceStatus struct {
	// Phase is the high-level state: Provisioning, Ready, or Failed.
	Phase string `json:"phase,omitempty"`

	// NamespaceName is the name of the managed child Namespace.
	NamespaceName string `json:"namespaceName,omitempty"`

	// LastSyncTime is the timestamp of the last successful reconcile.
	LastSyncTime metav1.Time `json:"lastSyncTime,omitempty"`

	// Conditions is the standard condition array for this object.
	// +patchMergeKey=type
	// +patchStrategy=merge
	// +listType=map
	// +listMapKey=type
	Conditions []metav1.Condition `json:"conditions,omitempty"`
}

//+kubebuilder:object:root=true
//+kubebuilder:subresource:status
//+kubebuilder:resource:scope=Cluster
//+kubebuilder:printcolumn:name="Phase",type="string",JSONPath=".status.phase"
//+kubebuilder:printcolumn:name="Namespace",type="string",JSONPath=".status.namespaceName"
//+kubebuilder:printcolumn:name="Age",type="date",JSONPath=".metadata.creationTimestamp"

// TenantNamespace is the Schema for the tenantnamespaces API
type TenantNamespace struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   TenantNamespaceSpec   `json:"spec,omitempty"`
	Status TenantNamespaceStatus `json:"status,omitempty"`
}

//+kubebuilder:object:root=true

// TenantNamespaceList contains a list of TenantNamespace
type TenantNamespaceList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []TenantNamespace `json:"items"`
}

func init() {
	SchemeBuilder.Register(&TenantNamespace{}, &TenantNamespaceList{})
}
