import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Switch,
  FormControlLabel,
  Stack,
  Container,
  Grid,
  Checkbox,
  Snackbar,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Slider,
  InputAdornment,
  Divider,
  Card,
  CardContent,
  Chip,
} from '@mui/material'
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Link as LinkIcon,
  Remove as RemoveIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material'
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  updateProduct,
  restoreProduct,
  type Product,
  type ProductVariant,
} from '@/lib/product-api'

// Constants
const CATEGORIES = ['frame', 'lens', 'service'] as const
const FRAME_TYPES = ['full-rim', 'half-rim', 'rimless'] as const
const FRAME_SHAPES = ['round', 'square', 'oval', 'cat-eye', 'aviator'] as const
const FRAME_MATERIALS = ['metal', 'plastic', 'mixed'] as const
const FRAME_GENDERS = ['men', 'women', 'unisex'] as const
const BRIDGE_FITS = ['standard', 'asian-fit'] as const
const LENS_TYPES = ['single-vision', 'bifocal', 'progressive', 'photochromic'] as const
const SERVICE_TYPES = ['eye-test', 'lens-cutting', 'frame-adjustment', 'cleaning'] as const
const VARIANT_COLORS = [
  'Black',
  'White',
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Gray',
  'Brown',
  'Gold',
  'Silver',
] as const

const PRICE_RANGES = {
  min: 0,
  max: 50000000,
  step: 100000,
}

// Utility Functions
const formatVNPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const getCategoryLabel = (category: string): string => {
  switch (category.toLowerCase()) {
    case 'frame':
      return 'Frame'
    case 'lens':
      return 'Lens'
    case 'service':
      return 'Service'
    default:
      return category
  }
}

const getCategoryColor = (category: string): 'primary' | 'secondary' | 'success' | 'info' => {
  switch (category.toLowerCase()) {
    case 'frame':
      return 'primary'
    case 'lens':
      return 'info'
    case 'service':
      return 'success'
    default:
      return 'primary'
  }
}

// Types
interface FormData {
  name: string
  description: string
  basePrice: number
  tags: string[]
  isActive: boolean
  images2D: string[]
  images3D: string[]
}

interface FrameData {
  frameType: (typeof FRAME_TYPES)[number]
  shape: (typeof FRAME_SHAPES)[number]
  material: (typeof FRAME_MATERIALS)[number]
  gender: (typeof FRAME_GENDERS)[number]
  bridgeFit: (typeof BRIDGE_FITS)[number]
}

interface LensData {
  lensType: (typeof LENS_TYPES)[number]
  index: number
  coatings: string
  isPrescriptionRequired: boolean
  minSPH: number
  maxSPH: number
  minCYL: number
  maxCYL: number
}

interface ServiceData {
  serviceType: (typeof SERVICE_TYPES)[number]
  durationMinutes: number
  serviceNotes: string
}

interface VariantForm {
  sku: string
  size: string
  color: string
  price: number
  weight: number
  images2D: string[]
  images3D: string[]
  isActive: boolean
}

interface ValidationErrors {
  [field: string]: string
}

// Price Input Component with Slider
function PriceInputWithSlider({
  label,
  value,
  onChange,
  error,
  helperText,
  min = PRICE_RANGES.min,
  max = PRICE_RANGES.max,
  required = false,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  error?: boolean
  helperText?: string
  min?: number
  max?: number
  required?: boolean
}) {
  const [inputValue, setInputValue] = useState(value.toString())

  const handleSliderChange = (_: Event, newValue: number | number[]) => {
    const numValue = Array.isArray(newValue) ? newValue[0] : newValue
    onChange(numValue)
    setInputValue(numValue.toString())
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const strValue = e.target.value
    setInputValue(strValue)

    const numValue = parseFloat(strValue)
    if (!isNaN(numValue)) {
      onChange(numValue)
    }
  }

  const handleInputBlur = () => {
    const numValue = parseFloat(inputValue)
    if (isNaN(numValue) || numValue < min) {
      setInputValue(min.toString())
      onChange(min)
    } else if (numValue > max) {
      setInputValue(max.toString())
      onChange(max)
    }
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
        {label} {required && <span style={{ color: 'red' }}>*</span>}
      </Typography>
      <Box sx={{ px: 1, mb: 1 }}>
        <Slider
          value={value}
          onChange={handleSliderChange}
          min={min}
          max={max}
          step={PRICE_RANGES.step}
          valueLabelDisplay="auto"
          valueLabelFormat={(val) => formatVNPrice(val)}
          sx={{
            color: error ? 'error.main' : 'primary.main',
            '& .MuiSlider-thumb': {
              width: 20,
              height: 20,
            },
          }}
        />
      </Box>
      <TextField
        fullWidth
        size="small"
        type="number"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        error={error}
        helperText={helperText || `Range: ${formatVNPrice(min)} - ${formatVNPrice(max)}`}
        InputProps={{
          startAdornment: <InputAdornment position="start">₫</InputAdornment>,
          inputProps: { min, max, step: PRICE_RANGES.step },
        }}
      />
    </Box>
  )
}

