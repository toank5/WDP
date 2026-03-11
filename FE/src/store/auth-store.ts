import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Address } from '@/types/api.types'
import { migrateGuestCartToUserCart, saveUserCartToGuestCart } from './cart.store'

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
      setAuth: async ({ user, accessToken }) => {
        // First save current cart as guest cart (if there was one before)
        await saveUserCartToGuestCart()

        set({
          user,
          accessToken,
          isAuthenticated: true,
        })

        // Migrate guest cart to user cart
        await migrateGuestCartToUserCart()

        // Trigger cart refresh to load the new user's cart
        window.dispatchEvent(new CustomEvent('cartUpdated'))
      },
      logout: async () => {
        // Save user cart to guest cart before logout
        await saveUserCartToGuestCart()

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
