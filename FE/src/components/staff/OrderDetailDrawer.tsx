import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Description as PrescriptionIcon,
  LocalShipping as ShippedIcon,
  HourglassTop as WaitingIcon,
  WarningAmber as WarningIcon,
  Inventory2 as InventoryIcon,
} from '@mui/icons-material'
import { orderApi, Order, OrderStatus } from '@/lib/order-api'
import { formatImageUrl } from '@/lib/product-api'
import { toast } from 'sonner'

interface OrderDetailDrawerProps {
  open: boolean
  order: Order | null
  isSalesMode?: boolean
  onClose: () => void
  onOrderUpdated: (nextOrder: Order) => void
}

const PREORDER_WAITING_STATUSES = new Set(['PENDING_STOCK', 'PARTIALLY_RESERVED'])

const isPreorderReadyForApproval = (order: Order): boolean => {
  const preorderItems = order.items.filter((item) => item.isPreorder)
  if (preorderItems.length === 0) {
    return true
  }

  return preorderItems.every(
    (item) => item.preorderStatus === 'READY_TO_FULFILL',
  )
}

const formatPrice = (price: number): string =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)

const formatDateTime = (dateInput?: string | Date): string => {
  if (!dateInput) {
    return '--'
  }

  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const FULFILLMENT_COLOR: Record<string, 'default' | 'success' | 'info' | 'warning' | 'error'> = {
  PAID: 'info',
  PROCESSING: 'info',
  CONFIRMED: 'info',
  SHIPPED: 'warning',
  DELIVERED: 'success',
  RETURNED: 'error',
  CANCELLED: 'error',
}

export default function OrderDetailDrawer({
  open,
  order,
  isSalesMode = false,
  onClose,
  onOrderUpdated,
}: OrderDetailDrawerProps) {
  const navigate = useNavigate()
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false)
  const [confirmReceivedOpen, setConfirmReceivedOpen] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [prescriptionOpen, setPrescriptionOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const hasPrescription = order?.orderType === 'PRESCRIPTION'

  const preorderWaitingStock = useMemo(() => {
    if (!order) {
      return false
    }

    return !isPreorderReadyForApproval(order)
  }, [order])

  const preorderProgress = useMemo(() => {
    if (!order) {
      return [] as Array<{
        id: string
        sku: string
        reserved: number
        required: number
        status: string
        isMissing: boolean
      }>
    }

    // Get all items if order type is PREORDER, or filter by isPreorder flag
    const relevantItems = order.orderType === 'PREORDER' 
      ? order.items 
      : order.items.filter((item) => item.isPreorder)

    return relevantItems.map((item) => {
        const reserved = item.reservedQuantity || 0
        const required = item.quantity
        const status = item.preorderStatus || 'PENDING_STOCK'
        const isFullyReserved = reserved >= required
        const isStatusReady = status === 'READY_TO_FULFILL'
        
        // Debug log
        console.log('Preorder item check:', {
          sku: item.variantSku,
          reserved,
          required,
          status,
          statusType: typeof status,
          isFullyReserved,
          isStatusReady,
          isMissing: !isFullyReserved && !isStatusReady
        })
        
        return {
          id: item._id,
          sku: item.variantSku || '--',
          reserved,
          required,
          status,
          isMissing: !isFullyReserved && !isStatusReady,
        }
      })
  }, [order])

  const missingItemsCount = useMemo(
    () => preorderProgress.filter((item) => item.isMissing).length,
    [preorderProgress],
  )

  const canAttemptApprove = Boolean(
    isSalesMode &&
      order &&
      [OrderStatus.PAID, OrderStatus.CONFIRMED].includes(order.orderStatus),
  )

  const canApproveForOperations = Boolean(canAttemptApprove && !preorderWaitingStock)

  const isOperationsPreorderAllocation = Boolean(
    !isSalesMode &&
      order &&
      [OrderStatus.PAID, OrderStatus.CONFIRMED].includes(order.orderStatus) &&
      order.items.some((item) => item.isPreorder),
  )

  const canMarkShipped = Boolean(
    !isSalesMode &&
    order &&
      [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.CONFIRMED].includes(order.orderStatus) &&
      !preorderWaitingStock,
  )

  const canConfirmReceived = Boolean(!isSalesMode && order && order.orderStatus === OrderStatus.SHIPPED)

  const timeline = useMemo(() => {
    if (!order?.history) {
      return []
    }

    return [...order.history].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )
  }, [order])

  const handleMarkShipped = async () => {
    if (!order) {
      return
    }

    try {
      setSubmitting(true)
      const updated = await orderApi.updateOrderStatus(order._id, OrderStatus.SHIPPED, 'Order marked as shipped')

      onOrderUpdated(updated)
      setShippingDialogOpen(false)
      toast.success(`Order ${updated.orderNumber} marked as shipped`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark order as shipped'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmReceived = async () => {
    if (!order) {
      return
    }

    try {
      setSubmitting(true)
      const updated = await orderApi.confirmReceipt(order._id)
      onOrderUpdated(updated)
      setConfirmReceivedOpen(false)
      toast.success(`Order ${updated.orderNumber} marked as delivered`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to confirm receipt'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleApproveForOperations = async () => {
    if (!order) {
      return
    }

    try {
      setSubmitting(true)
      const updated = await orderApi.approveOrderForOperations(order._id, {
        note: 'Approved by Sales and sent to Operations queue',
      })

      onOrderUpdated(updated)
      setApproveDialogOpen(false)
      toast.success(`Order ${updated.orderNumber} approved for operations`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve order'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', md: 560 } } }}>
        {!order ? null : (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {order.orderNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Order placed: {formatDateTime(order.createdAt)}
                  </Typography>
                </Box>
                <IconButton onClick={onClose}>
                  <CloseIcon />
                </IconButton>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                <Chip
                  size="small"
                  label={order.orderStatus}
                  color={FULFILLMENT_COLOR[order.orderStatus] ?? 'default'}
                />
                <Chip
                  size="small"
                  label={order.payment?.paidAt ? 'PAID' : 'PENDING'}
                  color={order.payment?.paidAt ? 'success' : 'warning'}
                  variant="outlined"
                />
                <Chip size="small" variant="outlined" label={order.orderType} />
              </Stack>
            </Box>

            <Box sx={{ px: 3, py: 2, flex: 1, overflowY: 'auto' }}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Customer Info
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {order.shippingAddress.fullName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.shippingAddress.phone}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.shippingAddress.address}, {order.shippingAddress.ward ? `${order.shippingAddress.ward}, ` : ''}
                    {order.shippingAddress.district}, {order.shippingAddress.city}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Product List
                    </Typography>
                    {hasPrescription ? (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PrescriptionIcon fontSize="small" />}
                        onClick={() => setPrescriptionOpen(true)}
                      >
                        View Prescription
                      </Button>
                    ) : null}
                  </Stack>

                  <Stack spacing={1.5}>
                    {order.items.map((item) => (
                      <Box
                        key={item._id}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '56px 1fr auto',
                          gap: 1.25,
                          p: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                        }}
                      >
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 1,
                            overflow: 'hidden',
                            bgcolor: 'grey.100',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {item.productImage ? (
                            <img
                              src={formatImageUrl(item.productImage)}
                              alt={item.productName || 'Product image'}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              N/A
                            </Typography>
                          )}
                        </Box>

                        <Box>
                          <Stack direction="row" alignItems="center" spacing={0.75}>
                            <Typography variant="body2" fontWeight={600}>
                              {item.productName || 'Product'}
                            </Typography>
                            {hasPrescription ? (
                              <Tooltip title="Prescription item">
                                <PrescriptionIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                              </Tooltip>
                            ) : null}
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            SKU: {item.variantSku || '--'}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            Qty: {item.quantity}
                            {item.variantDetails?.size ? ` • Size: ${item.variantDetails.size}` : ''}
                            {item.variantDetails?.color ? ` • Color: ${item.variantDetails.color}` : ''}
                          </Typography>

                          {item.isPreorder && item.preorderStatus ? (
                            <Chip
                              size="small"
                              color={PREORDER_WAITING_STATUSES.has(item.preorderStatus) ? 'warning' : 'success'}
                              sx={{ mt: 0.5 }}
                              label={`Pre-order: ${item.preorderStatus}`}
                            />
                          ) : null}
                        </Box>

                        <Typography variant="body2" fontWeight={600}>
                          {formatPrice(item.priceAtOrder * item.quantity)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                    Timeline
                  </Typography>
                  <List dense sx={{ py: 0 }}>
                    {timeline.map((entry, index) => (
                      <ListItem
                        key={`${entry.status}-${index}`}
                        sx={{
                          px: 0,
                          alignItems: 'flex-start',
                        }}
                      >
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip size="small" label={entry.status} />
                              <Typography variant="caption" color="text.secondary">
                                {formatDateTime(entry.timestamp)}
                              </Typography>
                            </Stack>
                          }
                          secondary={entry.note || ''}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Stack>
            </Box>

            <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              {/* Debug info - remove after testing */}
              {!isSalesMode && order && (order.orderType === 'PREORDER' || order.items.some(i => i.isPreorder)) ? (
                <Alert severity="info" sx={{ mb: 1.5, fontSize: '0.75rem' }}>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    DEBUG: isSalesMode={String(isSalesMode)} | preorderProgress.length={preorderProgress.length} | missingCount={missingItemsCount}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    Items: {preorderProgress.map(p => 
                      `${p.sku}[${p.reserved}/${p.required}][${p.status}][missing:${p.isMissing}]`
                    ).join(', ')}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                    Check browser console for detailed logs
                  </Typography>
                </Alert>
              ) : null}

              {preorderWaitingStock && isSalesMode ? (
                <Alert severity="warning" sx={{ mb: 1.5 }}>
                  Waiting for stock allocation. Sales approval is blocked until all preorder items are READY_TO_FULFILL.
                </Alert>
              ) : null}

              {!isSalesMode && preorderProgress.length > 0 && missingItemsCount > 0 ? (
                <Alert severity="warning" sx={{ mb: 1.5 }}>
                  <Typography variant="body2" fontWeight={600}>
                    ⚠️ {missingItemsCount} item{missingItemsCount > 1 ? 's' : ''} missing allocation
                  </Typography>
                  <Typography variant="caption" color="inherit" sx={{ display: 'block', mt: 0.5 }}>
                    Click "Go to Inventories" to allocate stock and mark items as READY_TO_FULFILL
                  </Typography>
                </Alert>
              ) : null}

              {preorderProgress.length > 0 ? (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Pre-order allocation progress
                  </Typography>
                  <Stack spacing={0.75}>
                    {preorderProgress.map((line) => (
                      <Stack
                        key={line.id}
                        direction="row"
                        spacing={0.75}
                        alignItems="center"
                        flexWrap="wrap"
                        useFlexGap
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          backgroundColor: line.isMissing && !isSalesMode ? 'rgba(244, 67, 54, 0.08)' : 'transparent',
                        }}
                      >
                        <Chip size="small" label={line.sku} variant="outlined" />
                        <Chip
                          size="small"
                          icon={line.reserved < line.required ? <WaitingIcon /> : undefined}
                          label={`Reserved ${line.reserved}/${line.required}`}
                          color={line.reserved < line.required ? 'warning' : 'success'}
                          variant="outlined"
                        />
                        <Chip size="small" label={line.status} />
                        {line.isMissing && !isSalesMode ? (
                          <Chip
                            size="small"
                            label="MISSING"
                            color="error"
                            variant="filled"
                            sx={{ fontWeight: 600 }}
                          />
                        ) : null}
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              ) : null}

              <Stack direction="row" spacing={1.25} justifyContent="flex-end">
                {isOperationsPreorderAllocation ? (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<InventoryIcon />}
                    onClick={() => navigate('/dashboard/inventory')}
                  >
                    Go to Inventories
                  </Button>
                ) : null}

                {canMarkShipped ? (
                  <Button
                    variant="contained"
                    color="info"
                    startIcon={<ShippedIcon />}
                    onClick={() => setShippingDialogOpen(true)}
                    disabled={submitting}
                  >
                    Mark as Shipped
                  </Button>
                ) : null}

                {canAttemptApprove ? (
                  <Button
                    variant="contained"
                    color={canApproveForOperations ? 'primary' : 'warning'}
                    startIcon={<CheckCircleIcon />}
                    onClick={() => setApproveDialogOpen(true)}
                    disabled={submitting || !canApproveForOperations}
                  >
                    {canApproveForOperations ? 'Approve for Operations' : 'Awaiting Stock Allocation'}
                  </Button>
                ) : null}

                {canConfirmReceived ? (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => setConfirmReceivedOpen(true)}
                    disabled={submitting}
                  >
                    Confirm Received
                  </Button>
                ) : null}
              </Stack>
            </Box>
          </Box>
        )}
      </Drawer>

      <Dialog open={shippingDialogOpen} onClose={() => setShippingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mark Order as Shipped</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to mark order <strong>{order?.orderNumber}</strong> as shipped?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShippingDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleMarkShipped} variant="contained" color="info" disabled={submitting}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Order for Operations</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Approve order <strong>{order?.orderNumber}</strong> and move it to operations queue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleApproveForOperations} variant="contained" disabled={submitting}>
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmReceivedOpen} onClose={() => setConfirmReceivedOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Confirm Received
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            This action will deduct inventory stock permanently. Proceed?
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmReceivedOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirmReceived} color="warning" variant="contained" disabled={submitting}>
            Proceed
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={prescriptionOpen} onClose={() => setPrescriptionOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Prescription Details</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
            {order?.notes ||
              'Prescription metadata is not available in this order payload. Connect this button to the prescription document endpoint to render PDF/text details.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrescriptionOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
