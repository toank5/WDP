import { create } from 'zustand'
import type { AuthUser, AuthPayload } from '../types'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (payload: AuthPayload) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  setAuth: ({ user, accessToken }) => {
    set({
      user,
      accessToken,
      isAuthenticated: true,
    })
    // Store token in AsyncStorage
    // TODO: Implement AsyncStorage persistence
  },
  logout: () => {
    set({ user: null, accessToken: null, isAuthenticated: false })
    // Clear token from AsyncStorage
    // TODO: Implement AsyncStorage persistence
  },
}))
