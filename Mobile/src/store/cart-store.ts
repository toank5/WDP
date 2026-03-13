import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { CartItem, CartResponse } from '../types'
import { addToCart, updateCartItem, removeFromCart, clearCart as clearCartApi, getCart, mergeCart as mergeCartApi } from '../services'
import { useAuthStore } from './auth-store'
import { STORAGE_KEYS } from '../constants'

/**
 * Guest cart item stored in AsyncStorage
 * This is used before the user logs in
 */
interface GuestCartItem {
  _id: string
  productId: string
  variantSku?: string
  productName?: string
  productImage?: string
  price: number
  quantity: number
  variantDetails?: {
    size?: string
    color?: string
  }
  addedAt: string
}

/**
 * Helper to create a normalized GuestCartItem
 */
function createGuestCartItem(
  productId: string,
  variantSku: string | undefined,
  quantity: number,
  productData?: {
    name?: string
    image?: string
    price?: number
    variantName?: string
    variantSku?: string
  }
): GuestCartItem {
  const now = new Date().toISOString()
  const cartItemId = variantSku ? `${productId}-${variantSku}` : productId

  return {
    _id: cartItemId,
    productId,
    variantSku,
    productName: productData?.name,
    productImage: productData?.image,
    price: productData?.price || 0,
    quantity,
    variantDetails: productData?.variantName
      ? {
          color: productData.variantName,
        }
      : undefined,
    addedAt: now,
  }
}

/**
 * Cart Store State
 * Manages shopping cart state with server-side persistence
 */
interface CartState {
  // Cart data
  items: CartItem[]
  totalItems: number
  subtotal: number
  tax: number
  shipping: number
  total: number
  loading: boolean
  error: string | null

  // Internal state
  _hydrated: boolean

  // Actions
  setHydrated: () => void
  loadCart: () => Promise<void>
  addItem: (item: {
    productId: string
    variantSku?: string
    quantity: number
    productData?: {
      name?: string
      image?: string
      price?: number
      variantName?: string
      variantSku?: string
    }
  }) => Promise<{ success: boolean; message: string }>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
}

const GUEST_CART_KEY = STORAGE_KEYS.GUEST_CART

/**
 * Helper: Get guest cart from AsyncStorage
 */
async function getGuestCart(): Promise<GuestCartItem[]> {
  try {
    const data = await AsyncStorage.getItem(GUEST_CART_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * Helper: Save guest cart to AsyncStorage
 */
async function saveGuestCart(items: GuestCartItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
  } catch (error) {
    console.error('Failed to save guest cart:', error)
  }
}

/**
 * Helper: Clear guest cart from AsyncStorage
 */
async function clearGuestCart(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GUEST_CART_KEY)
  } catch (error) {
    console.error('Failed to clear guest cart:', error)
  }
}

/**
 * Calculate totals from items
 */
function calculateTotals(items: CartItem[]) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
  const tax = subtotal * 0.1 // 10% VAT
  const shipping = subtotal > 0 ? 30000 : 0 // 30k VND shipping fee
  const total = subtotal + tax + shipping

  return { totalItems, subtotal, tax, shipping, total }
}

