import { useState, useEffect, useCallback } from 'react'

/**
 * Auth data structure stored in localStorage under "wdp-auth"
 * This can come from two sources:
 * 1. Zustand persist format: { state: { user: { email: ... }, accessToken, isAuthenticated }, version: ... }
 * 2. Direct format: { email: string, token: string, userId: string }
 */
interface WdpAuthDirect {
  email?: string
  token?: string
  userId?: string
}

interface WdpAuthState {
  user?: {
    email?: string
    fullName?: string
    role?: number
  }
  accessToken?: string
  isAuthenticated?: boolean
}

interface WdpAuthPersist {
  state?: WdpAuthState
  version?: number
}

export interface CartItem {
  _id: string
  productId: string
  variantSku?: string
  productName?: string
  productImage?: string
  price?: number
  quantity: number
  variantDetails?: {
    size?: string
    color?: string
  }
  addedAt?: string
}

/**
 * Reads the user email from localStorage "wdp-auth"
 * Handles both Zustand persist format and direct format
 */
function getUserEmailFromStorage(): string | null {
  try {
    const authData = localStorage.getItem('wdp-auth')
    if (!authData) return null

    const parsed: unknown = JSON.parse(authData)

    // Case 1: Zustand persist format { state: { user: { email } }, version: ... }
    if (typeof parsed === 'object' && parsed !== null && 'state' in parsed) {
      const persistData = parsed as WdpAuthPersist
      const email = persistData.state?.user?.email
      if (email) {
        console.log('[useUserCart] Found email from Zustand persist:', email)
        return email
      }
    }

    // Case 2: Direct format { email, token, userId }
    if (typeof parsed === 'object' && parsed !== null && 'email' in parsed) {
      const directData = parsed as WdpAuthDirect
      if (directData.email) {
        console.log('[useUserCart] Found email from direct format:', directData.email)
        return directData.email
      }
    }

    console.warn('[useUserCart] wdp-auth found but no email field', parsed)
    return null
  } catch (error) {
    console.error('[useUserCart] Failed to parse wdp-auth:', error)
    return null
  }
}

/**
 * Gets the cart storage key for the current user
 * Format: cart_{email} or cart_guest
 */
function getCartKey(email: string | null): string {
  return email ? `cart_${email}` : 'cart_guest'
}

/**
 * Reads cart from localStorage for the given email
 * Returns empty array if cart doesn't exist or is invalid
 */
function readCartFromLocalStorage(key: string): CartItem[] {
  try {
    const cartData = localStorage.getItem(key)
    if (!cartData) {
      console.log('[useUserCart] No cart found for key:', key)
      return []
    }

    const parsed: unknown = JSON.parse(cartData)

    // Validate it's an array
    if (!Array.isArray(parsed)) {
      console.warn('[useUserCart] Cart data is not an array:', parsed)
      return []
    }

    console.log('[useUserCart] Loaded', parsed.length, 'items from', key)
    return parsed as CartItem[]
  } catch (error) {
    console.error('[useUserCart] Failed to read cart from localStorage:', error)
    return []
  }
}

/**
 * Writes cart to localStorage
 */
function writeCartToLocalStorage(key: string, items: CartItem[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items))
    console.log('[useUserCart] Saved', items.length, 'items to', key)
  } catch (error) {
    console.error('[useUserCart] Failed to write cart to localStorage:', error)
  }
}

/**
 * Result type for useUserCart hook
 */
export interface UseUserCartResult {
  items: CartItem[]
  email: string | null
  cartKey: string | null
  loading: boolean
  error: string | null
  setItems: (items: CartItem[] | ((prev: CartItem[]) => CartItem[])) => void
  addItem: (item: CartItem) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  refreshCart: () => void
}

/**
 * Custom hook for managing user-specific cart in localStorage
 *
 * This hook:
 * 1. Reads the current user from localStorage.getItem("wdp-auth")
 * 2. Builds the cart key as cart_{email}
 * 3. Initializes state from that cart JSON in localStorage
 * 4. Automatically writes back to localStorage whenever cart state changes
 * 5. Handles missing/malformed auth gracefully
 *
 * @example
 * const { items, email, loading, setItems, addItem, removeItem } = useUserCart()
 */
export function useUserCart(): UseUserCartResult {
  const [items, setItemsState] = useState<CartItem[]>([])
  const [email, setEmail] = useState<string | null>(null)
  const [cartKey, setCartKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Refresh cart - re-read from localStorage
   * Useful when user logs in/out or you want to sync with external changes
   */
  const refreshCart = useCallback(() => {
    console.log('[useUserCart] Refreshing cart...')

    // 1. Get user email from auth storage
    const currentUserEmail = getUserEmailFromStorage()
    setEmail(currentUserEmail)

    // 2. Build cart key
    const currentCartKey = getCartKey(currentUserEmail)
    setCartKey(currentCartKey)

    // 3. Read cart from localStorage
    const cartItems = readCartFromLocalStorage(currentCartKey)

    // 4. Update state WITHOUT writing back (to avoid overwriting)
    setItemsState(cartItems)
    setError(null)
    setLoading(false)
  }, [])

  // Initial load - read from localStorage ONCE
  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  /**
   * Write cart to localStorage whenever items change
   * But only after initial load to avoid clearing existing cart
   */
  useEffect(() => {
    if (!loading && cartKey) {
      writeCartToLocalStorage(cartKey, items)
    }
  }, [items, cartKey, loading])

  /**
   * Set items and ensure they're written to localStorage
   */
  const setItems = useCallback((newItems: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
    setItemsState((prev) => {
      const updated = typeof newItems === 'function' ? newItems(prev) : newItems
      console.log('[useUserCart] Items updated:', updated.length, 'items')
      return updated
    })
  }, [])

  /**
   * Add item to cart
   */
  const addItem = useCallback((item: CartItem) => {
    setItemsState((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === item.productId && i.variantSku === item.variantSku
      )

      if (existingIndex >= 0) {
        // Update existing item
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + item.quantity,
        }
        console.log('[useUserCart] Updated existing item:', updated[existingIndex])
        return updated
      }

      // Add new item
      console.log('[useUserCart] Added new item:', item)
      return [...prev, { ...item, addedAt: item.addedAt || new Date().toISOString() }]
    })
  }, [])

  /**
   * Remove item from cart
   */
  const removeItem = useCallback((itemId: string) => {
    setItemsState((prev) => {
      const filtered = prev.filter((item) => item._id !== itemId)
      console.log('[useUserCart] Removed item:', itemId)
      return filtered
    })
  }, [])

  /**
   * Update item quantity
   */
  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(itemId)
      return
    }

    setItemsState((prev) =>
      prev.map((item) =>
        item._id === itemId ? { ...item, quantity } : item
      )
    )
  }, [removeItem])

  /**
   * Clear entire cart
   */
  const clearCart = useCallback(() => {
    setItemsState([])
    console.log('[useUserCart] Cart cleared')
  }, [])

  return {
    items,
    email,
    cartKey,
    loading,
    error,
    setItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    refreshCart,
  }
}
