import { API_ENDPOINTS, post } from './api'
import type { AuthUser, AuthPayload } from '../types'

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  email: string
  password: string
  fullName: string
  role?: number
}

interface VerifyEmailData {
  token: string
}

interface ForgotPasswordData {
  email: string
}

interface ResetPasswordData {
  token: string
  newPassword: string
}

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthPayload> {
  return post<AuthPayload>(API_ENDPOINTS.LOGIN, credentials)
}

/**
 * Register a new user
 */
export async function register(data: RegisterData): Promise<AuthPayload> {
  return post<AuthPayload>(API_ENDPOINTS.REGISTER, data)
}

/**
 * Verify email address
 */
export async function verifyEmail(data: VerifyEmailData): Promise<{ message: string }> {
  return post<{ message: string }>(API_ENDPOINTS.VERIFY_EMAIL, data)
}

/**
 * Request password reset
 */
export async function forgotPassword(data: ForgotPasswordData): Promise<{ message: string }> {
  return post<{ message: string }>(API_ENDPOINTS.FORGOT_PASSWORD, data)
}

/**
 * Reset password with token
 */
export async function resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
  return post<{ message: string }>(API_ENDPOINTS.RESET_PASSWORD, data)
}

/**
 * Resend verification email
 */
export async function resendVerification(email: string): Promise<{ message: string }> {
  return post<{ message: string }>(API_ENDPOINTS.RESEND_VERIFICATION, { email })
}
