import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AuthUser = {
  fullName: string
  email: string
  role: number
  avatar?: string
  addresses?: unknown[]
}

export type AuthPayload = {
  accessToken: string
  user: AuthUser
}

type AuthState = {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (payload: AuthPayload) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: ({ user, accessToken }) =>
        set({
          user,
          accessToken,
          isAuthenticated: true,
        }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'wdp-auth',
    }
  )
)
