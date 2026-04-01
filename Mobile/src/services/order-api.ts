import { API_ENDPOINTS, get, post } from './api'
import type { Order } from '../types'

export interface OrderListResponse {
  orders: Order[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Get all orders for current user
 */
export async function getOrders(): Promise<OrderListResponse> {
  const response = await get<Order[] | OrderListResponse>(API_ENDPOINTS.ORDERS)

  // Backward compatibility: allow either plain array or paginated object shape.
  if (Array.isArray(response)) {
    return {
      orders: response,
      total: response.length,
      page: 1,
      limit: response.length,
      totalPages: 1,
    }
  }

  return {
    orders: Array.isArray(response.orders) ? response.orders : [],
    total: response.total ?? 0,
    page: response.page ?? 1,
    limit: response.limit ?? 20,
    totalPages: response.totalPages ?? 1,
  }
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
