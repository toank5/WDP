// Staff Prescription Verification API
import { api } from './api-client'
import { unwrapApiPayloadOrDefault } from './type-guards'

// Types
export interface PrescriptionData {
  pd: number
  sph: { right: number; left: number }
  cyl: { right: number; left: number }
  axis: { right: number; left: number }
  add: { right: number; left: number }
}

export interface OrderAwaitingVerification {
  orderId: string
  orderNumber: string
  orderItemId: string
  orderStatus: string
  prescriptionStatus: string
  customerName: string
  customerPhone?: string
  productName: string
  productImage?: string
  prescriptionUrl?: string
  prescriptionData?: PrescriptionData
  createdAt: string
}

export interface VerifyPrescriptionRequest {
  rightEye?: { sph?: number; cyl?: number; axis?: number; add?: number }
  leftEye?: { sph?: number; cyl?: number; axis?: number; add?: number }
  pd?: { total?: number }
}

export interface RequestUpdateRequest {
  reason: string
  reasonCategory?: string
}

export interface OrdersAwaitingVerificationResponse {
  orders: OrderAwaitingVerification[]
  total: number
  page: number
  limit: number
}

// Get orders awaiting verification
export async function getOrdersAwaitingVerification(params: {
  page?: number
  limit?: number
  search?: string
} = {}): Promise<OrdersAwaitingVerificationResponse> {
  const queryParams = new URLSearchParams()
  if (params.page) queryParams.append('page', params.page.toString())
  if (params.limit) queryParams.append('limit', params.limit.toString())
  if (params.search) queryParams.append('search', params.search)

  const response = await api.get(
    `/orders/prescription/awaiting-verification?${queryParams.toString()}`,
  )
  return unwrapApiPayloadOrDefault<OrdersAwaitingVerificationResponse>(
    response.data,
    { orders: [], total: 0, page: 1, limit: 10 }
  )
}

// Verify prescription
export async function verifyPrescription(
  orderId: string,
  orderItemId: string,
  data: VerifyPrescriptionRequest,
): Promise<void> {
  await api.put(`/orders/${orderId}/items/${orderItemId}/verify-prescription`, data)
}

// Request customer update
export async function requestUpdate(
  orderId: string,
  orderItemId: string,
  data: RequestUpdateRequest,
): Promise<void> {
  await api.post(`/orders/${orderId}/items/${orderItemId}/request-update`, data)
}

// Manufacturing Types
export interface PrescriptionManufacturingStatus {
  manufacturingProofUrl?: string
  manufacturingStatus: 'PENDING' | 'COMPLETED' | 'FAILED'
  manufacturedAt?: string
}

export interface CompleteManufacturingResponse {
  manufacturingProofUrl?: string
  manufacturingStatus: 'PENDING' | 'COMPLETED' | 'FAILED'
  manufacturedAt?: string
}

// Upload manufacturing proof for OrderItem
// itemId is the index of the item in the order's items array
export async function completeManufacturing(
  orderId: string,
  itemIndex: number,
  file: File,
): Promise<CompleteManufacturingResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post(
    `/orders/${orderId}/items/${itemIndex}/manufacturing-proof`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return unwrapApiPayloadOrDefault<CompleteManufacturingResponse>(
    response.data,
    {} as CompleteManufacturingResponse
  )
}
