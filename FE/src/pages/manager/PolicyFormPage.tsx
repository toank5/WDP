import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getPolicies, createPolicy, updatePolicy, AnyPolicy, PolicyType, StrictPolicyConfigMap } from '../../lib/policy-api'
import {
  FiFileText,
  FiSettings,
  FiClock,
  FiTag,
  FiAlignLeft,
  FiArrowLeft,
  FiSave,
  FiCheckCircle,
  FiAlertCircle,
  FiPlus,
} from 'react-icons/fi'
import { toast } from 'sonner'
import ChipsInput from '../../components/ui/ChipsInput'
import type {
  ReturnPolicyConfig,
  WarrantyPolicyConfig,
  ShippingPolicyConfig,
  PrescriptionPolicyConfig,
  CancellationPolicyConfig,
  RefundPolicyConfig,
  LegalPolicyConfig,
  ApiError,
} from '../../types/policy.types'

/**
 * Form validation error state
 */
interface ValidationErrors {
  [key: string]: string
}

/**
 * Form state type - allows partial config for editing
 * Common fields are required, config can be partial
 */
interface PolicyFormState {
  type?: PolicyType
  title?: string
  summary?: string
  bodyPlainText?: string
  bodyRichTextJson?: unknown
  effectiveFrom?: string
  config?: Record<string, unknown>
}

/**
 * Type guard to check if value is a valid PolicyType
 */
function isValidPolicyType(value: string): value is PolicyType {
  return ['return', 'refund', 'warranty', 'shipping', 'prescription', 'cancellation', 'privacy', 'terms'].includes(value)
}

/**
 * Type guard to narrow config to ReturnPolicyConfig
 */
function isReturnConfig(config: unknown): config is Partial<ReturnPolicyConfig> {
  return typeof config === 'object' && config !== null
}

/**
 * Type guard to narrow config to WarrantyPolicyConfig
 */
function isWarrantyConfig(config: unknown): config is Partial<WarrantyPolicyConfig> {
  return typeof config === 'object' && config !== null
}

/**
 * Type guard to narrow config to ShippingPolicyConfig
 */
function isShippingConfig(config: unknown): config is Partial<ShippingPolicyConfig> {
  return typeof config === 'object' && config !== null
}

/**
 * Type guard to narrow config to PrescriptionPolicyConfig
 */
function isPrescriptionConfig(config: unknown): config is Partial<PrescriptionPolicyConfig> {
  return typeof config === 'object' && config !== null
}

/**
 * Type guard to narrow config to CancellationPolicyConfig
 */
function isCancellationConfig(config: unknown): config is Partial<CancellationPolicyConfig> {
  return typeof config === 'object' && config !== null
}

/**
 * Type guard to narrow config to RefundPolicyConfig
 */
function isRefundConfig(config: unknown): config is Partial<RefundPolicyConfig> {
  return typeof config === 'object' && config !== null
}

/**
 * Type guard to narrow error to ApiError
 */
function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'message' in error
}

const PolicyFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const typeParam = queryParams.get('type')
  const initialType: PolicyType = isValidPolicyType(typeParam || '') ? (typeParam as PolicyType) : 'return'

  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [formData, setFormData] = useState<PolicyFormState>({
    type: initialType,
    summary: '',
    bodyPlainText: '',
    bodyRichTextJson: undefined,
    effectiveFrom: new Date().toISOString().split('T')[0],
    config: {},
  })

  useEffect(() => {
    if (id) {
      setLoading(true)
      getPolicies()
        .then((policies) => {
          const policy = policies.find((p) => p._id === id)
          if (policy) {
            setFormData({
              type: policy.type,
              title: policy.title,
              summary: policy.summary,
              bodyPlainText: policy.bodyPlainText,
              bodyRichTextJson: policy.bodyRichTextJson,
              effectiveFrom: new Date(policy.effectiveFrom).toISOString().split('T')[0],
              config: policy.config as Record<string, unknown>,
            })
          }
        })
        .finally(() => setLoading(false))
    }
  }, [id])

  /**
   * Validate form data before submission
   * Frontend validation matching backend rules
   */
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {}
    const { type, config = {} } = formData

    // Common field validation
    if (!formData.title?.trim()) {
      errors.title = 'Title is required'
    }

    if (!formData.summary?.trim()) {
      errors.summary = 'Summary is required'
    } else if (formData.summary.length > 300) {
      errors.summary = 'Summary must be at most 300 characters'
    }

    if (!formData.bodyPlainText?.trim()) {
      errors.bodyPlainText = 'Body text is required'
    }

    if (!formData.effectiveFrom) {
      errors.effectiveFrom = 'Effective date is required'
    }

    // Config validation based on type
    if (type === 'return') {
      const c = config as Partial<ReturnPolicyConfig>

      if (!c.returnWindowDays?.framesOnly || c.returnWindowDays.framesOnly <= 0) {
        errors['returnWindowDays.framesOnly'] = 'Frames return window must be greater than 0'
      }
      if (!c.returnWindowDays?.prescriptionGlasses || c.returnWindowDays.prescriptionGlasses <= 0) {
        errors['returnWindowDays.prescriptionGlasses'] = 'Prescription glasses return window must be greater than 0'
      }
      if (!c.returnWindowDays?.contactLenses || c.returnWindowDays.contactLenses <= 0) {
        errors['returnWindowDays.contactLenses'] = 'Contact lenses return window must be greater than 0'
      }

      if (c.restockingFeePercent === undefined || c.restockingFeePercent < 0 || c.restockingFeePercent > 100) {
        errors.restockingFeePercent = 'Restocking fee must be between 0 and 100'
      }

      if (c.customerPaysReturnShipping === undefined) {
        errors.customerPaysReturnShipping = 'Customer pays return shipping is required'
      }

      if (!Array.isArray(c.nonReturnableCategories)) {
        errors.nonReturnableCategories = 'Non-returnable categories must be an array'
      }
    }

    if (type === 'warranty') {
      const c = config as Partial<WarrantyPolicyConfig>

      if (!c.framesMonths || c.framesMonths <= 0) {
        errors.framesMonths = 'Frames warranty must be greater than 0 months'
      }
      if (!c.lensesMonths || c.lensesMonths <= 0) {
        errors.lensesMonths = 'Lenses warranty must be greater than 0 months'
      }
      if (c.coversManufacturingDefects === undefined) {
        errors.coversManufacturingDefects = 'Covers manufacturing defects is required'
      }
      if (c.excludesScratchesFromWear === undefined) {
        errors.excludesScratchesFromWear = 'Excludes scratches from wear is required'
      }
    }

    if (type === 'shipping') {
      const c = config as Partial<ShippingPolicyConfig>

      if (!c.defaultCarrier?.trim()) {
        errors.defaultCarrier = 'Default carrier is required'
      }
      if (!c.standardDaysMin || c.standardDaysMin <= 0) {
        errors.standardDaysMin = 'Standard shipping minimum days must be greater than 0'
      }
      if (!c.standardDaysMax || c.standardDaysMax <= 0) {
        errors.standardDaysMax = 'Standard shipping maximum days must be greater than 0'
      }
      if (c.standardDaysMin && c.standardDaysMax && c.standardDaysMin > c.standardDaysMax) {
        errors.standardDaysMax = 'Standard shipping minimum days cannot be greater than maximum days'
      }
      if (!c.expressDaysMin || c.expressDaysMin <= 0) {
        errors.expressDaysMin = 'Express shipping minimum days must be greater than 0'
      }
      if (!c.expressDaysMax || c.expressDaysMax <= 0) {
        errors.expressDaysMax = 'Express shipping maximum days must be greater than 0'
      }
      if (c.expressDaysMin && c.expressDaysMax && c.expressDaysMin > c.expressDaysMax) {
        errors.expressDaysMax = 'Express shipping minimum days cannot be greater than maximum days'
      }
      if (c.freeShippingMinAmount === undefined || c.freeShippingMinAmount < 0) {
        errors.freeShippingMinAmount = 'Free shipping minimum amount must be at least 0'
      }
    }

    if (type === 'prescription') {
      const c = config as Partial<PrescriptionPolicyConfig>

      if (!c.maxPrescriptionAgeMonths || c.maxPrescriptionAgeMonths <= 0) {
        errors.maxPrescriptionAgeMonths = 'Max prescription age must be greater than 0 months'
      }
      if (c.requirePD === undefined) {
        errors.requirePD = 'Require PD is required'
      }
      if (c.allowHighPowerRange === undefined) {
        errors.allowHighPowerRange = 'Allow high power range is required'
      }
    }

    if (type === 'cancellation') {
      const c = config as Partial<CancellationPolicyConfig>

      if (c.allowCancelReadyBeforeShip === undefined) {
        errors.allowCancelReadyBeforeShip = 'Allow cancel ready before ship is required'
      }
      if (c.allowCancelPrescriptionBeforeProduction === undefined) {
        errors.allowCancelPrescriptionBeforeProduction = 'Allow cancel prescription before production is required'
      }
      if (c.allowCancelPreorderBeforeSupplierConfirm === undefined) {
        errors.allowCancelPreorderBeforeSupplierConfirm = 'Allow cancel preorder before supplier confirm is required'
      }
    }

    if (type === 'refund') {
      const c = config as Partial<RefundPolicyConfig>

      if (c.refundToOriginalMethodOnly === undefined) {
        errors.refundToOriginalMethodOnly = 'Refund to original method only is required'
      }
      if (!c.expectedProcessingDaysMin || c.expectedProcessingDaysMin <= 0) {
        errors.expectedProcessingDaysMin = 'Expected processing minimum days must be greater than 0'
      }
      if (!c.expectedProcessingDaysMax || c.expectedProcessingDaysMax <= 0) {
        errors.expectedProcessingDaysMax = 'Expected processing maximum days must be greater than 0'
      }
      if (c.expectedProcessingDaysMin && c.expectedProcessingDaysMax && c.expectedProcessingDaysMin > c.expectedProcessingDaysMax) {
        errors.expectedProcessingDaysMax = 'Expected processing minimum days cannot be greater than maximum days'
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  /**
   * Clear validation error for a specific field
   */
  const clearFieldError = (fieldName: string) => {
    setValidationErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form first
    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting')
      return
    }

    setLoading(true)
    try {
      // Prepare the base submit data without config first
      const baseSubmitData = {
        type: formData.type!,
        title: formData.title || '',
        summary: formData.summary || '',
        bodyPlainText: formData.bodyPlainText || '',
        bodyRichTextJson: formData.bodyRichTextJson,
        effectiveFrom: formData.effectiveFrom || new Date().toISOString().split('T')[0],
      }

      // Add config with proper type casting for API
      // We use unknown as intermediate type to avoid direct type assertion errors
      const submitData = {
        ...baseSubmitData,
        config: formData.config as StrictPolicyConfigMap[typeof baseSubmitData.type],
      }

      if (id) {
        // Update - type is inferred from submitData
        await updatePolicy(id, submitData)
        toast.success('Policy updated successfully')
      } else {
        // Create - type is inferred from submitData
        await createPolicy(submitData)
        toast.success('New policy version created')
      }
      navigate('/dashboard/policies')
    } catch (err: unknown) {
      console.error('Failed to save policy', err)

      // Use type guard for error handling
      if (isApiError(err)) {
        // Handle validation errors from backend
        if (err.errors && Object.keys(err.errors).length > 0) {
          setValidationErrors(err.errors)
          toast.error(err.message || 'Please fix the validation errors')
        } else {
          toast.error(err.message || 'Failed to save policy. Please try again.')
        }
      } else {
        toast.error('Failed to save policy. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const renderConfigFields = () => {
    const { type, config = {} } = formData

    // Return Policy Config
    if (type === 'return') {
      const c = isReturnConfig(config) ? config : {}
      return (
        <div className="space-y-4 p-4 bg-white border border-slate-300 rounded-[2px] self-stretch">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
            <FiSettings className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">
              Return Configuration
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Frames Return Window (days)
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
                value={c.returnWindowDays?.framesOnly ?? ''}
                onChange={(e) => {
                  clearFieldError('returnWindowDays.framesOnly')
                  const updatedConfig = Object.assign({}, c, {
                    returnWindowDays: Object.assign({}, c.returnWindowDays || {}, {
                      framesOnly: parseInt(e.target.value) || 0,
                    }),
                  })
                  setFormData({
                    ...formData,
                    config: updatedConfig,
                  })
                }}
              />
              {validationErrors['returnWindowDays.framesOnly'] && (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider ml-1">
                  {validationErrors['returnWindowDays.framesOnly']}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Prescription Glasses Return Window (days)
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
                value={c.returnWindowDays?.prescriptionGlasses ?? ''}
                onChange={(e) => {
                  clearFieldError('returnWindowDays.prescriptionGlasses')
                  const updatedConfig = Object.assign({}, c, {
                    returnWindowDays: Object.assign({}, c.returnWindowDays || {}, {
                      prescriptionGlasses: parseInt(e.target.value) || 0,
                    }),
                  })
                  setFormData({
                    ...formData,
                    config: updatedConfig,
                  })
                }}
              />
              {validationErrors['returnWindowDays.prescriptionGlasses'] && (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider ml-1">
                  {validationErrors['returnWindowDays.prescriptionGlasses']}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Contact Lenses Return Window (days)
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
                value={c.returnWindowDays?.contactLenses ?? ''}
                onChange={(e) => {
                  clearFieldError('returnWindowDays.contactLenses')
                  const updatedConfig = Object.assign({}, c, {
                    returnWindowDays: Object.assign({}, c.returnWindowDays || {}, {
                      contactLenses: parseInt(e.target.value) || 0,
                    }),
                  })
                  setFormData({
                    ...formData,
                    config: updatedConfig,
                  })
                }}
              />
              {validationErrors['returnWindowDays.contactLenses'] && (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider ml-1">
                  {validationErrors['returnWindowDays.contactLenses']}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Non-Returnable Categories
            </label>
            <ChipsInput
              value={c.nonReturnableCategories ?? []}
              onChange={(value) => {
                clearFieldError('nonReturnableCategories')
                setFormData({
                  ...formData,
                  config: Object.assign({}, c, { nonReturnableCategories: value }),
                })
              }}
              placeholder="Type a category and press Enter (e.g. used-contact-lenses)"
              className="w-full"
            />
            {validationErrors.nonReturnableCategories && (
              <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider ml-1">
                {validationErrors.nonReturnableCategories}
              </p>
            )}
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">
              Add categories that cannot be returned. Press Enter or click outside to add.
            </p>
          </div>
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Restocking Fee (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
              value={c.restockingFeePercent ?? ''}
              onChange={(e) => {
                clearFieldError('restockingFeePercent')
                setFormData({
                  ...formData,
                  config: Object.assign({}, c, { restockingFeePercent: parseInt(e.target.value) || 0 }),
                })
              }}
            />
            {validationErrors.restockingFeePercent && (
              <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider ml-1">
                {validationErrors.restockingFeePercent}
              </p>
            )}
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">
              Fee applied to the total refund amount for quality checks (0-100%).
            </p>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                id="returnShipping"
                className="peer h-6 w-6 rounded-xl border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer appearance-none bg-slate-50 border-2 checked:bg-blue-600 checked:border-blue-600"
                checked={!!c.customerPaysReturnShipping}
                onChange={(e) => {
                  clearFieldError('customerPaysReturnShipping')
                  setFormData({
                    ...formData,
                    config: Object.assign({}, c, { customerPaysReturnShipping: e.target.checked }),
                  })
                }}
              />
              <FiPlus className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-4 h-4 left-1 transition-opacity rotate-45" />
            </div>
            <label
              htmlFor="returnShipping"
              className="text-sm font-bold text-slate-700 cursor-pointer select-none"
            >
              Customer pays return shipping
            </label>
          </div>
        </div>
      )
    }

    // Warranty Policy Config
    if (type === 'warranty') {
      const c = isWarrantyConfig(config) ? config : {}
      return (
        <div className="space-y-4 p-4 bg-white border border-slate-300 rounded-[2px] self-stretch">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
            <FiSettings className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">
              Warranty Configuration
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Frames Warranty (months)
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
                value={c.framesMonths ?? ''}
                onChange={(e) => {
                  clearFieldError('framesMonths')
                  setFormData({
                    ...formData,
                    config: Object.assign({}, c, { framesMonths: parseInt(e.target.value) || 0 }),
                  })
                }}
              />
              {validationErrors.framesMonths && (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider ml-1">
                  {validationErrors.framesMonths}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Lenses Warranty (months)
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
                value={c.lensesMonths ?? ''}
                onChange={(e) => {
                  clearFieldError('lensesMonths')
                  setFormData({
                    ...formData,
                    config: Object.assign({}, c, { lensesMonths: parseInt(e.target.value) || 0 }),
                  })
                }}
              />
              {validationErrors.lensesMonths && (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider ml-1">
                  {validationErrors.lensesMonths}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="coversDefects"
                  className="peer h-6 w-6 rounded-xl border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer appearance-none bg-slate-50 border-2 checked:bg-blue-600 checked:border-blue-600"
                  checked={!!c.coversManufacturingDefects}
                  onChange={(e) => {
                    clearFieldError('coversManufacturingDefects')
                    setFormData({
                      ...formData,
                      config: Object.assign({}, c, { coversManufacturingDefects: e.target.checked }),
                    })
                  }}
                />
                <FiPlus className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-4 h-4 left-1 transition-opacity rotate-45" />
              </div>
              <label
                htmlFor="coversDefects"
                className="text-sm font-bold text-slate-700 cursor-pointer"
              >
                Covers manufacturing defects
              </label>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="excludesScratches"
                  className="peer h-6 w-6 rounded-xl border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer appearance-none bg-slate-50 border-2 checked:bg-blue-600 checked:border-blue-600"
                  checked={!!c.excludesScratchesFromWear}
                  onChange={(e) => {
                    clearFieldError('excludesScratchesFromWear')
                    setFormData({
                      ...formData,
                      config: Object.assign({}, c, { excludesScratchesFromWear: e.target.checked }),
                    })
                  }}
                />
                <FiPlus className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-4 h-4 left-1 transition-opacity rotate-45" />
              </div>
              <label
                htmlFor="excludesScratches"
                className="text-sm font-bold text-slate-700 cursor-pointer"
              >
                Excludes scratches from normal wear
              </label>
            </div>
          </div>
        </div>
      )
    }

    // Shipping Policy Config
    if (type === 'shipping') {
      const c = isShippingConfig(config) ? config : {}
      return (
        <div className="space-y-4 p-4 bg-white border border-slate-300 rounded-[2px] self-stretch">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
            <FiSettings className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">
              Shipping Configuration
            </h3>
          </div>
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Default Carrier
            </label>
            <input
              type="text"
              className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
              value={c.defaultCarrier ?? ''}
              onChange={(e) => {
                clearFieldError('defaultCarrier')
                setFormData({
                  ...formData,
                  config: Object.assign({}, c, { defaultCarrier: e.target.value }),
                })
              }}
              placeholder="e.g., FedEx, UPS, USPS"
            />
            {validationErrors.defaultCarrier && (
              <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider ml-1">
                {validationErrors.defaultCarrier}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Standard Shipping Min (days)
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
                value={c.standardDaysMin ?? ''}
                onChange={(e) => {
                  clearFieldError('standardDaysMin')
                  clearFieldError('standardDaysMax')
                  setFormData({
                    ...formData,
                    config: Object.assign({}, c, { standardDaysMin: parseInt(e.target.value) || 0 }),
                  })
                }}
              />
              {validationErrors.standardDaysMin && (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider ml-1">
                  {validationErrors.standardDaysMin}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Standard Shipping Max (days)
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
                value={c.standardDaysMax ?? ''}
                onChange={(e) => {
                  clearFieldError('standardDaysMax')
                  clearFieldError('standardDaysMin')
                  setFormData({
                    ...formData,
                    config: Object.assign({}, c, { standardDaysMax: parseInt(e.target.value) || 0 }),
                  })
                }}
              />
              {validationErrors.standardDaysMax && (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider ml-1">
                  {validationErrors.standardDaysMax}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Express Shipping Min (days)
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
                value={c.expressDaysMin ?? ''}
                onChange={(e) => {
                  clearFieldError('expressDaysMin')
                  clearFieldError('expressDaysMax')
                  setFormData({
                    ...formData,
                    config: Object.assign({}, c, { expressDaysMin: parseInt(e.target.value) || 0 }),
                  })
                }}
              />
              {validationErrors.expressDaysMin && (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider ml-1">
                  {validationErrors.expressDaysMin}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Express Shipping Max (days)
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
                value={c.expressDaysMax ?? ''}
                onChange={(e) => {
                  clearFieldError('expressDaysMax')
                  clearFieldError('expressDaysMin')
                  setFormData({
                    ...formData,
                    config: Object.assign({}, c, { expressDaysMax: parseInt(e.target.value) || 0 }),
                  })
                }}
              />
              {validationErrors.expressDaysMax && (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider ml-1">
                  {validationErrors.expressDaysMax}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Free Shipping Minimum Amount ($)
            </label>
            <input
              type="number"
              min="0"
              className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
              value={c.freeShippingMinAmount ?? ''}
              onChange={(e) => {
                clearFieldError('freeShippingMinAmount')
                setFormData({
                  ...formData,
                  config: Object.assign({}, c, { freeShippingMinAmount: parseInt(e.target.value) || 0 }),
                })
              }}
            />
            {validationErrors.freeShippingMinAmount && (
              <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider ml-1">
                {validationErrors.freeShippingMinAmount}
              </p>
            )}
          </div>
        </div>
      )
    }

    // Prescription Policy Config
    if (type === 'prescription') {
      const c = isPrescriptionConfig(config) ? config : {}
      return (
        <div className="space-y-4 p-4 bg-white border border-slate-300 rounded-[2px] self-stretch">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
            <FiSettings className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">
              Prescription Configuration
            </h3>
          </div>
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Max Prescription Age (months)
            </label>
            <input
              type="number"
              min="1"
              className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
              value={c.maxPrescriptionAgeMonths ?? ''}
              onChange={(e) => {
                clearFieldError('maxPrescriptionAgeMonths')
                setFormData({
                  ...formData,
                  config: Object.assign({}, c, { maxPrescriptionAgeMonths: parseInt(e.target.value) || 0 }),
                })
              }}
            />
            {validationErrors.maxPrescriptionAgeMonths && (
              <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider ml-1">
                {validationErrors.maxPrescriptionAgeMonths}
              </p>
            )}
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">
              How old a prescription can be before it's considered expired
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="requirePD"
                  className="peer h-6 w-6 rounded-xl border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer appearance-none bg-slate-50 border-2 checked:bg-blue-600 checked:border-blue-600"
                  checked={!!c.requirePD}
                  onChange={(e) => {
                    clearFieldError('requirePD')
                    setFormData({
                      ...formData,
                      config: Object.assign({}, c, { requirePD: e.target.checked }),
                    })
                  }}
                />
                <FiPlus className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-4 h-4 left-1 transition-opacity rotate-45" />
              </div>
              <label
                htmlFor="requirePD"
                className="text-sm font-bold text-slate-700 cursor-pointer"
              >
                Require Pupillary Distance (PD)
              </label>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="allowHighPower"
                  className="peer h-6 w-6 rounded-xl border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer appearance-none bg-slate-50 border-2 checked:bg-blue-600 checked:border-blue-600"
                  checked={!!c.allowHighPowerRange}
                  onChange={(e) => {
                    clearFieldError('allowHighPowerRange')
                    setFormData({
                      ...formData,
                      config: Object.assign({}, c, { allowHighPowerRange: e.target.checked }),
                    })
                  }}
                />
                <FiPlus className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-4 h-4 left-1 transition-opacity rotate-45" />
              </div>
              <label
                htmlFor="allowHighPower"
                className="text-sm font-bold text-slate-700 cursor-pointer"
              >
                Allow high power range prescriptions
              </label>
            </div>
          </div>
        </div>
      )
    }

    // Cancellation Policy Config
    if (type === 'cancellation') {
      const c = isCancellationConfig(config) ? config : {}
      return (
        <div className="space-y-4 p-4 bg-white border border-slate-300 rounded-[2px] self-stretch">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
            <FiSettings className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">
              Cancellation Configuration
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="cancelReady"
                  className="peer h-6 w-6 rounded-xl border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer appearance-none bg-slate-50 border-2 checked:bg-blue-600 checked:border-blue-600"
                  checked={!!c.allowCancelReadyBeforeShip}
                  onChange={(e) => {
                    clearFieldError('allowCancelReadyBeforeShip')
                    setFormData({
                      ...formData,
                      config: Object.assign({}, c, { allowCancelReadyBeforeShip: e.target.checked }),
                    })
                  }}
                />
                <FiPlus className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-4 h-4 left-1 transition-opacity rotate-45" />
              </div>
              <label
                htmlFor="cancelReady"
                className="text-sm font-bold text-slate-700 cursor-pointer"
              >
                Allow cancel ready-to-ship orders before shipping
              </label>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="cancelPrescription"
                  className="peer h-6 w-6 rounded-xl border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer appearance-none bg-slate-50 border-2 checked:bg-blue-600 checked:border-blue-600"
                  checked={!!c.allowCancelPrescriptionBeforeProduction}
                  onChange={(e) => {
                    clearFieldError('allowCancelPrescriptionBeforeProduction')
                    setFormData({
                      ...formData,
                      config: Object.assign({}, c, {
                        allowCancelPrescriptionBeforeProduction: e.target.checked,
                      }),
                    })
                  }}
                />
                <FiPlus className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-4 h-4 left-1 transition-opacity rotate-45" />
              </div>
              <label
                htmlFor="cancelPrescription"
                className="text-sm font-bold text-slate-700 cursor-pointer"
              >
                Allow cancel prescription orders before production
              </label>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="cancelPreorder"
                  className="peer h-6 w-6 rounded-xl border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer appearance-none bg-slate-50 border-2 checked:bg-blue-600 checked:border-blue-600"
                  checked={!!c.allowCancelPreorderBeforeSupplierConfirm}
                  onChange={(e) => {
                    clearFieldError('allowCancelPreorderBeforeSupplierConfirm')
                    setFormData({
                      ...formData,
                      config: Object.assign({}, c, {
                        allowCancelPreorderBeforeSupplierConfirm: e.target.checked,
                      }),
                    })
                  }}
                />
                <FiPlus className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-4 h-4 left-1 transition-opacity rotate-45" />
              </div>
              <label
                htmlFor="cancelPreorder"
                className="text-sm font-bold text-slate-700 cursor-pointer"
              >
                Allow cancel preorders before supplier confirmation
              </label>
            </div>
          </div>
        </div>
      )
    }

    // Refund Policy Config
    if (type === 'refund') {
      const c = isRefundConfig(config) ? config : {}
      return (
        <div className="space-y-4 p-4 bg-white border border-slate-300 rounded-[2px] self-stretch">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
            <FiSettings className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">
              Refund Configuration
            </h3>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm mb-4">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                id="refundOriginal"
                className="peer h-6 w-6 rounded-xl border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer appearance-none bg-slate-50 border-2 checked:bg-blue-600 checked:border-blue-600"
                checked={!!c.refundToOriginalMethodOnly}
                onChange={(e) => {
                  clearFieldError('refundToOriginalMethodOnly')
                  setFormData({
                    ...formData,
                    config: Object.assign({}, c, { refundToOriginalMethodOnly: e.target.checked }),
                  })
                }}
              />
              <FiPlus className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-4 h-4 left-1 transition-opacity rotate-45" />
            </div>
            <label
              htmlFor="refundOriginal"
              className="text-sm font-bold text-slate-700 cursor-pointer"
            >
              Refund to original payment method only
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Expected Processing Min (days)
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
                value={c.expectedProcessingDaysMin ?? ''}
                onChange={(e) => {
                  clearFieldError('expectedProcessingDaysMin')
                  clearFieldError('expectedProcessingDaysMax')
                  setFormData({
                    ...formData,
                    config: Object.assign({}, c, { expectedProcessingDaysMin: parseInt(e.target.value) || 0 }),
                  })
                }}
              />
              {validationErrors.expectedProcessingDaysMin && (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider ml-1">
                  {validationErrors.expectedProcessingDaysMin}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Expected Processing Max (days)
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
                value={c.expectedProcessingDaysMax ?? ''}
                onChange={(e) => {
                  clearFieldError('expectedProcessingDaysMax')
                  clearFieldError('expectedProcessingDaysMin')
                  setFormData({
                    ...formData,
                    config: Object.assign({}, c, { expectedProcessingDaysMax: parseInt(e.target.value) || 0 }),
                  })
                }}
              />
              {validationErrors.expectedProcessingDaysMax && (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider ml-1">
                  {validationErrors.expectedProcessingDaysMax}
                </p>
              )}
            </div>
          </div>
        </div>
      )
    }

    // Privacy & Terms (no specific config)
    if (type === 'privacy' || type === 'terms') {
      return (
        <div className="p-8 text-center bg-slate-50/50 border border-slate-100 border-dashed rounded-2xl">
          <FiAlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            No additional configuration needed for {type} policy
          </div>
          <p className="text-slate-400 text-xs mt-2">
            Just fill in the title, summary, and body text above
          </p>
        </div>
      )
    }

    return (
      <div className="p-12 text-center bg-slate-50/50 border border-slate-100 border-dashed rounded-[2rem] animate-in fade-in duration-700">
        <FiAlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-4" />
        <div className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">
          Configuration for {type} policy type
        </div>
      </div>
    )
  }

  if (loading && id) {
    return (
      <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-xl flex items-center justify-center z-50">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-50/50 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-blue-600 uppercase tracking-widest">
            WDP
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-start border-b border-slate-300 pb-4">
          <div className="space-y-2">
            <button
              onClick={() => navigate('/dashboard/policies')}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-blue-700 transition-colors"
            >
              <FiArrowLeft className="w-3.5 h-3.5" />
              Discard Draft
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">
              {id ? 'Modify Policy Version' : 'New Policy Version'}
            </h1>
          </div>
          <div className="p-3 bg-white border border-slate-300 rounded-[2px] shadow-sm">
            <FiFileText className="w-8 h-8 text-slate-500" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden">
            <div className="bg-slate-100 border-b border-slate-300 px-6 py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Primary Configuration
              </span>
            </div>
            <div className="p-6 md:p-8 space-y-8">
              {/* Type and Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                    <FiTag className="w-4 h-4 text-blue-500" />
                    Classification
                  </label>
                  <div className="relative">
                    <select
                      disabled={!!id}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 cursor-pointer appearance-none"
                      value={formData.type}
                      onChange={(e) => {
                        const newType = e.target.value
                        if (isValidPolicyType(newType)) {
                          setFormData({ ...formData, type: newType, config: {} })
                        }
                      }}
                    >
                      <option value="return">Return</option>
                      <option value="refund">Refund</option>
                      <option value="warranty">Warranty</option>
                      <option value="shipping">Shipping</option>
                      <option value="prescription">Prescription</option>
                      <option value="cancellation">Cancellation</option>
                      <option value="privacy">Privacy</option>
                      <option value="terms">Terms</option>
                    </select>
                    {!id && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <FiSettings className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                    <FiClock className="w-4 h-4 text-blue-500" />
                    Deployment Date
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                    value={formData.effectiveFrom}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      clearFieldError('effectiveFrom')
                      setFormData({ ...formData, effectiveFrom: e.target.value })
                    }}
                  />
                  {validationErrors.effectiveFrom && (
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider ml-1">
                      {validationErrors.effectiveFrom}
                    </p>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-3 text-left">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                  <span className="w-4 h-4 flex items-center justify-center bg-blue-500 text-[10px] text-white rounded-full font-black">
                    T
                  </span>
                  Official Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Transparency in Digital Commerce"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-xl font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
                  value={formData.title}
                  onChange={(e) => {
                    clearFieldError('title')
                    setFormData({ ...formData, title: e.target.value })
                  }}
                />
                {validationErrors.title && (
                  <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider ml-1">
                    {validationErrors.title}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">
                  This title is visible to all customers on the legal pages.
                </p>
              </div>

              {/* Summary */}
              <div className="space-y-3 text-left">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                  <FiAlignLeft className="w-4 h-4 text-blue-500" />
                  Executive Summary
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide a high-level overview that customers can quickly scan..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none placeholder:text-slate-300 leading-relaxed"
                  value={formData.summary}
                  onChange={(e) => {
                    clearFieldError('summary')
                    setFormData({ ...formData, summary: e.target.value })
                  }}
                />
                {validationErrors.summary && (
                  <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider ml-1">
                    {validationErrors.summary}
                  </p>
                )}
                <div className="flex justify-between items-center px-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    A brief TL;DR for mobile users.
                  </p>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    {formData.summary?.length || 0} / 300
                  </div>
                </div>
              </div>

              {/* Content Tabs Concept */}
              <div className="space-y-6">
                <div className="flex items-center gap-6 border-b border-slate-50 pb-2 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    className="px-4 py-2 text-xs font-black uppercase tracking-widest text-blue-600 border-b-2 border-blue-600 shrink-0"
                  >
                    Legal Document
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-slate-400 shrink-0 cursor-not-allowed"
                  >
                    Formatted Preview
                  </button>
                </div>

                <div className="space-y-3 text-left">
                  <textarea
                    required
                    rows={10}
                    placeholder="Draft the complete policy content. Use clear, unambiguous language..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-6 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300 leading-relaxed min-h-[320px]"
                    value={formData.bodyPlainText}
                    onChange={(e) => {
                      clearFieldError('bodyPlainText')
                      setFormData({ ...formData, bodyPlainText: e.target.value })
                    }}
                  />
                  {validationErrors.bodyPlainText && (
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider ml-1">
                      {validationErrors.bodyPlainText}
                    </p>
                  )}
                  <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm">
                    <FiCheckCircle className="w-4 h-4 text-emerald-500" />
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-none">
                      Sanitized Version Ready for Deployment
                    </p>
                  </div>
                </div>
              </div>

              {/* Config Fields Header */}
              <div className="pt-6">
                <div className="w-full h-px bg-slate-50 mb-10"></div>
                {renderConfigFields()}
              </div>

              {/* Actions */}
              <div className="flex flex-col md:flex-row items-center justify-end gap-6 pt-6 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/policies')}
                  className="w-full md:w-auto px-10 py-5 font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all active:scale-95"
                >
                  Discard Changes
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-2xl shadow-slate-900/20 hover:shadow-slate-900/40 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-4 group"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <FiSave className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      Seal & Publish
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PolicyFormPage
