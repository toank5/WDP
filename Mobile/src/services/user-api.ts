import { API_ENDPOINTS, get, post, patch, del } from './api'

// ==================== TYPES ====================

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

// ==================== CUSTOMER PROFILE API ====================

/**
 * Get current user's profile
 * GET /account/profile
 */
export async function getMyProfile(): Promise<UserProfile> {
  return get<UserProfile>(API_ENDPOINTS.ACCOUNT_PROFILE)
}

/**
 * Update current user's profile
 * PATCH /account/profile
 */
export async function updateMyProfile(payload: UpdateProfileRequest): Promise<UserProfile> {
  return patch<UserProfile>(API_ENDPOINTS.ACCOUNT_PROFILE, payload)
}

/**
 * Get current user's preferences
 * GET /account/preferences
 */
export async function getMyPreferences(): Promise<UserPreferences> {
  try {
    return get<UserPreferences>(API_ENDPOINTS.ACCOUNT_PREFERENCES)
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
  return patch<UserPreferences>(API_ENDPOINTS.ACCOUNT_PREFERENCES, payload)
}

/**
 * Change password
 * POST /account/change-password
 */
export async function changePassword(payload: ChangePasswordRequest): Promise<{ message: string }> {
  return post<{ message: string }>(API_ENDPOINTS.ACCOUNT_CHANGE_PASSWORD, payload)
}

/**
 * Delete account
 * DELETE /account
 */
export async function deleteMyAccount(): Promise<{ message: string }> {
  return del<{ message: string }>(API_ENDPOINTS.ACCOUNT_DELETE)
}
