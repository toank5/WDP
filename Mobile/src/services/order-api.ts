import { API_ENDPOINTS, get, post } from './api'
import type { Order } from '../types'

/**
 * Get all orders for current user
 */
export async function getOrders(): Promise<Order[]> {
  return get<Order[]>(API_ENDPOINTS.ORDERS)
}

/**
 * Get order by ID
 */
export async function getOrderById(id: string): Promise<Order> {
  return get<Order>(API_ENDPOINTS.ORDER_DETAIL(id))
}

/**
 * Create new order
 */
export interface CreateOrderPayload {
  items: Array<{
    productId: string
    variantSku?: string
    quantity: number
    priceAtOrder?: number
  }>
  shippingAddress: {
    fullName: string
    phone: string
    address: string
    city?: string
    district?: string
    ward?: string
  }
  shippingMethod?: 'STANDARD' | 'EXPRESS'
  payment?: {
    method: string
  }
  paymentMethod: string
  orderType: 'in-stock' | 'pre-order' | 'prescription'
  prescriptionId?: string
  notes?: string
  promotionCode?: string
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  return post<Order>(API_ENDPOINTS.ORDERS, payload)
}

export interface CheckoutCreatePaymentPayload {
  shippingAddress: {
    fullName: string
    phone: string
    address: string
    city: string
    district: string
    ward?: string
    zipCode?: string
  }
  notes?: string
  promotionCode?: string
  shippingMethod?: 'STANDARD' | 'EXPRESS'
}

export interface CheckoutCreatePaymentResponse {
  paymentUrl: string
  orderId: string
  orderNumber: string
  txnRef: string
  amount: number
}

export async function createCheckoutPayment(
  payload: CheckoutCreatePaymentPayload
): Promise<CheckoutCreatePaymentResponse> {
  return post<CheckoutCreatePaymentResponse>(API_ENDPOINTS.CHECKOUT_CREATE_PAYMENT, payload)
}

/**
 * Cancel order
 */
export async function cancelOrder(id: string): Promise<Order> {
  return post<Order>(`${API_ENDPOINTS.ORDER_DETAIL(id)}/cancel`)
}
