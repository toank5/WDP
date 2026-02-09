/**
 * Strict union of all policy types
 */
export type PolicyType =
  | 'return'
  | 'refund'
  | 'warranty'
  | 'shipping'
  | 'prescription'
  | 'cancellation'
  | 'privacy'
  | 'terms'

/**
 * Return Policy Config
 */
export interface ReturnPolicyConfig {
  returnWindowDays: {
    framesOnly: number
    prescriptionGlasses: number
    contactLenses: number
  }
  restockingFeePercent: number
  customerPaysReturnShipping: boolean
  nonReturnableCategories: string[]
}

/**
 * Warranty Policy Config
 */
export interface WarrantyPolicyConfig {
  framesMonths: number
  lensesMonths: number
  coversManufacturingDefects: boolean
  excludesScratchesFromWear: boolean
}

/**
 * Shipping Policy Config
 */
export interface ShippingPolicyConfig {
  defaultCarrier: string
  standardDaysMin: number
  standardDaysMax: number
  expressDaysMin: number
  expressDaysMax: number
  freeShippingMinAmount: number
}

/**
 * Prescription Policy Config
 */
export interface PrescriptionPolicyConfig {
  maxPrescriptionAgeMonths: number
  requirePD: boolean
  allowHighPowerRange: boolean
}

/**
 * Cancellation Policy Config
 */
export interface CancellationPolicyConfig {
  allowCancelReadyBeforeShip: boolean
  allowCancelPrescriptionBeforeProduction: boolean
  allowCancelPreorderBeforeSupplierConfirm: boolean
}

/**
 * Refund Policy Config
 */
export interface RefundPolicyConfig {
  refundToOriginalMethodOnly: boolean
  expectedProcessingDaysMin: number
  expectedProcessingDaysMax: number
}

/**
 * Privacy/Terms Policy Config (empty but validated)
 */
export interface LegalPolicyConfig {
  [key: string]: never
}

/**
 * Map of policy types to their config interfaces
 */
export type StrictPolicyConfigMap = {
  return: ReturnPolicyConfig
  refund: RefundPolicyConfig
  warranty: WarrantyPolicyConfig
  shipping: ShippingPolicyConfig
  prescription: PrescriptionPolicyConfig
  cancellation: CancellationPolicyConfig
  privacy: LegalPolicyConfig
  terms: LegalPolicyConfig
}

/**
 * Union type of all possible configs
 */
export type PolicyConfig = StrictPolicyConfigMap[PolicyType]

/**
 * Base Policy interface with common fields
 */
export interface BasePolicy {
  _id: string
  type: PolicyType
  version: number
  title: string
  summary: string
  bodyPlainText: string
  bodyRichTextJson?: unknown
  config: PolicyConfig
  isActive: boolean
  effectiveFrom: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

/**
 * Generic Policy interface with typed config based on PolicyType
 */
export interface Policy<T extends PolicyType = PolicyType> extends BasePolicy {
  type: T
  config: StrictPolicyConfigMap[T]
}

/**
 * Discriminated union of all Policy types for exhaustiveness checking
 */
export type AnyPolicy =
  | Policy<'return'>
  | Policy<'refund'>
  | Policy<'warranty'>
  | Policy<'shipping'>
  | Policy<'prescription'>
  | Policy<'cancellation'>
  | Policy<'privacy'>
  | Policy<'terms'>

/**
 * Form state for creating/updating policies
 */
export interface PolicyFormData<T extends PolicyType = PolicyType> {
  type?: T
  title: string
  summary: string
  bodyPlainText: string
  bodyRichTextJson?: unknown
  effectiveFrom: string
  config?: StrictPolicyConfigMap[T]
}

/**
 * API validation error format
 */
export interface ValidationError {
  path: string
  message: string
}

/**
 * API error response format
 */
export interface ApiError {
  message: string
  errors?: Record<string, string>
  statusCode?: number
}

/**
 * Helper type to get config for a specific policy type
 */
export type ConfigForType<T extends PolicyType> = StrictPolicyConfigMap[T]

/**
 * Type guard to narrow a policy to a specific type
 */
export function isPolicyType<T extends PolicyType>(
  policy: BasePolicy,
  type: T
): policy is Policy<T> {
  return policy.type === type
}
