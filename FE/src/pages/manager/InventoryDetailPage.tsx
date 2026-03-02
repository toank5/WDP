import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Stack,
  Container,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Divider,
  Grid,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Autocomplete,
  InputAdornment,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Business as BusinessIcon,
  Timeline as TimelineIcon,
  Add as AddIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material'
import {
  getInventoryBySku,
  updateInventory,
  adjustStock,
  getMovements,
  type InventoryItemEnriched,
  type UpdateInventoryPayload,
  type StockAdjustmentPayload,
  type InventoryMovement,
  MovementType,
} from '@/lib/inventory-api'
import {
  getPublicSuppliers,
  getSupplierById,
  type SupplierLight,
  type Supplier,
} from '@/lib/supplier-api'

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

export function InventoryDetailPage() {
  const { sku } = useParams<{ sku: string }>()
  const navigate = useNavigate()

  // State
  const [inventory, setInventory] = useState<InventoryItemEnriched | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [stockQuantity, setStockQuantity] = useState(0)
  const [reorderLevel, setReorderLevel] = useState(0)

  // Receive stock form state
  const [receiveQuantity, setReceiveQuantity] = useState('')
  const [receiveReference, setReceiveReference] = useState('')
  const [receiveNote, setReceiveNote] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierLight | null>(null)
  const [suppliers, setSuppliers] = useState<SupplierLight[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [selectedSupplierDetail, setSelectedSupplierDetail] = useState<Supplier | null>(null)
  const [loadingSupplierDetail, setLoadingSupplierDetail] = useState(false)

  // Movements history
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loadingMovements, setLoadingMovements] = useState(false)

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    if (!sku) return

    try {
      setLoading(true)
      const data = await getInventoryBySku(sku)

      if (!data) {
        showSnackbar('Inventory item not found', 'error')
        navigate('/dashboard/inventory')
        return
      }

      setInventory(data)
      setStockQuantity(data.stockQuantity)
      setReorderLevel(data.reorderLevel)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load inventory'
      showSnackbar(message, 'error')
      navigate('/dashboard/inventory')
    } finally {
      setLoading(false)
    }
  }, [sku, navigate, showSnackbar])

  useEffect(() => {
    loadInventory()
  }, [loadInventory])

  // Load suppliers
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setLoadingSuppliers(true)
        const data = await getPublicSuppliers()
        setSuppliers(data)
      } catch (err) {
        console.error('Failed to load suppliers:', err)
        const message = err instanceof Error ? err.message : 'Failed to load suppliers'
        showSnackbar(message, 'error')
        setSuppliers([])
      } finally {
        setLoadingSuppliers(false)
      }
    }
    loadSuppliers()
  }, [showSnackbar])

  // Load movements when inventory is loaded
  useEffect(() => {
    if (!sku) return

    const loadMovements = async () => {
      try {
        setLoadingMovements(true)
        const result = await getMovements(sku, { limit: 20 })
        setMovements(result.movements || [])
      } catch (err) {
        setMovements([])
      } finally {
        setLoadingMovements(false)
      }
    }
    loadMovements()
  }, [sku])

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (stockQuantity < 0) {
      newErrors.stockQuantity = 'Stock quantity cannot be negative'
    }
    if (reorderLevel < 0) {
      newErrors.reorderLevel = 'Reorder level cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle save
  const handleSave = async () => {
    if (!inventory || !sku) return

    if (!validateForm()) {
      showSnackbar('Please fix validation errors', 'error')
      return
    }

    try {
      setSaving(true)

      const payload: UpdateInventoryPayload = {
        stockQuantity,
        reorderLevel,
      }

      const updated = await updateInventory(sku, payload)
      setInventory(updated)
      showSnackbar('Inventory updated successfully', 'success')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update inventory'
      showSnackbar(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // Handle receive stock (for Operation Staff)
  const handleReceiveStock = async () => {
    if (!inventory || !sku) return

    const quantity = parseInt(receiveQuantity)
    if (!quantity || quantity <= 0) {
      showSnackbar('Please enter a valid quantity', 'error')
      return
    }

    try {
      setSaving(true)

      const payload: StockAdjustmentPayload = {
        delta: quantity,
        reason: 'Stock received',
        reference: receiveReference || undefined,
        note: receiveNote || undefined,
        supplierId: selectedSupplier?._id,
      }

      const updated = await adjustStock(sku, payload)
      setInventory(updated)
      setStockQuantity(updated.stockQuantity)

      // Clear form
      setReceiveQuantity('')
      setReceiveReference('')
      setReceiveNote('')
      setSelectedSupplier(null)

      // Reload movements
      const movementsResult = await getMovements(sku, { limit: 20 })
      setMovements(movementsResult.movements || [])

      showSnackbar(`Received ${quantity} units successfully`, 'success')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to receive stock'
      showSnackbar(message, 'error')
      // Reload to get correct state
      loadInventory()
    } finally {
      setSaving(false)
    }
  }

  // Handle supplier selection - fetch supplier details
  const handleSupplierChange = async (_event: unknown, newValue: SupplierLight | null) => {
    setSelectedSupplier(newValue)
    setSelectedSupplierDetail(null)

    if (newValue?._id) {
      try {
        setLoadingSupplierDetail(true)
        const detail = await getSupplierById(newValue._id)
        setSelectedSupplierDetail(detail)
      } catch (err) {
        // Silently fail - we still have the light data
      } finally {
        setLoadingSupplierDetail(false)
      }
    }
  }

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box my={3} display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (!inventory) {
    return null
  }

  // Calculate if low stock
  const isLowStock = inventory.stockQuantity <= inventory.reorderLevel
  const isOutOfStock = inventory.availableQuantity <= 0

  return (
    <Container maxWidth="md">
      <Box my={3}>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/dashboard/inventory')}
              >
                Back
              </Button>
              <InventoryIcon fontSize="large" color="primary" />
              <Box>
                <Typography variant="h5" fontWeight={600}>
                  {inventory.sku}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {inventory.productName || 'Unknown Product'}
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={2}>
              {isOutOfStock ? (
                <Chip
                  icon={<WarningIcon />}
                  label="Out of Stock"
                  color="error"
                  variant="filled"
                />
              ) : isLowStock ? (
                <Chip
                  icon={<WarningIcon />}
                  label="Low Stock"
                  color="warning"
                  variant="filled"
                />
              ) : (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="In Stock"
                  color="success"
                  variant="filled"
                />
              )}
            </Box>
          </Box>
        </Paper>

        <Grid container spacing={2}>
          {/* Product Info Card */}
          <Grid size={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Product Information
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Product Name
                    </Typography>
                    <Typography variant="body1">
                      {inventory.productName || 'N/A'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Category
                    </Typography>
                    <Box mt={0.5}>
                      {inventory.productCategory ? (
                        <Chip
                          label={getCategoryLabel(inventory.productCategory)}
                          color={getCategoryColor(inventory.productCategory)}
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2">N/A</Typography>
                      )}
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Variant
                    </Typography>
                    <Box mt={0.5} display="flex" gap={1}>
                      {inventory.variantSize && (
                        <Chip label={inventory.variantSize} size="small" variant="outlined" />
                      )}
                      {inventory.variantColor && (
                        <Chip
                          label={inventory.variantColor}
                          size="small"
                          sx={{
                            bgcolor: inventory.variantColor,
                            color: ['white', 'yellow', 'cyan'].includes(
                              inventory.variantColor.toLowerCase(),
                            )
                              ? 'black'
                              : 'white',
                          }}
                        />
                      )}
                      {!inventory.variantSize && !inventory.variantColor && (
                        <Typography variant="body2">N/A</Typography>
                      )}
                    </Box>
                  </Box>

                  {inventory.variantPrice && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Price
                      </Typography>
                      <Typography variant="body1">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(inventory.variantPrice)}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Stock Status Card */}
          <Grid size={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Stock Status
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">
                      Stock Quantity
                    </Typography>
                    <Typography
                      variant="h4"
                      color={isLowStock ? 'error.main' : 'text.primary'}
                    >
                      {formatNumber(inventory.stockQuantity)}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">
                      Reserved
                    </Typography>
                    <Typography variant="h4" color="text.secondary">
                      {formatNumber(inventory.reservedQuantity)}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">
                      Available
                    </Typography>
                    <Typography
                      variant="h4"
                      color={inventory.availableQuantity > 0 ? 'success.main' : 'error.main'}
                    >
                      {formatNumber(inventory.availableQuantity)}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">
                      Reorder Level
                    </Typography>
                    <Typography variant="h4" color="text.secondary">
                      {formatNumber(inventory.reorderLevel)}
                    </Typography>
                  </Grid>
                </Grid>

                {isLowStock && !isOutOfStock && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Stock is at or below reorder level. Consider restocking.
                  </Alert>
                )}

                {isOutOfStock && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    This item is out of stock!
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Edit Stock Card */}
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Edit Stock
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid size={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Stock Quantity"
                      value={stockQuantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        setStockQuantity(value)
                        if (errors.stockQuantity) {
                          setErrors({ ...errors, stockQuantity: '' })
                        }
                      }}
                      error={!!errors.stockQuantity}
                      helperText={errors.stockQuantity || 'Total units in warehouse'}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>

                  <Grid size={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Reorder Level"
                      value={reorderLevel}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        setReorderLevel(value)
                        if (errors.reorderLevel) {
                          setErrors({ ...errors, reorderLevel: '' })
                        }
                      }}
                      error={!!errors.reorderLevel}
                      helperText={errors.reorderLevel || 'Alert threshold for low stock'}
                      slotProps={{ htmlInput: { min: 0 } }}
                    />
                  </Grid>
                </Grid>

                <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                  <Button
                    variant="outlined"
                    onClick={() => loadInventory()}
                    disabled={saving}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Receive Stock Card */}
          <Grid size={12}>
            <Card sx={{ borderLeft: 4, borderColor: 'success.main' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600} color="success.main">
                  Receive Stock
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Record incoming stock from suppliers (increases available quantity)
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Quantity to Receive *"
                      value={receiveQuantity}
                      onChange={(e) => setReceiveQuantity(e.target.value)}
                      placeholder="e.g., 100"
                      slotProps={{ input: { min: 1 } }}
                      helperText="Number of units received"
                    />
                  </Grid>

                  <Grid size={12} md={6}>
                    <Box display="flex" gap={1} alignItems="flex-start">
                      <Autocomplete
                        fullWidth
                        options={suppliers}
                        loading={loadingSuppliers}
                        value={selectedSupplier}
                        onChange={handleSupplierChange}
                        getOptionLabel={(option) => `${option.code} - ${option.name}`}
                        isOptionEqualToValue={(option, value) => option._id === value._id}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Supplier (optional)"
                            placeholder="Select supplier"
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <>
                                  <InputAdornment position="start">
                                    <BusinessIcon fontSize="small" />
                                  </InputAdornment>
                                  {params.InputProps.startAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                        noOptionsText="No suppliers found"
                      />
                      <Button
                        variant="outlined"
                        startIcon={<OpenInNewIcon />}
                        onClick={() => navigate('/dashboard/suppliers')}
                        sx={{ mt: 0.5, whiteSpace: 'nowrap' }}
                      >
                        New
                      </Button>
                    </Box>
                    {selectedSupplierDetail && (
                      <Box mt={1}>
                        <Typography variant="caption" color="text.secondary">
                          Phone: {selectedSupplierDetail.phone || 'N/A'} | Email: {selectedSupplierDetail.email || 'N/A'}
                        </Typography>
                      </Box>
                    )}
                  </Grid>

                  <Grid size={12} md={6}>
                    <TextField
                      fullWidth
                      label="Reference (optional)"
                      value={receiveReference}
                      onChange={(e) => setReceiveReference(e.target.value)}
                      placeholder="e.g., PO-2026-0001"
                      helperText="PO number, shipment ID, etc."
                    />
                  </Grid>

                  <Grid size={12} md={6}>
                    <TextField
                      fullWidth
                      label="Note (optional)"
                      value={receiveNote}
                      onChange={(e) => setReceiveNote(e.target.value)}
                      placeholder="e.g., Supplier delivery #12345"
                      helperText="Additional notes"
                    />
                  </Grid>
                </Grid>

                <Box display="flex" justifyContent="flex-end" mt={2}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={saving ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                    onClick={handleReceiveStock}
                    disabled={saving || !receiveQuantity}
                  >
                    {saving ? 'Processing...' : 'Receive Stock'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Movement History Card */}
          <Grid size={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <TimelineIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Movement History
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {loadingMovements ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress size={32} />
                  </Box>
                ) : movements.length === 0 ? (
                  <Box py={4} textAlign="center">
                    <Typography color="text.secondary">
                      No movement history found
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date/Time</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell align="right">Change</TableCell>
                          <TableCell align="right">Before</TableCell>
                          <TableCell align="right">After</TableCell>
                          <TableCell>Reason</TableCell>
                          <TableCell>Supplier</TableCell>
                          <TableCell>Reference</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {movements.map((movement) => (
                          <TableRow key={movement._id} hover>
                            <TableCell>
                              <Typography variant="body2">
                                {new Date(movement.createdAt).toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={movement.movementType.toUpperCase()}
                                size="small"
                                color={
                                  movement.quantity > 0
                                    ? 'success'
                                    : 'error'
                                }
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                color={movement.quantity > 0 ? 'success.main' : 'error.main'}
                              >
                                {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="text.secondary">
                                {formatNumber(movement.stockBefore)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={500}>
                                {formatNumber(movement.stockAfter)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {movement.reason}
                              </Typography>
                              {movement.note && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {movement.note}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {movement.supplier ? (
                                <Typography variant="body2" noWrap>
                                  {movement.supplier.supplierCode || movement.supplier.supplierName || '—'}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  —
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {movement.reference || '—'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

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
