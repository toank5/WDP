import { API_ENDPOINTS, get, post, put, del } from './api'
import type { Prescription, EyePrescription } from '../types'

/**
 * Get all prescriptions for current user
 */
export async function getPrescriptions(): Promise<Prescription[]> {
  return get<Prescription[]>(API_ENDPOINTS.PRESCRIPTIONS)
}

/**
 * Get prescription by ID
 */
export async function getPrescriptionById(id: string): Promise<Prescription> {
  return get<Prescription>(API_ENDPOINTS.PRESCRIPTION_DETAIL(id))
}

/**
 * Create new prescription
 */
export interface CreatePrescriptionPayload {
  name: string
  rightEye: EyePrescription
  leftEye: EyePrescription
  pd: number
  notes?: string
  image?: string
}

export async function createPrescription(
  payload: CreatePrescriptionPayload
): Promise<Prescription> {
  return post<Prescription>(API_ENDPOINTS.PRESCRIPTIONS, payload)
}

/**
 * Update prescription
 */
export async function updatePrescription(
  id: string,
  payload: Partial<CreatePrescriptionPayload>
): Promise<Prescription> {
  return put<Prescription>(API_ENDPOINTS.PRESCRIPTION_DETAIL(id), payload)
}

/**
 * Delete prescription
 */
export async function deletePrescription(id: string): Promise<{ message: string }> {
  return del<{ message: string }>(API_ENDPOINTS.PRESCRIPTION_DETAIL(id))
}
