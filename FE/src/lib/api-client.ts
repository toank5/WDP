import axios, { AxiosError } from 'axios'
import { useAuthStore } from '../store/auth-store'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
})

// Response interceptor to handle 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Check if the error is a 401 Unauthorized
    if (error.response?.status === 401) {
      // Auto logout on 401
      const { logout } = useAuthStore.getState()
      logout()
    }
    return Promise.reject(error)
  }
)

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

type ApiResponse<T> = {
  statusCode: number
  message: string
  data?: T
  metadata?: T
  errors?: Record<string, string> | Array<{ path: string; message: string }>
}

export type ApiError = {
  message: string
  errors?: Record<string, string> | Array<{ path: string; message: string }>
  statusCode: number
}

/**
 * Extract and handle API errors
 */
export function handleApiError(error: unknown): never {
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

/**
 * Extract error message from various error types
 */
export function extractApiMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as {
      message?: string
      errors?: Array<{ path: string; message: string }>
    }
    if (data?.errors && Array.isArray(data.errors)) {
      return data.errors.map((e) => `${e.path}: ${e.message}`).join(', ')
    }
    if (data?.message) return data.message
    if (error.message) return error.message
  }
  return 'Request failed'
}

/**
 * Generic request handler that extracts data from API response
 */
async function handleRequest<T>(
  promise: Promise<{ data: ApiResponse<T> }>,
): Promise<T> {
  try {
    const response = await promise
    const data = response.data?.data || response.data?.metadata
    if (!data) throw new Error('Missing response payload')
    return data
  } catch (error) {
    const message = extractApiMessage(error)
    throw new Error(message)
  }
}

/**
 * Create an API client with custom config
 */
export function createApiClient(baseURL?: string) {
  return axios.create({
    baseURL: baseURL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Setup interceptors on an axios instance
 */
export function setupInterceptors(axiosInstance: typeof api) {
  // Response interceptor to handle 401 Unauthorized responses
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Check if the error is a 401 Unauthorized
      if (error.response?.status === 401) {
        // Auto logout on 401
        const { logout } = useAuthStore.getState()
        logout()
      }
      return Promise.reject(error)
    }
  )

  // Request interceptor to add auth token
  axiosInstance.interceptors.request.use((config) => {
    const { accessToken } = useAuthStore.getState()
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  })

  return axiosInstance
}

// Export the main api instance for direct use
export { api }