export const useCartStore = create<CartState>(
  (set, get) => ({
    // Initial state
    items: [],
    totalItems: 0,
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0,
    loading: false,
    error: null,
    _hydrated: false,

    setHydrated: () => {
      set({ _hydrated: true })
    },

    /**
     * Load cart from server or AsyncStorage
     * - If authenticated: load from backend API
     * - If not authenticated: load from AsyncStorage (guest cart)
     */
    loadCart: async () => {
      const { isAuthenticated } = useAuthStore.getState()

      set({ loading: true, error: null })

      try {
        if (isAuthenticated) {
          // Authenticated user: load from backend
          const cartData = await getCart()
          const { totalItems, subtotal, tax, shipping, total } = calculateTotals(
            cartData.items || []
          )
          set({
            items: cartData.items || [],
            totalItems: totalItems,
            subtotal,
            tax,
            shipping,
            total,
            loading: false,
          })
        } else {
          // Guest user: load from AsyncStorage
          const guestItems = await getGuestCart()
          const { totalItems, subtotal, tax, shipping, total } = calculateTotals(
            guestItems as any
          )
          set({
            items: guestItems as CartItem[],
            totalItems,
            subtotal,
            tax,
            shipping,
            total,
            loading: false,
          })
        }
      } catch (error) {
        console.error('Failed to load cart:', error)
        set({
          error: 'Failed to load cart',
          loading: false,
        })
      }
    },

    /**
     * Add item to cart
     * - If authenticated: send to backend API
     * - If not authenticated: save to AsyncStorage
     */
    addItem: async (item) => {
      const { isAuthenticated } = useAuthStore.getState()
      const { items } = get()

      set({ loading: true, error: null })

      try {
        if (isAuthenticated) {
          // Authenticated user: add via API
          const result = await addToCart({
            productId: item.productId,
            variantSku: item.variantSku,
            quantity: item.quantity,
          })

          if (result.success) {
            // Reload cart to get updated state
            await get().loadCart()
          } else {
            set({ error: result.message, loading: false })
          }
          return result
        } else {
          // Guest user: add to AsyncStorage
          const cartItemId = item.variantSku
            ? `${item.productId}-${item.variantSku}`
            : item.productId

          const existingIndex = items.findIndex(
            (i) =>
              i.productId === item.productId && i.variantSku === item.variantSku
          )

          let updatedItems: GuestCartItem[]

          if (existingIndex >= 0) {
            // Update existing item - add new quantity to existing
            updatedItems = items.map((existingItem, index) =>
              index === existingIndex
                ? { ...existingItem, quantity: existingItem.quantity + item.quantity }
                : existingItem
            ) as GuestCartItem[]
          } else {
            // Add new item - use createGuestCartItem helper
            const newItem: GuestCartItem = createGuestCartItem(
              item.productId,
              item.variantSku,
              item.quantity,
              item.productData
            )
            updatedItems = [...items, newItem]
          }

          await saveGuestCart(updatedItems)

          const { totalItems, subtotal, tax, shipping, total } = calculateTotals(
            updatedItems as any
          )
          set({
            items: updatedItems as CartItem[],
            totalItems,
            subtotal,
            tax,
            shipping,
            total,
            loading: false,
          })

          return { success: true, message: 'Added to cart' }
        }
      } catch (error) {
        console.error('Failed to add item to cart:', error)
        set({
          error: 'Failed to add item to cart',
          loading: false,
        })
        return { success: false, message: 'Failed to add item to cart' }
      }
    },

    /**
     * Update item quantity
     * - If authenticated: update via backend API
     * - If not authenticated: update in AsyncStorage
     */
    updateQuantity: async (itemId, quantity) => {
      const { isAuthenticated } = useAuthStore.getState()

      set({ loading: true, error: null })

      try {
        if (isAuthenticated) {
          // Authenticated user: update via API
          await updateCartItem(itemId, { quantity })
          await get().loadCart()
        } else {
          // Guest user: update in AsyncStorage
          const { items } = get()

          if (quantity < 1) {
            await get().removeItem(itemId)
            return
          }

          const updatedItems = items.map((item) =>
            item._id === itemId ? { ...item, quantity } : item
          ) as GuestCartItem[]

          await saveGuestCart(updatedItems)

          const { totalItems, subtotal, tax, shipping, total } = calculateTotals(
            updatedItems as any
          )
          set({
            items: updatedItems as CartItem[],
            totalItems,
            subtotal,
            tax,
            shipping,
            total,
            loading: false,
          })
        }
      } catch (error) {
        console.error('Failed to update item quantity:', error)
        set({
          error: 'Failed to update item quantity',
          loading: false,
        })
      }
    },

    /**
     * Remove item from cart
     * - If authenticated: remove via backend API
     * - If not authenticated: remove from AsyncStorage
     */
    removeItem: async (itemId) => {
      const { isAuthenticated } = useAuthStore.getState()

      set({ loading: true, error: null })

      try {
        if (isAuthenticated) {
          // Authenticated user: remove via API
          await removeFromCart(itemId)
          await get().loadCart()
        } else {
          // Guest user: remove from AsyncStorage
          const { items } = get()
          const updatedItems = items.filter(
            (item) => item._id !== itemId
          ) as GuestCartItem[]

          await saveGuestCart(updatedItems)

          const { totalItems, subtotal, tax, shipping, total } = calculateTotals(
            updatedItems as any
          )
          set({
            items: updatedItems as CartItem[],
            totalItems,
            subtotal,
            tax,
            shipping,
            total,
            loading: false,
          })
        }
      } catch (error) {
        console.error('Failed to remove item:', error)
        set({
          error: 'Failed to remove item',
          loading: false,
        })
      }
    },

    /**
     * Clear entire cart
     * - If authenticated: clear via backend API
     * - If not authenticated: clear from AsyncStorage
     */
    clearCart: async () => {
      const { isAuthenticated } = useAuthStore.getState()

      set({ loading: true, error: null })

      try {
        if (isAuthenticated) {
          // Authenticated user: clear via API
          await clearCartApi()
        } else {
          // Guest user: clear from AsyncStorage
          await clearGuestCart()
        }

        set({
          items: [],
          totalItems: 0,
          subtotal: 0,
          tax: 0,
          shipping: 0,
          total: 0,
          loading: false,
        })
      } catch (error) {
        console.error('Failed to clear cart:', error)
        set({
          error: 'Failed to clear cart',
          loading: false,
        })
      }
    },

    /**
     * Refresh cart from server
     * Forces a reload from backend API
     */
    refreshCart: async () => {
      await get().loadCart()
    },
  })
)

