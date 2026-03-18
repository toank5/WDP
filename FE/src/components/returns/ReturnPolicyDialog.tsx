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
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import type { ReturnPolicyWithHelpers } from '@/hooks/useReturnPolicy'

interface ReturnPolicyDialogProps {
  open: boolean
  onClose: () => void
  policy: ReturnPolicyWithHelpers | null
}

/**
 * Dialog component to display the full return policy
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false)
 * const { data: returnPolicy } = useReturnPolicy()
 *
 * <Button onClick={() => setOpen(true)}>View Full Policy</Button>
 * <ReturnPolicyDialog open={open} onClose={() => setOpen(false)} policy={returnPolicy} />
 * ```
 */
export function ReturnPolicyDialog({ open, onClose, policy }: ReturnPolicyDialogProps) {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          maxHeight: '85vh',
        },
      }}
    >
      <DialogTitle sx={{ px: 4, pt: 4, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" fontWeight={700}>
            {policy?.title || 'Return Policy'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: 4, py: 3 }}>
        {policy ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
              <Typography variant="body2" color="text.secondary">
                {policy.summary}
              </Typography>
            </Box>

            {/* Return Windows */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Return Windows
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Frames only:</strong> {policy.config.returnWindowDays.framesOnly} days
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Prescription glasses:</strong> {policy.config.returnWindowDays.prescriptionGlasses} days
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  <strong>Contact lenses:</strong> {policy.config.returnWindowDays.contactLenses} days
                </Typography>
              </Box>
            </Box>

            {/* Restocking Fee */}
            {policy.config.restockingFeePercent > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Restocking Fee
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  A restocking fee of {policy.config.restockingFeePercent}% may apply to returns.
                </Typography>
              </Box>
            )}

            {/* Return Shipping */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Return Shipping
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {policy.config.customerPaysReturnShipping
                  ? 'Customer pays return shipping for change-of-mind returns. If the return is due to our error or a manufacturing defect, we cover return shipping.'
                  : 'We cover return shipping costs for all eligible returns.'}
              </Typography>
            </Box>

            {/* Non-Returnable Categories */}
            {policy.config.nonReturnableCategories.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Non-Returnable Items
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  The following categories are not eligible for return:{' '}
                  {policy.config.nonReturnableCategories.join(', ')}
                </Typography>
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
                }}
              >
                {policy.bodyPlainText}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Return policy information is currently unavailable.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 4, pb: 4, pt: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
