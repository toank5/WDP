import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Visibility as ViewIcon,
  CheckCircle as ReadyIcon,
  Schedule as PendingIcon,
  LocalShipping as ShippedIcon,
  Cancel as CanceledIcon,
  Inventory as StockIcon,
  Assignment as ReserveIcon,
} from '@mui/icons-material'
import { preorderApi, type PreorderDetailResponse, type PreorderLineItem } from '@/lib/preorder-api'
import { PREORDER_STATUS_LABELS, type PreorderStatus } from '@/types/api.types'

// VND Price formatter
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

// Status chip config
const getStatusChip = (status: PreorderStatus) => {
  const config = {
    PENDING_STOCK: { label: PREORDER_STATUS_LABELS.PENDING_STOCK, color: 'warning' as const, icon: <PendingIcon /> },
    PARTIALLY_RESERVED: { label: PREORDER_STATUS_LABELS.PARTIALLY_RESERVED, color: 'info' as const, icon: <ReserveIcon /> },
    READY_TO_FULFILL: { label: PREORDER_STATUS_LABELS.READY_TO_FULFILL, color: 'success' as const, icon: <ReadyIcon /> },
    FULFILLED: { label: PREORDER_STATUS_LABELS.FULFILLED, color: 'default' as const, icon: <ShippedIcon /> },
    CANCELED: { label: PREORDER_STATUS_LABELS.CANCELED, color: 'error' as const, icon: <CanceledIcon /> },
  }
  return config[status] || config.PENDING_STOCK
}

// Status filter options
const STATUS_FILTERS: Array<{ value: PreorderStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING_STOCK', label: 'Pending Stock' },
  { value: 'PARTIALLY_RESERVED', label: 'Partially Reserved' },
  { value: 'READY_TO_FULFILL', label: 'Ready to Fulfill' },
  { value: 'FULFILLED', label: 'Fulfilled' },
  { value: 'CANCELED', label: 'Canceled' },
]

