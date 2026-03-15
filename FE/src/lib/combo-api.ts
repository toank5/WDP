import { api } from './api-client'
import { unwrapApiPayload } from './type-guards'

export interface Combo {
  _id: string
  name: string
  description: string
  frameProductId: string
  lensProductId: string
  frameName?: string
  lensName?: string
  comboPrice: number
  originalPrice: number
  discountAmount: number
  discountPercentage: number
  status: 'active' | 'inactive' | 'scheduled'
  startDate?: string
  endDate?: string
  maxPurchaseQuantity?: number
  tags?: string[]
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateComboDto {
  name: string
  description: string
  frameProductId: string
  lensProductId: string
  comboPrice: number
  originalPrice: number
  startDate?: string
  endDate?: string
  maxPurchaseQuantity?: number
  tags?: string[]
  isFeatured?: boolean
  status?: 'active' | 'inactive' | 'scheduled'
}

export interface UpdateComboDto {
  name?: string
  description?: string
  frameProductId?: string
  lensProductId?: string
  comboPrice?: number
  originalPrice?: number
  startDate?: string
  endDate?: string
  maxPurchaseQuantity?: number
  tags?: string[]
  isFeatured?: boolean
  status?: 'active' | 'inactive' | 'scheduled'
}

export interface ComboListResponse {
  items: Combo[]
  total: number
  page: number
  limit: number
}

export interface ComboStatsResponse {
  totalCombos: number
  activeCombos: number
  featuredCombos: number
  expiringSoon: number
}

export async function getAllCombos(params?: {
  search?: string
  status?: string
  frameProductId?: string
  lensProductId?: string
  isFeatured?: 'true' | 'false'
  page?: number
  limit?: number
}): Promise<ComboListResponse> {
  const queryParams = new URLSearchParams()
  if (params?.search) queryParams.set('search', params.search)
  if (params?.status) queryParams.set('status', params.status)
  if (params?.frameProductId) queryParams.set('frameProductId', params.frameProductId)
  if (params?.lensProductId) queryParams.set('lensProductId', params.lensProductId)
  if (params?.isFeatured) queryParams.set('isFeatured', params.isFeatured)
  if (params?.page) queryParams.set('page', params.page.toString())
  if (params?.limit) queryParams.set('limit', params.limit.toString())

  const response = await api.get(`/manager/combos?${queryParams}`)
  return unwrapApiPayload<ComboListResponse>(response.data)
}

export async function getComboById(id: string): Promise<Combo> {
  const response = await api.get(`/manager/combos/${id}`)
  return unwrapApiPayload<Combo>(response.data)
}

export async function createCombo(combo: CreateComboDto): Promise<Combo> {
  const response = await api.post('/manager/combos', combo)
  return unwrapApiPayload<Combo>(response.data)
}

export async function updateCombo(id: string, combo: UpdateComboDto): Promise<Combo> {
  const response = await api.patch(`/manager/combos/${id}`, combo)
  return unwrapApiPayload<Combo>(response.data)
}

export async function updateComboStatus(id: string, status: 'active' | 'inactive' | 'scheduled'): Promise<Combo> {
  const response = await api.patch(`/manager/combos/${id}/status`, { status })
  return unwrapApiPayload<Combo>(response.data)
}

export async function deleteCombo(id: string): Promise<void> {
  await api.delete(`/manager/combos/${id}`)
}

export async function getComboStatistics(): Promise<ComboStatsResponse> {
  const response = await api.get('/manager/combos/statistics/overview')
  return unwrapApiPayload<ComboStatsResponse>(response.data)
}

export async function getActiveCombos(): Promise<Combo[]> {
  const response = await api.get('/combos/active')
  return unwrapApiPayload<Combo[]>(response.data)
}
