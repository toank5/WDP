import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import {
  FilterList as FilterIcon,
  Inventory2 as InventoryIcon,
  LocalShipping as ShippingIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import OrderDetailDrawer from '@/components/staff/OrderDetailDrawer'
import { orderApi, Order, OrderStatus, OrderType, PreorderStatus } from '@/lib/order-api'
import { useAuthStore } from '@/store/auth-store'

type StatusFilter =
  | 'ALL'
  | 'PROCESSING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
type TypeFilter = 'ALL' | 'PREORDER' | 'PRESCRIPTION' | 'READY'
type SalesQueueFilter = 'ALL' | 'READY' | 'WAITING'

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'READY_TO_SHIP', label: 'Ready to ship' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Canceled/Returned' },
]

const TYPE_OPTIONS: Array<{ value: TypeFilter; label: string }> = [
  { value: 'ALL', label: 'All types' },
  { value: 'PREORDER', label: 'Pre-order' },
  { value: 'PRESCRIPTION', label: 'Prescription' },
  { value: 'READY', label: 'Standard' },
]

const PREORDER_WAITING_STATUSES = new Set<PreorderStatus>([
  PreorderStatus.PENDING_STOCK,
  PreorderStatus.PARTIALLY_RESERVED,
])

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
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatPrice = (price: number): string =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)

const getTypeChips = (order: Order): Array<{ label: string; color: 'default' | 'warning' | 'info' | 'secondary' }> => {
  const chips: Array<{ label: string; color: 'default' | 'warning' | 'info' | 'secondary' }> = []

  if (order.orderType === OrderType.PREORDER || order.items.some((item) => item.isPreorder)) {
    chips.push({ label: 'Pre-order', color: 'warning' })
  }

  if (order.orderType === OrderType.PRESCRIPTION) {
    chips.push({ label: 'Prescription', color: 'secondary' })
  }

  if (chips.length === 0) {
    chips.push({ label: 'Standard', color: 'default' })
  }

  return chips
}

const getStatusColor = (
  status: OrderStatus,
): 'default' | 'success' | 'info' | 'warning' | 'error' => {
  if (status === OrderStatus.DELIVERED) return 'success'
  if (status === OrderStatus.READY_TO_SHIP) return 'warning'
  if (status === OrderStatus.SHIPPED) return 'info'
  if (
    status === OrderStatus.RETURNED ||
    status === OrderStatus.CANCELED ||
    status === OrderStatus.CANCELLED ||
    status === OrderStatus.REFUNDED
  ) {
    return 'error'
  }
  if (status === OrderStatus.PAID || status === OrderStatus.PROCESSING || status === OrderStatus.CONFIRMED) {
    return 'warning'
  }
  return 'default'
}

const isProcessingStatus = (status: OrderStatus): boolean =>
  [OrderStatus.READY_TO_SHIP, OrderStatus.SHIPPED].includes(status)

const matchesStatusFilter = (orderStatus: OrderStatus, statusFilter: StatusFilter): boolean => {
  if (statusFilter === 'ALL') {
    return true
  }

  if (statusFilter === 'CANCELLED') {
    return [
      OrderStatus.CANCELED,
      OrderStatus.CANCELLED,
      OrderStatus.RETURNED,
      OrderStatus.REFUNDED,
    ].includes(orderStatus)
  }

  return orderStatus === statusFilter
}

const isPreorderReadyForApproval = (order: Order): boolean => {
  const preorderItems = order.items.filter((item) => item.isPreorder)
  if (preorderItems.length === 0) {
    return true
  }

  return preorderItems.every(
    (item) => item.preorderStatus === 'READY_TO_FULFILL',
  )
}

const isWaitingPreorderStock = (order: Order): boolean => !isPreorderReadyForApproval(order)

const hasPreorderItems = (order: Order): boolean => {
  return order.orderType === OrderType.PREORDER || order.items.some((item) => item.isPreorder)
}

const countMissingItems = (order: Order): number => {
  if (!hasPreorderItems(order)) {
    return 0
  }

  const relevantItems = order.orderType === OrderType.PREORDER 
    ? order.items 
    : order.items.filter((item) => item.isPreorder)

  return relevantItems.filter((item) => {
    const reserved = item.reservedQuantity || 0
    const required = item.quantity
    const isFullyReserved = reserved >= required
    const isStatusReady = item.preorderStatus === 'READY_TO_FULFILL'
    
    // Item is missing if it's not fully reserved AND status is not ready
    return !isFullyReserved && !isStatusReady
  }).length
}

