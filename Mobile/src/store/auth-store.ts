import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { AuthUser, AuthPayload } from '../types'
import { STORAGE_KEYS } from '../constants'
import { migrateGuestCartToUserCart, saveUserCartToGuestCart } from './cart-store'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  _hydrated: boolean
  setHydrated: () => void
  setAuth: (payload: AuthPayload) => void
  logout: () => void
}

// Storage keys
const AUTH_TOKEN_KEY = STORAGE_KEYS.AUTH_TOKEN
const USER_DATA_KEY = STORAGE_KEYS.USER_DATA

/**
 * Helper: Load auth state from AsyncStorage
 */
async function loadAuthFromStorage(): Promise<{
  user: AuthUser | null
  accessToken: string | null
}> {
  try {
    const [tokenStr, userStr] = await Promise.all([
      AsyncStorage.getItem(AUTH_TOKEN_KEY),
      AsyncStorage.getItem(USER_DATA_KEY),
    ])

    const accessToken = tokenStr || null
    const user = userStr ? (JSON.parse(userStr) as AuthUser) : null

    return { accessToken, user }
  } catch (error) {
    console.error('Failed to load auth from storage:', error)
    return { accessToken: null, user: null }
  }
}

/**
 * Helper: Save auth state to AsyncStorage
 */
async function saveAuthToStorage(user: AuthUser | null, accessToken: string | null): Promise<void> {
  try {
    if (user) {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user))
    } else {
      await AsyncStorage.removeItem(USER_DATA_KEY)
    }

    if (accessToken) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, accessToken)
    } else {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY)
    }
  } catch (error) {
    console.error('Failed to save auth to storage:', error)
  }
}

/**
 * Helper: Clear auth state from AsyncStorage
 */
async function clearAuthFromStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY])
  } catch (error) {
    console.error('Failed to clear auth from storage:', error)
  }
}

export const useAuthStore = create<AuthState>(
  (set, get) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    _hydrated: false,

    setHydrated: () => {
      set({ _hydrated: true })
    },

    setAuth: async ({ user, accessToken }) => {
      // Update state
      set({
        user,
        accessToken,
        isAuthenticated: true,
      })

      // Save to storage
      await saveAuthToStorage(user, accessToken)

      // Migrate guest cart to user cart
      await migrateGuestCartToUserCart()
    },

    logout: async () => {
      // Save user cart to guest cart before logout
      await saveUserCartToGuestCart()

      // Clear state
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      })

      // Clear from storage
      await clearAuthFromStorage()
    },
  })
)

/**
 * Initialize auth store from AsyncStorage
 * Call this when app starts
 */
export async function initializeAuthStore(): Promise<void> {
  const { accessToken, user } = await loadAuthFromStorage()

  if (accessToken && user) {
    useAuthStore.setState({
      user,
      accessToken,
      isAuthenticated: true,
      _hydrated: true,
    })
  } else {
    useAuthStore.setState({ _hydrated: true })
  }
}
