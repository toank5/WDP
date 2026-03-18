import { useState, useEffect, useCallback } from 'react'
import { getPolicyByType } from '@/lib/policy-api'
import type { Policy } from '@/lib/policy-api'

/**
 * Return Policy type from backend
 * This matches the JSON structure provided by the backend
 */
export interface ReturnPolicy {
  type: 'return'
  version: number
  title: string
  summary: string
  bodyPlainText: string
  config: {
    returnWindowDays: {
      framesOnly: number
      prescriptionGlasses: number
      contactLenses: number
    }
    restockingFeePercent: number
    customerPaysReturnShipping: boolean
    nonReturnableCategories: string[]
  }
  isActive: boolean
  effectiveFrom: string
  _id?: string
  createdAt?: string
  updatedAt?: string
}

/**
 * Product type for return window calculation
 */
export type ProductReturnType = 'framesOnly' | 'prescriptionGlasses' | 'contactLenses'

/**
 * Extended Return Policy with helper methods
 */
export interface ReturnPolicyWithHelpers extends ReturnPolicy {
  getReturnWindowDays: (productType: ProductReturnType) => number
  isNonReturnable: (category: string) => boolean
  getRestockingFee: () => number
  customerPaysReturnShipping: () => boolean
}

/**
 * Add helper methods to a ReturnPolicy
 */
function addHelperMethods(policy: ReturnPolicy): ReturnPolicyWithHelpers {
  return {
    ...policy,
    getReturnWindowDays: (productType: ProductReturnType) => {
      return policy.config.returnWindowDays[productType]
    },
    isNonReturnable: (category: string) => {
      return policy.config.nonReturnableCategories.includes(category)
    },
    getRestockingFee: () => policy.config.restockingFeePercent,
    customerPaysReturnShipping: () => policy.config.customerPaysReturnShipping,
  }
}

/**
 * Hook to fetch the current active return policy
 *
 * @example
 * ```tsx
 * const { data: returnPolicy, isLoading, error, refetch } = useReturnPolicy()
 *
 * if (isLoading) return <LoadingSpinner />
 * if (error) return <ErrorMessage />
 *
 * const windowDays = returnPolicy?.getReturnWindowDays('framesOnly')
 * ```
 */
export function useReturnPolicy() {
  const [data, setData] = useState<ReturnPolicyWithHelpers | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchPolicy = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const policy = await getPolicyByType('return')
      if (policy) {
        setData(addHelperMethods(policy as unknown as ReturnPolicy))
      } else {
        setData(null)
      }
    } catch (err) {
      console.error('Failed to fetch return policy:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch return policy'))
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPolicy()
  }, [fetchPolicy])

  return {
    data,
    isLoading,
    error,
    refetch: fetchPolicy,
  }
}

/**
 * Calculate days since delivery date
 */
export function getDaysSinceDelivery(deliveredAt?: string | Date): number {
  if (!deliveredAt) return 0

  const deliveryDate = new Date(deliveredAt)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - deliveryDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Check if an item is eligible for return based on policy and delivery date
 */
export function isItemReturnable(
  policy: ReturnPolicyWithHelpers | null | undefined,
  productType: ProductReturnType,
  category: string | undefined,
  deliveredAt?: string | Date
): { eligible: boolean; reason?: string } {
  if (!policy) {
    return { eligible: false, reason: 'Return policy not available' }
  }

  // Check if category is non-returnable
  if (category && policy.isNonReturnable(category)) {
    return { eligible: false, reason: 'This item is non-returnable' }
  }

  // Check delivery window
  if (deliveredAt) {
    const daysSince = getDaysSinceDelivery(deliveredAt)
    const windowDays = policy.getReturnWindowDays(productType)

    if (daysSince > windowDays) {
      return {
        eligible: false,
        reason: `Return window (${windowDays} days) has passed`,
      }
    }
  }

  return { eligible: true }
}

/**
 * Calculate estimated refund with restocking fee
 */
export function calculateEstimatedRefund(
  policy: ReturnPolicyWithHelpers | null | undefined,
  itemsTotal: number
): {
  estimatedSubtotal: number
  restockingFee: number
  estimatedRefund: number
  restockingFeePercent: number
} {
  const restockingFeePercent = policy?.getRestockingFee() ?? 0
  const restockingFee = itemsTotal * (restockingFeePercent / 100)
  const estimatedRefund = itemsTotal - restockingFee

  return {
    estimatedSubtotal: itemsTotal,
    restockingFee,
    estimatedRefund,
    restockingFeePercent,
  }
}

/**
 * Determine product return type based on order item
 */
export function getProductReturnType(orderItem: {
  isPrescription?: boolean
  isPreorder?: boolean
  // Add other identifying fields as needed
}): ProductReturnType {
  if (orderItem.isPrescription) {
    return 'prescriptionGlasses'
  }
  return 'framesOnly'
}
