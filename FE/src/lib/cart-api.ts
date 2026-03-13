// Cart API - Server-side cart integration
// This file handles all API calls to the backend cart service
// LocalStorage handling is managed by cart.store.ts

import { api } from './api-client'
import { extractApiMessage } from './api-client'
import { useAuthStore } from '@/store/auth-store'
import { UserRole } from '@/lib/enums'

/**
 * Cart item type from backend
 * Note: price may be returned as number or as an object with price property
 * Use normalizeCartItemPrice() to safely get the numeric value
 */
export interface CartItem {
  _id: string
  productId: string
  variantSku?: string
  productName?: string
  productImage?: string
  price?: number | { price: number }  // Backend may return as object or number
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
 * Safely normalize cart item price to a number
 * Handles both number and { price: number } formats
 */
export function normalizeCartItemPrice(item: CartItem): number {
  if (typeof item.price === 'number') return item.price
  if (typeof item.price === 'object' && item.price !== null && 'price' in item.price) {
    const priceValue = item.price.price
    return typeof priceValue === 'number' ? priceValue : 0
  }
  return 0
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
   * Only customers can access this endpoint
   */
  async getCart(): Promise<CartResponse> {
    // Check if user is authenticated and is a customer before calling backend
    const authState = useAuthStore.getState()
    if (!authState.isAuthenticated || !authState.accessToken) {
      throw new Error('User not authenticated')
    }
    if (authState.user?.role !== UserRole.CUSTOMER) {
      throw new Error('Cart is only available for customer accounts')
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
   * Only customers can access this endpoint
   */
  async addItem(params: AddCartItemRequest): Promise<{ success: boolean; message: string }> {
    // Check if user is authenticated and is a customer before calling backend
    const authState = useAuthStore.getState()
    if (!authState.isAuthenticated || !authState.accessToken) {
      return { success: false, message: 'Please login to add items to cart' }
    }
    if (authState.user?.role !== UserRole.CUSTOMER) {
      return { success: false, message: 'Cart is only available for customer accounts' }
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
   * Only customers can access this endpoint
   */
  async getCartCount(): Promise<number> {
    // Check if user is authenticated and is a customer before calling backend
    const authState = useAuthStore.getState()
    if (!authState.isAuthenticated || !authState.accessToken) {
      // Guest users don't have backend cart, return 0
      // The cart store handles localStorage for guest users
      return 0
    }
    if (authState.user?.role !== UserRole.CUSTOMER) {
      // Non-customer users don't have carts
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
   * Only customers can access this endpoint
   */
  async validateCart(): Promise<{
    valid: boolean
    invalidItems: Array<{ itemId: string; reason: string }>
  }> {
    // Check if user is authenticated and is a customer before calling backend
    const authState = useAuthStore.getState()
    if (!authState.isAuthenticated || !authState.accessToken) {
      // Guest users can't validate against backend
      return { valid: true, invalidItems: [] }
    }
    if (authState.user?.role !== UserRole.CUSTOMER) {
      // Non-customer users don't have carts to validate
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
