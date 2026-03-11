import { API_ENDPOINTS, get, post, del } from './api'
import type { Product } from '../types'

/**
 * Get user wishlist
 */
export async function getWishlist(): Promise<Product[]> {
  return get<Product[]>(API_ENDPOINTS.WISHLIST)
}

/**
 * Add product to wishlist
 */
export async function addToWishlist(productId: string): Promise<Product> {
  return post<Product>(API_ENDPOINTS.WISHLIST_ADD(productId), {})
}

/**
 * Remove product from wishlist
 */
export async function removeFromWishlist(productId: string): Promise<{ message: string }> {
  return del<{ message: string }>(API_ENDPOINTS.WISHLIST_REMOVE(productId))
}
