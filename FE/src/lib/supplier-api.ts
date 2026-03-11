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
 * Supplier status enum
 */
export enum SupplierStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/**
 * Supplier type
 */
export type Supplier = {
  _id: string
  code: string
  name: string
  email?: string
  phone?: string
  taxCode?: string
  currency?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  linkedProductIds?: string[]
  status: SupplierStatus
  createdAt: string
  updatedAt: string
}

/**
 * Lightweight supplier for autocomplete (read-only)
 */
export type SupplierLight = {
  _id: string
  code: string
  name: string
}

/**
 * Supplier query parameters
 */
export type SupplierQueryParams = {
  search?: string
  status?: SupplierStatus
  page?: number
  limit?: number
}

/**
 * Supplier list response
 */
export type SupplierListResponse = {
  items: Supplier[]
  total: number
  page: number
  limit: number
}

/**
 * Create supplier payload
 */
export type CreateSupplierPayload = {
  code: string
  name: string
  email?: string
  phone?: string
  taxCode?: string
  currency?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  linkedProductIds?: string[]
  status?: SupplierStatus
}

/**
 * Update supplier payload
 */
export type UpdateSupplierPayload = {
  name?: string
  email?: string
  phone?: string
  taxCode?: string
  currency?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  linkedProductIds?: string[]
  status?: SupplierStatus
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
      return {} as T
    }
    return data as T
  } catch (error) {
    const message = extractApiMessage(error)
    throw new Error(message)
  }
}

/**
 * Get all suppliers with optional filters (manager view)
 */
export async function getSupplierList(
  params: SupplierQueryParams = {},
): Promise<SupplierListResponse> {
  const queryParams = new URLSearchParams()

  if (params.search) queryParams.append('search', params.search)
  if (params.status) queryParams.append('status', params.status)
  if (params.page) queryParams.append('page', params.page.toString())
  if (params.limit) queryParams.append('limit', params.limit.toString())

  const queryString = queryParams.toString()
  const url = `/manager/suppliers${queryString ? `?${queryString}` : ''}`

  return handleRequest<SupplierListResponse>(api.get(url))
}

/**
 * Get public suppliers for dropdown/autocomplete (read-only, accessible by all staff)
 */
export async function getPublicSuppliers(
  search?: string,
): Promise<SupplierLight[]> {
  const queryParams = new URLSearchParams()

  if (search) queryParams.append('search', search)

  const queryString = queryParams.toString()
  const url = `/suppliers/public${queryString ? `?${queryString}` : ''}`

  return handleRequest<SupplierLight[]>(api.get(url))
}

/**
 * Get supplier by ID
 */
export async function getSupplierById(
  id: string,
): Promise<Supplier> {
  return handleRequest<Supplier>(api.get(`/manager/suppliers/${id}`))
}

/**
 * Get supplier by code
 */
export async function getSupplierByCode(
  code: string,
): Promise<Supplier> {
  return handleRequest<Supplier>(api.get(`/manager/suppliers/code/${code}`))
}

/**
 * Create a new supplier
 */
export async function createSupplier(
  payload: CreateSupplierPayload,
): Promise<Supplier> {
  return handleRequest<Supplier>(api.post('/manager/suppliers', payload))
}

/**
 * Update supplier
 */
export async function updateSupplier(
  id: string,
  payload: UpdateSupplierPayload,
): Promise<Supplier> {
  return handleRequest<Supplier>(
    api.patch(`/manager/suppliers/${id}`, payload),
  )
}

/**
 * Update supplier status
 */
export async function setSupplierStatus(
  id: string,
  status: SupplierStatus,
): Promise<Supplier> {
  return handleRequest<Supplier>(
    api.patch(`/manager/suppliers/${id}/status`, { status }),
  )
}

/**
 * Set supplier active status (activate/deactivate) - deprecated, use setSupplierStatus
 */
export async function setSupplierActive(
  id: string,
  isActive: boolean,
): Promise<Supplier> {
  return handleRequest<Supplier>(
    api.patch(`/manager/suppliers/${id}/status`, { status: isActive ? SupplierStatus.ACTIVE : SupplierStatus.INACTIVE }),
  )
}

/**
 * Delete supplier (admin only)
 */
export async function deleteSupplier(
  id: string,
): Promise<Supplier> {
  return handleRequest<Supplier>(api.delete(`/manager/suppliers/${id}`))
}
