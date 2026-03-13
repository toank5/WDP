import { api } from './api-client'
import { extractApiMessage } from './api-client'
import type { Address } from '@/types/api.types'
import { USER_ROLES } from '@eyewear/shared'

type ApiResponse<T> = {
  statusCode: number
  message: string
  metadata: T
}

export type User = {
  _id: string
  fullName: string
  email: string
  role: USER_ROLES
  avatar?: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export type CreateUserPayload = {
  name: string
  email: string
  role: USER_ROLES
  password: string
}

// ==================== CUSTOMER PROFILE TYPES ====================

export type UserProfile = {
  _id: string
  fullName: string
  email: string
  phone?: string
  avatar?: string
  dateOfBirth?: string
  preferredLanguage?: string
  preferredCurrency?: string
  createdAt: string
  updatedAt: string
}

export type UpdateProfileRequest = {
  fullName?: string
  phone?: string
  avatar?: string
  dateOfBirth?: string
  preferredLanguage?: string
  preferredCurrency?: string
}

export type ChangePasswordRequest = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export type UserPreferences = {
  newsletterSubscribed: boolean
  emailOffers: boolean
  newCollectionAlerts: boolean
}

export type UpdatePreferencesRequest = {
  newsletterSubscribed?: boolean
  emailOffers?: boolean
  newCollectionAlerts?: boolean
}

// ==================== ADMIN TYPES ====================

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

// ==================== CUSTOMER PROFILE API ====================

/**
 * Get current user's profile
 * GET /account/profile
 */
export async function getMyProfile(): Promise<UserProfile> {
  try {
    const response = await api.get('/account/profile')
    // Handle both response.data and response.data.metadata patterns
    if (response.data?.metadata) {
      return response.data.metadata
    }
    if (response.data?.data) {
      return response.data.data
    }
    throw new Error('Missing profile data in response')
  } catch (error) {
    const message = extractApiMessage(error)
    throw new Error(message)
  }
}

/**
 * Update current user's profile
 * PATCH /account/profile
 */
export async function updateMyProfile(payload: UpdateProfileRequest): Promise<UserProfile> {
  try {
    const response = await api.patch('/account/profile', payload)
    if (response.data?.metadata) {
      return response.data.metadata
    }
    if (response.data?.data) {
      return response.data.data
    }
    throw new Error('Missing profile data in response')
  } catch (error) {
    const message = extractApiMessage(error)
    throw new Error(message)
  }
}

/**
 * Get current user's preferences
 * GET /account/preferences
 */
export async function getMyPreferences(): Promise<UserPreferences> {
  try {
    const response = await api.get('/account/preferences')
    if (response.data?.metadata) {
      return response.data.metadata
    }
    if (response.data?.data) {
      return response.data.data
    }
    // Return default preferences if none set
    return {
      newsletterSubscribed: false,
      emailOffers: false,
      newCollectionAlerts: false,
    }
  } catch (error) {
    // Return default preferences on error
    return {
      newsletterSubscribed: false,
      emailOffers: false,
      newCollectionAlerts: false,
    }
  }
}

/**
 * Update current user's preferences
 * PATCH /account/preferences
 */
export async function updateMyPreferences(payload: UpdatePreferencesRequest): Promise<UserPreferences> {
  try {
    const response = await api.patch('/account/preferences', payload)
    if (response.data?.metadata) {
      return response.data.metadata
    }
    if (response.data?.data) {
      return response.data.data
    }
    throw new Error('Missing preferences data in response')
  } catch (error) {
    const message = extractApiMessage(error)
    throw new Error(message)
  }
}

/**
 * Change password
 * POST /account/change-password
 */
export async function changePassword(payload: ChangePasswordRequest): Promise<{ message: string }> {
  try {
    const response = await api.post('/account/change-password', payload)
    if (response.data?.metadata) {
      return response.data.metadata
    }
    if (response.data?.data) {
      return response.data.data
    }
    return { message: 'Password changed successfully' }
  } catch (error) {
    const message = extractApiMessage(error)
    throw new Error(message)
  }
}

/**
 * Delete account
 * DELETE /account
 */
export async function deleteMyAccount(): Promise<{ message: string }> {
  try {
    const response = await api.delete('/account')
    if (response.data?.metadata) {
      return response.data.metadata
    }
    if (response.data?.data) {
      return response.data.data
    }
    return { message: 'Account deleted successfully' }
  } catch (error) {
    const message = extractApiMessage(error)
    throw new Error(message)
  }
}
