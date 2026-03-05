// Cart API using backend API

import { api } from './api-client'
import { extractApiMessage } from './api-client'
import { formatImageUrl } from './product-api'
import { useAuthStore } from '@/store/auth-store'
import { ROLES } from './validations'

// Cart item type from backend
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
  addedAt: string
}

// Local cart item type (for add request - matches backend expectations)
export interface AddCartItemRequest {
  productId: string
  variantSku?: string
  quantity: number
}

// Cart response from backend
export interface CartResponse {
  _id: string
  customerId: string
  items: CartItem[]
  totalItems: number
  subtotal: number
  createdAt: string
  updatedAt: string
}

// Legacy cart item type (for backward compatibility)
export interface LegacyCartItem {
  cartItemId: string
  id: string
  name: string
  price: number
  variantSku?: string
  variantName?: string
  qty: number
  image: string
}

// Raw cart item from localStorage (could be old or new format)
interface RawCartItem extends Partial<CartItem>, Partial<LegacyCartItem> {
  _id?: string
  productId?: string
  variantSku?: string
  productName?: string
  productImage?: string
  price?: number
  quantity?: number
  variantDetails?: {
    size?: string
    color?: string
  }
  addedAt?: string
}

const CART_BASE_KEY = 'cart'

class CartAPI {
  // Get user-specific cart storage key
  private getCartStorageKey(userId?: string): string {
    const state = useAuthStore.getState()
    const currentUserId = userId || state.user?.email || 'guest'
    return `${CART_BASE_KEY}_${currentUserId}`
  }

  private get isAuthenticated() {
    // Check if user is authenticated using the auth store
    const state = useAuthStore.getState()
    return state.isAuthenticated && !!state.accessToken
  }


  /**
   * Get current user's cart from backend
   */
  async getCart(): Promise<CartResponse> {
    try {
      const response = await api.get('/cart')
      const cartData = response.data.metadata || response.data.data

      // Log the response for debugging
      console.log('Backend cart response:', {
        hasMetadata: !!response.data.metadata,
        hasData: !!response.data.data,
        cartData: cartData ? {
          itemsCount: cartData.items?.length || 0,
          totalItems: cartData.totalItems,
          subtotal: cartData.subtotal,
        } : null,
      })

      if (!cartData) {
        console.warn('Backend returned success but no cart data, falling back to localStorage')
        return this.getCartFromLocalStorage()
      }

      return cartData
    } catch (error) {
      const message = extractApiMessage(error)
      console.log('Backend cart API failed, using localStorage fallback:', message)
      // Always fall back to localStorage if backend fails for any reason
      // This ensures the cart works even when:
      // - Backend is down
      // - User is not logged in
      // - Cart doesn't exist yet
      // - Network error
      return this.getCartFromLocalStorage()
    }
  }

