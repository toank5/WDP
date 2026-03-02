import { useState, useEffect } from 'react'
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
  Business as BusinessIcon,
} from '@mui/icons-material'
import {
  adjustStock,
  getInventoryBySku,
  type InventoryItemEnriched,
} from '@/lib/inventory-api'
import { getPublicSuppliers, type SupplierLight } from '@/lib/supplier-api'

interface QuickInventoryDialogProps {
  open: boolean
  onClose: () => void
  inventoryItem: InventoryItemEnriched | null
  onSuccess?: () => void
  onItemUpdate?: (updatedItem: InventoryItemEnriched) => void
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num)
}

export function QuickInventoryDialog({
  open,
  onClose,
  inventoryItem,
  onSuccess,
  onItemUpdate,
}: QuickInventoryDialogProps) {
  const [saving, setSaving] = useState(false)
  const [localInventoryItem, setLocalInventoryItem] = useState<InventoryItemEnriched | null>(null)

  // Receive stock form state
  const [receiveQuantity, setReceiveQuantity] = useState('')
  const [receiveReference, setReceiveReference] = useState('')
  const [receiveNote, setReceiveNote] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierLight | null>(null)
  const [suppliers, setSuppliers] = useState<SupplierLight[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)

  // Error state
  const [error, setError] = useState<string | null>(null)

  // Sync local inventory item when prop changes
  useEffect(() => {
    setLocalInventoryItem(inventoryItem)
  }, [inventoryItem])

  // Reset form when dialog opens with new item
  useEffect(() => {
    if (open) {
      setReceiveQuantity('')
      setReceiveReference('')
      setReceiveNote('')
      setSelectedSupplier(null)
      setError(null)
      // Load active suppliers
      loadSuppliers()
    }
  }, [open])

  // Load suppliers for autocomplete
  const loadSuppliers = async () => {
    try {
      setLoadingSuppliers(true)
      const data = await getPublicSuppliers()
      setSuppliers(data)
    } catch (err) {
      // Silently fail - supplier list is optional
      setSuppliers([])
    } finally {
      setLoadingSuppliers(false)
    }
  }

  // Refresh inventory item after successful operation
  const refreshInventoryItem = async () => {
    if (!inventoryItem?.sku) return
    try {
      const updated = await getInventoryBySku(inventoryItem.sku)
      if (updated) {
        setLocalInventoryItem(updated)
        onItemUpdate?.(updated)
      }
    } catch (err) {
      // Silently fail, will use the API response data
    }
  }

  const handleReceiveStock = async () => {
    if (!inventoryItem) return

    const quantity = parseInt(receiveQuantity)
    if (!quantity || quantity <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    try {
      setSaving(true)
      setError(null)

      await adjustStock(inventoryItem.sku, {
        delta: quantity,
        reason: 'Stock received',
        reference: receiveReference || undefined,
        note: receiveNote || undefined,
        supplierId: selectedSupplier?._id,
      })

      // Refresh local data
      await refreshInventoryItem()

      // Clear form
      setReceiveQuantity('')
      setReceiveReference('')
      setReceiveNote('')
      setSelectedSupplier(null)

      // Notify parent of success - parent will reload the list
      onSuccess?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to receive stock'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const isLowStock = localInventoryItem ? localInventoryItem.stockQuantity <= localInventoryItem.reorderLevel : false
  const isOutOfStock = localInventoryItem ? localInventoryItem.availableQuantity <= 0 : false

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <InventoryIcon color="primary" />
              <Box>
                <Typography variant="h6">Inventory Management</Typography>
                <Typography variant="body2" color="text.secondary">
                  SKU: {localInventoryItem?.sku || 'N/A'}
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

        {!localInventoryItem ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2}>
            {/* Product Info */}
            <Card variant="outlined">
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Product
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {localInventoryItem.productName || 'Unknown Product'}
                </Typography>
                <Box mt={0.5} display="flex" gap={1} alignItems="center">
                  {localInventoryItem.productCategory && (
                    <Chip
                      label={localInventoryItem.productCategory}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {localInventoryItem.variantSize && (
                    <Chip label={localInventoryItem.variantSize} size="small" variant="outlined" />
                  )}
                  {localInventoryItem.variantColor && (
                    <Chip
                      label={localInventoryItem.variantColor}
                      size="small"
                      sx={{
                        bgcolor: localInventoryItem.variantColor,
                        color: ['white', 'yellow', 'cyan'].includes(
                          localInventoryItem.variantColor.toLowerCase(),
                        )
                          ? 'black'
                          : 'white',
                      }}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>

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
                <Box display="flex" gap={2}>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary">
                      Stock
                    </Typography>
                    <Typography variant="h6" color={isLowStock ? 'error.main' : 'text.primary'}>
                      {formatNumber(localInventoryItem.stockQuantity)}
                    </Typography>
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary">
                      Reserved
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      {formatNumber(localInventoryItem.reservedQuantity)}
                    </Typography>
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary">
                      Available
                    </Typography>
                    <Typography
                      variant="h6"
                      color={localInventoryItem.availableQuantity > 0 ? 'success.main' : 'error.main'}
                    >
                      {formatNumber(localInventoryItem.availableQuantity)}
                    </Typography>
                  </Box>
                </Box>
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
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <BusinessIcon fontSize="small" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <>
                              {loadingSuppliers ? <CircularProgress size={16} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    noOptionsText="No suppliers found"
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

            {/* Full Management Link */}
            <Box textAlign="center">
              <Typography variant="caption" color="text.secondary">
                For advanced options (edit stock, reorder level, supplier), go to{' '}
                <Button
                  size="small"
                  href={`/manager/inventory/${localInventoryItem.sku}`}
                  sx={{ ml: 0.5 }}
                >
                  Full Inventory Details
                </Button>
              </Typography>
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
