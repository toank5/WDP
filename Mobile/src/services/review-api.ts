import { API_ENDPOINTS, get, post, put, del } from './api'
import type { Review, ReviewStats } from '../types'

/**
 * Get reviews for a product
 */
export async function getProductReviews(
  productId: string,
  sort?: 'newest' | 'oldest' | 'highest' | 'lowest',
  rating?: number
): Promise<Review[]> {
  let url = API_ENDPOINTS.REVIEWS_PRODUCT(productId)
  const params = new URLSearchParams()

  if (sort) params.append('sort', sort)
  if (rating) params.append('rating', rating.toString())

  if (params.toString()) {
    url += `?${params.toString()}`
  }

  return get<Review[]>(url)
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
 * Submit review (alias for createReview)
 */
export async function submitReview(payload: CreateReviewPayload): Promise<Review> {
  return post<Review>(API_ENDPOINTS.REVIEW_SUBMIT, payload)
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
