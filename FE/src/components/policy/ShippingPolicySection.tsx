import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon, LocalShipping as ShippingIcon } from '@mui/icons-material'
import { getPolicyByType } from '@/lib/policy-api'
import type { Policy } from '@/types/policy.types'

interface ShippingPolicySectionProps {
  className?: string
}

/**
 * Collapsible shipping policy section component
 *
 * @example
 * ```tsx
 * <ShippingPolicySection />
 * ```
 */
export function ShippingPolicySection({ className }: ShippingPolicySectionProps) {
  const [policy, setPolicy] = useState<Policy<'shipping'> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoading(true)
        const data = await getPolicyByType('shipping')
        setPolicy(data)
      } catch (err) {
        console.error('Failed to fetch shipping policy:', err)
        setError('Unable to load shipping policy')
      } finally {
        setLoading(false)
      }
    }

    fetchPolicy()
  }, [])

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <Box className={className} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">
          Loading shipping policy...
        </Typography>
      </Box>
    )
  }

  if (error || !policy) {
    return null
  }

  const config = policy.config

  return (
    <Box className={className}>
      <Accordion
        defaultExpanded={false}
        sx={{
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          '&:before': { display: 'none' },
          borderRadius: '8px !important',
          overflow: 'hidden',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            bgcolor: 'grey.50',
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <ShippingIcon color="primary" />
            <Typography variant="subtitle2" fontWeight={600}>
              Shipping Policy
            </Typography>
            {policy.isActive && (
              <Chip label="Active" size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
            )}
          </Box>
        </AccordionSummary>

        <AccordionDetails sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Effective Date */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                Effective from {formatDate(policy.effectiveFrom)}
              </Typography>
            </Box>

            {/* Summary */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Summary
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {policy.summary}
              </Typography>
            </Box>

            {/* Shipping Options */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Shipping Options
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* Standard Shipping */}
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      Standard Shipping
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {config.standardDaysMin}-{config.standardDaysMax} business days
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600} color="primary">
                    {config.standardShippingFee === 0 ? 'Free' : formatPrice(config.standardShippingFee)}
                  </Typography>
                </Box>

                {/* Express Shipping */}
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      Express Shipping ({config.defaultCarrier})
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {config.expressDaysMin}-{config.expressDaysMax} business days
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600} color="primary">
                    {config.expressShippingFee === 0 ? 'Free' : formatPrice(config.expressShippingFee)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Free Shipping Threshold */}
            {config.freeShippingMinAmount > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Free Shipping
                </Typography>
                <Alert severity="success" sx={{ borderRadius: 1 }}>
                  <Typography variant="body2">
                    Free shipping on orders over {formatPrice(config.freeShippingMinAmount)}
                  </Typography>
                </Alert>
              </Box>
            )}

            {/* Full Policy Body */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Full Policy Details
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  whiteSpace: 'pre-line',
                  lineHeight: 1.6,
                  bgcolor: 'grey.50',
                  p: 1.5,
                  borderRadius: 1,
                }}
              >
                {policy.bodyPlainText}
              </Typography>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}
