import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  IconButton,
  Stack,
} from '@mui/material'
import { Search, Eye, RefreshCw, Clock, XCircle } from 'lucide-react'
import { getOrdersAwaitingVerification, type OrderAwaitingVerification } from '@/lib/staff-prescription-api'
import { PrescriptionVerifyModal } from '@/components/staff/PrescriptionVerifyModal'
import { formatDistanceToNow } from 'date-fns'

const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'warning' | 'info' | 'success' | 'error' }> = {
  PENDING_REVIEW: { label: 'Pending Verification', color: 'warning' },
  NEEDS_UPDATE: { label: 'Needs Update', color: 'error' },
  APPROVED: { label: 'Approved', color: 'success' },
  IN_MANUFACTURING: { label: 'In Manufacturing', color: 'info' },
}

export function PrescriptionVerificationPage() {
  const [orders, setOrders] = useState<OrderAwaitingVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OrderAwaitingVerification | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getOrdersAwaitingVerification({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
      })
      setOrders(response.orders || [])
      setTotal(response.total || 0)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders')
      setOrders([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [page, rowsPerPage, search])

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(0)
  }

  const handleVerify = (order: OrderAwaitingVerification) => {
    setSelectedOrder(order)
    setModalOpen(true)
  }

  const handleVerified = () => {
    setModalOpen(false)
    setSelectedOrder(null)
    fetchOrders()
  }

  const getTimeColor = (createdAt: string) => {
    const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
    if (hours < 1) return '#ef4444'
    if (hours < 3) return '#f59e0b'
    if (hours < 6) return '#fbbf24'
    return '#10b981'
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Prescription Verification</Typography>
          <Typography variant="body1" color="text.secondary">
            Review and verify customer prescriptions
          </Typography>
        </Box>
        <Stack direction="row" gap={2} alignItems="center">
          <Chip icon={<Clock size={16} />} label={`${total} Awaiting`} color="warning" />
          <IconButton onClick={fetchOrders} disabled={loading}>
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </IconButton>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      <Paper>
        {/* Search */}
        <Box p={2} borderBottom={1} borderColor="divider">
          <TextField
            fullWidth
            placeholder="Search by order number or customer name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button onClick={handleSearch} variant="contained" size="small">Search</Button>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Time</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Stack alignItems="center" gap={1}>
                      <XCircle size={40} sx={{ color: 'text.secondary' }} />
                      <Typography color="text.secondary">{search ? 'No orders found' : 'No orders awaiting verification'}</Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={`${order.orderId}-${order.orderItemId}`} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="primary.main">{order.orderNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{order.customerName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {order.productImage && (
                          <Box component="img" src={order.productImage} alt="" sx={{ width: 40, height: 40, borderRadius: 1 }} />
                        )}
                        <Typography variant="body2">{order.productName}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_CONFIG[order.prescriptionStatus]?.label || order.prescriptionStatus}
                        color={STATUS_CONFIG[order.prescriptionStatus]?.color || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Clock size={14} style={{ color: getTimeColor(order.createdAt) }} />
                        <Typography variant="caption" sx={{ color: getTimeColor(order.createdAt), fontWeight: 600 }}>
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Eye size={14} />}
                        onClick={() => handleVerify(order)}
                      >
                        Verify
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0) }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </Paper>

      {/* Modal */}
      <PrescriptionVerifyModal
        open={modalOpen}
        order={selectedOrder}
        onClose={() => { setModalOpen(false); setSelectedOrder(null) }}
        onVerified={handleVerified}
      />
    </Container>
  )
}
