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
  price: number // Always normalized to number
  quantity: number
  variantDetails?: {
    size?: string
    color?: string
  }
  addedAt: string
}

/**
 * Helper to normalize price from various formats to number
 */
function normalizePrice(price: unknown): number {
  if (typeof price === 'number') return price
  if (typeof price === 'object' && price !== null && 'price' in price) {
    const priceValue = (price as { price: unknown }).price
    return typeof priceValue === 'number' ? priceValue : 0
  }
  return 0
}

/**
 * Create a normalized GuestCartItem
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
    price: normalizePrice(productData?.price),
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
 * Validated promotion in cart
 * discountAmount is stored from API validation for consistent tracking
 * Note: Display discount is recalculated dynamically based on current cart subtotal
 */
export interface AppliedPromotion {
  code: string
  name: string
  type: 'percentage' | 'fixed_amount'
  value: number
  description?: string
  minOrderValue: number
  discountAmount: number  // Stored from API validation for backend reference
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

  // Promotion
  appliedPromotion: AppliedPromotion | null

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
  setPromotionCode: (promotion: AppliedPromotion | null) => void
  clearPromotionCode: () => void

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
      appliedPromotion: null,
      _hydrated: false,

      setHydrated: () => {
        set({ _hydrated: true })
      },

      /**
       * Load cart from server or localStorage
       * - If authenticated AND customer: load from backend API
       * - If not authenticated: load from localStorage (guest cart)
       * - If authenticated but not customer: use empty cart (non-customer roles don't have carts)
       */
      loadCart: async () => {
        const { isAuthenticated, accessToken, user } = await import('@/store/auth-store').then(
          (m) => m.useAuthStore.getState()
        )

        set({ loading: true, error: null })

        try {
          // Import UserRole enum
          const { UserRole } = await import('@/lib/enums')

          // Debug logging for role detection
          console.log('[CartStore] loadCart: Checking user role:', {
            isAuthenticated,
            hasAccessToken: !!accessToken,
            userRole: user?.role,
            userRoleType: typeof user?.role,
            expectedCustomer: UserRole.CUSTOMER,
            isCustomer: user?.role === UserRole.CUSTOMER,
          })

          if (isAuthenticated && accessToken && user?.role === UserRole.CUSTOMER) {
            // Authenticated customer: load from backend
            const cartData = await cartApi.getCart()
            set({
              items: cartData.items || [],
              totalItems: cartData.totalItems || 0,
              subtotal: cartData.subtotal || 0,
              appliedPromotion: null, // Always clear promotions when loading cart from backend
              loading: false,
            })
          } else if (!isAuthenticated) {
            // Guest user: load from localStorage
            const guestItems = getGuestCart()
            set({
              items: guestItems,
              totalItems: guestItems.reduce((sum, item) => sum + item.quantity, 0),
              subtotal: guestItems.reduce((sum, item) => {
                const price = normalizePrice(item.price)
                return sum + price * item.quantity
              }, 0),
              loading: false,
            })
          } else {
            // Authenticated but not customer (admin, manager, staff): use empty cart
            console.log('[CartStore] loadCart: Non-customer user, using empty cart')
            set({
              items: [],
              totalItems: 0,
              subtotal: 0,
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
        const { isAuthenticated, accessToken } = await import('@/store/auth-store').then((m) =>
          m.useAuthStore.getState()
        )
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
            const cartItemId = item.variantSku
              ? `${item.productId}-${item.variantSku}`
              : item.productId

            const existingIndex = items.findIndex(
              (i) => i.productId === item.productId && i.variantSku === item.variantSku
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

            saveGuestCart(updatedItems)

            set({
              items: updatedItems,
              totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
              // Handle both number and object types for price
              subtotal: updatedItems.reduce((sum, item) => {
                const price = normalizePrice(item.price)
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
        const { isAuthenticated, accessToken } = await import('@/store/auth-store').then((m) =>
          m.useAuthStore.getState()
        )

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
                const price = normalizePrice(item.price)
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
        const { isAuthenticated, accessToken } = await import('@/store/auth-store').then((m) =>
          m.useAuthStore.getState()
        )

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
                const price = normalizePrice(item.price)
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
        const { isAuthenticated, accessToken } = await import('@/store/auth-store').then((m) =>
          m.useAuthStore.getState()
        )

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

      /**
       * Set promotion code
       * Stores the validated promotion in the cart state
       */
      setPromotionCode: (promotion: AppliedPromotion | null) => {
        set({ appliedPromotion: promotion })
      },

      /**
       * Clear promotion code
       * Removes the applied promotion from the cart state
       */
      clearPromotionCode: () => {
        set({ appliedPromotion: null })
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
        // Note: appliedPromotion is NOT persisted - it should be cleared after each session
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

  const { isAuthenticated, accessToken } = await import('@/store/auth-store').then((m) =>
    m.useAuthStore.getState()
  )

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

  // Calculate discount amount dynamically from applied promotion based on current subtotal
  // This ensures discount is always correct even if cart contents change
  let discountAmount = 0
  if (store.appliedPromotion) {
    if (store.appliedPromotion.type === 'percentage') {
      discountAmount = Math.round((store.subtotal * store.appliedPromotion.value) / 100)
    } else {
      // Fixed amount discount - cap at subtotal to avoid negative total
      discountAmount = Math.min(store.appliedPromotion.value, store.subtotal)
    }
  }

  // Calculate total after discount
  const totalAfterDiscount = store.subtotal - discountAmount

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

    /**
     * Get discount amount from applied promotion (calculated dynamically)
     */
    discountAmount,

    /**
     * Get formatted discount amount
     */
    formattedDiscount: new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(discountAmount),

    /**
     * Get total after discount
     */
    totalAfterDiscount,

    /**
     * Get formatted total after discount
     */
    formattedTotal: new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(totalAfterDiscount),
  }
}
