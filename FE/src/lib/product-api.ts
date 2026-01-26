import axios from 'axios'

type ApiResponse<T> = {
  statusCode: number
  message: string
  metadata: T
}

export type ProductVariant = {
  sku: string
  type: 'AVIATOR' | 'ROUND'
  size: string
  color: string
  images: string[]
}

export type Product = {
  _id: string
  name: string
  category: 'FRAMES' | 'LENSES' | 'SERVICES'
  description: string
  basePrice: number
  variants: ProductVariant[]
  isActive: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export type CreateProductPayload = {
  name: string
  category: 'FRAMES' | 'LENSES' | 'SERVICES'
  description: string
  basePrice: number
  variants?: ProductVariant[]
}

export type CreateProductWithFilesPayload = {
  product: CreateProductPayload
  files: File[]
}

export type UpdateProductPayload = {
  name?: string
  category?: 'FRAMES' | 'LENSES' | 'SERVICES'
  description?: string
  basePrice?: number
  variants?: ProductVariant[]
}

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
    const data = error.response?.data as { message?: string }
    if (data?.message) return data.message
    if (error.message) return error.message
  }
  return 'Request failed'
}

async function handleRequest<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    const response = await promise
    if (!response.data?.metadata) throw new Error('Missing response payload')
    return response.data.metadata
  } catch (error) {
    const message = extractApiMessage(error)
    throw new Error(message)
  }
}

export async function getAllProducts() {
  return handleRequest<Product[]>(api.get('/products'))
}

export async function createProduct(
  payload: CreateProductPayload,
  files?: File[],
) {
  // If files are provided, use FormData
  if (files && files.length > 0) {
    const formData = new FormData()
    formData.append('name', payload.name)
    formData.append('category', payload.category)
    formData.append('description', payload.description)
    formData.append('basePrice', payload.basePrice.toString())

    if (payload.variants) {
      formData.append('variants', JSON.stringify(payload.variants))
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

    if (payload.name) formData.append('name', payload.name)
    if (payload.category) formData.append('category', payload.category)
    if (payload.description) formData.append('description', payload.description)
    if (payload.basePrice !== undefined)
      formData.append('basePrice', payload.basePrice.toString())

    if (payload.variants) {
      formData.append('variants', JSON.stringify(payload.variants))
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
