import { api } from './api-client'
import { extractApiMessage } from './api-client'

type ApiResponse<T> = {
  statusCode: number
  message: string
  data?: T
  metadata?: T
  errors?: Array<{ path: string; message: string }>
}

/**
 * User Profile types
 */
export interface UserProfile {
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

export interface UpdateProfileRequest {
  fullName?: string
  phone?: string
  avatar?: string
  dateOfBirth?: string
  preferredLanguage?: string
  preferredCurrency?: string
}

/**
 * User Preferences types
 */
export interface UserPreferences {
  newsletterSubscribed: boolean
  emailOffers: boolean
  newCollectionAlerts: boolean
}

export interface UpdatePreferencesRequest {
  newsletterSubscribed?: boolean
  emailOffers?: boolean
  newCollectionAlerts?: boolean
}

/**
 * Change Password types
 */
export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

/**
 * Account API client
 */
class AccountAPI {
  private unwrapApiResponse<T>(raw: unknown): T {
    if (!raw || typeof raw !== 'object') {
      throw new Error('Invalid API response: response is not an object')
    }

    const response = raw as Partial<ApiResponse<T> & { success?: boolean; data?: T; metadata?: T }>

    if (response.data !== undefined) {
      return response.data as T
    }

    if (response.metadata !== undefined) {
      return response.metadata as T
    }

    throw new Error('No valid data found in API response')
  }

  /**
   * Get current user's profile
   */
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await api.get('/account/profile')
      return this.unwrapApiResponse<UserProfile>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Update current user's profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    try {
      const response = await api.patch('/account/profile', data)
      return this.unwrapApiResponse<UserProfile>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Get current user's preferences
   */
  async getPreferences(): Promise<UserPreferences> {
    try {
      const response = await api.get('/account/preferences')
      return this.unwrapApiResponse<UserPreferences>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Update current user's preferences
   */
  async updatePreferences(data: UpdatePreferencesRequest): Promise<UserPreferences> {
    try {
      const response = await api.patch('/account/preferences', data)
      return this.unwrapApiResponse<UserPreferences>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    try {
      const response = await api.post('/account/change-password', data)
      return this.unwrapApiResponse<{ message: string }>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Delete account
   */
  async deleteAccount(): Promise<{ message: string }> {
    try {
      const response = await api.delete('/account')
      return this.unwrapApiResponse<{ message: string }>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }
}

export const accountApi = new AccountAPI()
