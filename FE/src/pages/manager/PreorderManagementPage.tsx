import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  LinearProgress,
  Alert,
  Skeleton,
} from '@mui/material'
import {
  Visibility as ViewIcon,
  ShoppingCart as PreorderIcon,
  Inventory as StockIcon,
  AttachMoney as ValueIcon,
  Warning as WarningIcon,
  CheckCircle as OkIcon,
  Error as OversoldIcon,
} from '@mui/icons-material'
import { preorderApi, type PreorderOverview, type PreorderInventoryView } from '@/lib/preorder-api'

// VND Price formatter
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

// Status configuration
const STATUS_CONFIG = {
  OK: {
    label: 'On Track',
    color: 'success' as const,
    bgColor: 'success.light',
    icon: <OkIcon />,
  },
  TIGHT: {
    label: 'Tight',
    color: 'warning' as const,
    bgColor: 'warning.light',
    icon: <WarningIcon />,
  },
  OVERSOLD: {
    label: 'Oversold',
    color: 'error' as const,
    bgColor: 'error.light',
    icon: <OversoldIcon />,
  },
}

export default function PreorderManagementPage() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState<PreorderOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOverview()
  }, [])

  const loadOverview = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await preorderApi.getOverview()
      setOverview(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load pre-order overview'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status: PreorderInventoryView['preorderStatus']) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.OK
  }

  const calculateProgress = (view: PreorderInventoryView) => {
    const totalAvailable = view.onHand + view.incoming
    const percentage = totalAvailable > 0 ? (totalAvailable / view.preordered) * 100 : 0
    return Math.min(percentage, 100)
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Pre-order Management
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
          <Grid size={{ xs: 12 }}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
        </Grid>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!overview) {
    return null
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          Pre-order Management
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Monitor and manage pre-orders across all SKUs
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'info.light',
                    color: 'info.dark',
                  }}
                >
                  <PreorderIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    OPEN PRE-ORDERS
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {overview.totalOpenPreorders}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'warning.light',
                    color: 'warning.dark',
                  }}
                >
                  <StockIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    UNITS ON PRE-ORDER
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {overview.totalUnitsOnPreorder}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'success.light',
                    color: 'success.dark',
                  }}
                >
                  <ValueIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    PRE-ORDER VALUE
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {formatPrice(overview.totalPreorderValue)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: overview.preorderInventoryViews.some((v) => v.preorderStatus === 'OVERSOLD')
                      ? 'error.light'
                      : 'success.light',
                    color: overview.preorderInventoryViews.some((v) => v.preorderStatus === 'OVERSOLD')
                      ? 'error.dark'
                      : 'success.dark',
                  }}
                >
                  {overview.preorderInventoryViews.some((v) => v.preorderStatus === 'OVERSOLD') ? (
                    <WarningIcon sx={{ fontSize: 32 }} />
                  ) : (
                    <OkIcon sx={{ fontSize: 32 }} />
                  )}
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    STATUS
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {overview.preorderInventoryViews.some((v) => v.preorderStatus === 'OVERSOLD')
                      ? 'Attention Needed'
                      : 'All Good'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Per-SKU Summary Table */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={600}>
            Pre-order Status by SKU
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>SKU</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Variant</TableCell>
                <TableCell align="right">Pre-ordered</TableCell>
                <TableCell align="right">On Hand</TableCell>
                <TableCell align="right">Incoming</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {overview.preorderInventoryViews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No active pre-orders</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                overview.preorderInventoryViews.map((view) => {
                  const statusConfig = getStatusConfig(view.preorderStatus)
                  const progress = calculateProgress(view)

                  return (
                    <TableRow key={view.sku} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {view.sku}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{view.productName}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {view.variantSize && `${view.variantSize} / `}
                          {view.variantColor}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {view.preordered}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{view.onHand}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="success.main">
                          +{view.incoming}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={statusConfig.label}
                            color={statusConfig.color}
                            size="small"
                            icon={statusConfig.icon}
                          />
                        </Box>
                        <Box sx={{ width: 80, mt: 0.5 }}>
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            color={statusConfig.color}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/manager/preorders/${view.sku}`)}
                          color="primary"
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

      {/* Recent Pre-orders */}
      {overview.recentPreorders.length > 0 && (
        <Paper>
          <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={600}>
              Recent Pre-orders
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {overview.recentPreorders.slice(0, 10).map((item) => (
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
                    <TableCell>
                      <Typography variant="body2">{item.productName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {item.variantSku}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {item.reservedQuantity || 0} / {item.quantity}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.preorderStatus.replace('_', ' ')}
                        size="small"
                        color={
                          item.preorderStatus === 'READY_TO_FULFILL'
                            ? 'success'
                            : item.preorderStatus === 'PENDING_STOCK'
                              ? 'warning'
                              : item.preorderStatus === 'CANCELED'
                                ? 'error'
                                : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/orders/${item.orderId}`)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Container>
  )
}
