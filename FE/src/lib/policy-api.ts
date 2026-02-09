import axios from 'axios'
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

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
})

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const authStore = localStorage.getItem('wdp-auth')
  if (authStore) {
    try {
      const { state } = JSON.parse(authStore)
      if (state?.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`
      }
    } catch (err) {
      console.error('Failed to parse auth store', err)
    }
  }
  return config
})

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  statusCode: number
  message: string
  metadata: T
}

/**
 * Extract and handle API errors
 */
function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error) && error.response) {
    const data = error.response.data as ApiError
    throw {
      message: data.message || 'An error occurred',
      errors: data.errors || {},
      statusCode: error.response.status,
    }
  }
  throw {
    message: 'Network error or server not responding',
    errors: {},
    statusCode: 0,
  }
}

// Management Endpoints

/**
 * Get all policies with optional filters
 */
export async function getPolicies(params?: { type?: PolicyType; active?: boolean }): Promise<AnyPolicy[]> {
  try {
    const res = await api.get<ApiResponse<AnyPolicy[]>>('/policies', { params })
    return res.data.metadata
  } catch (error) {
    throw handleApiError(error)
  }
}

/**
 * Create a new policy
 */
export async function createPolicy<T extends PolicyType>(
  payload: PolicyFormData<T>,
): Promise<AnyPolicy> {
  try {
    const res = await api.post<ApiResponse<AnyPolicy>>('/policies', payload)
    return res.data.metadata
  } catch (error) {
    throw handleApiError(error)
  }
}

/**
 * Update an existing policy
 */
export async function updatePolicy<T extends PolicyType>(
  id: string,
  payload: Partial<PolicyFormData<T>>,
): Promise<AnyPolicy> {
  try {
    const res = await api.patch<ApiResponse<AnyPolicy>>(`/policies/${id}`, payload)
    return res.data.metadata
  } catch (error) {
    throw handleApiError(error)
  }
}

/**
 * Activate a policy (deactivates all other policies of the same type)
 */
export async function activatePolicy(id: string): Promise<AnyPolicy> {
  try {
    const res = await api.patch<ApiResponse<AnyPolicy>>(`/policies/${id}/activate`)
    return res.data.metadata
  } catch (error) {
    throw handleApiError(error)
  }
}

/**
 * Deactivate a policy
 */
export async function deactivatePolicy(id: string): Promise<AnyPolicy> {
  try {
    const res = await api.patch<ApiResponse<AnyPolicy>>(`/policies/${id}/deactivate`)
    return res.data.metadata
  } catch (error) {
    throw handleApiError(error)
  }
}

// Public/Read Endpoints

/**
 * Get all currently active policies
 */
export async function getCurrentPolicies(): Promise<Record<PolicyType, AnyPolicy>> {
  try {
    const res = await api.get<ApiResponse<Record<string, AnyPolicy>>>('/policies/current')
    return res.data.metadata as Record<PolicyType, AnyPolicy>
  } catch (error) {
    throw handleApiError(error)
  }
}

/**
 * Get the current active policy for a specific type
 */
export async function getPolicyByType<T extends PolicyType>(type: T): Promise<Policy<T> | null> {
  try {
    const res = await api.get<ApiResponse<Policy<T>>>(`/policies/${type}`)
    return res.data.metadata
  } catch (error) {
    throw handleApiError(error)
  }
}

/**
 * Get the history (all versions) of a policy type
 */
export async function getPolicyHistory<T extends PolicyType>(type: T): Promise<Policy<T>[]> {
  try {
    const res = await api.get<ApiResponse<Policy<T>[]>>(`/policies/${type}/history`)
    return res.data.metadata
  } catch (error) {
    throw handleApiError(error)
  }
}
