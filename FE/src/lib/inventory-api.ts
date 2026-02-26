import { api } from './api-client'
import { extractApiMessage } from './api-client'

type ApiResponse<T> = {
  statusCode: number
  message: string
  data?: T
  metadata?: T
  errors?: Array<{ path: string; message: string }>
}

/**
 * Supplier information type
 */
export type SupplierInfo = {
  name?: string
  contactEmail?: string
  contactPhone?: string
  code?: string
  notes?: string
  expectedArrival?: string
}

/**
 * Inventory item type
 */
export type InventoryItem = {
  _id: string
  sku: string
  stockQuantity: number
  reservedQuantity: number
  availableQuantity: number
  reorderLevel: number
  supplierInfo?: SupplierInfo
  updatedAt: string
  createdAt: string
}

/**
 * Enriched inventory item with product information
 */
export type InventoryItemEnriched = InventoryItem & {
  productName?: string
  productCategory?: string
  variantSize?: string
  variantColor?: string
  variantPrice?: number
  variantIsActive?: boolean
  productIsActive?: boolean
  productId?: string
}

/**
 * Query parameters for inventory list
 */
export type InventoryQueryParams = {
  sku?: string
  lowStock?: boolean
  activeOnly?: boolean
  page?: number
  limit?: number
}

/**
 * Inventory list response
 */
export type InventoryListResponse = {
  items: InventoryItemEnriched[]
  total: number
  page: number
  limit: number
}

/**
 * Update inventory payload
 */
export type UpdateInventoryPayload = {
  stockQuantity?: number
  reservedQuantity?: number
  reorderLevel?: number
  supplierInfo?: SupplierInfo
}

/**
 * Stock adjustment payload
 */
export type StockAdjustmentPayload = {
  delta: number
  reason: string
  reference?: string
}

/**
 * Bulk stock update item
 */
export type BulkStockUpdateItem = {
  sku: string
  stockQuantity: number
  reservedQuantity?: number
}

/**
 * Bulk stock update payload
 */
export type BulkStockUpdatePayload = {
  items: BulkStockUpdateItem[]
}

/**
 * Reserve inventory payload
 */
export type ReserveInventoryPayload = {
  quantity: number
  orderId?: string
}

/**
 * Release reservation payload
 */
export type ReleaseReservationPayload = {
  quantity: number
  orderId?: string
}

async function handleRequest<T>(
  promise: Promise<{ data: ApiResponse<T> }>,
): Promise<T> {
  try {
    const response = await promise
    const data = response.data?.data || response.data?.metadata
    if (!data) {
      if (response.data.statusCode !== 200 && response.data.statusCode !== 201) {
        throw new Error(response.data.message || 'Request failed')
      }
      // Return empty object if data is undefined but status is successful
      return {} as T
    }
    return data as T
  } catch (error) {
    const message = extractApiMessage(error)
    throw new Error(message)
  }
}

/**
 * Get all inventory items with optional filters
 */
export async function getInventoryList(
  params: InventoryQueryParams = {},
): Promise<InventoryListResponse> {
  const queryParams = new URLSearchParams()

  if (params.sku) queryParams.append('sku', params.sku)
  if (params.lowStock) queryParams.append('lowStock', 'true')
  if (params.activeOnly) queryParams.append('activeOnly', 'true')
  if (params.page) queryParams.append('page', params.page.toString())
  if (params.limit) queryParams.append('limit', params.limit.toString())

  const queryString = queryParams.toString()
  const url = `/manager/inventory${queryString ? `?${queryString}` : ''}`

  return handleRequest<InventoryListResponse>(api.get(url))
}

/**
 * Get inventory item by SKU
 */
export async function getInventoryBySku(
  sku: string,
): Promise<InventoryItemEnriched | null> {
  try {
    return await handleRequest<InventoryItemEnriched>(
      api.get(`/manager/inventory/${sku}`),
    )
  } catch (error) {
    // Return null if not found
    const message = extractApiMessage(error)
    if (message.includes('not found')) {
      return null
    }
    throw error
  }
}

/**
 * Create a new inventory item
 */
export async function createInventory(
  payload: {
    sku: string
    stockQuantity: number
    reservedQuantity: number
    reorderLevel: number
    supplierInfo: SupplierInfo
  },
): Promise<InventoryItem> {
  return handleRequest<InventoryItem>(api.post('/manager/inventory', payload))
}

/**
 * Update inventory item by SKU
 */
export async function updateInventory(
  sku: string,
  payload: UpdateInventoryPayload,
): Promise<InventoryItem> {
  return handleRequest<InventoryItem>(
    api.patch(`/manager/inventory/${sku}`, payload),
  )
}

/**
 * Adjust stock quantity
 */
export async function adjustStock(
  sku: string,
  payload: StockAdjustmentPayload,
): Promise<InventoryItem> {
  return handleRequest<InventoryItem>(
    api.post(`/manager/inventory/${sku}/adjust`, payload),
  )
}

/**
 * Bulk update stock
 */
export async function bulkUpdateStock(
  payload: BulkStockUpdatePayload,
): Promise<{ success: string[]; failed: Array<{ sku: string; error: string }> }> {
  return handleRequest<{ success: string[]; failed: Array<{ sku: string; error: string }> }>(
    api.post('/manager/inventory/bulk-update', payload),
  )
}

/**
 * Reserve inventory
 */
export async function reserveInventory(
  sku: string,
  payload: ReserveInventoryPayload,
): Promise<InventoryItem> {
  return handleRequest<InventoryItem>(
    api.post(`/manager/inventory/${sku}/reserve`, payload),
  )
}

/**
 * Release reservation
 */
export async function releaseReservation(
  sku: string,
  payload: ReleaseReservationPayload,
): Promise<InventoryItem> {
  return handleRequest<InventoryItem>(
    api.post(`/manager/inventory/${sku}/release`, payload),
  )
}

/**
 * Get low stock items
 */
export async function getLowStockItems(): Promise<InventoryItemEnriched[]> {
  const response = await api.get('/manager/inventory/reports/low-stock')
  return response.data.data || []
}
