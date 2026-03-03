import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Address } from '@/types/api.types'

export type AuthUser = {
  fullName: string
  email: string
  role: number
  avatar?: string
  addresses?: Address[]
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
      setAuth: ({ user, accessToken }) => {
        set({
          user,
          accessToken,
          isAuthenticated: true,
        })
        // Trigger cart refresh to load the new user's cart
        window.dispatchEvent(new CustomEvent('cartUpdated'))
      },
      logout: () => {
        set({ user: null, accessToken: null, isAuthenticated: false })
        // Trigger cart refresh to load guest cart
        window.dispatchEvent(new CustomEvent('cartUpdated'))
      },
    }),
    {
      name: 'wdp-auth',
    }
  )
)
