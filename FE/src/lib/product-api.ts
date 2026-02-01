import axios from 'axios'

type ApiResponse<T> = {
  statusCode: number
  message: string
  data?: T
  metadata?: T
  errors?: Array<{ path: string; message: string }>
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
  suitableForPrescriptionRange?: {
    minSPH?: number
    maxSPH?: number
    minCYL?: number
    maxCYL?: number
  }
  isPrescriptionRequired: boolean
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

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
})

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const authStore = localStorage.getItem('wdp-auth')
  if (authStore) {
    try {
      const { state } = JSON.parse(authStore)
      if (state?.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`
      }
    } catch (err) {
      console.error('Failed to parse auth store', err)
    }
  }
  return config
})

function extractApiMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: any[] }
    if (data?.errors && Array.isArray(data.errors)) {
      return data.errors.map((e) => `${e.path}: ${e.message}`).join(', ')
    }
    if (data?.message) return data.message
    if (error.message) return error.message
  }
  return 'Request failed'
}

async function handleRequest<T>(
  promise: Promise<{ data: ApiResponse<T> }>,
): Promise<T> {
  try {
    const response = await promise
    const data = response.data?.data || response.data?.metadata
    if (!data) throw new Error('Missing response payload')
    return data
  } catch (error) {
    const message = extractApiMessage(error)
    throw new Error(message)
  }
}

export async function getAllProducts() {
  return handleRequest<Product[]>(api.get('/products'))
}

export async function createProduct(payload: CreateProductPayload, files?: File[]) {
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

    return handleRequest<Product>(
      api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    )
  }

  // Otherwise send as JSON
  return handleRequest<Product>(api.post('/products', payload))
}

export async function updateProduct(
  id: string,
  payload: UpdateProductPayload,
  files?: File[],
) {
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

    return handleRequest<Product>(
      api.put(`/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    )
  }

  // Otherwise send as JSON
  return handleRequest<Product>(api.put(`/products/${id}`, payload))
}

export async function deleteProduct(id: string) {
  return handleRequest<Product>(api.delete(`/products/${id}`))
}

export async function restoreProduct(id: string) {
  return handleRequest<Product>(api.patch(`/products/${id}/restore`))
}
