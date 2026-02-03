import axios from 'axios'

export type PolicyType =
  | 'return'
  | 'refund'
  | 'warranty'
  | 'shipping'
  | 'prescription'
  | 'cancellation'
  | 'privacy'
  | 'terms'

export type Policy = {
  _id: string
  type: PolicyType
  version: number
  title: string
  summary: string
  bodyPlainText: string
  bodyRichTextJson?: any
  config: Record<string, any>
  isActive: boolean
  effectiveFrom: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

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

// Management Endpoints
export async function getPolicies(params?: { type?: PolicyType; active?: boolean }) {
  const res = await api.get<Policy[]>('/policies', { params })
  return res.data
}

export async function createPolicy(payload: Partial<Policy>) {
  const res = await api.post<Policy>('/policies', payload)
  return res.data
}

export async function updatePolicy(id: string, payload: Partial<Policy>) {
  const res = await api.patch<Policy>(`/policies/${id}`, payload)
  return res.data
}

export async function activatePolicy(id: string) {
  const res = await api.patch<Policy>(`/policies/${id}/activate`)
  return res.data
}

export async function deactivatePolicy(id: string) {
  const res = await api.patch<Policy>(`/policies/${id}/deactivate`)
  return res.data
}

// Public/Read Endpoints
export async function getCurrentPolicies() {
  const res = await api.get<Record<PolicyType, Policy>>('/policies/current')
  return res.data
}

export async function getPolicyByType(type: PolicyType) {
  const res = await api.get<Policy>(`/policies/${type}`)
  return res.data
}

export async function getPolicyHistory(type: PolicyType) {
  const res = await api.get<Policy[]>(`/policies/${type}/history`)
  return res.data
}
