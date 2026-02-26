import { api } from './api-client'
import { extractApiMessage } from './api-client'

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
