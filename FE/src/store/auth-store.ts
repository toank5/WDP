import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Address } from '@/types/api.types'
import { migrateGuestCartToUserCart, saveUserCartToGuestCart } from './cart.store'
import { wishlistApi } from '@/lib/wishlist-api'

export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATION' | 'SALE' | 'CUSTOMER'

export type AuthUser = {
  fullName: string
  email: string
  role: UserRole
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

/**
 * Normalize role to string name (e.g., 4 -> "CUSTOMER", "4" -> "CUSTOMER")
 * This handles both numeric and string-numeric roles from backend
 */
function normalizeUserRole(role: any): UserRole {
  // Already a valid role string
  if (['ADMIN', 'MANAGER', 'OPERATION', 'SALE', 'CUSTOMER'].includes(role)) {
    console.log('[Auth] Role already normalized:', role)
    return role as UserRole
  }

  // Numeric role (4) or string-numeric role ("4")
  let numericRole: number | null = null
  if (typeof role === 'number') {
    numericRole = role
  } else if (typeof role === 'string') {
    const parsed = Number.parseInt(role, 10)
    if (!Number.isNaN(parsed)) {
      numericRole = parsed
    }
  }

  if (numericRole !== null) {
    const roleMap: Record<number, UserRole> = {
      0: 'ADMIN',
      1: 'MANAGER',
      2: 'OPERATION',
      3: 'SALE',
      4: 'CUSTOMER',
    }
    const normalizedRole = roleMap[numericRole] ?? 'CUSTOMER'
    console.log('[Auth] Normalized role from', role, 'to', normalizedRole)
    return normalizedRole
  }

  // Fallback
  console.log('[Auth] Unknown role, defaulting to CUSTOMER:', role)
  return 'CUSTOMER'
}

// Migration to convert old numeric role to string role
const migrateAuthState = (state: any): AuthState => {
  if (!state) return state

  // Migrate role from number or string-number to string name
  if (state.user?.role) {
    const normalizedRole = normalizeUserRole(state.user.role)
    if (normalizedRole !== state.user.role) {
      state.user = {
        ...state.user,
        role: normalizedRole,
      }
      console.log('[Auth] Migration: Updated role to', state.user.role)
    }
  }

  return state
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

        // Normalize the role before saving
        const normalizedUser: AuthUser = {
          ...user,
          role: normalizeUserRole(user.role),
        }

        console.log('[Auth] setAuth: User role after normalization:', normalizedUser.role)

        set({
          user: normalizedUser,
          accessToken,
          isAuthenticated: true,
        })

        // Migrate guest cart to user cart
        await migrateGuestCartToUserCart()

        // Migrate guest wishlist to user favorites
        await wishlistApi.migrateGuestWishlist()

        // Trigger cart refresh to load the new user's cart
        window.dispatchEvent(new CustomEvent('cartUpdated'))
      },
      logout: async () => {
        // Save user cart to guest cart before logout
        await saveUserCartToGuestCart()

        // Save user wishlist to guest storage before logout
        await wishlistApi.saveUserWishlistToGuest()

        set({ user: null, accessToken: null, isAuthenticated: false })

        // Trigger cart refresh to load guest cart
        window.dispatchEvent(new CustomEvent('cartUpdated'))
      },
    }),
    {
      name: 'wdp-auth',
      migrate: migrateAuthState,
    }
  )
)