export default function PreorderDetailPage() {
  const { sku } = useParams<{ sku: string }>()
  const navigate = useNavigate()

  const [detail, setDetail] = useState<PreorderDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<PreorderStatus | 'ALL'>('ALL')
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false)
  const [allocateQuantity, setAllocateQuantity] = useState('')
  const [allocateNotes, setAllocateNotes] = useState('')
  const [allocating, setAllocating] = useState(false)

  useEffect(() => {
    if (sku) {
      loadDetail()
    }
  }, [sku])

  const loadDetail = async () => {
    if (!sku) return

    try {
      setLoading(true)
      setError(null)
      const data = await preorderApi.getDetailBySku(sku)
      setDetail(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load pre-order details'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleAllocate = async () => {
    if (!detail || !sku) return

    const quantity = parseInt(allocateQuantity)
    if (isNaN(quantity) || quantity <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    try {
      setAllocating(true)
      setError(null)
      const result = await preorderApi.allocateStock(sku, quantity, allocateNotes)

      // Show success and reload
      alert(`Allocated ${result.totalAllocated} units to ${result.ordersUpdated} orders`)
      setAllocateDialogOpen(false)
      setAllocateQuantity('')
      setAllocateNotes('')
      loadDetail()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to allocate stock'
      setError(message)
    } finally {
      setAllocating(false)
    }
  }

  const filteredItems = detail?.preorderItems.filter((item) =>
    statusFilter === 'ALL' || item.preorderStatus === statusFilter
  ) || []

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={400} />
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  if (!detail) {
    return null
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/manager/preorders')}>
          <BackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Pre-order Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            SKU: {detail.sku}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Info Cards */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Product Info Card */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Product Information
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" fontWeight={600}>
                {detail.productName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Size: {detail.variantInfo.size || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Color: {detail.variantInfo.color || 'N/A'}
              </Typography>
              {detail.preorderConfig.isEnabled && (
                <Chip
                  label="Pre-order Enabled"
                  color="info"
                  size="small"
                  sx={{ mt: 2 }}
                />
              )}
            </Box>
          </Paper>

          {/* Pre-order Config Card */}
          {detail.preorderConfig.isEnabled && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Pre-order Configuration
              </Typography>
              <Box sx={{ mt: 2 }}>
                {detail.preorderConfig.expectedShipStart && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Expected Ship Start:</strong>{' '}
                    {new Date(detail.preorderConfig.expectedShipStart).toLocaleDateString()}
                  </Typography>
                )}
                {detail.preorderConfig.expectedShipEnd && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Expected Ship End:</strong>{' '}
                    {new Date(detail.preorderConfig.expectedShipEnd).toLocaleDateString()}
                  </Typography>
                )}
                {detail.preorderConfig.limit && (
                  <Typography variant="body2">
                    <strong>Pre-order Limit:</strong> {detail.preorderConfig.limit} units
                  </Typography>
                )}
              </Box>
            </Paper>
          )}

          {/* Inventory Status Card */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Inventory Status
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2">On Hand:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {detail.inventory.onHand}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2">Incoming:</Typography>
                <Typography variant="body2" fontWeight={600} color="success.main">
                  +{detail.inventory.incoming}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2">Pre-ordered:</Typography>
                <Typography variant="body2" fontWeight={600} color="warning.main">
                  {detail.inventory.preordered}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Remaining to Fulfill:</Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color={detail.inventory.remainingToFulfill > 0 ? 'warning.main' : 'success.main'}
                >
                  {detail.inventory.remainingToFulfill}
                </Typography>
              </Box>
            </Box>

            {/* Allocate Button */}
            {detail.inventory.incoming > 0 && (
              <Button
                fullWidth
                variant="contained"
                startIcon={<StockIcon />}
                onClick={() => setAllocateDialogOpen(true)}
                sx={{ mt: 3 }}
              >
                Allocate Incoming Stock
              </Button>
            )}
          </Paper>

          {/* Upcoming Deliveries */}
          {detail.upcomingDeliveries.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Upcoming Deliveries
              </Typography>
              <Box sx={{ mt: 2 }}>
                {detail.upcomingDeliveries.map((delivery, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: 1,
                      borderBottom: index < detail.upcomingDeliveries.length - 1 ? 1 : 0,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body2">
                      {new Date(delivery.expectedDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      +{delivery.quantity}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Right Column - Pre-order Items Table */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper>
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={600}>
                  Pre-order Items ({filteredItems.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {STATUS_FILTERS.map((filter) => (
                    <Chip
                      key={filter.value}
                      label={filter.label}
                      onClick={() => setStatusFilter(filter.value)}
                      color={statusFilter === filter.value ? 'primary' : 'default'}
                      size="small"
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Reserved</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Expected Ship Date</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No pre-order items found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => {
                      const statusChip = getStatusChip(item.preorderStatus)
                      return (
                        <TableRow key={`${item.orderId}-${item.variantSku}`} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {item.orderNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">{item.customerName}</Typography>
                              {item.customerEmail && (
                                <Typography variant="caption" color="text.secondary">
                                  {item.customerEmail}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">{item.quantity}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="info.main">
                              {item.reservedQuantity || 0}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={statusChip.label}
                              color={statusChip.color}
                              size="small"
                              icon={statusChip.icon}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {item.expectedShipDate
                                ? new Date(item.expectedShipDate).toLocaleDateString()
                                : 'TBD'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>
                              {formatPrice(item.priceAtOrder * item.quantity)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/orders/${item.orderId}`)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Allocate Stock Dialog */}
      <Dialog open={allocateDialogOpen} onClose={() => setAllocateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Allocate Stock to Pre-orders</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will allocate the received quantity to the oldest pending pre-orders for this SKU (FIFO).
          </Typography>
          <TextField
            fullWidth
            label="Received Quantity"
            type="number"
            value={allocateQuantity}
            onChange={(e) => setAllocateQuantity(e.target.value)}
            inputProps={{ min: 1 }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Notes (optional)"
            multiline
            rows={2}
            value={allocateNotes}
            onChange={(e) => setAllocateNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAllocateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAllocate}
            variant="contained"
            disabled={allocating || !allocateQuantity}
          >
            {allocating ? 'Allocating...' : 'Allocate Stock'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
