import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Divider,
  Checkbox,
  Alert,
  CircularProgress,
  Avatar,
  Stack,
  Paper,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import { Grid } from '@mui/material'
import {
  Close as CloseIcon,
  Info as InfoIcon,
  LocalShipping as LocalShippingIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
} from '@mui/icons-material'
import { toast } from 'sonner'
import type { ReturnPolicyWithHelpers, ProductReturnType } from '@/hooks/useReturnPolicy'
import {
  isItemReturnable,
  calculateEstimatedRefund,
  getDaysSinceDelivery,
} from '@/hooks/useReturnPolicy'
import type { Order, OrderItem } from '@/lib/order-api'
import {
  returnApi,
  ReturnRequestType,
  ReturnReason,
  type CreateReturnRequestDto,
  type ReturnLineItem,
} from '@/lib/return-api'

// VND Price formatter
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

interface RequestReturnDialogProps {
  open: boolean
  onClose: () => void
  order: Order | null
  policy: ReturnPolicyWithHelpers | null
  onSuccess?: () => void
}

/**
 * Dialog component for requesting returns/exchanges
 * Shows policy summary, item selection, and estimated refund calculation
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false)
 * const { data: returnPolicy } = useReturnPolicy()
 *
 * <Button onClick={() => setOpen(true)}>Request Return</Button>
 * <RequestReturnDialog open={open} onClose={() => setOpen(false)} order={order} policy={returnPolicy} />
 * ```
 */
