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
  MenuItem,
  Checkbox,
  FormControlLabel,
  Alert,
  Paper,
  Grid,
  IconButton,
} from '@mui/material'
import { X, PackageCheck, AlertTriangle } from 'lucide-react'
import { ReturnRequest, formatReturnNumber, type VerifyReturnedItemDto } from '@/lib/return-api'

const formatVND = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

interface VerifyReturnDialogProps {
  open: boolean
  returnRequest: ReturnRequest
  onClose: () => void
  onSubmit: (dto: VerifyReturnedItemDto) => void
}

export default function VerifyReturnDialog({
  open,
  returnRequest,
  onClose,
  onSubmit,
}: VerifyReturnDialogProps) {
  const [conditionRating, setConditionRating] = useState<'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'UNACCEPTABLE'>('GOOD')
  const [quantityVerified, setQuantityVerified] = useState(returnRequest.items.reduce((sum, item) => sum + item.quantity, 0))
  const [packagingIntact, setPackagingIntact] = useState(true)
  const [allAccessoriesPresent, setAllAccessoriesPresent] = useState(true)
  const [staffNotes, setStaffNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const totalQuantity = returnRequest.items.reduce((sum, item) => sum + item.quantity, 0)
      if (quantityVerified > totalQuantity) {
        throw new Error('Verified quantity cannot exceed ordered quantity')
      }

      await onSubmit({
        verification: {
          conditionRating,
          quantityVerified,
          packagingIntact,
          allAccessoriesPresent,
          staffNotes: staffNotes || undefined,
        },
        notes: undefined,
      })
    } catch (err) {
      // Error is handled by parent
    } finally {
      setSubmitting(false)
    }
  }

  const getConditionColor = (rating: string) => {
    switch (rating) {
      case 'EXCELLENT':
      case 'GOOD':
        return 'success'
      case 'ACCEPTABLE':
        return 'info'
      case 'POOR':
        return 'warning'
      case 'UNACCEPTABLE':
        return 'error'
      default:
        return 'default'
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Verify Returned Item
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatReturnNumber(returnRequest.returnNumber)}
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
          {/* Items Summary */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <PackageCheck size={18} />
              <Typography variant="subtitle2" fontWeight={600}>
                Items to Verify
              </Typography>
            </Box>
            <Stack spacing={1}>
              {returnRequest.items.map((item, idx) => (
                <Box key={idx} display="flex" justifyContent="space-between">
                  <Typography variant="body2">{item.productName}</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    Qty: {item.quantity}
                  </Typography>
                </Box>
              ))}
            </Stack>
            <Divider sx={{ my: 1.5 }} />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" fontWeight={600}>
                Total Quantity
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {returnRequest.items.reduce((sum, item) => sum + item.quantity, 0)}
              </Typography>
            </Box>
          </Paper>

          {/* Condition Rating */}
          <TextField
            fullWidth
            select
            value={conditionRating}
            label="Condition Rating *"
            onChange={(e) => setConditionRating(e.target.value as any)}
            disabled={submitting}
          >
              <MenuItem value="EXCELLENT">
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
                  Excellent - Like new, no flaws
                </Box>
              </MenuItem>
              <MenuItem value="GOOD">
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
                  Good - Minor signs of use
                </Box>
              </MenuItem>
              <MenuItem value="ACCEPTABLE">
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'info.main' }} />
                  Acceptable - Visible wear but functional
                </Box>
              </MenuItem>
              <MenuItem value="POOR">
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main' }} />
                  Poor - Significant wear/damage
                </Box>
              </MenuItem>
              <MenuItem value="UNACCEPTABLE">
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.main' }} />
                  Unacceptable - Beyond use
                </Box>
              </MenuItem>
            </TextField>

          {/* Quantity Verified */}
          <TextField
            fullWidth
            type="number"
            label="Quantity Verified *"
            value={quantityVerified}
            onChange={(e) => setQuantityVerified(Math.max(0, parseInt(e.target.value) || 0))}
            disabled={submitting}
            inputProps={{ min: 0, max: returnRequest.items.reduce((sum, item) => sum + item.quantity, 0) }}
            helperText={`Total ordered: ${returnRequest.items.reduce((sum, item) => sum + item.quantity, 0)}`}
          />

          {/* Packaging and Accessories */}
          <FormControlLabel
            control={
              <Checkbox
                checked={packagingIntact}
                onChange={(e) => setPackagingIntact(e.target.checked)}
                disabled={submitting}
              />
            }
            label="Original packaging is intact"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={allAccessoriesPresent}
                onChange={(e) => setAllAccessoriesPresent(e.target.checked)}
                disabled={submitting}
              />
            }
            label="All accessories are present"
          />

          {/* Staff Notes */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Staff Notes (Optional)"
            placeholder="Describe item condition, any issues found..."
            value={staffNotes}
            onChange={(e) => setStaffNotes(e.target.value)}
            disabled={submitting}
          />

          {/* Warning for poor condition */}
          {(conditionRating === 'POOR' || conditionRating === 'UNACCEPTABLE') && (
            <Alert severity="warning" icon={<AlertTriangle size={18} />}>
              <Typography variant="body2">
                {conditionRating === 'UNACCEPTABLE'
                  ? 'This item is in unacceptable condition. The return may be rejected.'
                  : 'This item is in poor condition. Consider if a partial refund is appropriate.'}
              </Typography>
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
          disabled={submitting || quantityVerified <= 0}
          startIcon={<PackageCheck size={18} />}
        >
          {submitting ? 'Verifying...' : 'Verify Item'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
