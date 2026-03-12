import { API_ENDPOINTS, get, post, put, del } from './api'
import type { CartItem, CartResponse, ProductData } from '../types'

/**
 * Get current user cart
 */
export async function getCart(): Promise<CartResponse> {
  return get<CartResponse>(API_ENDPOINTS.CART)
}

/**
 * Add item to cart
 */
export interface AddToCartPayload {
  productId: string
  variantSku?: string
  quantity: number
}

export async function addToCart(payload: AddToCartPayload): Promise<CartResponse> {
  return post<CartResponse>(API_ENDPOINTS.CART_ITEMS, payload)
}

/**
 * Bulk add items to cart
 */
export async function bulkAddCartItems(items: AddToCartPayload[]): Promise<CartResponse> {
  return post<CartResponse>(`${API_ENDPOINTS.CART_ITEMS}/bulk`, { items })
}

/**
 * Update cart item quantity
 */
export interface UpdateCartItemPayload {
  quantity: number
}

export async function updateCartItem(
  itemId: string,
  payload: UpdateCartItemPayload
): Promise<CartResponse> {
  return put<CartResponse>(API_ENDPOINTS.CART_ITEM(itemId), payload)
}

/**
 * Remove item from cart
 */
export async function removeFromCart(itemId: string): Promise<CartResponse> {
  return del<CartResponse>(API_ENDPOINTS.CART_ITEM(itemId))
}

/**
 * Clear cart
 */
export async function clearCart(): Promise<{ message: string }> {
  return del<{ message: string }>(API_ENDPOINTS.CART_CLEAR)
}

/**
 * Get cart item count
 */
export async function getCartCount(): Promise<{ count: number }> {
  return get<{ count: number }>(API_ENDPOINTS.CART_COUNT)
}

/**
 * Validate cart items (stock availability)
 */
export async function validateCart(): Promise<{
  valid: boolean
  invalidItems: Array<{ itemId: string; reason: string }>
}> {
  return get(API_ENDPOINTS.CART_VALIDATE)
}

/**
 * Merge guest cart to user cart
 */
export interface MergeCartPayload {
  items: AddToCartPayload[]
}

export async function mergeCart(payload: MergeCartPayload): Promise<CartResponse> {
  return post<CartResponse>(API_ENDPOINTS.CART_MERGE, payload)
}