const toEndOfDayIso = (dateValue?: string): string | undefined => {
  if (!dateValue) {
    return undefined
  }

  const endOfDay = new Date(`${dateValue}T23:59:59`)
  if (Number.isNaN(endOfDay.getTime())) {
    return undefined
  }

  return endOfDay.toISOString()
}

const isSalesRole = (role: unknown): boolean => {
  if (typeof role === 'string') {
    const normalized = role.trim().toUpperCase()
    return normalized === 'SALE' || normalized === '3'
  }

  return role === 3
}

const StaffOrdersPage: React.FC = () => {
  const navigate = useNavigate()
  const userRole = useAuthStore((state) => state.user?.role)
  const isSalesMode = isSalesRole(userRole)
  const defaultStatusFilter: StatusFilter = 'ALL'

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(defaultStatusFilter)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [salesQueueFilter, setSalesQueueFilter] = useState<SalesQueueFilter>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    void loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      // ALL means fetch all orders (showAll=true)
      // Specific status means filter by that status
      const isCancelledBucket = statusFilter === 'CANCELLED'
      const showAll = statusFilter === 'ALL' || isCancelledBucket
      const statusParam =
        statusFilter === 'ALL' || isCancelledBucket
          ? undefined
          : (statusFilter as OrderStatus)

      const params = {
        showAll,
        status: statusParam,
        orderType: typeFilter === 'ALL' ? undefined : (typeFilter as OrderType),
        dateFrom: dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : undefined,
        dateTo: toEndOfDayIso(dateTo),
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
      }

      console.log('🔍 Loading orders with params:', { statusFilter, showAll, statusParam, params })

      const response = await (isSalesMode ? orderApi.getSalesPendingOrders : orderApi.getOpsOrders)(params)

      console.log('✅ Orders loaded:', response.orders.length, 'orders')
      setOrders(response.orders)
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : isSalesMode
          ? 'Failed to load sales pending orders'
          : 'Failed to load operations orders'
      setError(message)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = matchesStatusFilter(order.orderStatus, statusFilter)
      const hasPreorder = order.orderType === OrderType.PREORDER || order.items.some((item) => item.isPreorder)
      const waitingStock = isWaitingPreorderStock(order)
      const matchesType =
        typeFilter === 'ALL'
          ? true
          : typeFilter === 'PREORDER'
            ? hasPreorder
            : order.orderType === typeFilter

      const matchesSalesQueue =
        !isSalesMode
          ? true
          : salesQueueFilter === 'ALL'
            ? true
            : salesQueueFilter === 'READY'
              ? !waitingStock
              : waitingStock

      const orderDate = new Date(order.createdAt)
      const afterFrom = dateFrom ? orderDate >= new Date(`${dateFrom}T00:00:00`) : true
      const beforeTo = dateTo ? orderDate <= new Date(`${dateTo}T23:59:59`) : true

      return matchesStatus && matchesType && matchesSalesQueue && afterFrom && beforeTo
    })
  }, [orders, statusFilter, typeFilter, salesQueueFilter, dateFrom, dateTo, isSalesMode])

  const salesCounters = useMemo(() => {
    const scoped = orders.filter((order) => {
      const matchesStatus = matchesStatusFilter(order.orderStatus, statusFilter)
      const hasPreorder = order.orderType === OrderType.PREORDER || order.items.some((item) => item.isPreorder)
      const matchesType =
        typeFilter === 'ALL'
          ? true
          : typeFilter === 'PREORDER'
            ? hasPreorder
            : order.orderType === typeFilter

      const orderDate = new Date(order.createdAt)
      const afterFrom = dateFrom ? orderDate >= new Date(`${dateFrom}T00:00:00`) : true
      const beforeTo = dateTo ? orderDate <= new Date(`${dateTo}T23:59:59`) : true

      return matchesStatus && matchesType && afterFrom && beforeTo
    })

    const waiting = scoped.filter((order) => isWaitingPreorderStock(order)).length
    const ready = scoped.length - waiting

    return {
      all: scoped.length,
      ready,
      waiting,
    }
  }, [orders, statusFilter, typeFilter, dateFrom, dateTo])

  const handleOpenDetails = (order: Order) => {
    setSelectedOrder(order)
    setDrawerOpen(true)
  }

  const handleOrderUpdated = (nextOrder: Order) => {
    setSelectedOrder(nextOrder)
    setOrders((prev) => prev.map((order) => (order._id === nextOrder._id ? nextOrder : order)))

    // Keep shipped orders visible in operations flow so staff can mark them delivered.
    if (!isSalesMode && nextOrder.orderStatus === OrderStatus.SHIPPED) {
      setStatusFilter('ALL')
      void loadOrders()
    }

    toast.success(`Order ${nextOrder.orderNumber} updated`)
  }

  const handleApplyFilters = () => {
    void loadOrders()
  }

  const handleResetFilters = () => {
    setStatusFilter(defaultStatusFilter)
    setTypeFilter('ALL')
    setSalesQueueFilter('ALL')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <Box sx={{ px: { xs: 1, md: 2 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <InventoryIcon color="action" />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}
          >
            {isSalesMode ? 'Sales Approval Queue' : 'Shipping & Logistics'}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            onClick={handleApplyFilters}
            disabled={loading}
            variant="outlined"
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <FilterIcon fontSize="small" color="action" />
            <Typography variant="subtitle2">Filters</Typography>
          </Stack>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="status-filter-label">Fulfillment Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Fulfillment Status"
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="type-filter-label">Order Type</InputLabel>
            <Select
              labelId="type-filter-label"
              value={typeFilter}
              label="Order Type"
              onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
            >
              {TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="From"
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            size="small"
            label="To"
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <Button onClick={handleApplyFilters} disabled={loading} variant="contained">
            Apply
          </Button>
          <Button onClick={handleResetFilters} disabled={loading}>
            Reset
          </Button>
        </Stack>

        {isSalesMode ? (
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Chip
              size="small"
              label={`All (${salesCounters.all})`}
              color={salesQueueFilter === 'ALL' ? 'primary' : 'default'}
              variant={salesQueueFilter === 'ALL' ? 'filled' : 'outlined'}
              onClick={() => setSalesQueueFilter('ALL')}
            />
            <Chip
              size="small"
              label={`Ready to Approve (${salesCounters.ready})`}
              color={salesQueueFilter === 'READY' ? 'success' : 'default'}
              variant={salesQueueFilter === 'READY' ? 'filled' : 'outlined'}
              onClick={() => setSalesQueueFilter('READY')}
            />
            <Chip
              size="small"
              label={`Waiting Stock (${salesCounters.waiting})`}
              color={salesQueueFilter === 'WAITING' ? 'warning' : 'default'}
              variant={salesQueueFilter === 'WAITING' ? 'filled' : 'outlined'}
              onClick={() => setSalesQueueFilter('WAITING')}
            />
          </Stack>
        ) : null}
      </Paper>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small" sx={{ minWidth: 1120 }}>
          <TableHead>
            <TableRow>
              <TableCell>Order Number</TableCell>
              <TableCell>Customer Name</TableCell>
              <TableCell>Order Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Total Amount</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Fulfillment</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ py: 2 }}>
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">
                      Loading orders...
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    No orders found for current filters.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const waitingStock = isWaitingPreorderStock(order)
                const missingCount = countMissingItems(order)
                const shouldHighlight = !isSalesMode && missingCount > 0

                return (
                  <TableRow 
                    key={order._id} 
                    hover
                    sx={{
                      backgroundColor: shouldHighlight ? 'rgba(255, 152, 0, 0.08)' : 'inherit',
                      '&:hover': {
                        backgroundColor: shouldHighlight ? 'rgba(255, 152, 0, 0.12)' : undefined,
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        {order.orderNumber}
                        {shouldHighlight ? (
                          <Chip 
                            size="small" 
                            label={`${missingCount} missing`}
                            color="error"
                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                          />
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell>{order.shippingAddress.fullName}</TableCell>
                    <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {getTypeChips(order).map((chip) => (
                          <Chip key={`${order._id}-${chip.label}`} label={chip.label} size="small" color={chip.color} />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatPrice(order.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={order.payment?.paidAt ? 'Paid' : 'Pending'}
                        color={order.payment?.paidAt ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Chip size="small" label={order.orderStatus} color={getStatusColor(order.orderStatus)} />
                        {waitingStock ? (
                          <Chip size="small" label="Waiting for Stock" color="warning" variant="outlined" />
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.75} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityIcon fontSize="small" />}
                          onClick={() => handleOpenDetails(order)}
                        >
                          View Details
                        </Button>
                        {!isSalesMode && isProcessingStatus(order.orderStatus) ? (
                          <Button
                            size="small"
                            variant="contained"
                            color="info"
                            startIcon={<ShippingIcon fontSize="small" />}
                            onClick={() => handleOpenDetails(order)}
                            disabled={waitingStock}
                          >
                            Update Status
                          </Button>
                        ) : null}
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <OrderDetailDrawer
        open={drawerOpen}
        order={selectedOrder}
        isSalesMode={isSalesMode}
        onClose={() => setDrawerOpen(false)}
        onOrderUpdated={handleOrderUpdated}
      />
    </Box>
  )
}

export default StaffOrdersPage