/**
 * Hook to migrate guest cart to user cart on login
 * This should be called after user logs in
 */
export async function migrateGuestCartToUserCart(): Promise<void> {
  const guestItems = await getGuestCart()

  if (guestItems.length === 0) {
    return
  }

  const { isAuthenticated } = useAuthStore.getState()
  if (!isAuthenticated) {
    return
  }

  try {
    // Convert guest cart items to API format
    const itemsToAdd = guestItems.map((item) => ({
      productId: item.productId,
      variantSku: item.variantSku,
      quantity: item.quantity,
    }))

    // Bulk add to user's backend cart
    await mergeCartApi(itemsToAdd)

    // Clear guest cart from AsyncStorage
    await clearGuestCart()

    // Refresh cart store
    await useCartStore.getState().loadCart()

    console.log('Guest cart migrated to user cart successfully')
  } catch (error) {
    console.error('Failed to migrate guest cart:', error)
    throw error
  }
}

/**
 * Hook to save user cart to guest cart on logout
 * This should be called before user logs out
 */
export async function saveUserCartToGuestCart(): Promise<void> {
  const { items } = useCartStore.getState()

  if (items.length === 0) {
    return
  }

  try {
    // Save current cart items as guest cart
    await saveGuestCart(items as any[])
    console.log('User cart saved to guest cart')
  } catch (error) {
    console.error('Failed to save user cart to guest cart:', error)
  }
}

/**
 * React hook for using cart store
 * Provides a convenient interface for components
 */
export function useCart() {
  const store = useCartStore()

  return {
    ...store,
    /**
     * Check if cart is empty
     */
    isEmpty: store.items.length === 0,

    /**
     * Get cart item count for display
     */
    itemCount: store.totalItems,

    /**
     * Get formatted prices
     */
    formattedSubtotal: new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(store.subtotal),
    formattedTax: new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(store.tax),
    formattedShipping: new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(store.shipping),
    formattedTotal: new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(store.total),
  }
}
