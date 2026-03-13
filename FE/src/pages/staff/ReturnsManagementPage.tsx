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
  Stack,
  Card,
  CardContent,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
} from '@mui/material'
import {
  Search,
  RefreshCw,
  Eye,
  PackageCheck,
  DollarSign,
  XCircle,
  AlertTriangle,
  TrendingDown,
} from 'lucide-react'
import {
  staffReturnApi,
  ReturnRequest,
  ReturnStatus,
  getReturnStatusLabel,
  getReturnStatusColor,
  getReturnReasonLabel,
  formatReturnNumber,
  type ReturnStats,
  type VerifyReturnedItemDto,
  type ProcessRefundExchangeDto,
} from '@/lib/return-api'
import { formatPrice } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'
import { USER_ROLES } from '@eyewear/shared'
import ReturnDetailsDialog from '@/components/staff/ReturnDetailsDialog'
import VerifyReturnDialog from '@/components/staff/VerifyReturnDialog'
import ProcessRefundDialog from '@/components/staff/ProcessRefundDialog'
import { ReturnRequestType } from '@/lib/return-api'

// VND Price formatter
const formatVND = (price?: number): string => {
  if (price === undefined || price === null) return 'N/A'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

export function ReturnsManagementPage() {
  const { user } = useAuthStore()

  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [stats, setStats] = useState<ReturnStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [total, setTotal] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Dialog states
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [processOpen, setProcessOpen] = useState(false)

  const fetchReturns = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await staffReturnApi.queryReturns({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
        status: statusFilter || undefined,
        fromDate: dateFrom || undefined,
        toDate: dateTo || undefined,
      })
      setReturns(response.items || [])
      setTotal(response.total || 0)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch returns')
      setReturns([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      const data = await staffReturnApi.getStatistics({
        fromDate: dateFrom || undefined,
        toDate: dateTo || undefined,
      })
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    fetchReturns()
  }, [page, rowsPerPage, search, statusFilter, dateFrom, dateTo])

  useEffect(() => {
    fetchStats()
  }, [dateFrom, dateTo])

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(0)
  }

  const handleRefresh = () => {
    fetchReturns()
    fetchStats()
  }

  const handleViewDetails = (returnRequest: ReturnRequest) => {
    setSelectedReturn(returnRequest)
    setDetailsOpen(true)
  }

  const handleVerify = (returnRequest: ReturnRequest) => {
    setSelectedReturn(returnRequest)
    setVerifyOpen(true)
  }

  const handleVerifySubmit = async (dto: VerifyReturnedItemDto) => {
    if (!selectedReturn) return
    try {
      await staffReturnApi.verifyReturnedItem(selectedReturn.id, dto)
      toast.success('Return verified successfully')
      setVerifyOpen(false)
      setSelectedReturn(null)
      fetchReturns()
      fetchStats()
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify return')
    }
  }

  const handleProcess = (returnRequest: ReturnRequest) => {
    setSelectedReturn(returnRequest)
    setProcessOpen(true)
  }

  const handleProcessSubmit = async (dto: ProcessRefundExchangeDto) => {
    if (!selectedReturn) return
    try {
      await staffReturnApi.processRefundExchange(selectedReturn.id, dto)
      toast.success('Refund/exchange processed successfully')
      setProcessOpen(false)
      setSelectedReturn(null)
      fetchReturns()
      fetchStats()
    } catch (err: any) {
      toast.error(err.message || 'Failed to process refund/exchange')
    }
  }

  const canVerify = (returnRequest: ReturnRequest) => {
    // Only Sale Staff (and managers/admins) can verify returns
    // Convert role to number to handle localStorage string conversion
    const userRole = Number(user?.role ?? ROLES.CUSTOMER)
    const statusMatch = returnRequest.status === ReturnStatus.AWAITING_ITEMS

    // Sale, Manager, Admin can verify
    return statusMatch && (userRole === ROLES.SALE || userRole <= ROLES.MANAGER)
  }

  const canProcess = (returnRequest: ReturnRequest) => {
    if (returnRequest.status !== ReturnStatus.IN_REVIEW) return false

    // Role-based access control for PROCESSING:
    // - Sale Staff (3): Can only process REFUND requests
    // - Operation Staff (2): Can only process EXCHANGE requests
    // - Manager (1) & Admin (0): Can process both
    // Convert role to number to handle localStorage string conversion
    const userRole = Number(user?.role ?? ROLES.CUSTOMER)

    if (userRole <= ROLES.MANAGER) {
      // Managers and Admins can process everything
      return true
    }

    if (userRole === ROLES.SALE) {
      // Sale Staff: Only refunds
      return returnRequest.returnType === ReturnRequestType.REFUND
    }

    if (userRole === ROLES.OPERATION) {
      // Operation Staff: Only exchanges
      return returnRequest.returnType === ReturnRequestType.EXCHANGE
    }

    return false
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Returns Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sale verifies → Sale refunds / Operation exchanges
          </Typography>
        </Box>
        <IconButton onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={loading ? 'animate-spin' : ''} />
        </IconButton>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.50' }}>
                    <PackageCheck className="text-primary" size={24} />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="h4" fontWeight={700}>
                      {stats.totalReturns}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Returns
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'warning.50' }}>
                    <AlertTriangle className="text-warning" size={24} />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="h4" fontWeight={700}>
                      {stats.pendingApproval}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Approval
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'info.50' }}>
                    <TrendingDown className="text-info" size={24} />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="h4" fontWeight={700}>
                      {stats.awaitingItem}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Awaiting Item
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.50' }}>
                    <DollarSign className="text-success" size={24} />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="h4" fontWeight={700}>
                      {formatVND(stats.totalRefundAmount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Refunds
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by number, order, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} />
                  </InputAdornment>
                ),
                endAdornment: searchInput && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchInput('')}>
                      <XCircle size={16} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid size={{ xs: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as ReturnStatus | '')}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value={ReturnStatus.SUBMITTED}>Submitted</MenuItem>
                <MenuItem value={ReturnStatus.AWAITING_ITEMS}>Awaiting Items</MenuItem>
                <MenuItem value={ReturnStatus.IN_REVIEW}>In Review</MenuItem>
                <MenuItem value={ReturnStatus.APPROVED}>Approved</MenuItem>
                <MenuItem value={ReturnStatus.COMPLETED}>Completed</MenuItem>
                <MenuItem value={ReturnStatus.REJECTED}>Rejected</MenuItem>
                <MenuItem value={ReturnStatus.CANCELED}>Canceled</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="From"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="To"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 6, md: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              startIcon={<Search size={18} />}
            >
              Search
            </Button>
          </Grid>

          <Grid size={{ xs: 6, md: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchInput('')
                setSearch('')
                setStatusFilter('')
                setDateFrom('')
                setDateTo('')
              }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Role-based Info Alert */}
      {user && user.role === USER_ROLES.SALE && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Sale Staff:</strong> You can <strong>VERIFY</strong> returns and process <strong>REFUNDS</strong> only.
            Exchange returns will be handled by Operation staff after verification.
          </Typography>
        </Alert>
      )}

      {user && user.role === USER_ROLES.OPERATION && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Operation Staff:</strong> You can only process <strong>EXCHANGES</strong> that have been verified by Sale staff.
            You cannot verify new returns - please ask Sale staff to verify first.
          </Typography>
        </Alert>
      )}

      {/* Returns Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Return Number</TableCell>
                <TableCell>Order</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : returns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No returns found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                returns.map((returnRequest) => (
                  <TableRow key={returnRequest.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {formatReturnNumber(returnRequest.returnNumber)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{returnRequest.orderNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{returnRequest.customerEmail || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={returnRequest.returnType}
                        size="small"
                        color={returnRequest.returnType === ReturnRequestType.REFUND ? 'success' : 'info'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {getReturnReasonLabel(returnRequest.reason)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {formatVND(returnRequest.requestedRefundAmount)}
                      </Typography>
                      {returnRequest.approvedRefundAmount !== undefined && (
                        <Typography variant="caption" color="text.secondary">
                          Approved: {formatVND(returnRequest.approvedRefundAmount)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getReturnStatusLabel(returnRequest.status)}
                        color={getReturnStatusColor(returnRequest.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDistanceToNow(new Date(returnRequest.createdAt), { addSuffix: true })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(returnRequest)}
                        >
                          <Eye size={16} />
                        </IconButton>
                        {canVerify(returnRequest) && (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => handleVerify(returnRequest)}
                          >
                            Verify
                          </Button>
                        )}
                        {canProcess(returnRequest) && (
                          <Button
                            size="small"
                            variant="contained"
                            color={returnRequest.returnType === ReturnRequestType.REFUND ? 'success' : 'info'}
                            onClick={() => handleProcess(returnRequest)}
                          >
                            {returnRequest.returnType === ReturnRequestType.REFUND ? 'Refund' : 'Exchange'}
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
        />
      </Paper>

      {/* Details Dialog */}
      {selectedReturn && (
        <ReturnDetailsDialog
          open={detailsOpen}
          returnRequest={selectedReturn}
          onClose={() => {
            setDetailsOpen(false)
            setSelectedReturn(null)
          }}
        />
      )}

      {/* Verify Dialog */}
      {selectedReturn && (
        <VerifyReturnDialog
          open={verifyOpen}
          returnRequest={selectedReturn}
          onClose={() => {
            setVerifyOpen(false)
            setSelectedReturn(null)
          }}
          onSubmit={handleVerifySubmit}
        />
      )}

      {/* Process Refund Dialog */}
      {selectedReturn && (
        <ProcessRefundDialog
          open={processOpen}
          returnRequest={selectedReturn}
          onClose={() => {
            setProcessOpen(false)
            setSelectedReturn(null)
          }}
          onSubmit={handleProcessSubmit}
        />
      )}
    </Container>
  )
}
