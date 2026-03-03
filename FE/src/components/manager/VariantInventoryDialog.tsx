import { useState, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  Divider,
  Grid,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Autocomplete,
  InputAdornment,
} from '@mui/material'
import {
  Close as CloseIcon,
  Inventory as InventoryIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Business as BusinessIcon,
} from '@mui/icons-material'
import {
  getInventoryBySku,
  adjustStock,
  type InventoryItemEnriched,
} from '@/lib/inventory-api'
import { getPublicSuppliers, type SupplierLight } from '@/lib/supplier-api'

interface VariantInventoryDialogProps {
  open: boolean
  onClose: () => void
  variantSku: string
  variantInfo?: {
    size?: string
    color?: string
    price?: number
  }
  onSuccess?: () => void
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num)
}

export function VariantInventoryDialog({
  open,
  onClose,
  variantSku,
  variantInfo,
  onSuccess,
}: VariantInventoryDialogProps) {
  const [inventory, setInventory] = useState<InventoryItemEnriched | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Receive stock form state
  const [receiveQuantity, setReceiveQuantity] = useState('')
  const [receiveReference, setReceiveReference] = useState('')
  const [receiveNote, setReceiveNote] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierLight | null>(null)
  const [supplierRef, setSupplierRef] = useState('')
  const [suppliers, setSuppliers] = useState<SupplierLight[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)

  // Error state
  const [error, setError] = useState<string | null>(null)

  // Confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelta, setPendingDelta] = useState(0)

  // Load inventory when dialog opens
  useEffect(() => {
    if (open && variantSku) {
      loadInventory()
      loadSuppliers()
    } else {
      // Reset state when dialog closes
      setInventory(null)
      setReceiveQuantity('')
      setReceiveReference('')
      setReceiveNote('')
      setSelectedSupplier(null)
      setSupplierRef('')
      setError(null)
    }
  }, [open, variantSku])

  // Load suppliers for autocomplete
  const loadSuppliers = async () => {
    try {
      setLoadingSuppliers(true)
      const data = await getPublicSuppliers()
      setSuppliers(data)
    } catch (err) {
      setSuppliers([])
    } finally {
      setLoadingSuppliers(false)
    }
  }

  const loadInventory = async () => {
    if (!variantSku) return

    try {
      setLoading(true)
      setError(null)
      const data = await getInventoryBySku(variantSku)
      setInventory(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load inventory'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleReceiveStock = async () => {
    if (!inventory || !variantSku) return

    const quantity = parseInt(receiveQuantity)
    if (!quantity || quantity <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    try {
      setSaving(true)
      setError(null)

      await adjustStock(variantSku, {
        delta: quantity,
        reason: 'Stock received',
        reference: receiveReference || undefined,
        note: receiveNote || undefined,
        supplierId: selectedSupplier?._id,
        supplierRef: supplierRef || undefined,
      })

      // Reload inventory data
      await loadInventory()

      // Clear form
      setReceiveQuantity('')
      setReceiveReference('')
      setReceiveNote('')
      setSelectedSupplier(null)
      setSupplierRef('')

      // Notify parent of success
      onSuccess?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to receive stock'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleQuickAdjust = async (delta: number) => {
    if (!inventory || !variantSku) return

    const newStock = inventory.stockQuantity + delta
    if (newStock < 0) {
      setError('Stock cannot be negative')
      return
    }

    // Show confirmation dialog
    setPendingDelta(delta)
    setConfirmOpen(true)
  }

  const handleConfirmAdjust = async () => {
    if (!inventory || !variantSku) return

    try {
      setSaving(true)
      setError(null)
      setConfirmOpen(false)

      await adjustStock(variantSku, {
        delta: pendingDelta,
        reason: pendingDelta > 0 ? 'Manual stock addition' : 'Manual stock removal',
      })

      // Reload inventory data
      await loadInventory()

      // Notify parent of success
      onSuccess?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to adjust stock'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelConfirm = () => {
    setConfirmOpen(false)
    setPendingDelta(0)
  }

  const isLowStock = inventory ? inventory.stockQuantity <= inventory.reorderLevel : false
  const isOutOfStock = inventory ? inventory.availableQuantity <= 0 : false

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <InventoryIcon color="primary" />
            <Box>
              <Typography variant="h6">Variant Inventory</Typography>
              <Typography variant="body2" color="text.secondary">
                SKU: {variantSku}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : inventory ? (
          <Stack spacing={2}>
            {/* Variant Info */}
            {variantInfo && (variantInfo.size || variantInfo.color) && (
              <Card variant="outlined">
                <CardContent sx={{ py: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Variant
                  </Typography>
                  <Box mt={0.5} display="flex" gap={1} flexWrap="wrap">
                    {variantInfo.size && (
                      <Chip label={variantInfo.size} size="small" variant="outlined" />
                    )}
                    {variantInfo.color && (
                      <Chip
                        label={variantInfo.color}
                        size="small"
                        sx={{
                          bgcolor: variantInfo.color,
                          color: ['white', 'yellow', 'cyan'].includes(
                            variantInfo.color.toLowerCase(),
                          )
                            ? 'black'
                            : 'white',
                        }}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Stock Status */}
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Stock Status
                  </Typography>
                  {isOutOfStock ? (
                    <Chip
                      icon={<WarningIcon />}
                      label="Out of Stock"
                      color="error"
                      size="small"
                      variant="filled"
                    />
                  ) : isLowStock ? (
                    <Chip
                      icon={<WarningIcon />}
                      label="Low Stock"
                      color="warning"
                      size="small"
                      variant="filled"
                    />
                  ) : (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="In Stock"
                      color="success"
                      size="small"
                      variant="filled"
                    />
                  )}
                </Box>
                <Divider sx={{ my: 1 }} />
                <Grid container spacing={1}>
                  <Grid size={3}>
                    <Typography variant="caption" color="text.secondary">
                      Stock
                    </Typography>
                    <Typography variant="h6" color={isLowStock ? 'error.main' : 'text.primary'}>
                      {formatNumber(inventory.stockQuantity)}
                    </Typography>
                  </Grid>
                  <Grid size={3}>
                    <Typography variant="caption" color="text.secondary">
                      Reserved
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      {formatNumber(inventory.reservedQuantity)}
                    </Typography>
                  </Grid>
                  <Grid size={3}>
                    <Typography variant="caption" color="text.secondary">
                      Available
                    </Typography>
                    <Typography
                      variant="h6"
                      color={inventory.availableQuantity > 0 ? 'success.main' : 'error.main'}
                    >
                      {formatNumber(inventory.availableQuantity)}
                    </Typography>
                  </Grid>
                  <Grid size={3}>
                    <Typography variant="caption" color="text.secondary">
                      Reorder
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      {formatNumber(inventory.reorderLevel)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Quick Adjust */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Quick Adjustment
                </Typography>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  Quickly add or remove stock
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<AddIcon />}
                    onClick={() => handleQuickAdjust(1)}
                    disabled={saving}
                  >
                    +1
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<AddIcon />}
                    onClick={() => handleQuickAdjust(5)}
                    disabled={saving}
                  >
                    +5
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<AddIcon />}
                    onClick={() => handleQuickAdjust(10)}
                    disabled={saving}
                  >
                    +10
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<AddIcon />}
                    onClick={() => handleQuickAdjust(50)}
                    disabled={saving}
                  >
                    +50
                  </Button>
                  <Divider orientation="vertical" flexItem />
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<RemoveIcon />}
                    onClick={() => handleQuickAdjust(-1)}
                    disabled={saving || inventory.stockQuantity < 1}
                  >
                    -1
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<RemoveIcon />}
                    onClick={() => handleQuickAdjust(-5)}
                    disabled={saving || inventory.stockQuantity < 5}
                  >
                    -5
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<RemoveIcon />}
                    onClick={() => handleQuickAdjust(-10)}
                    disabled={saving || inventory.stockQuantity < 10}
                  >
                    -10
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Receive Stock */}
            <Card variant="outlined" sx={{ borderLeft: 3, borderColor: 'success.main' }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} color="success.main" gutterBottom>
                  Receive Stock
                </Typography>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  Record incoming stock from suppliers
                </Typography>
                <Stack spacing={1.5}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Quantity to Receive"
                    value={receiveQuantity}
                    onChange={(e) => setReceiveQuantity(e.target.value)}
                    placeholder="e.g., 100"
                    inputProps={{ min: 1 }}
                  />
                  <Autocomplete
                    fullWidth
                    size="small"
                    options={suppliers}
                    loading={loadingSuppliers}
                    value={selectedSupplier}
                    onChange={(_event, newValue) => setSelectedSupplier(newValue)}
                    getOptionLabel={(option) => `${option.code} - ${option.name}`}
                    isOptionEqualToValue={(option, value) => option._id === value._id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Supplier (optional)"
                        placeholder="Select supplier"
                        slotProps={{
                          input: {
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <InputAdornment position="start">
                                  <BusinessIcon fontSize="small" />
                                </InputAdornment>
                                {params.InputProps.startAdornment}
                              </>
                            ),
                          },
                        }}
                      />
                    )}
                    noOptionsText="No suppliers found"
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Supplier Reference (optional)"
                    value={supplierRef}
                    onChange={(e) => setSupplierRef(e.target.value)}
                    placeholder="e.g., INV-2026-001"
                    disabled={!selectedSupplier}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Reference (optional)"
                    value={receiveReference}
                    onChange={(e) => setReceiveReference(e.target.value)}
                    placeholder="e.g., PO-2026-0001"
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Note (optional)"
                    value={receiveNote}
                    onChange={(e) => setReceiveNote(e.target.value)}
                    placeholder="e.g., Supplier delivery #12345"
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    startIcon={saving ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                    onClick={handleReceiveStock}
                    disabled={saving || !receiveQuantity}
                  >
                    {saving ? 'Processing...' : 'Receive Stock'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        ) : (
          <Alert severity="info">
            No inventory data found for this variant. Inventory will be auto-created when the product is saved.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Close
        </Button>
      </DialogActions>
    </Dialog>

      {/* Confirmation Dialog for Quick Adjustment */}
      <Dialog open={confirmOpen} onClose={handleCancelConfirm} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Stock Adjustment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to{' '}
            <Typography component="span" fontWeight={600} color={pendingDelta > 0 ? 'success.main' : 'error.main'}>
              {pendingDelta > 0 ? 'add' : 'remove'} {Math.abs(pendingDelta)} unit{Math.abs(pendingDelta) > 1 ? 's' : ''}
            </Typography>
            {' '}from stock?
          </Typography>
          {inventory && (
            <Box mt={2} p={1.5} bgcolor="background.default" borderRadius={1}>
              <Typography variant="caption" color="text.secondary">
                Current Stock: {formatNumber(inventory.stockQuantity)} →{' '}
                <Typography component="span" fontWeight={600} color={pendingDelta > 0 ? 'success.main' : 'error.main'}>
                  {formatNumber(inventory.stockQuantity + pendingDelta)}
                </Typography>
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelConfirm} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAdjust}
            variant="contained"
            color={pendingDelta > 0 ? 'success' : 'error'}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}
            disabled={saving}
          >
            {saving ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
