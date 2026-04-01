import { API_ENDPOINTS, post } from './api'

export type PromotionType = 'percentage' | 'fixed_amount'

export interface Promotion {
  _id: string
  code: string
  name: string
  description?: string
  type: PromotionType
  value: number
  minOrderValue: number
}

export interface ValidatePromotionPayload {
  code: string
  cartTotal: number
  productIds?: string[]
  customerId?: string
}

export interface ValidatePromotionResponse {
  isValid: boolean
  promotion?: Promotion
  discountAmount?: number
  message?: string
}

export async function validatePromotion(
  payload: ValidatePromotionPayload
): Promise<ValidatePromotionResponse> {
  return post<ValidatePromotionResponse>(API_ENDPOINTS.PROMOTIONS_VALIDATE, payload)
}
