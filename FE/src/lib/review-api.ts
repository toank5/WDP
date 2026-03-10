// Review API

import { api } from './api-client'
import { extractApiMessage } from './api-client'
import { unwrapApiPayload } from './type-guards'

// Review types
export interface Review {
  _id: string
  userId: string
  productId: string
  orderId: string
  variantSku?: string
  rating: number
  comment: string
  title?: string
  images: string[]
  isVerifiedPurchase: boolean
  helpfulCount: number
  isVisible: boolean
  response?: string
  responseDate?: string
  userName?: string
  userAvatar?: string
  createdAt: string
  updatedAt: string
}

export interface CreateReviewRequest {
  productId: string
  orderId: string
  variantSku?: string
  rating: number
  comment: string
  title?: string
  images?: string[]
}

export interface UpdateReviewRequest {
  rating?: number
  comment?: string
  title?: string
  images?: string[]
}

export interface ReviewStats {
  averageRating: number
  totalReviews: number
  ratingDistribution: Record<number, number>
  fiveStarPercentage: number
}

export interface ProductReviewsResponse {
  reviews: Review[]
  total: number
  totalPages: number
  page: number
}

export interface UnreviewedProduct {
  productId: string
  orderId: string
  variantSku?: string
  orderNumber: string
  productName: string
  productImage?: string
  deliveredDate?: string
}

class ReviewAPI {
  /**
   * Create a new review
   */
  async createReview(request: CreateReviewRequest): Promise<Review> {
    try {
      const response = await api.post('/reviews', request)
      return unwrapApiPayload<Review>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Get reviews for a specific product
   */
  async getProductReviews(
    productId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: 'recent' | 'helpful' | 'rating-high' | 'rating-low' = 'recent',
  ): Promise<ProductReviewsResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
      })

      const response = await api.get(`/reviews/product/${productId}?${params.toString()}`)
      const payload = unwrapApiPayload<{
        reviews: Review[]
        total: number
        totalPages: number
      }>(response.data)

      return {
        reviews: payload.reviews || [],
        total: payload.total || 0,
        totalPages: payload.totalPages || 1,
        page,
      }
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Get product review statistics
   */
  async getProductStats(productId: string): Promise<ReviewStats> {
    try {
      const response = await api.get(`/reviews/product/${productId}/stats`)
      return unwrapApiPayload<ReviewStats>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Get current user's reviews
   */
  async getMyReviews(page: number = 1, limit: number = 10): Promise<ProductReviewsResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      const response = await api.get(`/reviews/my-reviews?${params.toString()}`)
      const payload = unwrapApiPayload<{
        reviews: Review[]
        total: number
        totalPages: number
      }>(response.data)

      return {
        reviews: payload.reviews || [],
        total: payload.total || 0,
        totalPages: payload.totalPages || 1,
        page,
      }
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Check if user can review a product from an order
   */
  async canUserReviewProduct(
    productId: string,
    orderId: string,
    variantSku?: string,
  ): Promise<{ canReview: boolean; reason?: string }> {
    try {
      const params = variantSku ? `?variantSku=${variantSku}` : ''
      const response = await api.get(`/reviews/can-review/${productId}/${orderId}${params}`)
      const payload = unwrapApiPayload<{ canReview: boolean; reason?: string }>(response.data)
      return payload
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Get all products from delivered orders that user hasn't reviewed yet
   */
  async getUnreviewedProducts(): Promise<UnreviewedProduct[]> {
    try {
      const response = await api.get('/reviews/unreviewed')
      return unwrapApiPayload<UnreviewedProduct[]>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Get a single review by ID
   */
  async getReviewById(reviewId: string): Promise<Review> {
    try {
      const response = await api.get(`/reviews/${reviewId}`)
      return unwrapApiPayload<Review>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Update a review
   */
  async updateReview(reviewId: string, request: UpdateReviewRequest): Promise<Review> {
    try {
      const response = await api.put(`/reviews/${reviewId}`, request)
      return unwrapApiPayload<Review>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string): Promise<void> {
    try {
      await api.delete(`/reviews/${reviewId}`)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Mark a review as helpful
   */
  async markAsHelpful(reviewId: string): Promise<Review> {
    try {
      const response = await api.post(`/reviews/${reviewId}/helpful`)
      return unwrapApiPayload<Review>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Upload review images
   */
  async uploadReviewImages(files: File[]): Promise<string[]> {
    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('files', file)
      })

      const response = await api.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Assuming the API returns { urls: string[] }
      return response.data?.urls || []
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }
}

export const reviewApi = new ReviewAPI()
