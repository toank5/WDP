import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Divider, Stack, Chip, Paper, IconButton, Alert, Grid } from '@mui/material'
import { X, Package, DollarSign, User, Calendar, FileText } from 'lucide-react'
import { ReturnRequest, getReturnStatusLabel, getReturnStatusColor, getReturnReasonLabel, formatReturnNumber } from '@/lib/return-api'
import { formatDistanceToNow } from 'date-fns'

const formatVND = (price?: number): string => {
  if (price === undefined || price === null) return 'N/A'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

interface ReturnDetailsDialogProps {
  open: boolean
  returnRequest: ReturnRequest
  onClose: () => void
}

export default function ReturnDetailsDialog({ open, returnRequest, onClose }: ReturnDetailsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Return Details - {formatReturnNumber(returnRequest.returnNumber)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Order: {returnRequest.orderNumber}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 3 }}>
        <Stack spacing={3}>
          {/* Status */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Current Status
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  <Chip
                    label={getReturnStatusLabel(returnRequest.status)}
                    color={getReturnStatusColor(returnRequest.status)}
                    sx={{ mt: 0.5 }}
                  />
                </Typography>
              </Box>
              {returnRequest.requiresManagerApproval && (
                <Chip label="Requires Manager Approval" color="warning" size="small" />
              )}
            </Box>
          </Paper>

          {/* Customer Info */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <User size={18} />
              <Typography variant="subtitle2" fontWeight={600}>
                Customer Information
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">{returnRequest.customerEmail || 'N/A'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1">{returnRequest.customerPhone || 'N/A'}</Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Return Reason */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <FileText size={18} />
              <Typography variant="subtitle2" fontWeight={600}>
                Return Reason
              </Typography>
            </Box>
            <Typography variant="body1" fontWeight={600}>
              {getReturnReasonLabel(returnRequest.reason)}
            </Typography>
            {returnRequest.reasonDetails && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {returnRequest.reasonDetails}
              </Typography>
            )}
            {returnRequest.customerNotes && (
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Customer Notes:
                </Typography>
                <Typography variant="body2">{returnRequest.customerNotes}</Typography>
              </Box>
            )}
          </Box>

          {/* Items */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Package size={18} />
              <Typography variant="subtitle2" fontWeight={600}>
                Items Being Returned
              </Typography>
            </Box>
            <Stack spacing={1}>
              {returnRequest.items.map((item, idx) => (
                <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box flex={1}>
                      <Typography variant="body1" fontWeight={600}>
                        {item.productName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        SKU: {item.sku || item.variantId} | Qty: {item.quantity}
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={600}>
                      {formatVND(item.quantity * item.unitPrice)}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Box>

          {/* Financial Summary */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <DollarSign size={18} />
              <Typography variant="subtitle2" fontWeight={600}>
                Financial Summary
              </Typography>
            </Box>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Requested Refund
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatVND(returnRequest.requestedRefundAmount)}
                  </Typography>
                </Box>
                {returnRequest.restockingFee !== undefined && returnRequest.restockingFee > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Restocking Fee ({returnRequest.restockingFeePercent}%)
                    </Typography>
                    <Typography variant="body1" color="error.main">
                      -{formatVND(returnRequest.restockingFee)}
                    </Typography>
                  </Box>
                )}
                <Divider />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body1" fontWeight={600}>
                    Approved Refund
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    {returnRequest.approvedRefundAmount !== undefined
                      ? formatVND(returnRequest.approvedRefundAmount)
                      : 'Pending Approval'}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Box>

          {/* Staff Verification */}
          {returnRequest.staffVerification && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={2}>
                Staff Verification
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Received At
                    </Typography>
                    <Typography variant="body1">
                      {returnRequest.staffVerification.receivedAt
                        ? new Date(returnRequest.staffVerification.receivedAt).toLocaleString()
                        : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Condition Rating
                    </Typography>
                    <Chip
                      label={returnRequest.staffVerification.conditionRating || 'N/A'}
                      size="small"
                      color={
                        returnRequest.staffVerification.conditionRating === 'EXCELLENT' ||
                        returnRequest.staffVerification.conditionRating === 'GOOD'
                          ? 'success'
                          : returnRequest.staffVerification.conditionRating === 'ACCEPTABLE'
                          ? 'info'
                          : 'warning'
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Quantity Verified
                    </Typography>
                    <Typography variant="body1">
                      {returnRequest.staffVerification.quantityVerified || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Packaging Intact
                    </Typography>
                    <Typography variant="body1">
                      {returnRequest.staffVerification.packagingIntact ? 'Yes' : 'No'}
                    </Typography>
                  </Grid>
                  {returnRequest.staffVerification.warehouseNotes && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" color="text.secondary">
                        Warehouse Notes
                      </Typography>
                      <Typography variant="body2">{returnRequest.staffVerification.warehouseNotes}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Box>
          )}

          {/* Refund Details */}
          {returnRequest.refundDetails && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={2}>
                Refund Details
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Initiated At
                    </Typography>
                    <Typography variant="body1">
                      {returnRequest.refundDetails.initiatedAt
                        ? new Date(returnRequest.refundDetails.initiatedAt).toLocaleString()
                        : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Completed At
                    </Typography>
                    <Typography variant="body1">
                      {returnRequest.refundDetails.completedAt
                        ? new Date(returnRequest.refundDetails.completedAt).toLocaleString()
                        : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Refund Method
                    </Typography>
                    <Typography variant="body1">
                      {returnRequest.refundDetails.refundMethod || 'N/A'}
                    </Typography>
                  </Grid>
                  {returnRequest.refundDetails.refundAmount && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Refund Amount
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {formatVND(returnRequest.refundDetails.refundAmount)}
                      </Typography>
                    </Grid>
                  )}
                  {returnRequest.refundDetails.refundTransactionId && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Transaction ID
                      </Typography>
                      <Typography variant="body1">
                        {returnRequest.refundDetails.refundTransactionId}
                      </Typography>
                    </Grid>
                  )}
                  {returnRequest.refundDetails.notes && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" color="text.secondary">
                        Notes
                      </Typography>
                      <Typography variant="body2">{returnRequest.refundDetails.notes}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Box>
          )}

          {/* Exchange Details */}
          {returnRequest.exchangeDetails && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={2}>
                Exchange Details
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Processed At
                    </Typography>
                    <Typography variant="body1">
                      {returnRequest.exchangeDetails.processedAt
                        ? new Date(returnRequest.exchangeDetails.processedAt).toLocaleString()
                        : 'N/A'}
                    </Typography>
                  </Grid>
                  {returnRequest.exchangeDetails.exchangeOrderId && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Exchange Order ID
                      </Typography>
                      <Typography variant="body1">
                        {returnRequest.exchangeDetails.exchangeOrderId}
                      </Typography>
                    </Grid>
                  )}
                  {returnRequest.exchangeDetails.notes && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" color="text.secondary">
                        Notes
                      </Typography>
                      <Typography variant="body2">{returnRequest.exchangeDetails.notes}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Box>
          )}

          {/* Timestamps */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Calendar size={18} />
              <Typography variant="subtitle2" fontWeight={600}>
                Timestamps
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body2">
                  {new Date(returnRequest.createdAt).toLocaleString()} ({' '}
                  {formatDistanceToNow(new Date(returnRequest.createdAt), { addSuffix: true })} )
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {new Date(returnRequest.updatedAt).toLocaleString()} ({' '}
                  {formatDistanceToNow(new Date(returnRequest.updatedAt), { addSuffix: true })} )
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Rejection Reason */}
          {returnRequest.rejectionReason && (
            <Alert severity="error">
              <Typography variant="subtitle2" fontWeight={600}>
                Rejection Reason
              </Typography>
              <Typography variant="body2">{returnRequest.rejectionReason}</Typography>
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
