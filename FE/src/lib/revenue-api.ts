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
 * Revenue query parameters
 */
export type RevenueQueryParams = {
  from?: string // ISO date
  to?: string // ISO date
  groupBy?: 'day' | 'week' | 'month'
  timezone?: string
}

/**
 * Revenue by product query parameters
 */
export type RevenueByProductQueryParams = RevenueQueryParams & {
  page?: number
  limit?: number
  search?: string
}

/**
 * Revenue overview response
 */
export type RevenueOverview = {
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  from: string
  to: string
}

/**
 * Revenue time series data point
 */
export type RevenueTimeSeriesPoint = {
  periodStart: string
  revenue: number
  orders: number
}

/**
 * Revenue time series response
 */
export type RevenueTimeSeries = {
  points: RevenueTimeSeriesPoint[]
}

/**
 * Revenue by category item
 */
export type RevenueByCategoryItem = {
  category: string
  revenue: number
  orders: number
  units: number
}

/**
 * Revenue by category response
 */
export type RevenueByCategory = {
  items: RevenueByCategoryItem[]
}

/**
 * Revenue by product item
 */
export type RevenueByProductItem = {
  productId: string
  name: string
  revenue: number
  orders: number
  units: number
  avgPrice: number
}

/**
 * Revenue by product response
 */
export type RevenueByProduct = {
  items: RevenueByProductItem[]
  total: number
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

function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const queryParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value))
    }
  })
  return queryParams.toString()
}

/**
 * Get revenue overview metrics
 */
export async function getRevenueOverview(
  params: RevenueQueryParams = {},
): Promise<RevenueOverview> {
  const queryString = buildQueryString(params)
  const url = `/manager/revenue/overview${queryString ? `?${queryString}` : ''}`

  return handleRequest<RevenueOverview>(api.get(url))
}

/**
 * Get revenue time series data
 */
export async function getRevenueTimeSeries(
  params: RevenueQueryParams = {},
): Promise<RevenueTimeSeries> {
  const queryString = buildQueryString(params)
  const url = `/manager/revenue/timeseries${queryString ? `?${queryString}` : ''}`

  return handleRequest<RevenueTimeSeries>(api.get(url))
}

/**
 * Get revenue breakdown by category
 */
export async function getRevenueByCategory(
  params: RevenueQueryParams = {},
): Promise<RevenueByCategory> {
  const queryString = buildQueryString(params)
  const url = `/manager/revenue/by-category${queryString ? `?${queryString}` : ''}`

  return handleRequest<RevenueByCategory>(api.get(url))
}

/**
 * Get revenue breakdown by product
 */
export async function getRevenueByProduct(
  params: RevenueByProductQueryParams = {},
): Promise<RevenueByProduct> {
  const queryString = buildQueryString(params)
  const url = `/manager/revenue/by-product${queryString ? `?${queryString}` : ''}`

  return handleRequest<RevenueByProduct>(api.get(url))
}

/**
 * Format currency in VND
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format compact number (e.g., 1.5M, 500K)
 */
export function formatCompactNumber(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(amount)
}
