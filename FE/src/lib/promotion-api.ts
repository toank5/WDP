import { api } from './api-client'

export type PromotionType = 'percentage' | 'fixed_amount'
export type PromotionStatus = 'active' | 'inactive' | 'scheduled' | 'expired'
export type PromotionScope = 'all_orders' | 'specific_categories' | 'specific_products' | 'first_order'

export interface Promotion {
  _id: string
  code: string
  name: string
  description?: string
  type: PromotionType
  value: number
  minOrderValue: number
  scope: PromotionScope
  applicableCategories?: string[]
  applicableProductIds?: string[]
  startDate: string
  endDate: string
  usageLimit?: number
  usageCount: number
  remainingUses?: number
  maxUsesPerCustomer?: number
  status: PromotionStatus
  isStackable: boolean
  tags?: string[]
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePromotionDto {
  code: string
  name: string
  description?: string
  type: PromotionType
  value: number
  minOrderValue: number
  scope?: PromotionScope
  applicableCategories?: string[]
  applicableProductIds?: string[]
  startDate: string
  endDate: string
  usageLimit?: number
  maxUsesPerCustomer?: number
  isStackable?: boolean
  tags?: string[]
  isFeatured?: boolean
  status?: PromotionStatus
}

export interface UpdatePromotionDto {
  name?: string
  description?: string
  value?: number
  minOrderValue?: number
  startDate?: string
  endDate?: string
  usageLimit?: number
  maxUsesPerCustomer?: number
  isStackable?: boolean
  tags?: string[]
  isFeatured?: boolean
  status?: PromotionStatus
  code?: string
}

export interface PromotionListResponse {
  items: Promotion[]
  total: number
  page: number
  limit: number
}

export interface PromotionStatsResponse {
  totalPromotions: number
  activePromotions: number
  scheduledPromotions: number
  expiredPromotions: number
  featuredPromotions: number
  totalUsage: number
}

export interface ValidatePromotionDto {
  code: string
  cartTotal: number
  productIds?: string[]
  customerId?: string
}

export interface ValidatePromotionResponse {
  isValid: boolean
  promotion?: Promotion
  discountAmount?: number
  message?: string
}

export async function getAllPromotions(params?: {
  search?: string
  status?: string
  type?: string
  isFeatured?: 'true' | 'false'
  page?: number
  limit?: number
}): Promise<PromotionListResponse> {
  const queryParams = new URLSearchParams()
  if (params?.search) queryParams.set('search', params.search)
  if (params?.status) queryParams.set('status', params.status)
  if (params?.type) queryParams.set('type', params.type)
  if (params?.isFeatured) queryParams.set('isFeatured', params.isFeatured)
  if (params?.page) queryParams.set('page', params.page.toString())
  if (params?.limit) queryParams.set('limit', params.limit.toString())

  const response = await api.get(`/manager/promotions?${queryParams}`)
  return response.data.data
}

export async function getPromotionById(id: string): Promise<Promotion> {
  const response = await api.get(`/manager/promotions/${id}`)
  return response.data.data
}

export async function createPromotion(promotion: CreatePromotionDto): Promise<Promotion> {
  const response = await api.post('/manager/promotions', promotion)
  return response.data.data
}

export async function updatePromotion(id: string, promotion: UpdatePromotionDto): Promise<Promotion> {
  const response = await api.patch(`/manager/promotions/${id}`, promotion)
  return response.data.data
}

export async function updatePromotionStatus(id: string, status: PromotionStatus): Promise<Promotion> {
  const response = await api.patch(`/manager/promotions/${id}/status`, { status })
  return response.data.data
}

export async function deletePromotion(id: string): Promise<void> {
  await api.delete(`/manager/promotions/${id}`)
}

export async function validatePromotion(dto: ValidatePromotionDto): Promise<ValidatePromotionResponse> {
  const response = await api.post('/promotions/validate', dto)
  return response.data.data
}

export async function getPromotionStatistics(): Promise<PromotionStatsResponse> {
  const response = await api.get('/manager/promotions/statistics/overview')
  return response.data.data
}

export async function getActivePromotions(): Promise<Promotion[]> {
  const response = await api.get('/promotions/active')
  return response.data.data
}
