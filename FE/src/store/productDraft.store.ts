import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Draft variant for store (simplified, without images)
 */
export interface DraftVariant {
  sku: string
  size: string
  color: string
  price: number
  weight?: number
  images2D: string[]
  images3D: string[]
  isActive: boolean
}

/**
 * Draft prescription range
 */
export interface DraftPrescriptionRange {
  minSPH?: number
  maxSPH?: number
  minCYL?: number
  maxCYL?: number
}

/**
 * Product Draft - matches form state shape
 * Stores all product form data for restoration
 *
 * Note: Uses string types instead of strict union types from api.types.ts
 * to accommodate the form's local constants which may have different values
 */
export interface ProductDraft {
  // Common fields
  name: string
  category: string // 'frame' | 'lens' | 'service' | ''
  description: string
  basePrice: number | null
  images2D: string[]
  images3D: string[]
  tags: string[]
  isActive: boolean
  isPreorderEnabled: boolean

  // Frame-specific fields (use string for flexibility)
  frameType?: string
  shape?: string
  material?: string
  gender?: string // Note: form uses 'men'/'women' instead of 'male'/'female'
  bridgeFit?: string
  variants: DraftVariant[]

  // Lens-specific fields
  lensType?: string
  index?: number
  coatings?: string[]
  suitableForPrescriptionRange?: DraftPrescriptionRange
  isPrescriptionRequired?: boolean

  // Service-specific fields
  serviceType?: string
  durationMinutes?: number
  serviceNotes?: string

  // Metadata
  isEditMode: boolean
  editProductId?: string
  timestamp: number
}

/**
 * Product Draft State
 */
interface ProductDraftState {
  draft: ProductDraft | null
  setDraft: (draft: ProductDraft) => void
  clearDraft: () => void
  hasDraft: () => boolean
}

/**
 * Product Draft Store
 * Uses persist middleware to save drafts to localStorage
 */
export const useProductDraftStore = create<ProductDraftState>()(
  persist(
    (set, get) => ({
      draft: null,

      setDraft: (draft) => set({ draft }),

      clearDraft: () => set({ draft: null }),

      hasDraft: () => {
        const { draft } = get()
        return draft !== null
      },
    }),
    {
      name: 'wdp-product-draft',
      version: 1,
    }
  )
)
