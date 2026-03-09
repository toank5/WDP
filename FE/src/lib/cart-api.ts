// Cart API - Server-side cart integration
// This file handles all API calls to the backend cart service
// LocalStorage handling is managed by cart.store.ts

import { api } from './api-client'
import { extractApiMessage } from './api-client'
import { useAuthStore } from '@/store/auth-store'

/**
 * Cart item type from backend
 */
export interface CartItem {
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
    isPreorder?: boolean
    isPrescription?: boolean
  }
  addedAt: string
}

/**
 * Request to add item to cart
 */
export interface AddCartItemRequest {
  productId: string
  variantSku?: string
  quantity: number
}

/**
 * Cart response from backend
 */
export interface CartResponse {
  _id: string
  customerId: string
  items: CartItem[]
  totalItems: number
  subtotal: number
  createdAt: string
  updatedAt: string
}

/**
 * Cart API Service
 *
 * This service provides a clean interface to the backend cart API.
 * All localStorage handling is managed by cart.store.ts
 */
class CartAPI {
  /**
   * Get current user's cart from backend
   * GET /cart
   */
  async getCart(): Promise<CartResponse> {
    // Check if user is authenticated before calling backend
    const authState = useAuthStore.getState()
    if (!authState.isAuthenticated || !authState.accessToken) {
      throw new Error('User not authenticated')
    }

    const response = await api.get('/cart')
    const cartData = response.data.metadata || response.data.data

    if (!cartData) {
      throw new Error('No cart data returned from server')
    }

    return cartData
  }

  /**
   * Add item to cart
   * POST /cart/items
   */
  async addItem(params: AddCartItemRequest): Promise<{ success: boolean; message: string }> {
    // Check if user is authenticated before calling backend
    const authState = useAuthStore.getState()
    if (!authState.isAuthenticated || !authState.accessToken) {
      return { success: false, message: 'Please login to add items to cart' }
    }

    try {
      await api.post('/cart/items', {
        productId: params.productId,
        variantSku: params.variantSku,
        quantity: params.quantity,
      })

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('cartUpdated'))

      return { success: true, message: 'Item added to cart' }
    } catch (error) {
      const message = extractApiMessage(error)
      console.error('Failed to add item to cart:', message)
      return { success: false, message: message || 'Failed to add item to cart' }
    }
  }

  /**
   * Bulk add items to cart
   * POST /cart/items/bulk
   */
  async bulkAddItems(items: AddCartItemRequest[]): Promise<{ success: boolean; message: string }> {
    try {
      await api.post('/cart/items/bulk', { items })

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('cartUpdated'))

      return { success: true, message: 'Items added to cart' }
    } catch (error) {
      const message = extractApiMessage(error)
      console.error('Failed to bulk add items:', message)
      return { success: false, message: message || 'Failed to add items to cart' }
    }
  }

  /**
   * Update cart item quantity
   * PATCH /cart/items/:itemId
   */
  async updateItem(itemId: string, quantity: number): Promise<{ success: boolean; message: string }> {
    try {
      await api.patch(`/cart/items/${itemId}`, { quantity })

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('cartUpdated'))

      return { success: true, message: 'Cart updated' }
    } catch (error) {
      const message = extractApiMessage(error)
      console.error('Failed to update cart:', message)
      return { success: false, message: message || 'Failed to update cart' }
    }
  }

  /**
   * Remove item from cart
   * DELETE /cart/items/:itemId
   */
  async removeItem(itemId: string): Promise<{ success: boolean; message: string }> {
    try {
      await api.delete(`/cart/items/${itemId}`)

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('cartUpdated'))

      return { success: true, message: 'Item removed from cart' }
    } catch (error) {
      const message = extractApiMessage(error)
      console.error('Failed to remove item:', message)
      return { success: false, message: message || 'Failed to remove item' }
    }
  }

  /**
   * Clear the entire cart
   * DELETE /cart
   */
  async clearCart(): Promise<{ success: boolean; message: string; itemsRemoved: number }> {
    try {
      const response = await api.delete('/cart')
      const itemsRemoved = (response.data.metadata || response.data.data)?.itemsRemoved || 0

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('cartUpdated'))

      return {
        success: true,
        message: 'Cart cleared',
        itemsRemoved,
      }
    } catch (error) {
      const message = extractApiMessage(error)
      console.error('Failed to clear cart:', message)
      return { success: false, message: message || 'Failed to clear cart', itemsRemoved: 0 }
    }
  }

  /**
   * Get cart item count
   * GET /cart/count
   */
  async getCartCount(): Promise<number> {
    // Check if user is authenticated before calling backend
    const authState = useAuthStore.getState()
    if (!authState.isAuthenticated || !authState.accessToken) {
      // Guest users don't have backend cart, return 0
      // The cart store handles localStorage for guest users
      return 0
    }

    try {
      const response = await api.get('/cart/count')
      return (response.data.metadata || response.data.data)?.count || 0
    } catch (error) {
      console.error('Failed to get cart count:', error)
      return 0
    }
  }

  /**
   * Validate cart items (stock availability)
   * GET /cart/validate
   */
  async validateCart(): Promise<{
    valid: boolean
    invalidItems: Array<{ itemId: string; reason: string }>
  }> {
    // Check if user is authenticated before calling backend
    const authState = useAuthStore.getState()
    if (!authState.isAuthenticated || !authState.accessToken) {
      // Guest users can't validate against backend
      return { valid: true, invalidItems: [] }
    }

    try {
      const response = await api.get('/cart/validate')
      return response.data.metadata || response.data.data
    } catch (error) {
      console.error('Failed to validate cart:', error)
      return { valid: true, invalidItems: [] }
    }
  }
}

export const cartApi = new CartAPI()
