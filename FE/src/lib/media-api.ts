import { api } from './api-client'
import { extractApiMessage } from './api-client'

type ApiResponse<T> = {
  statusCode: number
  message: string
  data?: T
  metadata?: T
  errors?: Array<{ path: string; message: string }>
}

export type UploadMediaResponse = {
  urls: string[]
  count: number
}

/**
 * Upload 2D images for products
 * Accepts multiple image files (PNG, JPG, WebP)
 * Returns array of public URLs
 */
export async function uploadImages2D(files: File[]): Promise<string[]> {
  try {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    const response = await api.post('/manager/media/images2d', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    const data = response.data as ApiResponse<UploadMediaResponse>
    const uploadData = data.data || data.metadata

    if (!uploadData || !uploadData.urls) {
      throw new Error(data.message || 'Upload failed')
    }

    return uploadData.urls
  } catch (error) {
    const message = extractApiMessage(error)
    throw new Error(message)
  }
}

/**
 * Upload 3D models for products
 * Accepts multiple 3D model files (.glb, .gltf, .usdz)
 * Returns array of public URLs
 */
export async function uploadImages3D(files: File[]): Promise<string[]> {
  try {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    const response = await api.post('/manager/media/images3d', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    const data = response.data as ApiResponse<UploadMediaResponse>
    const uploadData = data.data || data.metadata

    if (!uploadData || !uploadData.urls) {
      throw new Error(data.message || 'Upload failed')
    }

    return uploadData.urls
  } catch (error) {
    const message = extractApiMessage(error)
    throw new Error(message)
  }
}
