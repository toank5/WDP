// Order API

import axios from 'axios'
import { api } from './api-client'
import { extractApiMessage } from './api-client'
import { useAuthStore } from '@/store/auth-store'
import { ROLES } from './validations'
import {
  ORDER_TYPES,
  ORDER_STATUS,
  PAYMENT_METHOD,
  PREORDER_STATUS,
  PAYMENT_STATUS,
  SHIPPING_METHOD,
  SHIPPING_CARRIER,
  PRESCRIPTION_REVIEW_STATUS,
  LAB_JOB_STATUS,
} from '@eyewear/shared'

// Get the API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost://3000'

// Re-export enums with PascalCase naming for backward compatibility
// Enums can be used as both values and types in TypeScript
export { ORDER_TYPES as OrderType }
export { ORDER_STATUS as OrderStatus }
export { PAYMENT_METHOD as PaymentMethod }
export { PREORDER_STATUS as PreorderStatus }
export { PAYMENT_STATUS as PaymentStatus }
export { SHIPPING_METHOD as ShippingMethod }
export { SHIPPING_CARRIER as ShippingCarrier }
export { PRESCRIPTION_REVIEW_STATUS as PrescriptionReviewStatus }
export { LAB_JOB_STATUS as LabJobStatus }
export { PRESCRIPTION_REVIEW_STATUS as PrescriptionStatus }

export interface PrescriptionData {
  pd?: number
  sph: { right: number; left: number }
  cyl: { right: number; left: number }
  axis: { right: number; left: number }
  add: { right: number; left: number }
}

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
  itemId?: string
  productId: string
  variantSku?: string
  category?: string
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
  requiresPrescription?: boolean
  typedPrescription?: {
    rightEye: { sph: number; cyl: number; axis: number; add: number }
    leftEye: { sph: number; cyl: number; axis: number; add: number }
    pd?: number
    pdRight?: number
    pdLeft?: number
    notesFromCustomer?: string
  }
  prescriptionReviewStatus?: PRESCRIPTION_REVIEW_STATUS
  prescriptionReviewNote?: string
  // Backward compatibility fields for existing UI
  isPrescription?: boolean
  prescriptionStatus?: PRESCRIPTION_REVIEW_STATUS
  prescriptionData?: PrescriptionData
  prescriptionUrl?: string
}

export interface LabJob {
  _id: string
  orderId: string
  orderItemId: string
  rightEye: { sph: number; cyl: number; axis: number; add: number }
  leftEye: { sph: number; cyl: number; axis: number; add: number }
  pd?: number
  pdRight?: number
  pdLeft?: number
  lensType: string
  status: LAB_JOB_STATUS
  notes?: string
  orderNumber?: string
  customerName?: string
  frameName?: string
  frameSku?: string
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
  prescriptionLensFeeTotal?: number
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

export interface UpdateManufacturingStatusRequest {
  itemId: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  note?: string
}

export interface ReviewPrescriptionRequest {
  status: PRESCRIPTION_REVIEW_STATUS.APPROVED | PRESCRIPTION_REVIEW_STATUS.REJECTED
  note?: string
}

export interface UpdateLabJobStatusRequest {
  status: LAB_JOB_STATUS
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

function normalizeOrder(order: Order): Order {
  return {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      category: (item as OrderItem & { productCategory?: string }).category
        ?? (item as OrderItem & { productCategory?: string }).productCategory,
      isPrescription: item.requiresPrescription,
      prescriptionStatus: item.prescriptionReviewStatus,
      prescriptionData: item.typedPrescription
        ? {
            pd: item.typedPrescription.pd,
            sph: {
              right: item.typedPrescription.rightEye.sph,
              left: item.typedPrescription.leftEye.sph,
            },
            cyl: {
              right: item.typedPrescription.rightEye.cyl,
              left: item.typedPrescription.leftEye.cyl,
            },
            axis: {
              right: item.typedPrescription.rightEye.axis,
              left: item.typedPrescription.leftEye.axis,
            },
            add: {
              right: item.typedPrescription.rightEye.add,
              left: item.typedPrescription.leftEye.add,
            },
          }
        : undefined,
    })),
  }
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
        shippingMethod: request.shippingMethod,
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
        orders: Array.isArray(payload?.orders) ? payload.orders.map(normalizeOrder) : [],
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
          orders: Array.isArray(payload?.orders) ? payload.orders.map(normalizeOrder) : [],
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
        orders: Array.isArray(payload?.orders) ? payload.orders.map(normalizeOrder) : [],
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
      return normalizeOrder(unwrapApiPayload<Order>(response.data))
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
      const response = await api.post(`/orders/${orderId}/manufacturing`, request)
      return normalizeOrder(unwrapApiPayload<Order>(response.data))
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  async getPrescriptionQueue(status: PRESCRIPTION_REVIEW_STATUS = PRESCRIPTION_REVIEW_STATUS.PENDING_REVIEW): Promise<Order[]> {
    const response = await api.get(`/staff/prescriptions?status=${status}`)
    return unwrapApiPayload<Order[]>(response.data).map(normalizeOrder)
  }

  async getPrescriptionDetail(orderItemId: string): Promise<{ order: Order; item: OrderItem }> {
    const response = await api.get(`/staff/prescriptions/${orderItemId}`)
    const payload = unwrapApiPayload<{ order: Order; item: OrderItem }>(response.data)
    return { ...payload, order: normalizeOrder(payload.order) }
  }

  async reviewPrescription(orderItemId: string, request: ReviewPrescriptionRequest): Promise<{ order: Order; workOrder?: LabJob }> {
    const response = await api.patch(`/staff/prescriptions/${orderItemId}`, request)
    const payload = unwrapApiPayload<{ order: Order; workOrder?: LabJob }>(response.data)
    return { ...payload, order: normalizeOrder(payload.order) }
  }

  // Backward compatibility wrappers
  async approvePrescription(orderId: string, request: { itemId: string; note?: string }): Promise<Order> {
    const result = await this.reviewPrescription(request.itemId, {
      status: PRESCRIPTION_REVIEW_STATUS.APPROVED,
      note: request.note,
    })
    return result.order
  }

  async requestPrescriptionUpdate(orderId: string, request: { itemId: string; message?: string }): Promise<Order> {
    const result = await this.reviewPrescription(request.itemId, {
      status: PRESCRIPTION_REVIEW_STATUS.REJECTED,
      note: request.message,
    })
    return result.order
  }

  async getLabJobs(status?: LAB_JOB_STATUS): Promise<LabJob[]> {
    const url = status ? `/staff/lab-jobs?status=${status}` : '/staff/lab-jobs'
    const response = await api.get(url)
    return unwrapApiPayload<LabJob[]>(response.data)
  }

  async updateLabJobStatus(id: string, request: UpdateLabJobStatusRequest): Promise<LabJob> {
    const response = await api.patch(`/staff/lab-jobs/${id}/status`, request)
    return unwrapApiPayload<LabJob>(response.data)
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

      return normalizeOrder(unwrapApiPayload<Order>(response.data))
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

      return normalizeOrder(unwrapApiPayload<Order>(response.data))
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

      return normalizeOrder(unwrapApiPayload<Order>(response.data))
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

      return normalizeOrder(unwrapApiPayload<Order>(response.data))
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

      return normalizeOrder(unwrapApiPayload<Order>(response.data))
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

      return normalizeOrder(unwrapApiPayload<Order>(response.data))
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

      return normalizeOrder(unwrapApiPayload<Order>(response.data))
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
