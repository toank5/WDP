import axios from 'axios'

type ApiResponse<T> = {
  statusCode: number
  message: string
  metadata: T
}

export type User = {
  _id: string
  fullName: string
  email: string
  role: number
  avatar?: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export type CreateUserPayload = {
  name: string
  email: string
  role: number
  password: string
}

const api = axios.create({
  baseURL: 'http://localhost:3000',
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

function extractApiMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string }
    if (data?.message) return data.message
    if (error.message) return error.message
  }
  return 'Request failed'
}

async function handleRequest<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    const response = await promise
    if (!response.data?.metadata) throw new Error('Missing response payload')
    return response.data.metadata
  } catch (error) {
    const message = extractApiMessage(error)
    throw new Error(message)
  }
}

export async function getAllUsers() {
  return handleRequest<User[]>(api.get('/users'))
}

export async function createUser(payload: CreateUserPayload) {
  return handleRequest<User>(api.post('/users', payload))
}