export function ProductManagementPage() {
  const navigate = useNavigate()

  // List view state
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [tabValue, setTabValue] = useState<'active' | 'deleted'>('active')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [activeFilter, setActiveFilter] = useState<string>('all')

  // Form state
  const [isCreating, setIsCreating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({ open: false, message: '', severity: 'success' })

  // Product data
  const [category, setCategory] = useState<'frame' | 'lens' | 'service'>('frame')
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    basePrice: 0,
    tags: [],
    isActive: true,
    images2D: [],
    images3D: [],
  })

  const [frameData, setFrameData] = useState<FrameData>({
    frameType: 'full-rim',
    shape: 'round',
    material: 'metal',
    gender: 'unisex',
    bridgeFit: 'standard',
  })

  const [lensData, setLensData] = useState<LensData>({
    lensType: 'single-vision',
    index: 1.5,
    coatings: '',
    isPrescriptionRequired: false,
    minSPH: 0,
    maxSPH: 0,
    minCYL: 0,
    maxCYL: 0,
  })

  const [serviceData, setServiceData] = useState<ServiceData>({
    serviceType: 'eye-test',
    durationMinutes: 30,
    serviceNotes: '',
  })

  // Variants
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null)
  const [variantForm, setVariantForm] = useState<VariantForm>({
    sku: '',
    size: '',
    color: '',
    price: 0,
    weight: 0,
    images2D: [],
    images3D: [],
    isActive: true,
  })

  // Validation
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})

  // Show snackbar
  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }, [])

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAllProducts()
      setProducts(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load products'
      showSnackbar(message, 'error')
    } finally {
      setLoading(false)
    }
  }, [showSnackbar])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Validation
  const validateForm = useCallback((): boolean => {
    const errors: ValidationErrors = {}

    // Basic validation
    if (!formData.name.trim()) {
      errors.name = 'Product name is required'
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Product name must be at least 3 characters'
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required'
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters'
    }

    if (formData.basePrice <= 0) {
      errors.basePrice = 'Base price must be greater than 0'
    }

    if (formData.images2D.length === 0 || formData.images2D.every((url) => !url.trim())) {
      errors.images2D = 'At least one 2D image URL is required'
    }

    // Category-specific validation
    if (category === 'frame') {
      if (!frameData.frameType) errors.frameType = 'Frame type is required'
      if (!frameData.shape) errors.shape = 'Shape is required'
      if (!frameData.material) errors.material = 'Material is required'
      if (variants.length === 0) {
        errors.variants = 'At least one variant is required for frame products'
      }
    } else if (category === 'lens') {
      if (!lensData.lensType) errors.lensType = 'Lens type is required'
      if (lensData.index < 1.5 || lensData.index > 2.0) {
        errors.index = 'Lens index must be between 1.5 and 2.0'
      }
    } else if (category === 'service') {
      if (!serviceData.serviceType) errors.serviceType = 'Service type is required'
      if (serviceData.durationMinutes < 1) {
        errors.durationMinutes = 'Duration must be at least 1 minute'
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData, category, frameData, lensData, serviceData, variants])

  // Reset forms
  const resetForms = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      basePrice: 0,
      tags: [],
      isActive: true,
      images2D: [],
      images3D: [],
    })
    setFrameData({
      frameType: 'full-rim',
      shape: 'round',
      material: 'metal',
      gender: 'unisex',
      bridgeFit: 'standard',
    })
    setLensData({
      lensType: 'single-vision',
      index: 1.5,
      coatings: '',
      isPrescriptionRequired: false,
      minSPH: 0,
      maxSPH: 0,
      minCYL: 0,
      maxCYL: 0,
    })
    setServiceData({
      serviceType: 'eye-test',
      durationMinutes: 30,
      serviceNotes: '',
    })
    setVariants([])
    setVariantForm({
      sku: '',
      size: '',
      color: '',
      price: 0,
      weight: 0,
      images2D: [],
      images3D: [],
      isActive: true,
    })
    setEditingVariantIndex(null)
    setValidationErrors({})
    setCategory('frame')
  }, [])

  // Variant handlers
  const handleAddVariant = useCallback(() => {
    const errors: ValidationErrors = {}

    if (!variantForm.sku.trim()) {
      errors.sku = 'SKU is required'
    }
    if (!variantForm.size.trim()) {
      errors.size = 'Size is required'
    }
    if (!variantForm.color.trim()) {
      errors.color = 'Color is required'
    }
    if (variantForm.price <= 0) {
      errors.price = 'Price must be greater than 0'
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      showSnackbar('Please fill all required variant fields', 'error')
      return
    }

    const newVariant: ProductVariant = {
      sku: variantForm.sku.toUpperCase().trim(),
      size: variantForm.size.trim(),
      color: variantForm.color.trim().toLowerCase(),
      price: variantForm.price,
      weight: variantForm.weight > 0 ? variantForm.weight : undefined,
      images2D: variantForm.images2D.filter((url) => url.trim()),
      images3D: variantForm.images3D.filter((url) => url.trim()),
      isActive: variantForm.isActive,
    }

    const skuExists = variants.some((v) => v.sku === newVariant.sku)
    if (skuExists) {
      showSnackbar(`Variant with SKU ${newVariant.sku} already exists`, 'error')
      return
    }

    if (editingVariantIndex !== null) {
      const updated = [...variants]
      updated[editingVariantIndex] = newVariant
      setVariants(updated)
      setEditingVariantIndex(null)
      showSnackbar('Variant updated', 'success')
    } else {
      setVariants([...variants, newVariant])
      showSnackbar('Variant added', 'success')
    }

    setVariantForm({
      sku: '',
      size: '',
      color: '',
      price: 0,
      weight: 0,
      images2D: [],
      images3D: [],
      isActive: true,
    })
    setValidationErrors({})
  }, [variantForm, variants, editingVariantIndex, showSnackbar])

  const handleDeleteVariant = useCallback(
    (index: number) => {
      setVariants(variants.filter((_, i) => i !== index))
      if (editingVariantIndex === index) {
        setEditingVariantIndex(null)
      }
    },
    [variants, editingVariantIndex]
  )

  const handleEditVariant = useCallback(
    (index: number) => {
      const variant = variants[index]
      setVariantForm({
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        price: variant.price || 0,
        weight: variant.weight || 0,
        images2D: variant.images2D || [],
        images3D: variant.images3D || [],
        isActive: variant.isActive ?? true,
      })
      setEditingVariantIndex(index)
    },
    [variants]
  )

  // Product CRUD
  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      showSnackbar('Please fix validation errors before submitting', 'error')
      return
    }

    try {
      setIsSubmitting(true)

      const basePayload = {
        name: formData.name.trim(),
        category,
        description: formData.description.trim(),
        basePrice: formData.basePrice,
        images2D: formData.images2D.filter((url) => url.trim()),
        images3D:
          formData.images3D.length > 0 ? formData.images3D.filter((url) => url.trim()) : undefined,
        tags: formData.tags,
        isActive: formData.isActive,
      }

      let payload: any

      if (category === 'frame') {
        payload = {
          ...basePayload,
          frameType: frameData.frameType,
          shape: frameData.shape,
          material: frameData.material,
          gender: frameData.gender,
          bridgeFit: frameData.bridgeFit,
          variants,
        }
      } else if (category === 'lens') {
        payload = {
          ...basePayload,
          lensType: lensData.lensType,
          index: lensData.index,
          coatings: lensData.coatings
            ? lensData.coatings
                .split(',')
                .map((c) => c.trim())
                .filter(Boolean)
            : [],
          isPrescriptionRequired: lensData.isPrescriptionRequired,
          suitableForPrescriptionRange: {
            minSPH: lensData.minSPH || undefined,
            maxSPH: lensData.maxSPH || undefined,
            minCYL: lensData.minCYL || undefined,
            maxCYL: lensData.maxCYL || undefined,
          },
          variants,
        }
      } else if (category === 'service') {
        payload = {
          ...basePayload,
          serviceType: serviceData.serviceType,
          durationMinutes: serviceData.durationMinutes,
          serviceNotes: serviceData.serviceNotes || undefined,
        }
      }

      if (editingId) {
        await updateProduct(editingId, payload)
        showSnackbar('Product updated successfully', 'success')
      } else {
        await createProduct(payload)
        showSnackbar('Product created successfully', 'success')
      }

      resetForms()
      setIsCreating(false)
      setEditingId(null)
      loadProducts()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Operation failed'
      showSnackbar(message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteConfirmId(id)
    setDeleteConfirmOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirmId) return

    try {
      await deleteProduct(deleteConfirmId)
      showSnackbar('Product deleted successfully', 'success')
      setDeleteConfirmOpen(false)
      setDeleteConfirmId(null)
      loadProducts()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed'
      showSnackbar(message, 'error')
    }
  }, [deleteConfirmId, loadProducts, showSnackbar])

  const handleRestore = useCallback(
    async (id: string) => {
      try {
        await restoreProduct(id)
        showSnackbar('Product restored successfully', 'success')
        loadProducts()
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Restore failed'
        showSnackbar(message, 'error')
      }
    },
    [loadProducts, showSnackbar]
  )

  const startEdit = useCallback(
    (product: Product) => {
      setEditingId(product._id)
      setIsCreating(true)
      setCategory(product.category as 'frame' | 'lens' | 'service')

      setFormData({
        name: product.name,
        description: product.description,
        basePrice: product.basePrice,
        tags: product.tags || [],
        isActive: product.isActive ?? true,
        images2D: product.images2D || [],
        images3D: product.images3D || [],
      })

      setVariants((product as Product & { variants?: ProductVariant[] }).variants || [])

      if (product.category === 'frame') {
        const p = product as Product & {
          frameType: string
          shape: string
          material: string
          gender?: string
          bridgeFit?: string
        }
        setFrameData({
          frameType: p.frameType as (typeof FRAME_TYPES)[number],
          shape: p.shape as (typeof FRAME_SHAPES)[number],
          material: p.material as (typeof FRAME_MATERIALS)[number],
          gender: (p.gender || 'unisex') as (typeof FRAME_GENDERS)[number],
          bridgeFit: (p.bridgeFit || 'standard') as (typeof BRIDGE_FITS)[number],
        })
      } else if (product.category === 'lens') {
        const p = product as Product & {
          lensType: string
          index: number
          coatings?: string[]
          isPrescriptionRequired: boolean
          suitableForPrescriptionRange?: {
            minSPH?: number
            maxSPH?: number
            minCYL?: number
            maxCYL?: number
          }
        }
        setLensData({
          lensType: p.lensType as (typeof LENS_TYPES)[number],
          index: p.index,
          coatings: p.coatings?.join(', ') || '',
          isPrescriptionRequired: p.isPrescriptionRequired,
          minSPH: p.suitableForPrescriptionRange?.minSPH || 0,
          maxSPH: p.suitableForPrescriptionRange?.maxSPH || 0,
          minCYL: p.suitableForPrescriptionRange?.minCYL || 0,
          maxCYL: p.suitableForPrescriptionRange?.maxCYL || 0,
        })
      } else if (product.category === 'service') {
        const p = product as Product & {
          serviceType: string
          durationMinutes: number
          serviceNotes?: string
        }
        setServiceData({
          serviceType: p.serviceType as (typeof SERVICE_TYPES)[number],
          durationMinutes: p.durationMinutes,
          serviceNotes: p.serviceNotes || '',
        })
      }
    },
    [loadProducts]
  )

  // Filter products
  const filteredProducts = products.filter((product) => {
    const isDeletedTab = tabValue === 'deleted'
    if (isDeletedTab !== !!product.isDeleted) return false
    if (categoryFilter !== 'all' && product.category !== categoryFilter) return false
    if (activeFilter === 'active' && !product.isActive) return false
    if (activeFilter === 'inactive' && product.isActive) return false
    return true
  })

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box my={3} display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  // ==================== LIST VIEW ====================
  if (!isCreating) {
    return (
      <Container maxWidth="lg">
        <Box my={3}>
          {/* Header */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h4" fontWeight={600}>
                  Products
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage your product inventory
                </Typography>
              </Box>
              <Box display="flex" gap={2}>
                <IconButton onClick={loadProducts} color="primary">
                  <RefreshIcon />
                </IconButton>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    resetForms()
                    setIsCreating(true)
                    setEditingId(null)
                  }}
                >
                  Create Product
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle2" sx={{ minWidth: 60 }}>
                Filters:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="frame">Frame</MenuItem>
                  <MenuItem value="lens">Lens</MenuItem>
                  <MenuItem value="service">Service</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={activeFilter}
                  label="Status"
                  onChange={(e) => setActiveFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>View</InputLabel>
                <Select
                  value={tabValue}
                  label="View"
                  onChange={(e) => setTabValue(e.target.value as 'active' | 'deleted')}
                >
                  <MenuItem value="active">Active Products</MenuItem>
                  <MenuItem value="deleted">Deleted Products</MenuItem>
                </Select>
              </FormControl>

              <Box flexGrow={1} />
              <Chip
                label={`${filteredProducts.length} items`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Stack>
          </Paper>

          {/* Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Base Price
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Updated</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Box py={6}>
                        <Typography color="text.secondary" gutterBottom>
                          No products found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Try adjusting your filters or create a new product
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product._id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {product.name}
                          </Typography>
                          {product.slug && (
                            <Typography variant="caption" color="text.secondary">
                              SKU: {product.slug}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getCategoryLabel(product.category)}
                          color={getCategoryColor(product.category)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={500} color="primary.main">
                          {formatVNPrice(product.basePrice)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.isActive ? 'Active' : 'Inactive'}
                          color={product.isActive ? 'success' : 'default'}
                          size="small"
                          variant={product.isActive ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(product.updatedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {tabValue === 'active' ? (
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={() => startEdit(product)}
                            >
                              Edit
                            </Button>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(product._id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => handleRestore(product._id)}
                          >
                            Restore
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteConfirmOpen}
            onClose={() => setDeleteConfirmOpen(false)}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle>Delete Product</DialogTitle>
            <DialogContent>
              <Typography>Are you sure you want to delete this product?</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                This action can be undone from the Deleted Products tab.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
              <Button
                onClick={handleDeleteConfirm}
                color="error"
                variant="contained"
                startIcon={<DeleteIcon />}
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>

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

  // ==================== FORM VIEW ====================
  return (
    <Container maxWidth="md">
      <Box my={3}>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" fontWeight={600}>
                {editingId ? 'Edit Product' : 'Create Product'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {editingId
                  ? 'Update product information'
                  : 'Fill in the details to create a new product'}
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<CloseIcon />}
                onClick={() => {
                  setIsCreating(false)
                  setEditingId(null)
                  resetForms()
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={isSubmitting ? <CircularProgress size={16} /> : <SaveIcon />}
                disabled={isSubmitting}
                type="submit"
                form="product-form"
              >
                {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
            </Box>
          </Box>
        </Paper>

        <form id="product-form" onSubmit={handleCreateOrUpdate}>
          <Stack spacing={2}>
            {/* Basic Info */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid size={12}>
                    <TextField
                      label="Product Name"
                      fullWidth
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value })
                        if (validationErrors.name) {
                          setValidationErrors({ ...validationErrors, name: '' })
                        }
                      }}
                      error={!!validationErrors.name}
                      helperText={
                        validationErrors.name ||
                        'Enter a descriptive product name (min. 3 characters)'
                      }
                      placeholder="e.g., Classic Round Titanium Frame"
                    />
                  </Grid>

                  <Grid size={12}>
                    <TextField
                      label="Description"
                      fullWidth
                      multiline
                      rows={4}
                      value={formData.description}
                      onChange={(e) => {
                        setFormData({ ...formData, description: e.target.value })
                        if (validationErrors.description) {
                          setValidationErrors({ ...validationErrors, description: '' })
                        }
                      }}
                      error={!!validationErrors.description}
                      helperText={
                        validationErrors.description ||
                        'Describe features, materials, and benefits (min. 10 characters)'
                      }
                      placeholder="Enter a detailed product description..."
                    />
                  </Grid>

                  <Grid size={6}>
                    <PriceInputWithSlider
                      label="Base Price"
                      value={formData.basePrice}
                      onChange={(value) => {
                        setFormData({ ...formData, basePrice: value })
                        if (validationErrors.basePrice) {
                          setValidationErrors({ ...validationErrors, basePrice: '' })
                        }
                      }}
                      error={!!validationErrors.basePrice}
                      helperText={validationErrors.basePrice}
                      required
                    />
                  </Grid>

                  <Grid size={6}>
                    <FormControl fullWidth disabled={!!editingId}>
                      <InputLabel>Category *</InputLabel>
                      <Select
                        value={category}
                        label="Category *"
                        onChange={(e) => {
                          setCategory(e.target.value as 'frame' | 'lens' | 'service')
                          setVariants([])
                        }}
                      >
                        {CATEGORIES.map((cat) => (
                          <MenuItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={12}>
                    <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" p={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight={500}>
                            Product Status
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Chip
                            label={formData.isActive ? 'Active' : 'Inactive'}
                            color={formData.isActive ? 'success' : 'default'}
                            size="small"
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.isActive}
                                onChange={(e) =>
                                  setFormData({ ...formData, isActive: e.target.checked })
                                }
                                color="success"
                              />
                            }
                            label=""
                          />
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Media Section */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Images & Media
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={3}>
                  <Grid size={12}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
                      2D Images *
                    </Typography>
                    <Stack spacing={1}>
                      {formData.images2D.map((url, index) => (
                        <Box key={index} display="flex" gap={1} alignItems="center">
                          <TextField
                            fullWidth
                            size="small"
                            value={url}
                            onChange={(e) => {
                              const updated = [...formData.images2D]
                              updated[index] = e.target.value
                              setFormData({ ...formData, images2D: updated })
                              if (validationErrors.images2D) {
                                setValidationErrors({ ...validationErrors, images2D: '' })
                              }
                            }}
                            placeholder="https://example.com/image.jpg"
                            error={!!validationErrors.images2D && index === 0}
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                images2D: formData.images2D.filter((_, i) => i !== index),
                              })
                            }}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() =>
                          setFormData({ ...formData, images2D: [...formData.images2D, ''] })
                        }
                        sx={{ mt: 1 }}
                      >
                        Add Image URL
                      </Button>
                      {validationErrors.images2D && (
                        <Typography variant="caption" color="error">
                          {validationErrors.images2D}
                        </Typography>
                      )}
                    </Stack>
                  </Grid>

                  <Grid size={12}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
                      3D Models (Optional)
                    </Typography>
                    <Stack spacing={1}>
                      {formData.images3D.map((url, index) => (
                        <Box key={index} display="flex" gap={1} alignItems="center">
                          <TextField
                            fullWidth
                            size="small"
                            value={url}
                            onChange={(e) => {
                              const updated = [...formData.images3D]
                              updated[index] = e.target.value
                              setFormData({ ...formData, images3D: updated })
                            }}
                            placeholder="https://example.com/model.glb"
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                images3D: formData.images3D.filter((_, i) => i !== index),
                              })
                            }}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<LinkIcon />}
                        onClick={() =>
                          setFormData({ ...formData, images3D: [...formData.images3D, ''] })
                        }
                        sx={{ mt: 1 }}
                      >
                        Add 3D Model URL
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Category-specific Section */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  {category === 'frame' && 'Frame Details'}
                  {category === 'lens' && 'Lens Details'}
                  {category === 'service' && 'Service Details'}
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {category === 'frame' && (
                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <FormControl fullWidth error={!!validationErrors.frameType}>
                        <InputLabel>Frame Type *</InputLabel>
                        <Select
                          value={frameData.frameType}
                          label="Frame Type *"
                          onChange={(e) => {
                            setFrameData({
                              ...frameData,
                              frameType: e.target.value as (typeof FRAME_TYPES)[number],
                            })
                            if (validationErrors.frameType) {
                              setValidationErrors({ ...validationErrors, frameType: '' })
                            }
                          }}
                        >
                          {FRAME_TYPES.map((type) => (
                            <MenuItem key={type} value={type}>
                              {type
                                .split('-')
                                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ')}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={6}>
                      <FormControl fullWidth error={!!validationErrors.shape}>
                        <InputLabel>Shape *</InputLabel>
                        <Select
                          value={frameData.shape}
                          label="Shape *"
                          onChange={(e) => {
                            setFrameData({
                              ...frameData,
                              shape: e.target.value as (typeof FRAME_SHAPES)[number],
                            })
                            if (validationErrors.shape) {
                              setValidationErrors({ ...validationErrors, shape: '' })
                            }
                          }}
                        >
                          {FRAME_SHAPES.map((shape) => (
                            <MenuItem key={shape} value={shape}>
                              {shape.charAt(0).toUpperCase() + shape.slice(1)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={6}>
                      <FormControl fullWidth error={!!validationErrors.material}>
                        <InputLabel>Material *</InputLabel>
                        <Select
                          value={frameData.material}
                          label="Material *"
                          onChange={(e) => {
                            setFrameData({
                              ...frameData,
                              material: e.target.value as (typeof FRAME_MATERIALS)[number],
                            })
                            if (validationErrors.material) {
                              setValidationErrors({ ...validationErrors, material: '' })
                            }
                          }}
                        >
                          {FRAME_MATERIALS.map((material) => (
                            <MenuItem key={material} value={material}>
                              {material.charAt(0).toUpperCase() + material.slice(1)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={6}>
                      <FormControl fullWidth>
                        <InputLabel>Gender</InputLabel>
                        <Select
                          value={frameData.gender}
                          label="Gender"
                          onChange={(e) =>
                            setFrameData({
                              ...frameData,
                              gender: e.target.value as (typeof FRAME_GENDERS)[number],
                            })
                          }
                        >
                          {FRAME_GENDERS.map((gender) => (
                            <MenuItem key={gender} value={gender}>
                              {gender.charAt(0).toUpperCase() + gender.slice(1)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={6}>
                      <FormControl fullWidth>
                        <InputLabel>Bridge Fit</InputLabel>
                        <Select
                          value={frameData.bridgeFit}
                          label="Bridge Fit"
                          onChange={(e) =>
                            setFrameData({
                              ...frameData,
                              bridgeFit: e.target.value as (typeof BRIDGE_FITS)[number],
                            })
                          }
                        >
                          {BRIDGE_FITS.map((fit) => (
                            <MenuItem key={fit} value={fit}>
                              {fit
                                .split('-')
                                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ')}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                )}

                {category === 'lens' && (
                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <FormControl fullWidth error={!!validationErrors.lensType}>
                        <InputLabel>Lens Type *</InputLabel>
                        <Select
                          value={lensData.lensType}
                          label="Lens Type *"
                          onChange={(e) => {
                            setLensData({
                              ...lensData,
                              lensType: e.target.value as (typeof LENS_TYPES)[number],
                            })
                            if (validationErrors.lensType) {
                              setValidationErrors({ ...validationErrors, lensType: '' })
                            }
                          }}
                        >
                          {LENS_TYPES.map((type) => (
                            <MenuItem key={type} value={type}>
                              {type
                                .split('-')
                                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ')}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Refractive Index *"
                        value={lensData.index}
                        onChange={(e) =>
                          setLensData({ ...lensData, index: parseFloat(e.target.value) || 1.5 })
                        }
                        error={!!validationErrors.index}
                        helperText={validationErrors.index || 'Range: 1.5 - 2.0'}
                        inputProps={{ step: 0.01, min: 1.5, max: 2.0 }}
                      />
                    </Grid>
                    <Grid size={12}>
                      <TextField
                        fullWidth
                        label="Coatings"
                        value={lensData.coatings}
                        onChange={(e) => setLensData({ ...lensData, coatings: e.target.value })}
                        placeholder="Anti-reflective, UV protection, Scratch resistant"
                        helperText="Separate with commas (e.g., AR, UV, Scratch)"
                      />
                    </Grid>
                    <Grid size={12}>
                      <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          p={2}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              Prescription Required
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {lensData.isPrescriptionRequired
                                ? 'Customer must provide prescription'
                                : 'No prescription needed'}
                            </Typography>
                          </Box>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={lensData.isPrescriptionRequired}
                                onChange={(e) =>
                                  setLensData({
                                    ...lensData,
                                    isPrescriptionRequired: e.target.checked,
                                  })
                                }
                                color="primary"
                              />
                            }
                            label=""
                          />
                        </Box>
                      </Card>
                    </Grid>
                    {lensData.isPrescriptionRequired && (
                      <>
                        <Grid size={12}>
                          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
                            Prescription Range
                          </Typography>
                        </Grid>
                        <Grid size={6}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Min SPH"
                            value={lensData.minSPH}
                            onChange={(e) =>
                              setLensData({ ...lensData, minSPH: parseFloat(e.target.value) || 0 })
                            }
                            inputProps={{ step: 0.25 }}
                          />
                        </Grid>
                        <Grid size={6}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Max SPH"
                            value={lensData.maxSPH}
                            onChange={(e) =>
                              setLensData({ ...lensData, maxSPH: parseFloat(e.target.value) || 0 })
                            }
                            inputProps={{ step: 0.25 }}
                          />
                        </Grid>
                        <Grid size={6}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Min CYL"
                            value={lensData.minCYL}
                            onChange={(e) =>
                              setLensData({ ...lensData, minCYL: parseFloat(e.target.value) || 0 })
                            }
                            inputProps={{ step: 0.25 }}
                          />
                        </Grid>
                        <Grid size={6}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Max CYL"
                            value={lensData.maxCYL}
                            onChange={(e) =>
                              setLensData({ ...lensData, maxCYL: parseFloat(e.target.value) || 0 })
                            }
                            inputProps={{ step: 0.25 }}
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                )}

                {category === 'service' && (
                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <FormControl fullWidth error={!!validationErrors.serviceType}>
                        <InputLabel>Service Type *</InputLabel>
                        <Select
                          value={serviceData.serviceType}
                          label="Service Type *"
                          onChange={(e) => {
                            setServiceData({
                              ...serviceData,
                              serviceType: e.target.value as (typeof SERVICE_TYPES)[number],
                            })
                            if (validationErrors.serviceType) {
                              setValidationErrors({ ...validationErrors, serviceType: '' })
                            }
                          }}
                        >
                          {SERVICE_TYPES.map((type) => (
                            <MenuItem key={type} value={type}>
                              {type
                                .split('-')
                                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ')}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Duration (minutes) *"
                        value={serviceData.durationMinutes}
                        onChange={(e) =>
                          setServiceData({
                            ...serviceData,
                            durationMinutes: parseInt(e.target.value) || 1,
                          })
                        }
                        error={!!validationErrors.durationMinutes}
                        helperText={validationErrors.durationMinutes || 'Minimum 1 minute'}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid size={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Service Notes"
                        value={serviceData.serviceNotes}
                        onChange={(e) =>
                          setServiceData({ ...serviceData, serviceNotes: e.target.value })
                        }
                        placeholder="Additional information about the service..."
                      />
                    </Grid>
                  </Grid>
                )}
              </CardContent>
            </Card>

            {/* Variants Section (for frames and lenses) */}
            {(category === 'frame' || category === 'lens') && (
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight={600}>
                      Variants
                    </Typography>
                    <Chip
                      label={`${variants.length} added`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  <Divider sx={{ mb: 2 }} />

                  {validationErrors.variants && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {validationErrors.variants}
                    </Alert>
                  )}

                  {/* Variant Form */}
                  <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle2" gutterBottom fontWeight={500}>
                      {editingVariantIndex !== null ? 'Edit Variant' : 'Add New Variant'}
                    </Typography>
                    <Grid container spacing={2} mt={1}>
                      <Grid size={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="SKU *"
                          value={variantForm.sku}
                          onChange={(e) =>
                            setVariantForm({ ...variantForm, sku: e.target.value.toUpperCase() })
                          }
                          error={!!validationErrors.sku}
                          helperText={validationErrors.sku || 'Unique identifier'}
                          placeholder="e.g., FRAME-BLK-52"
                        />
                      </Grid>
                      <Grid size={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Size *"
                          value={variantForm.size}
                          onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                          error={!!validationErrors.size}
                          placeholder="e.g., 52mm"
                        />
                      </Grid>
                      <Grid size={6}>
                        <FormControl fullWidth size="small" error={!!validationErrors.color}>
                          <InputLabel>Color *</InputLabel>
                          <Select
                            value={variantForm.color}
                            label="Color *"
                            onChange={(e) =>
                              setVariantForm({ ...variantForm, color: e.target.value })
                            }
                          >
                            {VARIANT_COLORS.map((color) => (
                              <MenuItem key={color} value={color.toLowerCase()}>
                                {color}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={6}>
                        <PriceInputWithSlider
                          label="Variant Price *"
                          value={variantForm.price}
                          onChange={(value) => setVariantForm({ ...variantForm, price: value })}
                          error={!!validationErrors.price}
                          helperText={validationErrors.price}
                          min={0}
                          max={20000000}
                        />
                      </Grid>
                      <Grid size={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Weight (g)"
                          value={variantForm.weight}
                          onChange={(e) =>
                            setVariantForm({
                              ...variantForm,
                              weight: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="Optional"
                        />
                      </Grid>
                      <Grid size={6}>
                        <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                          <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            p={1.5}
                          >
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2">Active</Typography>
                              <Checkbox
                                checked={variantForm.isActive}
                                onChange={(e) =>
                                  setVariantForm({ ...variantForm, isActive: e.target.checked })
                                }
                              />
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                      <Grid size={12}>
                        <Box display="flex" gap={1}>
                          <Button
                            fullWidth
                            variant="contained"
                            onClick={handleAddVariant}
                            startIcon={editingVariantIndex !== null ? <SaveIcon /> : <AddIcon />}
                          >
                            {editingVariantIndex !== null ? 'Update Variant' : 'Add Variant'}
                          </Button>
                          {editingVariantIndex !== null && (
                            <Button
                              variant="outlined"
                              onClick={() => {
                                setEditingVariantIndex(null)
                                setVariantForm({
                                  sku: '',
                                  size: '',
                                  color: '',
                                  price: 0,
                                  weight: 0,
                                  images2D: [],
                                  images3D: [],
                                  isActive: true,
                                })
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Variants Table */}
                  {variants.length > 0 && (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>SKU</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Size</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Color</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">
                              Price
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">
                              Actions
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {variants.map((variant, index) => (
                            <TableRow key={variant.sku} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight={500}>
                                  {variant.sku}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={variant.size} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={variant.color}
                                  size="small"
                                  sx={{
                                    bgcolor: variant.color,
                                    color: ['white', 'yellow', 'cyan'].includes(
                                      variant.color.toLowerCase()
                                    )
                                      ? 'black'
                                      : 'white',
                                  }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight={500} color="primary.main">
                                  {formatVNPrice(variant.price || 0)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={variant.isActive ? 'Active' : 'Inactive'}
                                  color={variant.isActive ? 'success' : 'default'}
                                  size="small"
                                  variant={variant.isActive ? 'filled' : 'outlined'}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  <IconButton size="small" onClick={() => handleEditVariant(index)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<InventoryIcon fontSize="small" />}
                                    onClick={() => navigate(`/manager/inventory/${variant.sku}`)}
                                    sx={{ minWidth: 'auto', px: 1 }}
                                  >
                                    Stock
                                  </Button>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteVariant(index)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Form Actions */}
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="flex-end" gap={2}>
                  <Button
                    variant="outlined"
                    startIcon={<CloseIcon />}
                    onClick={() => {
                      setIsCreating(false)
                      setEditingId(null)
                      resetForms()
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={isSubmitting ? <CircularProgress size={16} /> : <SaveIcon />}
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </form>

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