  /**
   * Get cart from localStorage (fallback)
   * Handles both old format {id, name, price, qty, image, variantName} and new format
   */
  private getCartFromLocalStorage(): CartResponse {
    try {
      const cart = localStorage.getItem(this.getCartStorageKey())
      if (!cart) {
        return this.emptyCartResponse()
      }

      const rawItems: RawCartItem[] = JSON.parse(cart)

      // Convert items to new CartItem format
      const items: CartItem[] = rawItems.map((rawItem): CartItem => {
        // Check if item is already in new format
        if (rawItem._id && rawItem.productId && rawItem.quantity !== undefined) {
          return {
            _id: rawItem._id,
            productId: rawItem.productId,
            variantSku: rawItem.variantSku,
            productName: rawItem.productName,
            productImage: rawItem.productImage,
            price: rawItem.price,
            quantity: rawItem.quantity,
            variantDetails: rawItem.variantDetails,
            addedAt: rawItem.addedAt || new Date().toISOString(),
          }
        }

        // Convert from old format {id, name, price, qty, image, variantName}
        const id = rawItem.id || rawItem.cartItemId
        if (!id) {
          throw new Error('Invalid cart item: missing id')
        }
        return {
          _id: id,
          productId: rawItem.id || id,
          variantSku: rawItem.variantSku,
          productName: rawItem.name,
          productImage: rawItem.image,
          price: rawItem.price ?? 0,
          quantity: rawItem.qty || rawItem.quantity || 1,
          variantDetails: rawItem.variantName ? {
            color: rawItem.variantName,
          } : undefined,
          addedAt: rawItem.addedAt || new Date().toISOString(),
        }
      })

      // Save the converted cart back to localStorage in new format
      localStorage.setItem(this.getCartStorageKey(), JSON.stringify(items))

      return {
        _id: '',
        customerId: '',
        items,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Error parsing cart from localStorage:', error)
      return this.emptyCartResponse()
    }
  }

  /**
   * Returns an empty cart response
   */
  private emptyCartResponse(): CartResponse {
    return {
      _id: '',
      customerId: '',
      items: [],
      totalItems: 0,
      subtotal: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  /**
   * Save cart to localStorage
   */
  private saveCartToLocalStorage(cart: CartItem[]): void {
    localStorage.setItem(this.getCartStorageKey(), JSON.stringify(cart))
    window.dispatchEvent(new CustomEvent('cartUpdated'))
  }

  /**
   * Add item to cart
   */
  async addItem(params: {
    variantId?: string
    productId: string
    quantity: number
    productData?: {
      name?: string
      image?: string
      price?: number
      variantName?: string
      variantSku?: string
    }
  }): Promise<{ success: boolean; message: string }> {
    let usingLocalStorage = !useAuthStore.getState().accessToken

    try {
      // Try backend first if authenticated
      const token = useAuthStore.getState().accessToken
      if (token) {
        console.log('Adding to backend cart:', {
          productId: params.productId,
          variantSku: params.variantId,
          quantity: params.quantity,
        })

        const response = await api.post('/cart/items', {
          productId: params.productId,
          variantSku: params.variantId,
          quantity: params.quantity,
        })

        console.log('Backend add to cart response:', {
          status: response.status,
          hasData: !!response.data,
          hasMetadata: !!response.data.metadata,
        })

        // Clear local cart since backend is now the source of truth
        const storageKey = this.getCartStorageKey()
        console.log('Clearing localStorage cart:', storageKey)
        localStorage.removeItem(storageKey)
        window.dispatchEvent(new CustomEvent('cartUpdated'))

        return { success: true, message: 'Item added to cart' }
      }
    } catch (error) {
      // Fall back to localStorage if backend fails
      const message = extractApiMessage(error)
      console.log('Backend cart API failed, using localStorage. Error:', message)
      usingLocalStorage = true
    }

    // LocalStorage fallback (or primary storage for non-authenticated users)
    try {
      const cart = this.getCartFromLocalStorage()
      const { variantId, productId, quantity, productData } = params

      const cartItemId = variantId ? `${productId}-${variantId}` : productId

      const existingItem = cart.items.find((item) => item.productId === productId && item.variantSku === variantId)

      if (existingItem) {
        existingItem.quantity += quantity
        console.log('Updated existing item:', existingItem)
      } else {
        const newItem = {
          _id: cartItemId,
          productId,
          variantSku: variantId,
          productName: productData?.name,
          productImage: productData?.image,
          price: productData?.price,
          quantity,
          variantDetails: productData?.variantName ? {
            color: productData.variantName,
          } : undefined,
          addedAt: new Date().toISOString(),
        }
        cart.items.push(newItem)
        console.log('Added new item:', newItem)
      }

      this.saveCartToLocalStorage(cart.items)
      console.log('Cart saved to localStorage. Total items:', cart.items.length)
      return { success: true, message: usingLocalStorage ? 'Added to cart (saved locally)' : 'Added to cart' }
    } catch (error) {
      console.error('Failed to add to cart:', error)
      return { success: false, message: 'Failed to add to cart' }
    }
  }

  /**
   * Bulk add items to cart (for merging guest cart)
   */
  async bulkAddItems(items: AddCartItemRequest[]): Promise<{ success: boolean; message: string }> {
    try {
      const token = useAuthStore.getState().accessToken
      if (token) {
        await api.post('/cart/items/bulk', {
          items,
        }, {
        })

        window.dispatchEvent(new CustomEvent('cartUpdated'))
        return { success: true, message: 'Items added to cart' }
      }
    } catch (error) {
      // Fall back to localStorage
    }

    // LocalStorage fallback
    try {
      const cart = this.getCartFromLocalStorage()

      for (const item of items) {
        const cartItemId = item.variantSku ? `${item.productId}-${item.variantSku}` : item.productId
        const existingItem = cart.items.find(
          (i) => i.productId === item.productId && i.variantSku === item.variantSku
        )

        if (existingItem) {
          existingItem.quantity += item.quantity
        } else {
          cart.items.push({
            _id: cartItemId,
            productId: item.productId,
            variantSku: item.variantSku,
            quantity: item.quantity,
            addedAt: new Date().toISOString(),
          })
        }
      }

      this.saveCartToLocalStorage(cart.items)
      return { success: true, message: 'Items added to cart' }
    } catch (error) {
      return { success: false, message: 'Failed to add items to cart' }
    }
  }

  /**
   * Update item quantity
   */
  async updateItem(itemId: string, quantity: number): Promise<{ success: boolean; message: string }> {
    if (quantity <= 0) {
      return this.removeItem(itemId)
    }

    try {
      const token = useAuthStore.getState().accessToken
      if (token) {
        await api.patch(`/cart/items/${itemId}`, {
          quantity,
        }, {
        })

        window.dispatchEvent(new CustomEvent('cartUpdated'))
        return { success: true, message: 'Cart updated' }
      }
    } catch (error) {
      // Fall back to localStorage
    }

    // LocalStorage fallback
    try {
      const cart = this.getCartFromLocalStorage()
      const item = cart.items.find((i) => i._id === itemId)

      if (item) {
        item.quantity = quantity
        this.saveCartToLocalStorage(cart.items)
        return { success: true, message: 'Cart updated' }
      }

      return { success: false, message: 'Item not found' }
    } catch (error) {
      return { success: false, message: 'Failed to update cart' }
    }
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemId: string): Promise<{ success: boolean; message: string }> {
    try {
      const token = useAuthStore.getState().accessToken
      if (token) {
        await api.delete(`/cart/items/${itemId}`, {
        })

        window.dispatchEvent(new CustomEvent('cartUpdated'))
        return { success: true, message: 'Item removed from cart' }
      }
    } catch (error) {
      // Fall back to localStorage
    }

    // LocalStorage fallback
    try {
      const cart = this.getCartFromLocalStorage()
      cart.items = cart.items.filter((i) => i._id !== itemId)
      this.saveCartToLocalStorage(cart.items)
      return { success: true, message: 'Item removed from cart' }
    } catch (error) {
      return { success: false, message: 'Failed to remove item' }
    }
  }

  /**
   * Clear cart
   */
  async clearCart(): Promise<{ success: boolean; message: string; itemsRemoved: number }> {
    try {
      const token = useAuthStore.getState().accessToken
      if (token) {
        const response = await api.delete('/cart', {
        })

        window.dispatchEvent(new CustomEvent('cartUpdated'))
        return {
          success: true,
          message: 'Cart cleared',
          itemsRemoved: (response.data.metadata || response.data.data)?.itemsRemoved || 0,
        }
      }
    } catch (error) {
      // Fall back to localStorage
    }

    // LocalStorage fallback
    try {
      const cart = this.getCartFromLocalStorage()
      const itemsRemoved = cart.items.length
      this.saveCartToLocalStorage([])
      return { success: true, message: 'Cart cleared', itemsRemoved }
    } catch (error) {
      return { success: false, message: 'Failed to clear cart', itemsRemoved: 0 }
    }
  }

  /**
   * Get cart item count
   */
  async getCartCount(): Promise<number> {
    try {
      const { accessToken: token, user } = useAuthStore.getState()
      if (token && user?.role === ROLES.CUSTOMER) {
        const response = await api.get('/cart/count', {
        })
        return (response.data.metadata || response.data.data)?.count || 0
      }
    } catch (error) {
      // Silently fall back to localStorage
    }

    // LocalStorage fallback (also used when not authenticated)
    const cart = this.getCartFromLocalStorage()
    return cart.totalItems || 0
  }

  /**
   * Get cart total
   */
  async getCartTotal(): Promise<number> {
    try {
      const { accessToken: token, user } = useAuthStore.getState()
      if (token && user?.role === ROLES.CUSTOMER) {
        const response = await api.get('/cart', {
        })
        return (response.data.metadata || response.data.data)?.subtotal || 0
      }
    } catch (error) {
      // Fall back to localStorage
    }

    // LocalStorage fallback
    const cart = this.getCartFromLocalStorage()
    return cart.subtotal || 0
  }

  /**
   * Get cart items (legacy - returns format compatible with existing UI)
   */
  async getItems(): Promise<CartItem[]> {
    try {
      const cart = await this.getCart()
      return cart.items
    } catch (error) {
      return []
    }
  }

  /**
   * Validate cart (check stock availability)
   */
  async validateCart(): Promise<{
    valid: boolean
    invalidItems: Array<{ itemId: string; reason: string }>
  }> {
    try {
      const token = useAuthStore.getState().accessToken
      if (token) {
        const response = await api.get('/cart/validate', {
        })
        return response.data.metadata || response.data.data
      }
    } catch (error) {
      // If validation fails, proceed anyway
    }

    return { valid: true, invalidItems: [] }
  }

  /**
   * Merge guest cart (from localStorage) to user cart
   */
  async mergeGuestCart(guestCartItems: CartItem[]): Promise<{ success: boolean; message: string }> {
    if (guestCartItems.length === 0) {
      return { success: true, message: 'No items to merge' }
    }

    // Convert guest cart items to add item requests
    const itemsToAdd: AddCartItemRequest[] = guestCartItems.map((item) => ({
      productId: item.productId,
      variantSku: item.variantSku,
      quantity: item.quantity,
    }))

    return this.bulkAddItems(itemsToAdd)
  }

  /**
   * Migrate from localStorage to backend
   * Call this after user logs in to migrate their guest cart
   */
  async migrateFromLocalStorage(): Promise<{ success: boolean; message: string }> {
    try {
      // After login, the storage key is now the user's email, but the guest cart was stored as 'cart_guest'
      // So we need to check both the current key and the guest key
      const guestCartKey = `${CART_BASE_KEY}_guest`
      const guestCart = localStorage.getItem(guestCartKey) || localStorage.getItem(this.getCartStorageKey())

      if (!guestCart) {
        return { success: true, message: 'No items to migrate' }
      }

      const items: CartItem[] = JSON.parse(guestCart)
      console.log('Migrating cart items:', items.length)

      const result = await this.mergeGuestCart(items)

      if (result.success) {
        // Clear both guest and user-specific localStorage keys
        localStorage.removeItem(guestCartKey)
        localStorage.removeItem(this.getCartStorageKey())
        console.log('Cart migration completed, localStorage cleared')
      }

      return result
    } catch (error) {
      console.error('Cart migration failed:', error)
      return { success: false, message: 'Migration failed' }
    }
  }
}

export const cartApi = new CartAPI()
