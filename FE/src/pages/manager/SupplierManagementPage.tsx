import { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Chip,
  Stack,
  Container,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material'
import {
  Business as BusinessIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import {
  getSupplierList,
  setSupplierStatus,
  deleteSupplier,
  type Supplier,
  type SupplierQueryParams,
  SupplierStatus,
} from '@/lib/supplier-api'
import { SupplierDialog } from '@/components/manager/SupplierDialog'

type StatusFilter = 'all' | 'active' | 'inactive'

export function SupplierManagementPage() {
  // State
  const [items, setItems] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null)

  // Filters
  const [searchFilter, setSearchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Menu state for actions
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({ open: false, message: '', severity: 'success' })

  // Show snackbar
  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }, [])

  // Load suppliers
  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true)
      const params: SupplierQueryParams = {
        page,
        limit: 20,
      }

      if (searchFilter.trim()) {
        params.search = searchFilter.trim()
      }

      if (statusFilter === 'active') {
        params.status = SupplierStatus.ACTIVE
      } else if (statusFilter === 'inactive') {
        params.status = SupplierStatus.INACTIVE
      }

      const result = await getSupplierList(params)
      setItems(result?.items || [])
      setTotal(result?.total || 0)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load suppliers'
      showSnackbar(message, 'error')
    } finally {
      setLoading(false)
    }
  }, [page, searchFilter, statusFilter, showSnackbar])

  useEffect(() => {
    loadSuppliers()
  }, [loadSuppliers])

  // Handle search
  const handleSearch = () => {
    setPage(1)
    loadSuppliers()
  }

  // Handle status filter change
  const handleStatusFilterChange = (value: StatusFilter) => {
    setStatusFilter(value)
    setPage(1)
  }

  // Open actions menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, supplier: Supplier) => {
    setAnchorEl(event.currentTarget)
    setSelectedSupplier(supplier)
  }

  // Close actions menu
  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedSupplier(null)
  }

  // Handle edit
  const handleEdit = () => {
    if (selectedSupplier) {
      setEditingSupplierId(selectedSupplier._id)
      setDialogOpen(true)
    }
    handleMenuClose()
  }

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingSupplierId(null)
  }

  // Handle save (reload suppliers after create/update)
  const handleDialogSave = () => {
    loadSuppliers()
  }

  // Handle toggle status
  const handleToggleStatus = async () => {
    if (!selectedSupplier) return

    try {
      const newStatus = selectedSupplier.status === SupplierStatus.ACTIVE
        ? SupplierStatus.INACTIVE
        : SupplierStatus.ACTIVE
      await setSupplierStatus(selectedSupplier._id, newStatus)
      showSnackbar(
        `Supplier ${newStatus.toLowerCase()} successfully`,
        'success',
      )
      loadSuppliers()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update supplier status'
      showSnackbar(message, 'error')
    } finally {
      handleMenuClose()
    }
  }

  // Handle delete (admin only)
  const handleDelete = async () => {
    if (!selectedSupplier) return

    if (!confirm(`Are you sure you want to permanently delete "${selectedSupplier.name}"?`)) {
      return
    }

    try {
      await deleteSupplier(selectedSupplier._id)
      showSnackbar('Supplier deleted successfully', 'success')
      loadSuppliers()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete supplier'
      showSnackbar(message, 'error')
    } finally {
      handleMenuClose()
    }
  }

  return (
    <Container maxWidth="lg">
      <Box my={3}>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <BusinessIcon fontSize="large" color="primary" />
              <Box>
                <Typography variant="h4" fontWeight={600}>
                  Suppliers
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage suppliers for purchasing and inventory
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={2} alignItems="center">
              <Chip
                label={`${total} suppliers`}
                size="medium"
                color="primary"
                variant="outlined"
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingSupplierId(null)
                  setDialogOpen(true)
                }}
              >
                Add Supplier
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="subtitle2" sx={{ minWidth: 60 }}>
                Filters:
              </Typography>

              <TextField
                size="small"
                placeholder="Search by name or code..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch()
                  }
                }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ minWidth: 280 }}
              />

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => handleStatusFilterChange(e.target.value as StatusFilter)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                onClick={handleSearch}
                sx={{ height: 40 }}
              >
                Search
              </Button>

              <Box flexGrow={1} />

              {statusFilter === 'inactive' && items.filter((i) => i.status === SupplierStatus.INACTIVE).length > 0 && (
                <Chip
                  label={`${items.filter((i) => i.status === SupplierStatus.INACTIVE).length} inactive`}
                  color="default"
                  variant="filled"
                />
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : !items || items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box py={6}>
                      <BusinessIcon
                        sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
                      />
                      <Typography color="text.secondary" gutterBottom>
                        No suppliers found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Try adjusting your filters or add a new supplier
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500} fontFamily="monospace">
                        {item.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {item.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {item.email || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {item.phone || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {[item.city, item.country].filter(Boolean).join(', ') || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.status === SupplierStatus.ACTIVE ? 'Active' : 'Inactive'}
                        color={item.status === SupplierStatus.ACTIVE ? 'success' : 'default'}
                        size="small"
                        variant={item.status === SupplierStatus.ACTIVE ? 'filled' : 'outlined'}
                        icon={item.status === SupplierStatus.ACTIVE ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, item)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {total > 20 && (
          <Box display="flex" justifyContent="center" alignItems="center" py={3} gap={2}>
            <Button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              variant="outlined"
              size="small"
            >
              Previous
            </Button>
            <Typography variant="body2">
              Page {page} of {Math.ceil(total / 20)}
            </Typography>
            <Button
              disabled={page >= Math.ceil(total / 20)}
              onClick={() => setPage((p) => p + 1)}
              variant="outlined"
              size="small"
            >
              Next
            </Button>
          </Box>
        )}

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleEdit}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={handleToggleStatus}>
            {selectedSupplier?.status === SupplierStatus.ACTIVE ? (
              <CancelIcon fontSize="small" sx={{ mr: 1 }} />
            ) : (
              <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
            )}
            {selectedSupplier?.status === SupplierStatus.ACTIVE ? 'Deactivate' : 'Activate'}
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <CancelIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Supplier Dialog */}
        <SupplierDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          onSave={handleDialogSave}
          supplierId={editingSupplierId}
        />
      </Box>
    </Container>
  )
}
