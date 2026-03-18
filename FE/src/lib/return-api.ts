/**
 * Return API Client
 *
 * Handles all API calls related to returns management
 * including customer requests and staff operations
 */

import { api, extractApiMessage } from './api-client'
import type { Order, OrderItem } from './order-api'
import {
  RETURN_STATUS,
  RETURN_ITEM_CONDITION,
  RETURN_REASON,
  RETURN_TYPE,
  RETURN_ITEM_STATUS,
} from '@eyewear/shared'

// Re-export enums with PascalCase naming for backward compatibility
// Note: RETURN_TYPE is renamed to ReturnRequestType to avoid conflict with TypeScript's built-in ReturnType utility type
export { RETURN_STATUS as ReturnStatus }
export { RETURN_ITEM_CONDITION as ReturnItemCondition }
export { RETURN_REASON as ReturnReason }
export { RETURN_TYPE as ReturnRequestType }
export { RETURN_ITEM_STATUS as ReturnItemStatus }

// Type definitions matching backend DTOs
export interface ReturnLineItem {
  orderItemId: string
  productId: string
  variantId: string
  productName?: string
  productImage?: string
  quantity: number
  quantityReceived?: number
  unitPrice: number
  sku?: string
  category?: string
  isPrescription?: boolean
  // New fields for item inspection
  condition?: RETURN_ITEM_CONDITION
  inventoryProcessed?: boolean
  inspectionNotes?: string
  inspectedBy?: string
  inspectedAt?: Date
}

export interface StaffVerification {
  receivedAt?: Date
  receivedBy?: string
  conditionRating?: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'UNACCEPTABLE'
  quantityVerified?: number
  packagingIntact?: boolean
  allAccessoriesPresent?: boolean
  warehouseNotes?: string
  itemDisposition?: 'RESALEABLE' | 'DAMAGED' | 'SCRAPPED'
  inventoryMovementId?: string
}

export interface RefundDetails {
  initiatedAt?: Date
  initiatedBy?: string
  refundAmount?: number
  refundMethod?: string
  refundTransactionId?: string
  completedAt?: Date
  completedBy?: string
  notes?: string
  originalPaymentId?: string
  originalPaymentMethod?: string
}

export interface ExchangeDetails {
  processedAt?: Date
  processedBy?: string
  exchangeOrderId?: string
  notes?: string
}

export interface ReturnRequest {
  id: string
  returnNumber: string
  orderId: string
  orderNumber: string
  userId: string
  status: RETURN_STATUS
  returnType: RETURN_TYPE
  reason: RETURN_REASON
  reasonDetails?: string
  items: ReturnLineItem[]
  requestedRefundAmount: number
  approvedRefundAmount?: number
  restockingFee?: number
  restockingFeePercent?: number
  staffVerification?: StaffVerification
  refundDetails?: RefundDetails
  exchangeDetails?: ExchangeDetails
  customerNotes?: string
  customerEmail?: string
  customerPhone?: string
  rejectionReason?: string
  returnTrackingNumber?: string
  createdAt: Date
  updatedAt: Date
  requiresManagerApproval: boolean
  statusHistory?: {
    status: RETURN_STATUS
    changedBy: string
    changedAt: Date
    notes?: string
  }[]
  // New fields for enhanced return flow
  inventoryProcessed?: boolean
  inventoryProcessedAt?: Date
  inventoryProcessedBy?: string
  revenueImpact?: {
    originalRevenue: number
    refundAmount: number
    netRevenue: number
    recordedAt?: Date
  }
}

export interface CreateReturnRequestDto {
  orderId: string
  returnType: RETURN_TYPE
  reason: RETURN_REASON
  reasonDetails?: string
  items: ReturnLineItem[]
  customerNotes?: string
  customerEmail?: string
  customerPhone?: string
}

export interface VerifyReturnedItemDto {
  verification: {
    staffNotes?: string
    conditionRating?: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'UNACCEPTABLE'
    quantityVerified: number
    packagingIntact?: boolean
    allAccessoriesPresent?: boolean
  }
  notes?: string
}