export function RequestReturnDialog({
  open,
  onClose,
  order,
  policy,
  onSuccess,
}: RequestReturnDialogProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [showFullPolicy, setShowFullPolicy] = useState(false)

  // New state for return details
  const [returnType, setReturnRequestType] = useState<ReturnRequestType>(ReturnRequestType.REFUND)
  const [returnReason, setReturnReason] = useState<ReturnReason>(ReturnReason.DEFECTIVE)
  const [reasonDetails, setReasonDetails] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  // Reset state when dialog opens/closes
  const handleOpen = () => {
    setSelectedItems(new Set())
    setShowFullPolicy(false)
    setReturnRequestType(ReturnRequestType.REFUND)
    setReturnReason(ReturnReason.DEFECTIVE)
    setReasonDetails('')
    setCustomerNotes('')
    setCustomerEmail('')
    setCustomerPhone('')
  }

  const handleClose = () => {
    setSelectedItems(new Set())
    setShowFullPolicy(false)
    setReturnRequestType(ReturnRequestType.REFUND)
    setReturnReason(ReturnReason.DEFECTIVE)
    setReasonDetails('')
    setCustomerNotes('')
    setCustomerEmail('')
    setCustomerPhone('')
    onClose()
  }

  // Calculate return eligibility for each item
  const itemEligibility = useMemo(() => {
    if (!order || !policy) return {}

    const eligibility: Record<string, { eligible: boolean; reason?: string; windowDays?: number }> =
      {}

    order.items.forEach((item) => {
      const productType: ProductReturnType = item.isPrescription
        ? 'prescriptionGlasses'
        : 'framesOnly'
      const result = isItemReturnable(
        policy,
        productType,
        item.productImage,
        order.history?.find((h) => h.status === 'DELIVERED')?.timestamp.toString()
      )

      eligibility[item._id] = {
        ...result,
        windowDays: policy.getReturnWindowDays(productType),
      }
    })

    return eligibility
  }, [order, policy])

  // Calculate estimated refund
  const refundEstimate = useMemo(() => {
    if (!policy || !order) return null

    const selectedOrderItems = order.items.filter((item) => selectedItems.has(item._id))
    const itemsTotal = selectedOrderItems.reduce(
      (sum, item) => sum + item.priceAtOrder * item.quantity,
      0
    )

    if (itemsTotal === 0) return null

    return calculateEstimatedRefund(policy, itemsTotal)
  }, [policy, order, selectedItems])

  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  // Submit return request
  const handleSubmit = async () => {
    if (selectedItems.size === 0) {
      toast.error('Please select at least one item to return')
      return
    }

    if (!order) {
      toast.error('Order information is missing')
      return
    }

    setSubmitting(true)

    try {
      // Prepare line items for return
      const items: ReturnLineItem[] = order.items
        .filter((item) => selectedItems.has(item._id))
        .map((item) => ({
          orderItemId: item._id,
          productId: item.productId,
          variantId: item.variantSku || item.productId,
          productName: item.productName,
          productImage: item.productImage,
          quantity: item.quantity,
          unitPrice: item.priceAtOrder,
          sku: item.variantSku,
          category: undefined,
          isPrescription: item.isPrescription ?? false,
        }))

      // Create the DTO
      const dto: CreateReturnRequestDto = {
        orderId: order._id,
        returnType,
        reason: returnReason,
        reasonDetails: reasonDetails || undefined,
        items,
        customerNotes: customerNotes || undefined,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
      }

      // Call the API
      const result = await returnApi.createReturnRequest(dto)

      // Show success with return number
      toast.success(
        `Return request submitted successfully!\n\nReturn Number: ${result.returnNumber}\n\nWe will process your request within 1-2 business days. You can track the status in your account.`,
        {
          duration: 8000,
          style: {
            whiteSpace: 'pre-line',
          },
        }
      )
      onSuccess?.()
      handleClose()
    } catch (error) {
      console.error('Return request error:', error)
      // Error message is already extracted by returnApi.createReturnRequest
      const message = error instanceof Error ? error.message : 'Failed to submit return request'
      toast.error(message, {
        duration: 6000,
        style: {
          whiteSpace: 'pre-line',
        },
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Get return window text for an item
  const getReturnWindowText = (item: OrderItem): string => {
    if (!policy) return 'Return policy not available'

    const productType: ProductReturnType = item.isPrescription
      ? 'prescriptionGlasses'
      : 'framesOnly'
    const windowDays = policy.getReturnWindowDays(productType)

    // Check if delivered
    const deliveredEntry = order?.history?.find((h) => h.status === 'DELIVERED')
    if (deliveredEntry?.timestamp) {
      const daysSince = getDaysSinceDelivery(deliveredEntry.timestamp)
      const daysRemaining = windowDays - daysSince

      if (daysRemaining <= 0) {
        return `Return window (${windowDays} days) has passed`
      }

      return `Return window: ${daysRemaining} days remaining (${windowDays} days from delivery)`
    }

    return `Returnable within ${windowDays} days from delivery`
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      TransitionProps={{
        onEnter: handleOpen,
      }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            maxHeight: '90vh',
          },
        },
      }}
    >
      <DialogTitle sx={{ px: 4, pt: 4, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Request Return / Exchange
            </Typography>
            {order && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Order #{order.orderNumber}
              </Typography>
            )}
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: 4, py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Policy Summary Bar */}
          {policy && (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: 'info.50',
                borderColor: 'info.200',
                borderRadius: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <InfoIcon color="info" sx={{ mt: 0.5, flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    {policy.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {policy.summary}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setShowFullPolicy(!showFullPolicy)}
                    sx={{ mt: 1, p: 0 }}
                  >
                    {showFullPolicy ? 'Hide' : 'View'} Full Policy
                  </Button>
                </Box>
              </Box>

              {/* Expanded Policy Details */}
              {showFullPolicy && (
                <Box sx={{ mt: 2, pl: 5 }}>
                  <Stack spacing={1.5}>
                    <Divider />
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textTransform: 'uppercase', fontWeight: 600 }}
                      >
                        Effective from {new Date(policy.effectiveFrom).toLocaleDateString('vi-VN')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {policy.bodyPlainText}
                      </Typography>
                    </Box>
                    {policy.config.restockingFeePercent > 0 && (
                      <Alert severity="warning" sx={{ borderRadius: 2 }}>
                        <Typography variant="caption">
                          A restocking fee of {policy.config.restockingFeePercent}% may apply to
                          returns.
                        </Typography>
                      </Alert>
                    )}
                  </Stack>
                </Box>
              )}
            </Paper>
          )}

          {/* Items Selection */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Select Items to Return
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose the items you would like to return. Only eligible items can be selected.
            </Typography>

            <Stack spacing={2}>
              {order?.items.map((item) => {
                const eligibility = itemEligibility[item._id]
                const isSelected = selectedItems.has(item._id)
                const canSelect = eligibility?.eligible ?? false

                return (
                  <Paper
                    key={item._id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      display: 'flex',
                      gap: 2,
                      alignItems: 'center',
                      borderRadius: 3,
                      borderColor: canSelect ? 'grey.300' : 'error.200',
                      bgcolor: canSelect ? 'background.paper' : 'error.50',
                      opacity: !canSelect ? 0.7 : 1,
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleItemSelection(item._id)}
                      disabled={!canSelect}
                      sx={{ p: 0.5 }}
                    />

                    <Avatar
                      src={item.productImage}
                      alt={item.productName}
                      sx={{ width: 56, height: 56, bgcolor: 'grey.100' }}
                      variant="rounded"
                    />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={600} noWrap>
                        {item.productName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Qty: {item.quantity} × {formatPrice(item.priceAtOrder)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        {canSelect ? (
                          <CheckCircleIcon color="success" sx={{ fontSize: 14 }} />
                        ) : (
                          <BlockIcon color="error" sx={{ fontSize: 14 }} />
                        )}
                        <Typography
                          variant="caption"
                          color={canSelect ? 'success.main' : 'error.main'}
                        >
                          {getReturnWindowText(item)}
                        </Typography>
                      </Box>
                      {eligibility?.reason && (
                        <Typography
                          variant="caption"
                          color="error.main"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {eligibility.reason}
                        </Typography>
                      )}
                    </Box>

                    <Typography variant="subtitle2" fontWeight={600}>
                      {formatPrice(item.priceAtOrder * item.quantity)}
                    </Typography>
                  </Paper>
                )
              })}
            </Stack>
          </Box>

          {/* Return Type Selection */}
          {selectedItems.size > 0 && (
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Return Type
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Would you like a refund or an exchange for different items?
              </Typography>
              <ToggleButtonGroup
                value={returnType}
                exclusive
                onChange={(e, value) => value && setReturnRequestType(value)}
                fullWidth
                disabled={submitting}
              >
                <ToggleButton value={ReturnRequestType.REFUND} sx={{ flex: 1, py: 2 }}>
                  <Stack alignItems="center" spacing={1}>
                    <Typography variant="body1" fontWeight={600}>
                      Refund
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Get your money back
                    </Typography>
                  </Stack>
                </ToggleButton>
                <ToggleButton value={ReturnRequestType.EXCHANGE} sx={{ flex: 1, py: 2 }}>
                  <Stack alignItems="center" spacing={1}>
                    <Typography variant="body1" fontWeight={600}>
                      Exchange
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Get different items
                    </Typography>
                  </Stack>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}

          {/* Return Reason Selection */}
          {selectedItems.size > 0 && (
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Reason for Return
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Please select the primary reason for your return.
              </Typography>
              <TextField
                fullWidth
                select
                label="Reason"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value as ReturnReason)}
                disabled={submitting}
              >
                <MenuItem value={ReturnReason.DAMAGED}>Item arrived damaged</MenuItem>
                <MenuItem value={ReturnReason.DEFECTIVE}>Defective product</MenuItem>
                <MenuItem value={ReturnReason.WRONG_ITEM}>Wrong item received</MenuItem>
                <MenuItem value={ReturnReason.NOT_AS_DESCRIBED}>Not as described</MenuItem>
                <MenuItem value={ReturnReason.NO_LONGER_NEEDED}>No longer needed</MenuItem>
                <MenuItem value={ReturnReason.CHANGE_OF_MIND}>Change of mind</MenuItem>
                <MenuItem value={ReturnReason.PRESCRIPTION_CHANGE}>Prescription changed</MenuItem>
                <MenuItem value={ReturnReason.OTHER}>Other</MenuItem>
              </TextField>

              {/* Additional details field */}
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Additional Details (Optional)"
                placeholder="Please provide more details about your return reason..."
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
                disabled={submitting}
                sx={{ mt: 2 }}
              />
            </Box>
          )}

          {/* Contact Information */}
          {selectedItems.size > 0 && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Contact Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                How would you like us to contact you about this return?
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    placeholder="your@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    disabled={submitting}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    type="tel"
                    placeholder="+84 xxx xxx xxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    disabled={submitting}
                  />
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Customer Notes */}
          {selectedItems.size > 0 && (
            <Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Additional Notes (Optional)"
                placeholder="Any additional information you'd like to share about your return..."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                disabled={submitting}
              />
            </Box>
          )}

          {/* Estimated Refund Summary */}
          {refundEstimate && selectedItems.size > 0 && (
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: 'success.50',
                borderColor: 'success.200',
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Estimated Refund Summary
              </Typography>

              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Items Subtotal
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatPrice(refundEstimate.estimatedSubtotal)}
                  </Typography>
                </Box>

                {refundEstimate.restockingFee > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Restocking Fee ({refundEstimate.restockingFeePercent}%)
                    </Typography>
                    <Typography variant="body2" color="error.main" fontWeight={500}>
                      -{formatPrice(refundEstimate.restockingFee)}
                    </Typography>
                  </Box>
                )}

                <Divider />

                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    Estimated Refund
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    {formatPrice(refundEstimate.estimatedRefund)}
                  </Typography>
                </Box>
              </Stack>

              {policy?.config.customerPaysReturnShipping && (
                <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalShippingIcon fontSize="small" />
                    <Typography variant="caption">
                      You pay return shipping for change-of-mind returns.
                    </Typography>
                  </Box>
                </Alert>
              )}
            </Paper>
          )}

          {/* No Items Selected Message */}
          {selectedItems.size === 0 && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="body2">
                Select items above to see estimated refund amount.
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 4, pb: 4, pt: 2 }}>
        <Button onClick={handleClose} disabled={submitting} sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={selectedItems.size === 0 || submitting}
          startIcon={submitting ? <CircularProgress size={16} /> : null}
          sx={{ borderRadius: 2 }}
        >
          {submitting ? 'Submitting...' : 'Submit Return Request'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
