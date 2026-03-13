// Order API

import axios from 'axios'
import { api } from './api-client'
import { extractApiMessage } from './api-client'
import { useAuthStore } from '@/store/auth-store'
import { ROLES } from './validations'
import {
  ORDER_TYPES,
  ORDER_STATUS,
  PRESCRIPTION_STATUS,
  PAYMENT_METHOD,
  PREORDER_STATUS,
  PAYMENT_STATUS,
  SHIPPING_METHOD,
  SHIPPING_CARRIER,
} from '@eyewear/shared'

// Get the API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost://3000'

// Re-export enums with PascalCase naming for backward compatibility
// Enums can be used as both values and types in TypeScript
export { ORDER_TYPES as OrderType }
export { ORDER_STATUS as OrderStatus }
export { PRESCRIPTION_STATUS as PrescriptionStatus }
export { PAYMENT_METHOD as PaymentMethod }
export { PREORDER_STATUS as PreorderStatus }
export { PAYMENT_STATUS as PaymentStatus }
export { SHIPPING_METHOD as ShippingMethod }
export { SHIPPING_CARRIER as ShippingCarrier }

// Order types
export interface ShippingAddress {
  fullName: string
  phone: string
  address: string
  city: string
  district: string
  ward?: string
  postalCode?: string
}

export interface OrderItem {
  _id: string
  productId: string
  variantSku?: string
  productName?: string
  productImage?: string
  priceAtOrder: number
  quantity: number
  variantDetails?: {
    size?: string
    color?: string
  }
  // Pre-order fields
  isPreorder?: boolean
  preorderStatus?: PREORDER_STATUS
  expectedShipDate?: string
  reservedQuantity?: number
  // Prescription fields
  isPrescription?: boolean
  prescriptionStatus?: PRESCRIPTION_STATUS
  prescriptionData?: PrescriptionData
  prescriptionUrl?: string
  // Manufacturing proof fields (on OrderItem level)
  manufacturingProofUrl?: string
  manufacturingStatus?: 'PENDING' | 'COMPLETED' | 'FAILED'
  manufacturedAt?: string
}

export interface PrescriptionData {
  pd: number
  sph: {
    right: number
    left: number
  }
  cyl: {
    right: number
    left: number
  }
  axis: {
    right: number
    left: number
  }
  add: {
    right: number
    left: number
  }
}

export interface OrderPayment {
  method: string
  amount: number
  transactionId?: string
  paidAt?: Date | string
  status?: PAYMENT_STATUS
}

export interface OrderTracking {
  carrier?: string
  trackingNumber?: string
  estimatedDelivery?: Date
  actualDelivery?: Date
}

export interface OrderHistoryItem {
  status: ORDER_STATUS
  changedBy?: string
  timestamp: Date
  note?: string
}

export interface Order {
  _id: string
  orderNumber: string
  customerId: string
  orderType: ORDER_TYPES
  orderStatus: ORDER_STATUS
  items: OrderItem[]
  subtotal: number
  shippingFee: number
  tax: number
  totalAmount: number
  shippingAddress: ShippingAddress
  payment?: OrderPayment
  tracking?: OrderTracking
  assignedStaffId?: string
  notes?: string
  history?: OrderHistoryItem[]
  // Promotion fields
  promotionId?: string
  promotionCode?: string
  promotionDiscount?: number
  comboDiscount?: number
  comboId?: string
  createdAt: string
  updatedAt: string
}

export interface CheckoutRequest {
  items: Array<{
    productId: string
    variantSku?: string
    quantity: number
    priceAtOrder: number
  }>
  shippingAddress: ShippingAddress
  shippingMethod: SHIPPING_METHOD
  payment: {
    method: PAYMENT_METHOD
  }
  orderType?: ORDER_TYPES
  notes?: string
  promotionCode?: string
}

export interface CheckoutResponse {
  order: Order
  paymentUrl?: string
}

