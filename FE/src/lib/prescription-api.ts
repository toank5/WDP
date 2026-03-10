// Prescription API

import { api } from './api-client'
import { extractApiMessage } from './api-client'
import { unwrapApiPayload } from './type-guards'

// Prescription types
export interface EyeData {
  sph?: number
  cyl?: number
  axis?: number
  add?: number
}

export interface PDData {
  left?: number
  right?: number
  total?: number
}

export interface Prescription {
  _id: string
  name: string
  prescriptionDate?: string
  rightEye?: EyeData
  leftEye?: EyeData
  pd?: PDData
  imageUrl?: string
  isVerified: boolean
  verifiedAt?: string
  verifiedBy?: string
  verificationNotes?: string
  createdAt: string
  updatedAt: string
}

export interface CreatePrescriptionRequest {
  name: string
  prescriptionDate?: string
  rightEye?: EyeData
  leftEye?: EyeData
  pd?: PDData
  imageUrl?: string
}

export interface UpdatePrescriptionRequest {
  name?: string
  prescriptionDate?: string
  rightEye?: EyeData
  leftEye?: EyeData
  pd?: PDData
  imageUrl?: string
}

export interface PrescriptionListParams {
  isVerified?: string
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PrescriptionListResponse {
  prescriptions: Prescription[]
  total: number
  page: number
  limit: number
  totalPages: number
}

class PrescriptionAPI {
  /**
   * Create a new prescription
   */
  async createPrescription(request: CreatePrescriptionRequest): Promise<Prescription> {
    try {
      const response = await api.post('/prescriptions', request)
      return unwrapApiPayload<Prescription>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Get user's prescriptions
   */
  async getMyPrescriptions(params: PrescriptionListParams = {}): Promise<PrescriptionListResponse> {
    try {
      const queryParams = new URLSearchParams()

      if (params.isVerified) queryParams.append('isVerified', params.isVerified)
      if (params.search) queryParams.append('search', params.search)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

      const queryString = queryParams.toString()
      const url = `/prescriptions${queryString ? `?${queryString}` : ''}`

      const response = await api.get(url)
      return unwrapApiPayload<PrescriptionListResponse>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Get prescription by ID
   */
  async getPrescriptionById(prescriptionId: string): Promise<Prescription> {
    try {
      const response = await api.get(`/prescriptions/${prescriptionId}`)
      return unwrapApiPayload<Prescription>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Update prescription
   */
  async updatePrescription(prescriptionId: string, request: UpdatePrescriptionRequest): Promise<Prescription> {
    try {
      const response = await api.put(`/prescriptions/${prescriptionId}`, request)
      return unwrapApiPayload<Prescription>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Delete prescription
   */
  async deletePrescription(prescriptionId: string): Promise<void> {
    try {
      await api.delete(`/prescriptions/${prescriptionId}`)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Verify prescription (staff only)
   */
  async verifyPrescription(prescriptionId: string, isVerified: boolean, notes?: string): Promise<Prescription> {
    try {
      const response = await api.post(`/prescriptions/${prescriptionId}/verify`, {
        isVerified,
        verificationNotes: notes,
      })
      return unwrapApiPayload<Prescription>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  /**
   * Upload prescription image
   * TODO: Implement with actual file upload service (Cloudinary/S3)
   */
  async uploadPrescriptionImage(file: File): Promise<{ url: string }> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      // For now, return a mock URL
      // TODO: Implement actual upload with Cloudinary or your media service
      const response = await api.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return unwrapApiPayload<{ url: string }>(response.data)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }
}

export const prescriptionApi = new PrescriptionAPI()
