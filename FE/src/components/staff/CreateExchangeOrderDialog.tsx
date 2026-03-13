import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Stack,
  TextField,
  IconButton,
  Alert,
  Paper,
  Chip,
  CircularProgress,
} from '@mui/material'
import { X, ShoppingCart, Package, CheckCircle } from 'lucide-react'
import { ReturnRequest } from '@/lib/return-api'
import { staffReturnApi } from '@/lib/return-api'
import { toast } from 'sonner'

const formatVND = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

interface CreateExchangeOrderDialogProps {
  open: boolean
  returnRequest: ReturnRequest
  onClose: () => void
  onSuccess: (exchangeOrderId: string) => void
}

export default function CreateExchangeOrderDialog({
  open,
  returnRequest,
  onClose,
  onSuccess,
}: CreateExchangeOrderDialogProps) {
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate exchange order value (same as original order value)
  const exchangeValue = returnRequest.approvedRefundAmount || returnRequest.requestedRefundAmount

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    try {
      // Create exchange order using the real backend endpoint
      const result = await staffReturnApi.createExchangeOrder({
        returnId: returnRequest.id,
        items: returnRequest.items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          productImage: item.productImage,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          sku: item.sku,
        })),
        notes: notes || undefined,
      })

      toast.success(`Exchange order ${result.orderNumber} created successfully`)
      onSuccess(result.orderNumber)
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create exchange order'
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Create Exchange Order
            </Typography>
            <Typography variant="body2" color="text.secondary">
              For {returnRequest.returnNumber}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" disabled={submitting}>
            <X size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 3 }}>
        <Stack spacing={3}>
          {/* Info Alert */}
          <Alert severity="info">
            <Typography variant="body2">
              This will create a new exchange order for the replacement products.
              The customer will receive the new items instead of a refund.
            </Typography>
          </Alert>

          {/* Original Order Info */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <ShoppingCart size={18} />
              <Typography variant="subtitle2" fontWeight={600}>
                Original Order
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Order Number
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {returnRequest.orderNumber}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Exchange Value
              </Typography>
              <Typography variant="body2" fontWeight={700} color="success.main">
                {formatVND(exchangeValue)}
              </Typography>
            </Box>
          </Paper>

          {/* Items Being Exchanged */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Package size={18} />
              <Typography variant="subtitle2" fontWeight={600}>
                Items to Exchange
              </Typography>
            </Box>
            <Stack spacing={1.5}>
              {returnRequest.items.map((item, idx) => (
                <Box
                  key={idx}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ py: 1, borderBottom: idx < returnRequest.items.length - 1 ? 1 : 0, borderColor: 'divider' }}
                >
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={500}>
                      {item.productName}
                    </Typography>
                    {item.sku && (
                      <Typography variant="caption" color="text.secondary">
                        SKU: {item.sku}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={`Qty: ${item.quantity}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              ))}
            </Stack>
          </Paper>

          {/* Notes */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Exchange Notes (Optional)"
            placeholder="Add any special instructions for the exchange order..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={submitting}
            helperText="These notes will be attached to the exchange order"
          />

          {/* Error Alert */}
          {error && (
            <Alert severity="error">
              <Typography variant="body2">{error}</Typography>
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} /> : <CheckCircle size={18} />}
        >
          {submitting ? 'Creating...' : 'Create Exchange Order'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
