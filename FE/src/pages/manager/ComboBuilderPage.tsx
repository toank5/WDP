import React, { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Stack,
  Divider,
  Tooltip,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalOffer as ComboIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Inventory as ProductIcon,
} from '@mui/icons-material'
import {
  getAllCombos,
  createCombo,
  updateCombo,
  updateComboStatus,
  deleteCombo,
  getComboStatistics,
  type Combo,
  type CreateComboDto,
  type UpdateComboDto,
} from '@/lib/combo-api'
import { getAllProducts, type Product } from '@/lib/product-api'

const ComboBuilderPage: React.FC = () => {
  const [combos, setCombos] = useState<Combo[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [frames, setFrames] = useState<Product[]>([])
  const [lenses, setLenses] = useState<Product[]>([])
  const [stats, setStats] = useState({
    totalCombos: 0,
    activeCombos: 0,
    featuredCombos: 0,
    expiringSoon: 0,
  })
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [comboToDelete, setComboToDelete] = useState<Combo | null>(null)

  // Form state
  const [formData, setFormData] = useState<CreateComboDto>({
    name: '',
    description: '',
    frameProductId: '',
    lensProductId: '',
    comboPrice: 0,
    originalPrice: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxPurchaseQuantity: 0,
    tags: [],
    isFeatured: false,
    status: 'active',
  })

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  const fetchCombos = useCallback(async () => {
    try {
      setLoading(true)
      const [combosData, statsData, productsData] = await Promise.all([
        getAllCombos({ limit: 100 }),
        getComboStatistics(),
        getAllProducts({ limit: 500, status: 'ACTIVE' }),
      ])
      setCombos(combosData.items)
      setStats(statsData)
      setProducts(productsData.items)
      setFrames(productsData.items.filter((p) => p.category === 'frame'))
      setLenses(productsData.items.filter((p) => p.category === 'lens'))
    } catch (error) {
      console.error('Error fetching data:', error)
      setSnackbar({
        open: true,
        message: 'Failed to load data',
        severity: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCombos()
  }, [fetchCombos])

  const handleOpenCreateDialog = () => {
    setEditingCombo(null)
    setFormData({
      name: '',
      description: '',
      frameProductId: '',
      lensProductId: '',
      comboPrice: 0,
      originalPrice: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      maxPurchaseQuantity: 0,
      tags: [],
      isFeatured: false,
      status: 'active',
    })
    setDialogOpen(true)
  }

  const handleOpenEditDialog = (combo: Combo) => {
    setEditingCombo(combo)
    setFormData({
      name: combo.name,
      description: combo.description,
      frameProductId: combo.frameProductId,
      lensProductId: combo.lensProductId,
      comboPrice: combo.comboPrice,
      originalPrice: combo.originalPrice,
      startDate: combo.startDate ? combo.startDate.split('T')[0] : '',
      endDate: combo.endDate ? combo.endDate.split('T')[0] : '',
      maxPurchaseQuantity: combo.maxPurchaseQuantity,
      tags: combo.tags,
      isFeatured: combo.isFeatured,
      status: combo.status,
    })
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingCombo(null)
  }

  const handleSave = async () => {
    try {
      if (editingCombo) {
        await updateCombo(editingCombo._id, formData as UpdateComboDto)
        setSnackbar({
          open: true,
          message: 'Combo updated successfully',
          severity: 'success',
        })
      } else {
        await createCombo(formData)
        setSnackbar({
          open: true,
          message: 'Combo created successfully',
          severity: 'success',
        })
      }
      handleCloseDialog()
      fetchCombos()
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to save combo',
        severity: 'error',
      })
    }
  }

  const handleToggleStatus = async (combo: Combo) => {
    try {
      const newStatus = combo.status === 'active' ? 'inactive' : 'active'
      await updateComboStatus(combo._id, newStatus)
      setSnackbar({
        open: true,
        message: `Combo ${newStatus}`,
        severity: 'success',
      })
      fetchCombos()
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update status',
        severity: 'error',
      })
    }
  }

  const handleOpenDeleteDialog = (combo: Combo) => {
    setComboToDelete(combo)
    setDeleteDialogOpen(true)
  }

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setComboToDelete(null)
  }

  const handleDelete = async () => {
    if (!comboToDelete) return

    try {
      await deleteCombo(comboToDelete._id)
      setSnackbar({
        open: true,
        message: 'Combo deleted successfully',
        severity: 'success',
      })
      handleCloseDeleteDialog()
      fetchCombos()
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to delete combo',
        severity: 'error',
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'default'
      case 'scheduled':
        return 'info'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getProductName = (productId: string) => {
    const product = products.find((p) => p._id === productId)
    return product?.name || productId
  }

  const calculateDiscount = () => {
    if (formData.originalPrice > 0) {
      const discount = formData.originalPrice - formData.comboPrice
      const percentage = (discount / formData.originalPrice) * 100
      return {
        amount: discount,
        percentage: percentage.toFixed(1),
      }
    }
    return { amount: 0, percentage: '0' }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ComboIcon sx={{ color: 'text.secondary' }} />
          <Typography
            variant="h1"
            sx={{
              fontSize: '1.25rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Combo Builder
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Create Combo
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">Total Combos</Typography>
            <Typography variant="h4">{stats.totalCombos}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.light', color: 'success.dark' }}>
            <Typography variant="body2">Active</Typography>
            <Typography variant="h4">{stats.activeCombos}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.dark' }}>
            <Typography variant="body2">Featured</Typography>
            <Typography variant="h4">{stats.featuredCombos}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'error.light', color: 'error.dark' }}>
            <Typography variant="body2">Expiring Soon</Typography>
            <Typography variant="h4">{stats.expiringSoon}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Combos Table */}
      <Paper variant="outlined">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Combo Name</TableCell>
                <TableCell>Frame</TableCell>
                <TableCell>Lens</TableCell>
                <TableCell>Original Price</TableCell>
                <TableCell>Combo Price</TableCell>
                <TableCell>Discount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {combos.map((combo) => (
                <TableRow key={combo._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {combo.name}
                      </Typography>
                      {combo.isFeatured && (
                        <Chip label="Featured" size="small" color="warning" />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {combo.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ProductIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {combo.frameName || getProductName(combo.frameProductId)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ProductIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {combo.lensName || getProductName(combo.lensProductId)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {combo.originalPrice.toLocaleString()} VND
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {combo.comboPrice.toLocaleString()} VND
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={`${combo.discountPercentage.toFixed(1)}%`}
                      color="success"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={getStatusLabel(combo.status)}
                      color={getStatusColor(combo.status) as any}
                      icon={combo.status === 'active' ? <ActiveIcon fontSize="small" /> : undefined}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Toggle status">
                      <IconButton
                        size="small"
                        onClick={() => handleToggleStatus(combo)}
                        color={combo.status === 'active' ? 'success' : 'default'}
                      >
                        {combo.status === 'active' ? <ActiveIcon /> : <InactiveIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenEditDialog(combo)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleOpenDeleteDialog(combo)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {combos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No combos found. Create your first combo to get started!
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCombo ? 'Edit Combo' : 'Create New Combo'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Combo Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Student Package - Round Frame + Single Vision Lens"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
                placeholder="Describe the benefits of this combo package..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Frame Product</InputLabel>
                <Select
                  value={formData.frameProductId}
                  label="Frame Product"
                  onChange={(e) => setFormData({ ...formData, frameProductId: e.target.value })}
                >
                  {frames.map((frame) => (
                    <MenuItem key={frame._id} value={frame._id}>
                      {frame.name} - {frame.basePrice.toLocaleString()} VND
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Lens Product</InputLabel>
                <Select
                  value={formData.lensProductId}
                  label="Lens Product"
                  onChange={(e) => setFormData({ ...formData, lensProductId: e.target.value })}
                >
                  {lenses.map((lens) => (
                    <MenuItem key={lens._id} value={lens._id}>
                      {lens.name} - {lens.basePrice.toLocaleString()} VND
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Original Price (VND)"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                helperText="Sum of frame + lens prices"
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Combo Price (VND)"
                value={formData.comboPrice}
                onChange={(e) => setFormData({ ...formData, comboPrice: Number(e.target.value) })}
                helperText="Special combo price"
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Customer Savings
                </Typography>
                <Typography variant="h6" color="success.dark">
                  {calculateDiscount().amount.toLocaleString()} VND
                  <Typography component="span" variant="body2">
                    ({calculateDiscount().percentage}% off)
                  </Typography>
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Purchase per Customer"
                value={formData.maxPurchaseQuantity || 0}
                onChange={(e) => setFormData({ ...formData, maxPurchaseQuantity: Number(e.target.value) || undefined })}
                helperText="0 = unlimited"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isFeatured || false}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    />
                  }
                  label="Featured Combo"
                />
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingCombo ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the combo "{comboToDelete?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ComboBuilderPage
