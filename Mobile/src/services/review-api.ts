import { API_ENDPOINTS, get, post, put, del } from './api'
import type { Review, ReviewStats } from '../types'

/**
 * Get reviews for a product
 */
export async function getProductReviews(productId: string): Promise<Review[]> {
  return get<Review[]>(API_ENDPOINTS.REVIEWS_PRODUCT(productId))
}

/**
 * Get review stats for a product
 */
export async function getProductReviewStats(productId: string): Promise<ReviewStats> {
  return get<ReviewStats>(`${API_ENDPOINTS.REVIEWS}/stats/${productId}`)
}

/**
 * Create review
 */
export interface CreateReviewPayload {
  productId: string
  rating: number
  comment: string
  images?: string[]
}

export async function createReview(payload: CreateReviewPayload): Promise<Review> {
  return post<Review>(API_ENDPOINTS.REVIEWS, payload)
}

/**
 * Update review
 */
export async function updateReview(
  id: string,
  payload: Partial<CreateReviewPayload>
): Promise<Review> {
  return put<Review>(`${API_ENDPOINTS.REVIEWS}/${id}`, payload)
}

/**
 * Delete review
 */
export async function deleteReview(id: string): Promise<{ message: string }> {
  return del<{ message: string }>(`${API_ENDPOINTS.REVIEWS}/${id}`)
}
