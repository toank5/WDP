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
  TextField,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
} from '@mui/material'
import {
  Close as CloseIcon,
  Inventory as InventoryIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material'
import {
  adjustStock,
  type InventoryItemEnriched,
} from '@/lib/inventory-api'

interface QuickInventoryDialogProps {
  open: boolean
  onClose: () => void
  inventoryItem: InventoryItemEnriched | null
  onSuccess?: () => void
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num)
}

export function QuickInventoryDialog({
  open,
  onClose,
  inventoryItem,
  onSuccess,
}: QuickInventoryDialogProps) {
  const [saving, setSaving] = useState(false)

  // Receive stock form state
  const [receiveQuantity, setReceiveQuantity] = useState('')
  const [receiveReference, setReceiveReference] = useState('')
  const [receiveNote, setReceiveNote] = useState('')

  // Error state
  const [error, setError] = useState<string | null>(null)

  // Reset form when dialog opens with new item
  useEffect(() => {
    if (open) {
      setReceiveQuantity('')
      setReceiveReference('')
      setReceiveNote('')
      setError(null)
    }
  }, [open])

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
      })

      // Clear form
      setReceiveQuantity('')
      setReceiveReference('')
      setReceiveNote('')

      // Notify parent of success - parent will reload the list
      onSuccess?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to receive stock'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleQuickAdjust = async (delta: number) => {
    if (!inventoryItem) return

    const newStock = inventoryItem.stockQuantity + delta
    if (newStock < 0) {
      setError('Stock cannot be negative')
      return
    }

    try {
      setSaving(true)
      setError(null)

      await adjustStock(inventoryItem.sku, {
        delta,
        reason: delta > 0 ? 'Manual stock addition' : 'Manual stock removal',
      })

      // Notify parent of success
      onSuccess?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to adjust stock'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const isLowStock = inventoryItem ? inventoryItem.stockQuantity <= inventoryItem.reorderLevel : false
  const isOutOfStock = inventoryItem ? inventoryItem.availableQuantity <= 0 : false

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <InventoryIcon color="primary" />
            <Box>
              <Typography variant="h6">Inventory Management</Typography>
              <Typography variant="body2" color="text.secondary">
                SKU: {inventoryItem?.sku || 'N/A'}
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

        {!inventoryItem ? (
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
                  {inventoryItem.productName || 'Unknown Product'}
                </Typography>
                <Box mt={0.5} display="flex" gap={1} alignItems="center">
                  {inventoryItem.productCategory && (
                    <Chip
                      label={inventoryItem.productCategory}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {inventoryItem.variantSize && (
                    <Chip label={inventoryItem.variantSize} size="small" variant="outlined" />
                  )}
                  {inventoryItem.variantColor && (
                    <Chip
                      label={inventoryItem.variantColor}
                      size="small"
                      sx={{
                        bgcolor: inventoryItem.variantColor,
                        color: ['white', 'yellow', 'cyan'].includes(
                          inventoryItem.variantColor.toLowerCase(),
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
                      {formatNumber(inventoryItem.stockQuantity)}
                    </Typography>
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary">
                      Reserved
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      {formatNumber(inventoryItem.reservedQuantity)}
                    </Typography>
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary">
                      Available
                    </Typography>
                    <Typography
                      variant="h6"
                      color={inventoryItem.availableQuantity > 0 ? 'success.main' : 'error.main'}
                    >
                      {formatNumber(inventoryItem.availableQuantity)}
                    </Typography>
                  </Box>
                </Box>
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
                    disabled={saving || inventoryItem.stockQuantity < 1}
                  >
                    -1
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<RemoveIcon />}
                    onClick={() => handleQuickAdjust(-5)}
                    disabled={saving || inventoryItem.stockQuantity < 5}
                  >
                    -5
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<RemoveIcon />}
                    onClick={() => handleQuickAdjust(-10)}
                    disabled={saving || inventoryItem.stockQuantity < 10}
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
                  href={`/manager/inventory/${inventoryItem.sku}`}
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
