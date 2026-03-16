import { api } from './api-client'
import { unwrapApiPayload } from './type-guards'

// Get the API base URL for formatting image URLs
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// Utility function to format image URLs
export function formatImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  // If URL already starts with http://, https://, or data:, return as-is
  if (/^https?:\/\//.test(url) || url.startsWith('data:')) {
    return url
  }
  // Otherwise, prepend the API base URL
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

export type ProductVariant = {
  sku: string
  size: string
  color: string
  price?: number
  weight?: number
  images2D?: string[]
  images3D?: string[]
  isActive?: boolean
  // Pre-order configuration
  isPreorderEnabled?: boolean
  preorderExpectedShipStart?: string
  preorderExpectedShipEnd?: string
  preorderLimit?: number
}

// Frame-specific types
export type FrameProduct = {
  _id: string
  name: string
  slug: string
  category: 'frame'
  description: string
  basePrice: number
  images2D: string[]
  images3D?: string[]
  tags: string[]
  frameType: 'full-rim' | 'half-rim' | 'rimless'
  shape: 'round' | 'square' | 'oval' | 'cat-eye' | 'aviator'
  material: 'metal' | 'plastic' | 'mixed'
  gender?: 'men' | 'women' | 'unisex'
  bridgeFit?: 'standard' | 'asian-fit'
  variants: ProductVariant[]
  isActive: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

// Lens-specific types
export type LensProduct = {
  _id: string
  name: string
  slug: string
  category: 'lens'
  description: string
  basePrice: number
  images2D: string[]
  images3D?: string[]
  tags: string[]
  lensType: 'single-vision' | 'bifocal' | 'progressive' | 'photochromic'
  index: number
  coatings?: string[]
  isActive: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

// Service-specific types
export type ServiceProduct = {
  _id: string
  name: string
  slug: string
  category: 'service'
  description: string
  basePrice: number
  images2D: string[]
  images3D?: string[]
  tags: string[]
  serviceType: 'eye-test' | 'lens-cutting' | 'frame-adjustment' | 'cleaning'
  durationMinutes: number
  serviceNotes?: string
  isActive: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export type Product = FrameProduct | LensProduct | ServiceProduct

export type CreateFrameProductPayload = {
  name: string
  category: 'frame'
  description: string
  basePrice: number
  images2D: string[]
  images3D?: string[]
  tags?: string[]
  frameType: 'full-rim' | 'half-rim' | 'rimless'
  shape: 'round' | 'square' | 'oval' | 'cat-eye' | 'aviator'
  material: 'metal' | 'plastic' | 'mixed'
  gender?: 'men' | 'women' | 'unisex'
  bridgeFit?: 'standard' | 'asian-fit'
  variants: ProductVariant[]
}

export type CreateLensProductPayload = {
  name: string
  category: 'lens'
  description: string
  basePrice: number
  images2D: string[]
  images3D?: string[]
  tags?: string[]
  lensType: 'single-vision' | 'bifocal' | 'progressive' | 'photochromic'
  index: number
  coatings?: string[]
  suitableForPrescriptionRange?: {
    minSPH?: number
    maxSPH?: number
    minCYL?: number
    maxCYL?: number
  }
  isPrescriptionRequired: boolean
}

export type CreateServiceProductPayload = {
  name: string
  category: 'service'
  description: string
  basePrice: number
  images2D: string[]
  images3D?: string[]
  tags?: string[]
  serviceType: 'eye-test' | 'lens-cutting' | 'frame-adjustment' | 'cleaning'
  durationMinutes: number
  serviceNotes?: string
}

export type CreateProductPayload =
  | CreateFrameProductPayload
  | CreateLensProductPayload
  | CreateServiceProductPayload

export type UpdateProductPayload = Partial<CreateProductPayload>

export async function getAllProducts(): Promise<Product[]> {
  const response = await api.get('/products')
  return unwrapApiPayload<Product[]>(response.data)
}

export async function createProduct(
  payload: CreateProductPayload,
  files?: File[],
): Promise<Product> {
  // If files are provided, use FormData
  if (files && files.length > 0) {
    const formData = new FormData()

    // Add all string fields
    for (const [key, value] of Object.entries(payload)) {
      if (key === 'variants' || key === 'coatings' || key === 'tags') {
        formData.append(key, JSON.stringify(value))
      } else if (key === 'suitableForPrescriptionRange') {
        formData.append(key, JSON.stringify(value))
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        formData.append(key, String(value))
      }
    }

    // Append all files
    files.forEach((file) => {
      formData.append('images', file)
    })

    const response = await api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return unwrapApiPayload<Product>(response.data)
  }

  // Otherwise send as JSON
  const response = await api.post('/products', payload)
  return unwrapApiPayload<Product>(response.data)
}

export async function updateProduct(
  id: string,
  payload: UpdateProductPayload,
  files?: File[],
): Promise<Product> {
  // If files are provided, use FormData
  if (files && files.length > 0) {
    const formData = new FormData()

    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined || value === null) continue
      if (key === 'variants' || key === 'coatings' || key === 'tags') {
        formData.append(key, JSON.stringify(value))
      } else if (key === 'suitableForPrescriptionRange') {
        formData.append(key, JSON.stringify(value))
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        formData.append(key, String(value))
      }
    }

    // Append all files
    files.forEach((file) => {
      formData.append('images', file)
    })

    const response = await api.put(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return unwrapApiPayload<Product>(response.data)
  }

  // Otherwise send as JSON
  const response = await api.put(`/products/${id}`, payload)
  return unwrapApiPayload<Product>(response.data)
}

export async function deleteProduct(id: string): Promise<Product> {
  const response = await api.delete(`/products/${id}`)
  return unwrapApiPayload<Product>(response.data)
}

export async function restoreProduct(id: string): Promise<Product> {
  const response = await api.patch(`/products/${id}/restore`)
  return unwrapApiPayload<Product>(response.data)
}

// Catalog list types

export type ProductCategory = 'frame' | 'lens' | 'service'

export type ProductSortBy = 'createdAt' | 'name' | 'price' | 'updatedAt'

export type ProductSortOrder = 'asc' | 'desc'

export interface ProductCatalogQueryParams {
  search?: string
  category?: ProductCategory
  shape?: string
  material?: string
  status?: 'ACTIVE' | 'INACTIVE'
  has3D?: 'true' | 'false'
  hasVariants?: 'true' | 'false'
  sortBy?: ProductSortBy
  sortOrder?: ProductSortOrder
  page?: number
  limit?: number
}

export interface ProductListItem {
  id: string
  name: string
  slug?: string
  category: ProductCategory
  shape?: string
  material?: string
  isActive: boolean
  defaultImage2DUrl?: string
  has3D: boolean
  variantCount: number
  minPrice?: number
  maxPrice?: number
  createdAt: string
  updatedAt: string
}

export interface ProductCatalogResponse {
  items: ProductListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Get products catalog with filtering, sorting, and pagination
 * Used for admin/manager catalog view
 */
export async function getProductsCatalog(
  params: ProductCatalogQueryParams = {},
): Promise<ProductCatalogResponse> {
  const queryParams = new URLSearchParams()

  if (params.search) queryParams.append('search', params.search)
  if (params.category) queryParams.append('category', params.category)
  if (params.shape) queryParams.append('shape', params.shape)
  if (params.material) queryParams.append('material', params.material)
  if (params.status) queryParams.append('status', params.status)
  if (params.has3D) queryParams.append('has3D', params.has3D)
  if (params.hasVariants) queryParams.append('hasVariants', params.hasVariants)
  if (params.sortBy) queryParams.append('sortBy', params.sortBy)
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)
  if (params.page) queryParams.append('page', params.page.toString())
  if (params.limit) queryParams.append('limit', params.limit.toString())

  const queryString = queryParams.toString()
  const url = `/products/catalog${queryString ? `?${queryString}` : ''}`

  const response = await api.get(url)
  return unwrapApiPayload<ProductCatalogResponse>(response.data)
}

/**
 * Get product by ID (full details)
 */
export async function getProductById(id: string): Promise<Product> {
  const response = await api.get(`/products/${id}`)
  return unwrapApiPayload<Product>(response.data)
}

/**
 * Check inventory availability for a variant SKU
 */
export async function checkInventoryAvailability(sku: string): Promise<{
  sku: string
  stockQuantity: number
  reservedQuantity: number
  availableQuantity: number
  isInStock: boolean
} | null> {
  try {
    const response = await api.get(`/inventory/${sku}`)
    return unwrapApiPayload(response.data)
  } catch {
    return null
  }
}

/**
 * Batch check inventory availability for multiple SKUs
 */
export async function checkMultipleInventoryAvailability(skus: string[]): Promise<
  Record<string, {
    sku: string
    availableQuantity: number
    isInStock: boolean
  }>
> {
  try {
    const response = await api.post('/inventory/check-availability', { skus })
    return unwrapApiPayload(response.data)
  } catch {
    return {}
  }
}
