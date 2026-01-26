import axios, { AxiosError } from 'axios'
import { AuthPayload } from '../store/auth-store'

type ApiResponse<T> = {
  statusCode: number
  message: string
  metadata: T
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  fullName: string
  email: string
  password: string
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
})

function extractApiMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string }
    if (data?.message) return data.message
    if (error.message) return error.message
  }
  return 'Request failed'
}

async function postJson<TBody, TData>(path: string, body: TBody): Promise<TData> {
  try {
    const response = await api.post<ApiResponse<TData>>(path, body)
    if (!response.data?.metadata) throw new Error('Missing response payload')
    return response.data.metadata
  } catch (error) {
    const message = extractApiMessage(error)
    throw new Error(message)
  }
}

export async function login(payload: LoginRequest) {
  return postJson<LoginRequest, AuthPayload>('/auth/login', payload)
}

export async function register(payload: RegisterRequest) {
  return postJson<RegisterRequest, AuthPayload>('/auth/register', payload)
}
