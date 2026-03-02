import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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
  CircularProgress,
  Snackbar,
  Alert,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
} from '@mui/material'
import {
  Inventory as InventoryIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import {
  getInventoryList,
  type InventoryItemEnriched,
  type InventoryQueryParams,
} from '@/lib/inventory-api'

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num)
}

const getCategoryLabel = (category: string): string => {
  switch (category?.toLowerCase()) {
    case 'frame':
      return 'Frame'
    case 'lens':
      return 'Lens'
    case 'service':
      return 'Service'
    default:
      return category || 'N/A'
  }
}

const getCategoryColor = (category: string): 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'default' => {
  switch (category?.toLowerCase()) {
    case 'frame':
      return 'primary'
    case 'lens':
      return 'info'
    case 'service':
      return 'success'
    default:
      return 'default'
  }
}

export function InventoryManagementPage() {
  const navigate = useNavigate()

  // State
  const [items, setItems] = useState<InventoryItemEnriched[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  // Filters
  const [skuFilter, setSkuFilter] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [activeOnly, setActiveOnly] = useState(true)

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

  // Load inventory
  const loadInventory = useCallback(async () => {
    try {
      setLoading(true)
      const params: InventoryQueryParams = {
        page,
        limit: 50,
      }

      if (skuFilter.trim()) {
        params.sku = skuFilter.trim()
      }
      if (lowStockOnly) {
        params.lowStock = true
      }
      if (activeOnly) {
        params.activeOnly = true
      }

      const result = await getInventoryList(params)
      setItems(result?.items || [])
      setTotal(result?.total || 0)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load inventory'
      showSnackbar(message, 'error')
    } finally {
      setLoading(false)
    }
  }, [page, skuFilter, lowStockOnly, activeOnly, showSnackbar])

  useEffect(() => {
    loadInventory()
  }, [loadInventory])

  // Handle search
  const handleSearch = () => {
    setPage(1)
    loadInventory()
  }

  // Handle low stock toggle
  const handleLowStockToggle = (_event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setLowStockOnly(checked)
    setPage(1)
  }

  // Handle active only toggle
  const handleActiveOnlyToggle = (_event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setActiveOnly(checked)
    setPage(1)
  }

  // Get stock status
  const getStockStatus = (item: InventoryItemEnriched) => {
    if (!item.variantIsActive || !item.productIsActive) {
      return { label: 'Inactive', color: 'default' as const, showWarning: false }
    }
    if (item.availableQuantity <= 0) {
      return { label: 'Out of Stock', color: 'error' as const, showWarning: true }
    }
    if (item.stockQuantity <= item.reorderLevel) {
      return { label: 'Low Stock', color: 'warning' as const, showWarning: true }
    }
    return { label: 'In Stock', color: 'success' as const, showWarning: false }
  }

  return (
    <Container maxWidth="lg">
      <Box my={3}>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <InventoryIcon fontSize="large" color="primary" />
              <Box>
                <Typography variant="h4" fontWeight={600}>
                  Inventory
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage stock levels for all product variants
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={2} alignItems="center">
              <Chip
                label={`${total} items`}
                size="medium"
                color="primary"
                variant="outlined"
              />
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
                placeholder="Search by SKU..."
                value={skuFilter}
                onChange={(e) => setSkuFilter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch()
                  }
                }}
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  },
                }}
                sx={{ minWidth: 250 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={lowStockOnly}
                    onChange={handleLowStockToggle}
                    color="warning"
                  />
                }
                label="Low stock only"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={activeOnly}
                    onChange={handleActiveOnlyToggle}
                    color="success"
                  />
                }
                label="Active only"
              />

              <Box flexGrow={1} />

              {lowStockOnly && items && items.filter((i) => i.stockQuantity <= i.reorderLevel).length > 0 && (
                <Chip
                  icon={<WarningIcon />}
                  label={`${items.filter((i) => i.stockQuantity <= i.reorderLevel).length} low stock items`}
                  color="warning"
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
                <TableCell sx={{ fontWeight: 600 }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Variant</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Stock</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Reserved</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Available</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Reorder Level</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : !items || items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Box py={6}>
                      <InventoryIcon
                        sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
                      />
                      <Typography color="text.secondary" gutterBottom>
                        No inventory items found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Try adjusting your filters
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const status = getStockStatus(item)
                  return (
                    <TableRow key={item._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500} fontFamily="monospace">
                          {item.sku}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {item.productName || 'N/A'}
                          </Typography>
                          {item.productCategory && (
                            <Chip
                              label={getCategoryLabel(item.productCategory)}
                              color={getCategoryColor(item.productCategory)}
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {item.variantSize || item.variantColor ? (
                          <Stack direction="row" spacing={1}>
                            {item.variantSize && (
                              <Chip label={item.variantSize} size="small" variant="outlined" />
                            )}
                            {item.variantColor && (
                              <Chip
                                label={item.variantColor}
                                size="small"
                                sx={{
                                  bgcolor: item.variantColor,
                                  color: ['white', 'yellow', 'cyan'].includes(
                                    item.variantColor.toLowerCase(),
                                  )
                                    ? 'black'
                                    : 'white',
                                }}
                              />
                            )}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          color={item.stockQuantity <= item.reorderLevel ? 'error.main' : 'inherit'}
                        >
                          {formatNumber(item.stockQuantity)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {formatNumber(item.reservedQuantity)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          color={item.availableQuantity > 0 ? 'success.main' : 'error.main'}
                        >
                          {formatNumber(item.availableQuantity)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {formatNumber(item.reorderLevel)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={status.label}
                          color={status.color}
                          size="small"
                          variant={status.color === 'default' ? 'outlined' : 'filled'}
                          icon={status.showWarning ? <WarningIcon fontSize="small" /> : undefined}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => navigate(`/dashboard/inventory/${item.sku}`)}
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {total > 50 && (
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
              Page {page} of {Math.ceil(total / 50)}
            </Typography>
            <Button
              disabled={page >= Math.ceil(total / 50)}
              onClick={() => setPage((p) => p + 1)}
              variant="outlined"
              size="small"
            >
              Next
            </Button>
          </Box>
        )}

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
      </Box>
    </Container>
  )
}
