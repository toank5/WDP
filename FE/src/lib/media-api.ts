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
    const endpoint = '/manager/media/images2d'
    console.log('[media-api] Uploading 2D images to:', endpoint)
    console.log('[media-api] Files:', files.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)}MB)`))

    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    const data = response.data as ApiResponse<UploadMediaResponse>
    const uploadData = data.data || data.metadata

    if (!uploadData || !uploadData.urls) {
      throw new Error(data.message || 'Upload failed')
    }

    console.log('[media-api] 2D upload successful, URLs:', uploadData.urls)
    return uploadData.urls
  } catch (error) {
    const message = extractApiMessage(error)
    console.error('[media-api] 2D upload failed:', message)
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
    const endpoint = '/manager/media/images3d'
    console.log('[media-api] Uploading 3D models to:', endpoint)
    console.log('[media-api] Files:', files.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)}MB)`))

    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    const data = response.data as ApiResponse<UploadMediaResponse>
    const uploadData = data.data || data.metadata

    if (!uploadData || !uploadData.urls) {
      throw new Error(data.message || 'Upload failed')
    }

    console.log('[media-api] 3D upload successful, URLs:', uploadData.urls)
    return uploadData.urls
  } catch (error) {
    const message = extractApiMessage(error)
    console.error('[media-api] 3D upload failed:', message)
    throw new Error(message)
  }
}
