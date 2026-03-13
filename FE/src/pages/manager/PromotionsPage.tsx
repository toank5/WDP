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
  Card,
  CardContent,
  Stack,
  Divider,
  Tooltip,
  Grid,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalOffer as CouponIcon,
  TrendingUp as PercentageIcon,
  AttachMoney as FixedIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material'
import {
  getAllPromotions,
  createPromotion,
  updatePromotion,
  updatePromotionStatus,
  deletePromotion,
  getPromotionStatistics,
  type Promotion,
  type CreatePromotionDto,
  type UpdatePromotionDto,
  PromotionType,
  PromotionStatus,
} from '@/lib/promotion-api'

const PromotionsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [stats, setStats] = useState({
    totalPromotions: 0,
    activePromotions: 0,
    scheduledPromotions: 0,
    expiredPromotions: 0,
    featuredPromotions: 0,
    totalUsage: 0,
  })
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(null)

  // Form state
  const [formData, setFormData] = useState<CreatePromotionDto>({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    minOrderValue: 0,
    scope: 'all_orders',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: 0,
    maxUsesPerCustomer: 1,
    isStackable: false,
    isFeatured: false,
    status: 'active',
  })

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true)
      const [promotionsData, statsData] = await Promise.all([
        getAllPromotions({ limit: 100 }),
        getPromotionStatistics(),
      ])
      setPromotions(promotionsData.items)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching promotions:', error)
      setSnackbar({
        open: true,
        message: 'Failed to load promotions',
        severity: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPromotions()
  }, [fetchPromotions])

  const handleOpenCreateDialog = () => {
    setEditingPromotion(null)
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      minOrderValue: 0,
      scope: 'all_orders',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usageLimit: 0,
      maxUsesPerCustomer: 1,
      isStackable: false,
      isFeatured: false,
      status: 'active',
    })
    setDialogOpen(true)
  }

  const handleOpenEditDialog = (promotion: Promotion) => {
    setEditingPromotion(promotion)
    setFormData({
      code: promotion.code,
      name: promotion.name,
      description: promotion.description,
      type: promotion.type,
      value: promotion.value,
      minOrderValue: promotion.minOrderValue,
      scope: promotion.scope,
      applicableCategories: promotion.applicableCategories,
      applicableProductIds: promotion.applicableProductIds,
      startDate: promotion.startDate.split('T')[0],
      endDate: promotion.endDate.split('T')[0],
      usageLimit: promotion.usageLimit,
      maxUsesPerCustomer: promotion.maxUsesPerCustomer,
      isStackable: promotion.isStackable,
      tags: promotion.tags,
      isFeatured: promotion.isFeatured,
      status: promotion.status,
    })
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingPromotion(null)
  }

  const handleSave = async () => {
    try {
      if (editingPromotion) {
        await updatePromotion(editingPromotion._id, formData as UpdatePromotionDto)
        setSnackbar({
          open: true,
          message: 'Promotion updated successfully',
          severity: 'success',
        })
      } else {
        await createPromotion(formData)
        setSnackbar({
          open: true,
          message: 'Promotion created successfully',
          severity: 'success',
        })
      }
      handleCloseDialog()
      fetchPromotions()
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to save promotion',
        severity: 'error',
      })
    }
  }

  const handleToggleStatus = async (promotion: Promotion) => {
    try {
      const newStatus: PromotionStatus =
        promotion.status === 'active' ? 'inactive' : 'active'
      await updatePromotionStatus(promotion._id, newStatus)
      setSnackbar({
        open: true,
        message: `Promotion ${newStatus}`,
        severity: 'success',
      })
      fetchPromotions()
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update status',
        severity: 'error',
      })
    }
  }

  const handleOpenDeleteDialog = (promotion: Promotion) => {
    setPromotionToDelete(promotion)
    setDeleteDialogOpen(true)
  }

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setPromotionToDelete(null)
  }

  const handleDelete = async () => {
    if (!promotionToDelete) return

    try {
      await deletePromotion(promotionToDelete._id)
      setSnackbar({
        open: true,
        message: 'Promotion deleted successfully',
        severity: 'success',
      })
      handleCloseDeleteDialog()
      fetchPromotions()
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to delete promotion',
        severity: 'error',
      })
    }
  }

  const getStatusColor = (status: PromotionStatus) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'default'
      case 'scheduled':
        return 'info'
      case 'expired':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: PromotionStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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
          <CouponIcon sx={{ color: 'text.secondary' }} />
          <Typography
            variant="h1"
            sx={{
              fontSize: '1.25rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Promotion Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Create Promotion
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">Total</Typography>
            <Typography variant="h4">{stats.totalPromotions}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.light', color: 'success.dark' }}>
            <Typography variant="body2">Active</Typography>
            <Typography variant="h4">{stats.activePromotions}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.light', color: 'info.dark' }}>
            <Typography variant="body2">Scheduled</Typography>
            <Typography variant="h4">{stats.scheduledPromotions}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.dark' }}>
            <Typography variant="body2">Featured</Typography>
            <Typography variant="h4">{stats.featuredPromotions}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">Total Usage</Typography>
            <Typography variant="h4">{stats.totalUsage}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Promotions Table */}
      <Paper variant="outlined">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Min Order</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Usage</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {promotions.map((promotion) => (
                <TableRow key={promotion._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                        {promotion.code}
                      </Typography>
                      {promotion.isFeatured && (
                        <Chip label="Featured" size="small" color="warning" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{promotion.name}</Typography>
                      {promotion.description && (
                        <Typography variant="caption" color="text.secondary">
                          {promotion.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {promotion.type === 'percentage' ? (
                        <PercentageIcon fontSize="small" />
                      ) : (
                        <FixedIcon fontSize="small" />
                      )}
                      <Typography variant="body2">
                        {promotion.type === 'percentage' ? '%' : 'Fixed'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {promotion.type === 'percentage'
                        ? `${promotion.value}%`
                        : `${promotion.value.toLocaleString()} VND`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {promotion.minOrderValue.toLocaleString()} VND
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarIcon fontSize="small" />
                      <Typography variant="caption">
                        {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {promotion.usageCount}
                        {promotion.usageLimit && ` / ${promotion.usageLimit}`}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={getStatusLabel(promotion.status)}
                      color={getStatusColor(promotion.status) as any}
                      icon={promotion.status === 'active' ? <ActiveIcon fontSize="small" /> : undefined}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Toggle status">
                      <IconButton
                        size="small"
                        onClick={() => handleToggleStatus(promotion)}
                        color={promotion.status === 'active' ? 'success' : 'default'}
                      >
                        {promotion.status === 'active' ? <ActiveIcon /> : <InactiveIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenEditDialog(promotion)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleOpenDeleteDialog(promotion)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Promotion Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                disabled={!!editingPromotion}
                helperText={editingPromotion ? 'Code cannot be changed' : 'Unique code for the promotion'}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as PromotionType })}
                >
                  <MenuItem value="percentage">Percentage</MenuItem>
                  <MenuItem value="fixed_amount">Fixed Amount</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Promotion Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                label={`Discount ${formData.type === 'percentage' ? '(%)' : '(VND)'}`}
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Min Order Value (VND)"
                value={formData.minOrderValue}
                onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Usage Limit (0 = unlimited)"
                value={formData.usageLimit || 0}
                onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) || undefined })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as PromotionStatus })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Stack direction="row" spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isFeatured || false}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    />
                  }
                  label="Featured Promotion"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isStackable || false}
                      onChange={(e) => setFormData({ ...formData, isStackable: e.target.checked })}
                    />
                  }
                  label="Stackable with others"
                />
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingPromotion ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the promotion "{promotionToDelete?.code}"?
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

export default PromotionsPage
