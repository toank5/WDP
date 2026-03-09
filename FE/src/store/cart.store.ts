import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { CartItem, CartResponse } from '@/lib/cart-api'
import { cartApi } from '@/lib/cart-api'

/**
 * Guest cart item stored in localStorage
 * This is used before the user logs in
 */
interface GuestCartItem {
  _id: string
  productId: string
  variantSku?: string
  productName?: string
  productImage?: string
  price?: number | { price: number }  // Can be a number or object with price property
  quantity: number
  variantDetails?: {
    size?: string
    color?: string
  }
  addedAt: string
}

/**
 * Cart Store State
 * Manages the shopping cart state with server-side persistence
 */
interface CartState {
  // Cart data
  items: CartItem[]
  totalItems: number
  subtotal: number
  loading: boolean
  error: string | null

  // Actions
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

  // Internal state
  _hydrated: boolean
  setHydrated: () => void
}

const GUEST_CART_KEY = 'guest_cart'

/**
 * Helper: Get guest cart from localStorage
 */
function getGuestCart(): GuestCartItem[] {
  try {
    const data = localStorage.getItem(GUEST_CART_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * Helper: Save guest cart to localStorage
 */
function saveGuestCart(items: GuestCartItem[]): void {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('cartUpdated'))
  } catch (error) {
    console.error('Failed to save guest cart:', error)
  }
}

/**
 * Helper: Clear guest cart from localStorage
 */
function clearGuestCart(): void {
  try {
    localStorage.removeItem(GUEST_CART_KEY)
  } catch (error) {
    console.error('Failed to clear guest cart:', error)
  }
}

/**
 * Cart Store
 *
 * This store manages the shopping cart with the following flow:
 *
 * 1. **Guest Users**: Cart is stored in localStorage (guest_cart key)
 * 2. **Authenticated Users**: Cart is synced with the backend API
 * 3. **On Login**: Guest cart is merged with the user's backend cart
 * 4. **On Logout**: Backend cart is saved to localStorage as guest cart
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      totalItems: 0,
      subtotal: 0,
      loading: false,
      error: null,
      _hydrated: false,

      setHydrated: () => {
        set({ _hydrated: true })
      },

      /**
       * Load cart from server or localStorage
       * - If authenticated: load from backend API
       * - If not authenticated: load from localStorage (guest cart)
       */
      loadCart: async () => {
        const { isAuthenticated, accessToken, user } = await import('@/store/auth-store').then(m => m.useAuthStore.getState())

        set({ loading: true, error: null })

        try {
          if (isAuthenticated && accessToken) {
            // Authenticated user: load from backend
            const cartData = await cartApi.getCart()
            set({
              items: cartData.items || [],
              totalItems: cartData.totalItems || 0,
              subtotal: cartData.subtotal || 0,
              loading: false,
            })
          } else {
            // Guest user: load from localStorage
            const guestItems = getGuestCart()
            set({
              items: guestItems,
              totalItems: guestItems.reduce((sum, item) => sum + item.quantity, 0),
              subtotal: guestItems.reduce((sum, item) => {
                const price = typeof item.price === 'number' ? item.price : (typeof item.price === 'object' && item.price?.price) ? item.price.price : 0
                return sum + price * item.quantity
              }, 0),
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
       * - If not authenticated: save to localStorage
       */
      addItem: async (item) => {
        const { isAuthenticated, accessToken } = await import('@/store/auth-store').then(m => m.useAuthStore.getState())
        const { items } = get()

        set({ loading: true, error: null })

        try {
          if (isAuthenticated && accessToken) {
            // Authenticated user: add via API
            const result = await cartApi.addItem({
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
            // Guest user: add to localStorage
            const cartItemId = item.variantSku ? `${item.productId}-${item.variantSku}` : item.productId

            const existingIndex = items.findIndex(
              (i) => i.productId === item.productId && i.variantSku === item.variantSku
            )

            let updatedItems: GuestCartItem[]

            if (existingIndex >= 0) {
              // Update existing item
              updatedItems = items.map((item, index) =>
                index === existingIndex
                  ? { ...item, quantity: item.quantity + item.quantity }
                  : item
              ) as GuestCartItem[]
            } else {
              // Add new item
              const newItem: GuestCartItem = {
                _id: cartItemId,
                productId: item.productId,
                variantSku: item.variantSku,
                productName: item.productData?.name,
                productImage: item.productData?.image,
                // Ensure price is a number, not an object
                price: typeof item.productData?.price === 'number' ? item.productData.price : (typeof item.productData?.price === 'object' && item.productData.price?.price) ? item.productData.price.price : 0,
                quantity: item.quantity,
                variantDetails: item.productData?.variantName ? {
                  color: item.productData.variantName,
                } : undefined,
                addedAt: new Date().toISOString(),
              }
              updatedItems = [...items, newItem] as GuestCartItem[]
            }

            saveGuestCart(updatedItems)

            set({
              items: updatedItems,
              totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
              // Handle both number and object types for price
              subtotal: updatedItems.reduce((sum, item) => {
                const price = typeof item.price === 'number' ? item.price : (typeof item.price === 'object' && item.price?.price) ? item.price.price : 0
                return sum + price * item.quantity
              }, 0),
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
       * - If not authenticated: update in localStorage
       */
      updateQuantity: async (itemId, quantity) => {
        const { isAuthenticated, accessToken } = await import('@/store/auth-store').then(m => m.useAuthStore.getState())

        set({ loading: true, error: null })

        try {
          if (isAuthenticated && accessToken) {
            // Authenticated user: update via API
            await cartApi.updateItem(itemId, quantity)
            await get().loadCart()
          } else {
            // Guest user: update in localStorage
            const { items } = get()

            if (quantity < 1) {
              await get().removeItem(itemId)
              return
            }

            const updatedItems = items.map((item) =>
              item._id === itemId ? { ...item, quantity } : item
            ) as GuestCartItem[]

            saveGuestCart(updatedItems)

            set({
              items: updatedItems,
              totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
              // Handle both number and object types for price
              subtotal: updatedItems.reduce((sum, item) => {
                const price = typeof item.price === 'number' ? item.price : (typeof item.price === 'object' && item.price?.price) ? item.price.price : 0
                return sum + price * item.quantity
              }, 0),
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
       * - If not authenticated: remove from localStorage
       */
      removeItem: async (itemId) => {
        const { isAuthenticated, accessToken } = await import('@/store/auth-store').then(m => m.useAuthStore.getState())

        set({ loading: true, error: null })

        try {
          if (isAuthenticated && accessToken) {
            // Authenticated user: remove via API
            await cartApi.removeItem(itemId)
            await get().loadCart()
          } else {
            // Guest user: remove from localStorage
            const { items } = get()
            const updatedItems = items.filter((item) => item._id !== itemId) as GuestCartItem[]

            saveGuestCart(updatedItems)

            set({
              items: updatedItems,
              totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
              // Handle both number and object types for price
              subtotal: updatedItems.reduce((sum, item) => {
                const price = typeof item.price === 'number' ? item.price : (typeof item.price === 'object' && item.price?.price) ? item.price.price : 0
                return sum + price * item.quantity
              }, 0),
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
       * Clear the entire cart
       * - If authenticated: clear via backend API
       * - If not authenticated: clear from localStorage
       */
      clearCart: async () => {
        const { isAuthenticated, accessToken } = await import('@/store/auth-store').then(m => m.useAuthStore.getState())

        set({ loading: true, error: null })

        try {
          if (isAuthenticated && accessToken) {
            // Authenticated user: clear via API
            await cartApi.clearCart()
          } else {
            // Guest user: clear from localStorage
            clearGuestCart()
          }

          set({
            items: [],
            totalItems: 0,
            subtotal: 0,
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
       * Forces a reload from the backend API
       */
      refreshCart: async () => {
        await get().loadCart()
      },
    }),
    {
      name: 'wdp-cart-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields to localStorage
        items: state.items,
        totalItems: state.totalItems,
        subtotal: state.subtotal,
        _hydrated: state._hydrated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    }
  )
)

/**
 * Hook to migrate guest cart to user cart on login
 * This should be called after the user logs in
 */
export async function migrateGuestCartToUserCart(): Promise<void> {
  const guestItems = getGuestCart()

  if (guestItems.length === 0) {
    return
  }

  const { isAuthenticated, accessToken } = await import('@/store/auth-store').then(m => m.useAuthStore.getState())

  if (!isAuthenticated || !accessToken) {
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
    await cartApi.bulkAddItems(itemsToAdd)

    // Clear guest cart from localStorage
    clearGuestCart()

    // Refresh the cart store
    await useCartStore.getState().loadCart()

    console.log('Guest cart migrated to user cart successfully')
  } catch (error) {
    console.error('Failed to migrate guest cart:', error)
    throw error
  }
}

/**
 * Hook to save user cart to guest cart on logout
 * This should be called before the user logs out
 */
export async function saveUserCartToGuestCart(): Promise<void> {
  const { items } = useCartStore.getState()

  if (items.length === 0) {
    return
  }

  try {
    // Save current cart items as guest cart
    saveGuestCart(items as GuestCartItem[])
    console.log('User cart saved to guest cart')
  } catch (error) {
    console.error('Failed to save user cart to guest cart:', error)
  }
}

/**
 * React hook for using the cart store
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
     * Get formatted subtotal
     */
    formattedSubtotal: new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(store.subtotal),
  }
}
