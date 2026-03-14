import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL, API_ENDPOINTS } from '../config'
import type { ApiResponse, ApiError } from '../types'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Lazy load store to avoid circular dependency
    const { useAuthStore } = require('../store/auth-store') as { useAuthStore: any }
    const { accessToken } = useAuthStore.getState()

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle 401 and errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    // Check if error is a 401 Unauthorized
    if (error.response?.status === 401) {
      // Auto logout on 401
      const { useAuthStore } = require('../store/auth-store') as { useAuthStore: any }
      const { logout } = useAuthStore.getState()
      logout()
    }

    return Promise.reject(error)
  }
)

/**
 * Extract and handle API errors
 */
export function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error) && error.response) {
    const data = error.response.data

    // Extract message
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? (data as any).message
        : 'An error occurred'

    // Extract errors
    const errors =
      typeof data === 'object' && data !== null && 'errors' in data
        ? (data as any).errors
        : {}

    throw {
      message,
      errors,
      statusCode: error.response?.status || 0,
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

    if (typeof data === 'object' && data !== null) {
      // Check for errors array
      if ('errors' in data && Array.isArray(data.errors)) {
        return data.errors
          .filter((e: any) => e && typeof e === 'object')
          .map((e: any) => {
            const path = e.path || 'unknown'
            const msg = e.message || 'error'
            return `${path}: ${msg}`
          })
          .join(', ')
      }

      // Check for message
      if ('message' in data && typeof data.message === 'string') {
        return data.message
      }
    }

    if (error.message) return error.message
  }

  return 'Request failed'
}

/**
 * Generic request handler that extracts data from API response
 */
async function handleRequest<T>(
  promise: Promise<{ data: ApiResponse<T> }>
): Promise<T> {
  try {
    const response = await promise
    const data = response.data?.data || response.data?.metadata

    if (data === undefined || data === null) {
      throw new Error('Missing response payload: no data or metadata found')
    }

    return data as T
  } catch (error) {
    const message = extractApiMessage(error)
    throw new Error(message)
  }
}

/**
 * GET request
 */
export async function get<T = any>(url: string, config?: InternalAxiosRequestConfig): Promise<T> {
  return handleRequest<T>(api.get(url, config))
}

/**
 * POST request
 */
export async function post<T = any>(
  url: string,
  data?: any,
  config?: InternalAxiosRequestConfig
): Promise<T> {
  return handleRequest<T>(api.post(url, data, config))
}

/**
 * PUT request
 */
export async function put<T = any>(
  url: string,
  data?: any,
  config?: InternalAxiosRequestConfig
): Promise<T> {
  return handleRequest<T>(api.put(url, data, config))
}

/**
 * PATCH request
 */
export async function patch<T = any>(
  url: string,
  data?: any,
  config?: InternalAxiosRequestConfig
): Promise<T> {
  return handleRequest<T>(api.patch(url, data, config))
}

/**
 * DELETE request
 */
export async function del<T = any>(url: string, config?: InternalAxiosRequestConfig): Promise<T> {
  return handleRequest<T>(api.delete(url, config))
}

// Export API instance and endpoints
export { api }
export { API_ENDPOINTS }