export interface ProcessRefundExchangeDto {
  details: {
    refundAmount?: number
    refundMethod?: string
    refundTransactionId?: string
    exchangeOrderId?: string
    notes?: string
  }
}

export interface ReturnQueryDto {
  status?: RETURN_STATUS
  userId?: string
  orderId?: string
  returnNumber?: string
  search?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ReturnStats {
  totalReturns: number
  pendingApproval: number
  awaitingItem: number
  verifiedPendingAction: number
  totalRefundAmount: number
  approvedReturns: number
  rejectedReturns: number
  avgProcessingTimeDays: number
  returnsByReason: Record<string, number>
}

// Customer Return API methods
export const returnApi = {
  /**
   * Check return eligibility for order items
   */
  async checkEligibility(orderId: string, items: ReturnLineItem[]): Promise<{
    eligible: boolean
    returnWindowDays?: number
    daysSinceDelivery?: number
    daysRemaining?: number
    ineligibleItems?: Array<{ item: ReturnLineItem; reason: string }>
    estimatedRefundAmount?: number
    restockingFee?: number
    restockingFeePercent?: number
  }> {
    try {
      const { data } = await api.post('/returns/eligibility', { orderId, items })
      return data as any
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  },

  /**
   * Create a new return request
   */
  async createReturnRequest(dto: CreateReturnRequestDto): Promise<ReturnRequest> {
    try {
      const { data } = await api.post('/returns', dto)
      // Backend wraps response in { statusCode, message, metadata }
      return (data as any).metadata as ReturnRequest
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  },

  /**
   * Get customer's return requests
   */
  async getMyReturns(query: ReturnQueryDto = {}): Promise<{
    items: ReturnRequest[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const params = new URLSearchParams()
      if (query.status) params.append('status', query.status)
      if (query.orderId) params.append('orderId', query.orderId)
      if (query.returnNumber) params.append('returnNumber', query.returnNumber)
      if (query.search) params.append('search', query.search)
      if (query.page) params.append('page', query.page.toString())
      if (query.limit) params.append('limit', query.limit.toString())
      if (query.sortBy) params.append('sortBy', query.sortBy)
      if (query.sortOrder) params.append('sortOrder', query.sortOrder)

      const queryString = params.toString()
      const { data } = await api.get(`/returns/my-returns${queryString ? `?${queryString}` : ''}`)

      // Handle different response structures
      const result = (data as any).metadata || data
      return {
        items: Array.isArray(result?.items) ? result.items : (Array.isArray(result) ? result : []),
        total: result?.total ?? result?.page?.total ?? 0,
        page: result?.page ?? query.page ?? 1,
        limit: result?.limit ?? query.limit ?? 10,
      }
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  },

  /**
   * Get return request by ID
   */
  async getReturnRequest(id: string): Promise<ReturnRequest> {
    try {
      const { data } = await api.get(`/returns/${id}`)
      return (data as any).metadata as ReturnRequest
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  },

  /**
   * Get return request by return number
   */
  async getReturnByNumber(returnNumber: string): Promise<ReturnRequest> {
    try {
      const { data } = await api.get(`/returns/number/${returnNumber}`)
      return (data as any).metadata as ReturnRequest
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  },

  /**
   * Cancel return request
   */
  async cancelReturnRequest(id: string): Promise<ReturnRequest> {
    try {
      const { data } = await api.patch(`/returns/${id}/cancel`)
      return (data as any).metadata as ReturnRequest
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  },
}

// Staff Return Management API methods
export const staffReturnApi = {
  /**
   * Query all return requests (staff view)
   */
  async queryReturns(query: ReturnQueryDto = {}): Promise<{
    items: ReturnRequest[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const params = new URLSearchParams()
      if (query.status) params.append('status', query.status)
      if (query.userId) params.append('userId', query.userId)
      if (query.orderId) params.append('orderId', query.orderId)
      if (query.returnNumber) params.append('returnNumber', query.returnNumber)
      if (query.search) params.append('search', query.search)
      if (query.fromDate) params.append('fromDate', query.fromDate)
      if (query.toDate) params.append('toDate', query.toDate)
      if (query.page) params.append('page', query.page.toString())
      if (query.limit) params.append('limit', query.limit.toString())
      if (query.sortBy) params.append('sortBy', query.sortBy)
      if (query.sortOrder) params.append('sortOrder', query.sortOrder)

      const queryString = params.toString()
      const { data } = await api.get(`/staff/returns${queryString ? `?${queryString}` : ''}`)

      // Handle different response structures
      const result = (data as any).metadata || data
      return {
        items: Array.isArray(result?.items) ? result.items : (Array.isArray(result) ? result : []),
        total: result?.total ?? result?.page?.total ?? 0,
        page: result?.page ?? query.page ?? 1,
        limit: result?.limit ?? query.limit ?? 10,
      }
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  },

  /**
   * Get return statistics for manager dashboard
   */
  async getStatistics(filters?: { fromDate?: string; toDate?: string }): Promise<ReturnStats> {
    try {
      const params = new URLSearchParams()
      if (filters?.fromDate) params.append('fromDate', filters.fromDate)
      if (filters?.toDate) params.append('toDate', filters.toDate)

      const queryString = params.toString()
      const { data } = await api.get(`/staff/returns/statistics${queryString ? `?${queryString}` : ''}`)
      return (data as any).metadata as ReturnStats
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  },

  /**
   * Get return request by ID (staff view)
   */
  async getReturnRequest(id: string): Promise<ReturnRequest> {
    try {
      const { data } = await api.get(`/staff/returns/${id}`)
      return (data as any).metadata as ReturnRequest
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  },

  /**
   * Update return status
   */
  async updateReturnStatus(
    id: string,
    status: RETURN_STATUS,
    options?: {
      rejectionReason?: string
      approvedRefundAmount?: number
      restockingFee?: number
      restockingFeePercent?: number
    },
  ): Promise<ReturnRequest> {
    try {
      const { data } = await api.patch(`/staff/returns/${id}/status`, {
        status,
        ...options,
      })
      return (data as any).metadata as ReturnRequest
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  },

  /**
   * Verify returned item (Staff operation)
   * This is the key operation for Sale/Operation Staff:
   * - Check item condition
   * - Verify quantity
   * - Add staff notes
   */
  async verifyReturnedItem(id: string, dto: VerifyReturnedItemDto): Promise<ReturnRequest> {
    try {
      const { data } = await api.patch(`/staff/returns/${id}/verify`, dto)
      return (data as any).metadata as ReturnRequest
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  },

  /**
   * Process refund/exchange (Staff operation)
   * After verification, staff processes the refund or creates exchange order
   */
  async processRefundExchange(id: string, dto: ProcessRefundExchangeDto): Promise<ReturnRequest> {
    try {
      const { data } = await api.patch(`/staff/returns/${id}/process`, dto)
      return (data as any).metadata as ReturnRequest
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  },

  /**
   * Inspect Return Items (Sale Staff)
   * Sale Staff inspects items and sets condition for each item
   */
  async inspectReturnItems(
    id: string,
    dto: {
      items: Array<{
        orderItemId: string
        condition: RETURN_ITEM_CONDITION
        quantityReceived: number
        inspectionNotes?: string
      }>
      resolutionType: RETURN_TYPE
      approvedRefundAmount?: number
      restockingFee?: number
      notes?: string
    },
  ): Promise<ReturnRequest> {
    try {
      const { data } = await api.post(`/staff/returns/${id}/inspect`, dto)
      return (data as any).metadata as ReturnRequest
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  },

  /**
   * Approve Return Resolution (Sale Staff)
   * Sale Staff approves the return with final resolution
   */
  async approveReturnResolution(
    id: string,
    dto: {
      resolutionType: RETURN_TYPE
      approvedRefundAmount: number
      restockingFee?: number
      refundMethod?: string
      notes?: string
    },
  ): Promise<ReturnRequest> {
    try {
      const { data } = await api.post(`/staff/returns/${id}/approve`, dto)
      return (data as any).metadata as ReturnRequest
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  },

  /**
   * Process Return Inventory (Operation Staff)
   * Operation Staff updates inventory based on item conditions
   */
  async processReturnInventory(
    id: string,
    dto: {
      inventoryMovements: Array<{
        sku: string
        type: 'RETURN_IN' | 'SCRAP'
        quantity: number
        reason: string
      }>
      notes?: string
    },
  ): Promise<ReturnRequest> {
    try {
      const { data } = await api.post(`/staff/returns/${id}/inventory`, dto)
      return (data as any).metadata as ReturnRequest
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  },

  /**
   * Complete Return (Helper endpoint)
   * Called after refund/exchange is processed to mark return as COMPLETED
   */
  async completeReturn(id: string): Promise<ReturnRequest> {
    try {
      const { data } = await api.post(`/staff/returns/${id}/complete`)
      return (data as any).metadata as ReturnRequest
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  },

  /**
   * Create Exchange Order (Operation Staff)
   * Creates a new order for replacement products when processing an exchange return
   */
  async createExchangeOrder(dto: {
    returnId: string
    items: Array<{
      productId: string
      variantId: string
      productName: string
      productImage?: string
      quantity: number
      unitPrice: number
      sku?: string
    }>
    notes?: string
  }): Promise<{
    id: string
    orderNumber: string
    returnId: string
    returnNumber: string
    customerId: string
    orderType: string
    orderStatus: string
    items: any[]
    totalAmount: number
    createdAt: Date
    notes?: string
  }> {
    try {
      const { data } = await api.post('/staff/returns/exchange-order', dto)
      return (data as any).metadata || data
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  },
}

// Helper functions

/**
 * Get status label for display
 */
export function getReturnStatusLabel(status: RETURN_STATUS): string {
  const labels: Record<RETURN_STATUS, string> = {
    [RETURN_STATUS.SUBMITTED]: 'Return Submitted',
    [RETURN_STATUS.AWAITING_ITEMS]: 'Awaiting Return Items',
    [RETURN_STATUS.IN_REVIEW]: 'Under Review',
    [RETURN_STATUS.APPROVED]: 'Approved',
    [RETURN_STATUS.REJECTED]: 'Rejected',
    [RETURN_STATUS.COMPLETED]: 'Completed',
    [RETURN_STATUS.CANCELED]: 'Canceled',
  }
  return labels[status] || status
}

/**
 * Get reason label for display
 */
export function getReturnReasonLabel(reason: RETURN_REASON): string {
  const labels: Record<RETURN_REASON, string> = {
    [RETURN_REASON.DAMAGED]: 'Item Arrived Damaged',
    [RETURN_REASON.DEFECTIVE]: 'Defective Product',
    [RETURN_REASON.WRONG_ITEM]: 'Wrong Item Received',
    [RETURN_REASON.NOT_AS_DESCRIBED]: 'Not as Described',
    [RETURN_REASON.NO_LONGER_NEEDED]: 'No Longer Needed',
    [RETURN_REASON.CHANGE_OF_MIND]: 'Change of Mind',
    [RETURN_REASON.PRESCRIPTION_CHANGE]: 'Prescription Changed',
    [RETURN_REASON.OTHER]: 'Other',
  }
  return labels[reason] || reason
}

/**
 * Get status color for UI
 */
export function getReturnStatusColor(status: RETURN_STATUS): 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' {
  const colors: Record<RETURN_STATUS, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
    [RETURN_STATUS.SUBMITTED]: 'info',
    [RETURN_STATUS.AWAITING_ITEMS]: 'info',
    [RETURN_STATUS.IN_REVIEW]: 'warning',
    [RETURN_STATUS.APPROVED]: 'success',
    [RETURN_STATUS.REJECTED]: 'error',
    [RETURN_STATUS.COMPLETED]: 'success',
    [RETURN_STATUS.CANCELED]: 'default',
  }
  return colors[status] || 'default'
}

/**
 * Format return number for display
 */
export function formatReturnNumber(returnNumber: string): string {
  return returnNumber.toUpperCase()
}

export default returnApi
