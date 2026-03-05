// Pre-order API for frontend
import { api } from './api-client'
import { extractApiMessage } from './api-client'
import type { PreorderStatus, PREORDER_STATUS_LABELS } from '@/types/api.types'

// Pre-order inventory view types
export interface PreorderInventoryView {
  sku: string
  productName: string
  variantSize?: string
  variantColor?: string
  onHand: number
  incoming: number
  preordered: number
  remainingPreorderCapacity?: number
  nextIncomingDate?: string
  preorderStatus: 'OK' | 'TIGHT' | 'OVERSOLD'
}

// Pre-order line item types
export interface PreorderLineItem {
  orderId: string
  orderNumber: string
  customerName: string
  customerEmail?: string
  productId: string
  variantSku: string
  productName: string
  quantity: number
  reservedQuantity: number
  preorderStatus: PreorderStatus
  expectedShipDate?: string
  createdAt: string
  priceAtOrder: number
}

// Pre-order overview types
export interface PreorderOverview {
  totalOpenPreorders: number
  totalUnitsOnPreorder: number
  totalPreorderValue: number
  preorderInventoryViews: PreorderInventoryView[]
  recentPreorders: PreorderLineItem[]
}

// Pre-order detail types
export interface PreorderDetailResponse {
  sku: string
  productName: string
  variantInfo: {
    size?: string
    color?: string
    images2D?: string[]
  }
  inventory: {
    onHand: number
    incoming: number
    preordered: number
    remainingToFulfill: number
  }
  preorderConfig: {
    isEnabled: boolean
    expectedShipStart?: string
    expectedShipEnd?: string
    limit?: number
  }
  preorderItems: PreorderLineItem[]
  upcomingDeliveries: Array<{
    expectedDate: string
    quantity: number
  }>
}

// Allocation result types
export interface PreorderAllocationResult {
  totalReceived: number
  totalAllocated: number
  ordersUpdated: number
  ordersUpdatedList: Array<{
    orderId: string
    orderNumber: string
    allocatedQuantity: number
    newStatus: PreorderStatus
  }>
  remainingUnallocated: number
}

// Preorder API client
class PreorderAPI {
  private readonly baseUrl = '/preorders'

  /**
   * Get pre-order overview for dashboard
   */
  async getOverview(): Promise<PreorderOverview> {
    try {
      const response = await api.get(`${this.baseUrl}/overview`)
      return response.data.data
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Get pre-order details for a specific SKU
   */
  async getDetailBySku(sku: string): Promise<PreorderDetailResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/${encodeURIComponent(sku.toUpperCase())}`)
      return response.data.data
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Allocate received stock to pre-orders
   */
  async allocateStock(sku: string, receivedQuantity: number, notes?: string): Promise<PreorderAllocationResult> {
    try {
      const response = await api.post(`${this.baseUrl}/allocate`, {
        sku: sku.toUpperCase(),
        receivedQuantity,
        notes,
      })
      return response.data.data
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }
}

export const preorderApi = new PreorderAPI()

// Export the labels for use in components
export { PREORDER_STATUS_LABELS }
