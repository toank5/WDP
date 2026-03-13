import { API_ENDPOINTS, get, post, put, del } from './api'
import type { Product, ProductCategory } from '../types'

/**
 * Get all active products (public)
 */
export async function getAllProducts(): Promise<Product[]> {
  return get<Product[]>(API_ENDPOINTS.PRODUCTS)
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<Product> {
  return get<Product>(API_ENDPOINTS.PRODUCT_DETAIL(id))
}

/**
 * Get products with catalog filters (admin/manager)
 */
export interface ProductCatalogParams {
  search?: string
  category?: ProductCategory
  shape?: string
  material?: string
  status?: 'ACTIVE' | 'INACTIVE'
  has3D?: 'true' | 'false'
  hasVariants?: 'true' | 'false'
  sortBy?: 'createdAt' | 'name' | 'price' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface ProductCatalogResponse {
  items: any[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getProductsCatalog(
  params: ProductCatalogParams = {}
): Promise<ProductCatalogResponse> {
  const queryParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value))
    }
  })

  const url = API_ENDPOINTS.PRODUCT_CATALOG + (queryParams.toString() ? `?${queryParams.toString()}` : '')
  return get<ProductCatalogResponse>(url)
}

/**
 * Create product (manager/admin)
 */
export interface CreateProductPayload {
  name: string
  category: ProductCategory
  description: string
  basePrice: number
  images2D?: string[]
  images3D?: string[]
  tags?: string[]
  // Frame-specific
  frameType?: 'full-rim' | 'half-rim' | 'rimless'
  shape?: 'round' | 'square' | 'oval' | 'cat-eye' | 'aviator'
  material?: 'metal' | 'plastic' | 'mixed'
  gender?: 'men' | 'women' | 'unisex'
  bridgeFit?: 'standard' | 'asian-fit'
  variants?: any[]
  // Lens-specific
  lensType?: 'single-vision' | 'bifocal' | 'progressive' | 'photochromic'
  index?: number
  coatings?: string[]
  isPrescriptionRequired?: boolean
  // Service-specific
  serviceType?: 'eye-test' | 'lens-cutting' | 'frame-adjustment' | 'cleaning'
  durationMinutes?: number
  serviceNotes?: string
}

export async function createProduct(payload: CreateProductPayload): Promise<Product> {
  return post<Product>(API_ENDPOINTS.PRODUCTS, payload)
}

/**
 * Update product (manager/admin)
 */
export async function updateProduct(id: string, payload: Partial<CreateProductPayload>): Promise<Product> {
  return put<Product>(API_ENDPOINTS.PRODUCT_DETAIL(id), payload)
}

/**
 * Delete product (manager/admin)
 */
export async function deleteProduct(id: string): Promise<Product> {
  return del<Product>(API_ENDPOINTS.PRODUCT_DETAIL(id))
}

/**
 * Restore soft-deleted product
 */
export async function restoreProduct(id: string): Promise<Product> {
  return post<Product>(`${API_ENDPOINTS.PRODUCT_DETAIL(id)}/restore`)
}
