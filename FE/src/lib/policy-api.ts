import { api } from './api-client'
import type {
  Policy,
  PolicyType,
  PolicyFormData,
  StrictPolicyConfigMap,
  AnyPolicy,
  ApiError,
} from '../types/policy.types'

// Re-export types for convenience
export type {
  Policy,
  PolicyType,
  PolicyFormData,
  AnyPolicy,
  ReturnPolicyConfig,
  RefundPolicyConfig,
  WarrantyPolicyConfig,
  ShippingPolicyConfig,
  PrescriptionPolicyConfig,
  CancellationPolicyConfig,
  StrictPolicyConfigMap,
} from '../types/policy.types'

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  statusCode: number
  message: string
  metadata: T
}

// Management Endpoints

/**
 * Get all policies with optional filters
 */
export async function getPolicies(params?: { type?: PolicyType; active?: boolean }): Promise<AnyPolicy[]> {
  const res = await api.get<ApiResponse<AnyPolicy[]>>('/policies', { params })
  return res.data.metadata
}

/**
 * Create a new policy
 */
export async function createPolicy<T extends PolicyType>(
  payload: PolicyFormData<T>,
): Promise<AnyPolicy> {
  const res = await api.post<ApiResponse<AnyPolicy>>('/policies', payload)
  return res.data.metadata
}

/**
 * Update an existing policy
 */
export async function updatePolicy<T extends PolicyType>(
  id: string,
  payload: Partial<PolicyFormData<T>>,
): Promise<AnyPolicy> {
  const res = await api.patch<ApiResponse<AnyPolicy>>(`/policies/${id}`, payload)
  return res.data.metadata
}

/**
 * Activate a policy (deactivates all other policies of the same type)
 */
export async function activatePolicy(id: string): Promise<AnyPolicy> {
  const res = await api.patch<ApiResponse<AnyPolicy>>(`/policies/${id}/activate`)
  return res.data.metadata
}

/**
 * Deactivate a policy
 */
export async function deactivatePolicy(id: string): Promise<AnyPolicy> {
  const res = await api.patch<ApiResponse<AnyPolicy>>(`/policies/${id}/deactivate`)
  return res.data.metadata
}

// Public/Read Endpoints

/**
 * Get all currently active policies
 */
export async function getCurrentPolicies(): Promise<Record<PolicyType, AnyPolicy>> {
  const res = await api.get<ApiResponse<Record<string, AnyPolicy>>>('/policies/current')
  return res.data.metadata as Record<PolicyType, AnyPolicy>
}

/**
 * Get the current active policy for a specific type
 */
export async function getPolicyByType<T extends PolicyType>(type: T): Promise<Policy<T> | null> {
  const res = await api.get<ApiResponse<Policy<T>>>(`/policies/${type}`)
  return res.data.metadata
}

/**
 * Get the history (all versions) of a policy type
 */
export async function getPolicyHistory<T extends PolicyType>(type: T): Promise<Policy<T>[]> {
  const res = await api.get<ApiResponse<Policy<T>[]>>(`/policies/${type}/history`)
  return res.data.metadata
}

/**
 * Get normalized prescription lens fee from active prescription policy.
 * Returns 0 when policy is missing or fee is invalid.
 */
export async function getPrescriptionLensFee(): Promise<number> {
  const policy = await getPolicyByType('prescription')
  const fee = Number((policy?.config as { prescriptionLensFee?: unknown } | undefined)?.prescriptionLensFee ?? 0)
  return Number.isFinite(fee) && fee > 0 ? fee : 0
}
