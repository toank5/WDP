import { API_ENDPOINTS, post, get } from './api'

/**
 * Return Request API
 */

export interface ReturnRequestItem {
  orderItemId: string
  quantity: number
  reason: string
  description?: string
  images?: string[]
}

export interface CreateReturnRequestPayload {
  orderId: string
  items: ReturnRequestItem[]
  reason: string
  description?: string
}

export interface ReturnRequest {
  _id: string
  orderId: string
  orderNumber: string
  userId: string
  items: ReturnRequestItem[]
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'
  reason: string
  description?: string
  refundAmount?: number
  createdAt: string
  updatedAt: string
}

/**
 * Create a new return request
 */
export async function createReturnRequest(
  payload: CreateReturnRequestPayload
): Promise<ReturnRequest> {
  return post<ReturnRequest>(API_ENDPOINTS.RETURN_REQUEST, payload)
}

/**
 * Get return requests for an order
 */
export async function getOrderReturns(orderId: string): Promise<ReturnRequest[]> {
  return get<ReturnRequest[]>(API_ENDPOINTS.ORDER_RETURNS(orderId))
}

/**
 * Get return request details
 */
export async function getReturnById(id: string): Promise<ReturnRequest> {
  return get<ReturnRequest>(API_ENDPOINTS.RETURN_DETAIL(id))
}

/**
 * Get all return requests for current user
 */
export async function getMyReturns(): Promise<ReturnRequest[]> {
  return get<ReturnRequest[]>(API_ENDPOINTS.RETURNS)
}
