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
  Alert,
  Paper,
  IconButton,
  Chip,
} from '@mui/material'
import { X, DollarSign, RotateCcw, ShoppingCart, Plus } from 'lucide-react'
import { ReturnRequest, ReturnRequestType, formatReturnNumber, type ProcessRefundExchangeDto } from '@/lib/return-api'
import CreateExchangeOrderDialog from './CreateExchangeOrderDialog'

const formatVND = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

interface ProcessRefundDialogProps {
  open: boolean
  returnRequest: ReturnRequest
  onClose: () => void
  onSubmit: (dto: ProcessRefundExchangeDto) => void
}

const getReturnRequestTypeLabel = (type: ReturnRequestType): string => {
  return type === ReturnRequestType.REFUND ? 'Refund' : 'Exchange'
}

const getReturnRequestTypeColor = (type: ReturnRequestType): 'success' | 'info' => {
  return type === ReturnRequestType.REFUND ? 'success' : 'info'
}

export default function ProcessRefundDialog({
  open,
  returnRequest,
  onClose,
  onSubmit,
}: ProcessRefundDialogProps) {
  const actionType = returnRequest.returnType.toLowerCase() as 'refund' | 'exchange'
  const [refundMethod, setRefundMethod] = useState<'VNPAY' | 'BANK_TRANSFER' | 'STORE_CREDIT'>('VNPAY')
  const [refundTransactionId, setRefundTransactionId] = useState('')
  const [exchangeOrderId, setExchangeOrderId] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [createExchangeDialogOpen, setCreateExchangeDialogOpen] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const refundAmount = returnRequest.approvedRefundAmount || returnRequest.requestedRefundAmount

      await onSubmit({
        details: {
          refundAmount: actionType === 'refund' ? refundAmount : undefined,
          refundMethod: actionType === 'refund' ? refundMethod : undefined,
          refundTransactionId: actionType === 'refund' && refundTransactionId ? refundTransactionId : undefined,
          exchangeOrderId: actionType === 'exchange' && exchangeOrderId ? exchangeOrderId : undefined,
          notes: notes || undefined,
        },
      })
    } catch (err) {
      // Error is handled by parent
    } finally {
      setSubmitting(false)
    }
  }

  const handleExchangeOrderCreated = (orderId: string) => {
    setExchangeOrderId(orderId)
    setCreateExchangeDialogOpen(false)
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Process {actionType === 'refund' ? 'Refund' : 'Exchange'}
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
            {/* Staff Verification Summary */}
            {returnRequest.staffVerification && (
              <Alert severity="success">
                <Typography variant="body2">
                  Item verified as <strong>{returnRequest.staffVerification.conditionRating}</strong> condition.
                  Quantity verified: <strong>{returnRequest.staffVerification.quantityVerified}</strong>
                </Typography>
              </Alert>
            )}

            {/* Return Type Badge - Read Only */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                  Customer Requested
                </Typography>
                <Chip
                  icon={actionType === 'refund' ? <DollarSign size={16} /> : <RotateCcw size={16} />}
                  label={getReturnRequestTypeLabel(returnRequest.returnType)}
                  color={getReturnRequestTypeColor(returnRequest.returnType)}
                  size="small"
                />
              </Box>
            </Paper>

            {/* Refund Amount */}
            {actionType === 'refund' && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Refund Amount
                </Typography>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {formatVND(returnRequest.approvedRefundAmount || returnRequest.requestedRefundAmount)}
                </Typography>
                {returnRequest.restockingFee && returnRequest.restockingFee > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Includes restocking fee: {formatVND(returnRequest.restockingFee)}
                  </Typography>
                )}
              </Paper>
            )}

            {/* Refund Method */}
            {actionType === 'refund' && (
              <TextField
                fullWidth
                select
                value={refundMethod}
                label="Refund Method"
                onChange={(e) => setRefundMethod(e.target.value as any)}
                disabled={submitting}
              >
                <MenuItem value="VNPAY">VNPAY (Original Payment)</MenuItem>
                <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                <MenuItem value="STORE_CREDIT">Store Credit</MenuItem>
              </TextField>
            )}

            {/* Transaction ID */}
            {actionType === 'refund' && refundMethod === 'VNPAY' && (
              <TextField
                fullWidth
                label="VNPAY Transaction ID"
                placeholder="Enter VNPAY refund transaction ID"
                value={refundTransactionId}
                onChange={(e) => setRefundTransactionId(e.target.value)}
                disabled={submitting}
              />
            )}

            {/* Exchange Order Section */}
            {actionType === 'exchange' && (
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Exchange Order ID"
                  placeholder="Enter the exchange order ID"
                  value={exchangeOrderId}
                  onChange={(e) => setExchangeOrderId(e.target.value)}
                  disabled={submitting}
                  helperText={exchangeOrderId ? 'Exchange order linked' : 'Create or enter an exchange order ID'}
                  InputProps={{
                    endAdornment: !exchangeOrderId ? (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setCreateExchangeDialogOpen(true)}
                        disabled={submitting}
                        startIcon={<Plus size={16} />}
                      >
                        Create New
                      </Button>
                    ) : undefined,
                  }}
                />

                {!exchangeOrderId && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      Click <strong>Create New</strong> to generate an exchange order for the replacement products,
                      or manually enter an existing order ID if you've already created one.
                    </Typography>
                  </Alert>
                )}
              </Stack>
            )}

            {/* Notes */}
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes (Optional)"
              placeholder="Add any notes about this refund/exchange..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
            />

            {/* Info Alert */}
            <Alert severity="info">
              <Typography variant="body2">
                {actionType === 'refund'
                  ? 'Processing this refund will mark the return as APPROVED and initiate the refund through the selected method.'
                  : 'Processing this exchange will mark the return as APPROVED and link it to the new exchange order.'}
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || (actionType === 'exchange' && !exchangeOrderId)}
            startIcon={actionType === 'refund' ? <DollarSign size={18} /> : <RotateCcw size={18} />}
          >
            {submitting ? 'Processing...' : actionType === 'refund' ? 'Process Refund' : 'Process Exchange'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Exchange Order Dialog */}
      <CreateExchangeOrderDialog
        open={createExchangeDialogOpen}
        returnRequest={returnRequest}
        onClose={() => setCreateExchangeDialogOpen(false)}
        onSuccess={handleExchangeOrderCreated}
      />
    </>
  )
}
