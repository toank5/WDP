import axios, { AxiosError } from 'axios'
import { useAuthStore } from '../store/auth-store'
import { hasProperty, isObject, isNonEmptyArray, isNonEmptyString } from './type-guards'

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
    const data = error.response.data

    // Use type guards instead of unsafe casting
    const message = isObject(data) && hasProperty(data, 'message') && isNonEmptyString(data.message)
      ? data.message
      : 'An error occurred'

    const errors = isObject(data) && hasProperty(data, 'errors')
      ? (typeof data.errors === 'object' ? data.errors : {})
      : {}

    throw {
      message,
      errors,
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
    const data = error.response?.data

    if (isObject(data)) {
      // Check for reasons array (used in return API)
      if (hasProperty(data, 'reasons') && isNonEmptyArray(data.reasons)) {
        const reasons = data.reasons as unknown[]
        if (reasons.every((r) => typeof r === 'string')) {
          return (reasons as string[]).join('\n• ')
        }
      }

      // Check for errors array
      if (hasProperty(data, 'errors') && isNonEmptyArray(data.errors)) {
        const errors = data.errors as unknown[]
        return errors
          .filter((e): e is { path?: string; message?: string } => isObject(e))
          .map((e) => {
            const path = hasProperty(e, 'path') && isNonEmptyString(e.path) ? e.path : 'unknown'
            const message = hasProperty(e, 'message') && isNonEmptyString(e.message) ? e.message : 'error'
            return `${path}: ${message}`
          })
          .join(', ')
      }

      // Check for message
      if (hasProperty(data, 'message') && isNonEmptyString(data.message)) {
        // If there's also a reasons array, combine them
        if (hasProperty(data, 'reasons') && isNonEmptyArray(data.reasons)) {
          const reasons = data.reasons as unknown[]
          if (reasons.every((r) => typeof r === 'string')) {
            return `${data.message}\n• ${(reasons as string[]).join('\n• ')}`
          }
        }
        return data.message
      }
    }

    if (error.message) return error.message
  }
  return 'Request failed'
}

/**
 * Generic request handler that extracts data from API response
 * Uses type guards to safely extract data from API responses
 */
async function handleRequest<T>(
  promise: Promise<{ data: ApiResponse<T> }>,
): Promise<T> {
  try {
    const response = await promise

    // Use type guards to safely extract data
    if (!isObject(response.data)) {
      throw new Error('Invalid API response: response data is not an object')
    }

    // Check for data or metadata property
    if (hasProperty(response.data, 'data') && response.data.data !== undefined) {
      return response.data.data as T
    }

    if (hasProperty(response.data, 'metadata') && response.data.metadata !== undefined) {
      return response.data.metadata as T
    }

    throw new Error('Missing response payload: no data or metadata found')
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
