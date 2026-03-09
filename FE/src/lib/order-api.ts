// Order API

import axios from 'axios'
import { api } from './api-client'
import { extractApiMessage } from './api-client'

// Get the API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// Order enums
export enum OrderType {
  READY = 'READY',
  PREORDER = 'PREORDER',
  PRESCRIPTION = 'PRESCRIPTION',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
}

export enum PaymentMethod {
  VNPAY = 'VNPAY',
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
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
  preorderStatus?: 'PENDING_STOCK' | 'PARTIALLY_RESERVED' | 'READY_TO_FULFILL' | 'FULFILLED' | 'CANCELED'
  expectedShipDate?: string
  reservedQuantity?: number
}

export interface OrderPayment {
  method: string
  amount: number
  transactionId?: string
  paidAt?: Date
  status?: 'PENDING' | 'PAID' | 'FAILED'
}

export interface OrderTracking {
  carrier?: string
  trackingNumber?: string
  estimatedDelivery?: Date
  actualDelivery?: Date
}

export interface OrderHistoryItem {
  status: OrderStatus
  changedBy?: string
  timestamp: Date
  note?: string
}

export interface Order {
  _id: string
  orderNumber: string
  customerId: string
  orderType: OrderType
  orderStatus: OrderStatus
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
  shippingMethod: 'STANDARD' | 'EXPRESS'
  payment: {
    method: PaymentMethod
  }
  orderType?: OrderType
  notes?: string
}

export interface CheckoutResponse {
  order: Order
  paymentUrl?: string
}

export interface OrderListQueryParams {
  status?: OrderStatus
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
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
   */
  async checkout(request: CheckoutRequest): Promise<CheckoutResponse> {
    try {
      // Use the new checkout endpoint
      // Map postalCode to zipCode for backend compatibility
      const { postalCode, ...addressRest } = request.shippingAddress
      const payload = {
        shippingAddress: {
          ...addressRest,
          zipCode: postalCode,
        },
        notes: request.notes,
      }

      console.log('Sending checkout request:', payload)
      const response = await api.post('/checkout/create-payment', payload)
      console.log('Received response:', response)

      // The response structure is: { statusCode, message, metadata: { paymentUrl, orderId, ... } }
      const data = response.data.metadata || response.data

      return {
        order: {
          _id: data.orderId,
          orderNumber: data.orderNumber,
          customerId: '',
          orderType: request.orderType || OrderType.READY,
          orderStatus: OrderStatus.PENDING,
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

      return response.data.data
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<Order> {
    try {
      const response = await api.get(`/orders/${orderId}`)

      return response.data.data
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

      return response.data.data
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

      return response.data.data
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

      return response.data.data
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }
}

export const orderApi = new OrderAPI()