export interface OrderListQueryParams {
  status?: ORDER_STATUS
  showAll?: boolean
  search?: string
  orderType?: ORDER_TYPES
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface MarkAsShippedRequest {
  trackingNumber: string
  carrier: string
  estimatedDelivery?: string
  note?: string
}

export interface ApproveOrderRequest {
  note?: string
}

export interface ApprovePrescriptionRequest {
  itemId: string
  note?: string
}

export interface RequestPrescriptionUpdateRequest {
  itemId: string
  message: string
}

export interface UpdateManufacturingStatusRequest {
  itemId: string
  status: 'IN_MANUFACTURING' | 'READY_TO_SHIP' | 'COMPLETED'
  note?: string
}

export interface OrderListResponse {
  orders: Order[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CancelOrderRequest {
  reason: string
}

// API response wrapper
interface ApiResponse<T> {
  statusCode: number
  message: string
  data?: T
  metadata?: T
  success?: boolean
}

/**
 * Safely unwrap API response payload
 * Uses type guards to ensure runtime safety
 */
function unwrapApiPayload<T>(raw: unknown): T {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid API response: response is not an object')
  }

  const response = raw as Partial<ApiResponse<T> & { success?: boolean; data?: T; metadata?: T }>

  // Check for success + data pattern
  if (response.success === true && response.data !== undefined) {
    return response.data
  }

  // Check for metadata pattern
  if (response.metadata !== undefined) {
    return response.metadata
  }

  // Check for data pattern
  if (response.data !== undefined) {
    return response.data
  }

  // The response itself might be the data (rare case)
  if ('statusCode' in response || 'message' in response) {
    throw new Error('No valid data found in API response')
  }

  return raw as T
}

class OrderAPI {
  // Helper to clear all cart data
  private clearAllCarts(): void {
    const CART_BASE_KEY = 'cart'
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith(CART_BASE_KEY)) {
        localStorage.removeItem(key)
      }
    })
    window.dispatchEvent(new CustomEvent('cartUpdated'))
  }

  /**
   * Checkout - Create order from cart
   * This uses the new checkout endpoint with VNPAY integration
   * Note: Items are fetched from the database cart, not sent in request
   */
  async checkout(request: CheckoutRequest): Promise<CheckoutResponse> {
    try {
      // Map postalCode to zipCode for backend compatibility
      const { postalCode, ...addressRest } = request.shippingAddress

      // Build checkout payload - only send fields that DTO accepts
      // Items are fetched from database cart by the backend
      const payload = {
        shippingAddress: {
          ...addressRest,
          zipCode: postalCode,
        },
        notes: request.notes,
        promotionCode: request.promotionCode,
      }

      console.log('[OrderAPI] Sending checkout request:', JSON.stringify(payload, null, 2))
      const response = await api.post('/checkout/create-payment', payload)
      console.log('[OrderAPI] Received response:', response)

      // The response structure is: { statusCode, message, metadata: { paymentUrl, orderId, ... } }
      const data = response.data.metadata || response.data

      return {
        order: {
          _id: data.orderId,
          orderNumber: data.orderNumber,
          customerId: '',
          orderType: request.orderType || ORDER_TYPES.READY,
          orderStatus: ORDER_STATUS.PENDING,
          items: [],
          subtotal: 0,
          shippingFee: 0,
          tax: 0,
          totalAmount: data.amount,
          shippingAddress: request.shippingAddress,
          payment: { method: 'VNPAY', amount: data.amount },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        paymentUrl: data.paymentUrl,
      }
    } catch (error) {
      console.error('Full checkout error:', error)
      if (axios.isAxiosError(error)) {
        console.error('Error response:', error.response)
        console.error('Error request:', error.request)
        console.error('Error config:', error.config)
      }
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Get user's orders
   */
  async getMyOrders(params: OrderListQueryParams = {}): Promise<OrderListResponse> {
    try {
      const queryParams = new URLSearchParams()

      if (params.status) queryParams.append('status', params.status)
      if (params.search) queryParams.append('search', params.search)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

      const queryString = queryParams.toString()
      const url = `/orders${queryString ? `?${queryString}` : ''}`

      const response = await api.get(url)
      const payload = unwrapApiPayload<OrderListResponse>(response.data)

      return {
        orders: Array.isArray(payload?.orders) ? payload.orders : [],
        total: payload?.total ?? 0,
        page: payload?.page ?? params.page ?? 1,
        limit: payload?.limit ?? params.limit ?? 10,
        totalPages: payload?.totalPages ?? 1,
      }
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Get orders for operations dashboard.
   * Supports fallback endpoints to accommodate backend route naming differences.
   */
  async getOpsOrders(params: OrderListQueryParams = {}): Promise<OrderListResponse> {
    const queryParams = new URLSearchParams()

    if (params.showAll) queryParams.append('showAll', 'true')
    if (params.status) queryParams.append('status', params.status)
    if (params.search) queryParams.append('search', params.search)
    if (params.orderType) queryParams.append('orderType', params.orderType)
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params.dateTo) queryParams.append('dateTo', params.dateTo)
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

    const queryString = queryParams.toString()
    const candidates = ['/orders/ops', '/orders/management', '/orders']

    for (const baseUrl of candidates) {
      try {
        const url = `${baseUrl}${queryString ? `?${queryString}` : ''}`
        const response = await api.get(url)
        const payload = unwrapApiPayload<OrderListResponse>(response.data)

        return {
          orders: Array.isArray(payload?.orders) ? payload.orders : [],
          total: payload?.total ?? 0,
          page: payload?.page ?? params.page ?? 1,
          limit: payload?.limit ?? params.limit ?? 20,
          totalPages: payload?.totalPages ?? 1,
        }
      } catch (error) {
        const statusCode = axios.isAxiosError(error)
          ? (error.response?.status ?? 0)
          : 0

        // Try next candidate route when endpoint not found.
        if (statusCode === 404) {
          continue
        }

        // For auth/permission or server errors, surface immediately.
        throw new Error(extractApiMessage(error))
      }
    }

    throw new Error('No operations order endpoint is available')
  }

  /**
   * Get sales pending-approval queue.
   */
  async getSalesPendingOrders(params: OrderListQueryParams = {}): Promise<OrderListResponse> {
    try {
      const queryParams = new URLSearchParams()

      if (params.showAll) queryParams.append('showAll', 'true')
      if (params.status) queryParams.append('status', params.status)
      if (params.search) queryParams.append('search', params.search)
      if (params.orderType) queryParams.append('orderType', params.orderType)
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom)
      if (params.dateTo) queryParams.append('dateTo', params.dateTo)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

      const queryString = queryParams.toString()
      const url = `/orders/sales-pending${queryString ? `?${queryString}` : ''}`

      const response = await api.get(url)
      const payload = unwrapApiPayload<OrderListResponse>(response.data)

      return {
        orders: Array.isArray(payload?.orders) ? payload.orders : [],
        total: payload?.total ?? 0,
        page: payload?.page ?? params.page ?? 1,
        limit: payload?.limit ?? params.limit ?? 20,
        totalPages: payload?.totalPages ?? 1,
      }
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Sales approval: move order to operations queue.
   */
  async approveOrderForOperations(orderId: string, request: ApproveOrderRequest = {}): Promise<Order> {
    try {
      const response = await api.post(`/orders/${orderId}/approve`, request)
      return unwrapApiPayload<Order>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Approve prescription (Sales Staff)
   */
  async approvePrescription(orderId: string, request: ApprovePrescriptionRequest): Promise<Order> {
    try {
      const response = await api.post(`/orders/${orderId}/prescription/approve`, request)
      return unwrapApiPayload<Order>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Request prescription update from customer (Sales Staff)
   */
  async requestPrescriptionUpdate(orderId: string, request: RequestPrescriptionUpdateRequest): Promise<Order> {
    try {
      const response = await api.post(`/orders/${orderId}/prescription/request-update`, request)
      return unwrapApiPayload<Order>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Update manufacturing status (Operations Staff)
   */
  async updateManufacturingStatus(orderId: string, request: UpdateManufacturingStatusRequest): Promise<Order> {
    try {
      const response = await api.post(`/orders/${orderId}/prescription/manufacturing`, request)
      return unwrapApiPayload<Order>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Get order by ID
   * Uses different endpoints based on user role:
   * - Staff (ADMIN, MANAGER, OPERATION, SALE): /staff/orders/:id
   * - Customer: /orders/:id
   */
  async getOrderById(orderId: string): Promise<Order> {
    try {
      // Get current user role from auth store
      const authState = useAuthStore.getState()
      const userRole = authState.user?.role

      // Determine endpoint based on role
      // Staff roles (0-3) use staff endpoint, customers (4) use customer endpoint
      const isStaff = userRole !== undefined && userRole < ROLES.CUSTOMER
      const endpoint = isStaff ? `/staff/orders/${orderId}` : `/orders/${orderId}`

      const response = await api.get(endpoint)

      return unwrapApiPayload<Order>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Get order by order number (for VNPAY callback)
   */
  async getOrderByNumber(orderNumber: string): Promise<Order> {
    try {
      const response = await api.get(`/checkout/order?orderNumber=${orderNumber}`)

      return unwrapApiPayload<Order>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, request: CancelOrderRequest): Promise<Order> {
    try {
      const response = await api.post(`/orders/${orderId}/cancel`, request)

      return unwrapApiPayload<Order>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Confirm receipt (Operations Staff)
   * Marks order as DELIVERED and performs final inventory deduction
   */
  async confirmReceipt(orderId: string): Promise<Order> {
    try {
      const response = await api.post(`/orders/${orderId}/confirm-receipt`)

      return unwrapApiPayload<Order>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Update order fulfillment status.
   */
  async updateOrderStatus(orderId: string, status: ORDER_STATUS, note?: string): Promise<Order> {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, {
        status,
        note,
      })

      return unwrapApiPayload<Order>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Update shipping tracking details.
   */
  async updateTracking(
    orderId: string,
    payload: { carrier: string; trackingNumber: string; estimatedDelivery?: string },
  ): Promise<Order> {
    try {
      const queryParams = new URLSearchParams({
        carrier: payload.carrier,
        trackingNumber: payload.trackingNumber,
      })

      if (payload.estimatedDelivery) {
        queryParams.append('estimatedDelivery', payload.estimatedDelivery)
      }

      const response = await api.post(`/orders/${orderId}/tracking?${queryParams.toString()}`)

      return unwrapApiPayload<Order>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Mark order as shipped with required tracking details.
   */
  async markAsShipped(orderId: string, request: MarkAsShippedRequest): Promise<Order> {
    await this.updateTracking(orderId, {
      carrier: request.carrier,
      trackingNumber: request.trackingNumber,
      estimatedDelivery: request.estimatedDelivery,
    })

    return this.updateOrderStatus(orderId, ORDER_STATUS.SHIPPED, request.note)
  }

  /**
   * Upload manufacturing proof for OrderItem (Operations Staff)
   * POST /orders/:orderId/items/:itemId/manufacturing-proof
   */
  async uploadManufacturingProof(orderId: string, itemId: string, file: File): Promise<Order> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post(
        `/orders/${orderId}/items/${itemId}/manufacturing-proof`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      return unwrapApiPayload<Order>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Get order statistics (admin only)
   */
  async getOrderStats(): Promise<{
    total: number
    byStatus: Record<string, number>
  }> {
    try {
      const response = await api.get('/orders/stats/summary')

      return unwrapApiPayload<{ total: number; byStatus: Record<string, number> }>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }
}

export const orderApi = new OrderAPI()
