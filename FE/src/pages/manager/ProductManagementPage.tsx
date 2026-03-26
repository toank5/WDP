import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
  CardMedia,
  LinearProgress,
  Grid,
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
  Image as ImageIcon,
  ViewInAr as ModelIcon,
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
import { uploadImages2D, uploadImages3D } from '@/lib/media-api'
import {
  useProductDraftStore,
  type ProductDraft,
  type DraftVariant,
} from '@/store/productDraft.store'
import { VariantMediaDialog } from '@/components/manager/VariantMediaDialog'
import { VariantInventoryDialog } from '@/components/manager/VariantInventoryDialog'

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
  isPreorderEnabled: boolean
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
  coatings: string[]
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
  // Existing URLs (already uploaded, from previous save or initial edit)
  images2DUrls: string[]
  images3DUrls: string[]
  // New files not yet uploaded
  images2DFiles: File[]
  images3DFiles: File[]
  isActive: boolean
}

// Variant type used in form state - includes both URLs and pending files
type FormVariant = ProductVariant & {
  images2DFiles: File[]
  images3DFiles: File[]
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
          inputProps: { min, max },
        }}
      />
    </Box>
  )
}

// Frame Size Input Component (format: LensWidth-BridgeWidth-TempleLength, e.g., "52-18-140")
interface FrameSizeInputProps {
  value: string
  onChange: (value: string) => void
  error?: boolean
  required?: boolean
}

function FrameSizeInput({ value, onChange, error, required }: FrameSizeInputProps) {
  // Parse the size string "52-18-140" into parts
  const parseSize = (sizeStr: string) => {
    const parts = sizeStr.split('-').map((s) => parseInt(s, 10))
    return {
      lensWidth: isNaN(parts[0]) ? '' : parts[0],
      bridgeWidth: isNaN(parts[1]) ? '' : parts[1],
      templeLength: isNaN(parts[2]) ? '' : parts[2],
    }
  }

  const parsed = parseSize(value)

  const handlePartChange = (part: 'lensWidth' | 'bridgeWidth' | 'templeLength', newValue: string) => {
    const numValue = parseInt(newValue, 10)
    const updated = { ...parsed, [part]: isNaN(numValue) ? '' : numValue }

    // Only format if all parts have values
    if (updated.lensWidth && updated.bridgeWidth && updated.templeLength) {
      onChange(`${updated.lensWidth}-${updated.bridgeWidth}-${updated.templeLength}`)
    } else if (updated.lensWidth || updated.bridgeWidth || updated.templeLength) {
      // Partial input - don't format yet
      onChange(
        `${updated.lensWidth || ''}${updated.bridgeWidth ? '-' + updated.bridgeWidth : ''}${updated.templeLength ? '-' + updated.templeLength : ''}`
      )
    } else {
      onChange('')
    }
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
        Size (Lens-Bridge-Temple) {required && <span style={{ color: 'red' }}>*</span>}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          size="small"
          type="number"
          label="Lens"
          placeholder="52"
          value={parsed.lensWidth}
          onChange={(e) => handlePartChange('lensWidth', e.target.value)}
          error={error}
          inputProps={{ min: 40, max: 65, style: { textAlign: 'center' } }}
          sx={{ flex: 1 }}
        />
        <Typography sx={{ color: 'text.secondary' }}>-</Typography>
        <TextField
          size="small"
          type="number"
          label="Bridge"
          placeholder="18"
          value={parsed.bridgeWidth}
          onChange={(e) => handlePartChange('bridgeWidth', e.target.value)}
          error={error}
          inputProps={{ min: 12, max: 25, style: { textAlign: 'center' } }}
          sx={{ flex: 1 }}
        />
        <Typography sx={{ color: 'text.secondary' }}>-</Typography>
        <TextField
          size="small"
          type="number"
          label="Temple"
          placeholder="140"
          value={parsed.templeLength}
          onChange={(e) => handlePartChange('templeLength', e.target.value)}
          error={error}
          inputProps={{ min: 120, max: 155, style: { textAlign: 'center' } }}
          sx={{ flex: 1 }}
        />
      </Box>
      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
          Format: Lens Width (40-65) - Bridge (12-25) - Temple (120-155)
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        Example: 52-18-140 (52mm lens, 18mm bridge, 140mm temple)
      </Typography>
    </Box>
  )
}

export function ProductManagementPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Draft store
  const { draft, setDraft, clearDraft, hasDraft } = useProductDraftStore()

  // Variant media dialog state
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false)
  const [currentVariantIndex, setCurrentVariantIndex] = useState<number | null>(null)

  // Variant inventory dialog state
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false)
  const [inventoryVariant, setInventoryVariant] = useState<FormVariant | null>(null)

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
    isPreorderEnabled: false,
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
    coatings: [],
  })

  const [coatingInput, setCoatingInput] = useState('')

  const [serviceData, setServiceData] = useState<ServiceData>({
    serviceType: 'eye-test',
    durationMinutes: 30,
    serviceNotes: '',
  })

  // Variants
  const [variants, setVariants] = useState<FormVariant[]>([])
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null)
  const [variantForm, setVariantForm] = useState<VariantForm>({
    sku: '',
    size: '',
    color: '',
    price: 0,
    weight: 0,
    images2DUrls: [],
    images3DUrls: [],
    images2DFiles: [],
    images3DFiles: [],
    isActive: true,
  })

  // Validation
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})

  // Media file state (pending upload, stored until form submit)
  const [pendingImage2DFiles, setPendingImage2DFiles] = useState<File[]>([])
  const [pendingImage3DFiles, setPendingImage3DFiles] = useState<File[]>([])

  // Upload state (during submission)
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)

  // Tags input state
  const [tagInput, setTagInput] = useState('')

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

  // Auto-save draft on unmount when creating or editing
  useEffect(() => {
    if (!isCreating) return

    return () => {
      // Save draft when component unmounts (navigation, page close, etc.)
      const currentDraft: ProductDraft = {
        // Common fields
        name: formData.name,
        category: category,
        description: formData.description,
        basePrice: formData.basePrice,
        images2D: formData.images2D,
        images3D: formData.images3D,
        tags: formData.tags,
        isActive: formData.isActive,
        isPreorderEnabled: formData.isPreorderEnabled,

        // Frame-specific fields
        frameType: frameData.frameType,
        shape: frameData.shape,
        material: frameData.material,
        gender: frameData.gender,
        bridgeFit: frameData.bridgeFit,
        variants: variants.map((v) => ({
          sku: v.sku,
          size: v.size,
          color: v.color,
          price: v.price ?? 0,
          weight: v.weight,
          images2D: v.images2D || [],
          images3D: v.images3D || [],
          isActive: v.isActive ?? true,
        })),

        // Lens-specific fields
        lensType: lensData.lensType,
        index: lensData.index,
        coatings: lensData.coatings,

        // Service-specific fields
        serviceType: serviceData.serviceType,
        durationMinutes: serviceData.durationMinutes,
        serviceNotes: serviceData.serviceNotes,

        // Metadata
        isEditMode: editingId !== null,
        editProductId: editingId ?? undefined,
        timestamp: Date.now(),
      }

      setDraft(currentDraft)
    }
  }, [isCreating, formData, category, frameData, lensData, serviceData, variants, editingId, setDraft])

  // ==================== DRAFT SAVE FUNCTION ====================

  /**
   * Save current form state as draft
   */
  const saveDraft = useCallback(() => {
    const currentDraft: ProductDraft = {
      // Common fields
      name: formData.name,
      category: category,
      description: formData.description,
      basePrice: formData.basePrice,
      images2D: formData.images2D,
      images3D: formData.images3D,
      tags: formData.tags,
      isActive: formData.isActive,
      isPreorderEnabled: formData.isPreorderEnabled,

      // Frame-specific fields
      frameType: frameData.frameType,
      shape: frameData.shape,
      material: frameData.material,
      gender: frameData.gender,
      bridgeFit: frameData.bridgeFit,
      variants: variants.map((v) => ({
        sku: v.sku,
        size: v.size,
        color: v.color,
        price: v.price ?? 0,
        weight: v.weight,
        images2D: v.images2D || [],
        images3D: v.images3D || [],
        isActive: v.isActive ?? true,
      })),

      // Lens-specific fields
      lensType: lensData.lensType,
      index: lensData.index,
      coatings: lensData.coatings,

      // Service-specific fields
      serviceType: serviceData.serviceType,
      durationMinutes: serviceData.durationMinutes,
      serviceNotes: serviceData.serviceNotes,

      // Metadata
      isEditMode: editingId !== null,
      editProductId: editingId ?? undefined,
      timestamp: Date.now(),
    }

    setDraft(currentDraft)
  }, [
    formData,
    category,
    frameData,
    lensData,
    serviceData,
    variants,
    editingId,
    setDraft,
  ])

  /**
   * Navigate back to menu
   */
  const handleBackToMenu = useCallback(() => {
    navigate('/manager')
  }, [navigate])

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

    // Check for at least one 2D image (existing URL or pending file)
    const has2DImages = formData.images2D.length > 0 || pendingImage2DFiles.length > 0
    if (!has2DImages) {
      errors.images2D = 'At least one 2D image is required (existing or pending upload)'
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
  }, [formData, pendingImage2DFiles, category, frameData, lensData, serviceData, variants])

  // Reset forms
  const resetForms = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      basePrice: 0,
      tags: [],
      isActive: true,
      isPreorderEnabled: false,
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
      coatings: [],
    })
    setCoatingInput('')
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
      images2DUrls: [],
      images3DUrls: [],
      images2DFiles: [],
      images3DFiles: [],
      isActive: true,
      isPreorderEnabled: false,
    })
    setEditingVariantIndex(null)
    setValidationErrors({})
    setPendingImage2DFiles([])
    setPendingImage3DFiles([])
    setTagInput('')
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

    const newVariant: FormVariant = {
      sku: variantForm.sku.toUpperCase().trim(),
      size: variantForm.size.trim(),
      color: variantForm.color.trim().toLowerCase(),
      price: variantForm.price,
      weight: variantForm.weight > 0 ? variantForm.weight : undefined,
      images2D: variantForm.images2DUrls.filter((url) => url.trim()),
      images3D: variantForm.images3DUrls.filter((url) => url.trim()),
      images2DFiles: variantForm.images2DFiles,
      images3DFiles: variantForm.images3DFiles,
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
      images2DUrls: [],
      images3DUrls: [],
      images2DFiles: [],
      images3DFiles: [],
      isActive: true,
      isPreorderEnabled: false,
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
        images2DUrls: variant.images2D || [],
        images3DUrls: variant.images3D || [],
        images2DFiles: variant.images2DFiles || [],
        images3DFiles: variant.images3DFiles || [],
        isActive: variant.isActive ?? true,
      })
      setEditingVariantIndex(index)
    },
    [variants]
  )

  const handleToggleVariantStatus = useCallback(
    (index: number) => {
      setVariants((prev) => {
        const updated = [...prev]
        updated[index] = {
          ...updated[index],
          isActive: !updated[index].isActive,
        }
        return updated
      })
    },
    [],
  )

  const handleOpenVariantMedia = useCallback((index: number) => {
    setCurrentVariantIndex(index)
    setMediaDialogOpen(true)
  }, [])

  const handleSaveVariantMedia = useCallback(
    (images2DUrls: string[], images3DUrls: string[], images2DFiles: File[], images3DFiles: File[]) => {
      if (currentVariantIndex === null) return

      setVariants((prev) => {
        const updated = [...prev]
        updated[currentVariantIndex] = {
          ...updated[currentVariantIndex],
          images2D: images2DUrls,
          images3D: images3DUrls,
          images2DFiles,
          images3DFiles,
        }
        return updated
      })

      showSnackbar('Variant media updated successfully', 'success')
    },
    [currentVariantIndex, showSnackbar]
  )

  // Variant Inventory handlers
  const handleOpenVariantInventory = useCallback((index: number) => {
    setCurrentVariantIndex(index)
    setInventoryDialogOpen(true)
  }, [])

  const handleCloseInventoryDialog = useCallback(() => {
    setInventoryDialogOpen(false)
    setCurrentVariantIndex(null)
  }, [])

  // Product CRUD
  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      showSnackbar('Please fix validation errors before submitting', 'error')
      return
    }

    try {
      setIsSubmitting(true)
      setIsUploadingMedia(true)

      // Step 1: Upload product-level pending 2D and 3D files
      let newProduct2DUrls: string[] = []
      let newProduct3DUrls: string[] = []

      if (pendingImage2DFiles.length > 0) {
        try {
          newProduct2DUrls = await uploadImages2D(pendingImage2DFiles)
        } catch (uploadErr: unknown) {
          const message = uploadErr instanceof Error ? uploadErr.message : 'Failed to upload 2D images'
          showSnackbar(`Upload failed: ${message}`, 'error')
          setIsUploadingMedia(false)
          setIsSubmitting(false)
          return
        }
      }

      if (pendingImage3DFiles.length > 0) {
        try {
          newProduct3DUrls = await uploadImages3D(pendingImage3DFiles)
        } catch (uploadErr: unknown) {
          const message = uploadErr instanceof Error ? uploadErr.message : 'Failed to upload 3D models'
          showSnackbar(`Upload failed: ${message}`, 'error')
          setIsUploadingMedia(false)
          setIsSubmitting(false)
          return
        }
      }

      // Step 2: Upload all variant files and build final variants array
      const finalVariants = await Promise.all(
        variants.map(async (variant) => {
          let newVariant2DUrls: string[] = []
          let newVariant3DUrls: string[] = []

          // Upload variant 2D files
          if (variant.images2DFiles && variant.images2DFiles.length > 0) {
            try {
              newVariant2DUrls = await uploadImages2D(variant.images2DFiles)
            } catch (uploadErr: unknown) {
              throw new Error(`Failed to upload 2D images for variant ${variant.sku}`)
            }
          }

          // Upload variant 3D files
          if (variant.images3DFiles && variant.images3DFiles.length > 0) {
            try {
              newVariant3DUrls = await uploadImages3D(variant.images3DFiles)
            } catch (uploadErr: unknown) {
              throw new Error(`Failed to upload 3D models for variant ${variant.sku}`)
            }
          }

          // Combine existing URLs with newly uploaded URLs and deduplicate
          const finalVariant2D = Array.from(
            new Set([...(variant.images2D || []), ...newVariant2DUrls])
          )
          const finalVariant3D = Array.from(
            new Set([...(variant.images3D || []), ...newVariant3DUrls])
          )

          // Return clean ProductVariant without file properties
          return {
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            price: variant.price,
            weight: variant.weight,
            images2D: finalVariant2D,
            images3D: finalVariant3D,
            isActive: variant.isActive,
          }
        })
      )

      setIsUploadingMedia(false)

      // Step 3: Combine product-level existing URLs with newly uploaded URLs
      const finalProductImages2D = Array.from(
        new Set([...formData.images2D.filter((url) => url.trim()), ...newProduct2DUrls])
      )
      const finalProductImages3D =
        formData.images3D.length > 0 || newProduct3DUrls.length > 0
          ? Array.from(new Set([...formData.images3D.filter((url) => url.trim()), ...newProduct3DUrls]))
          : undefined

      // Step 4: Build payload with final URLs
      const basePayload = {
        name: formData.name.trim(),
        category,
        description: formData.description.trim(),
        basePrice: formData.basePrice,
        images2D: finalProductImages2D,
        images3D: finalProductImages3D,
        tags: formData.tags,
        isActive: formData.isActive,
        isPreorderEnabled: formData.isPreorderEnabled,
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
          variants: finalVariants,
        }
      } else if (category === 'lens') {
        payload = {
          ...basePayload,
          lensType: lensData.lensType,
          index: lensData.index,
          coatings: lensData.coatings,
        }
      } else if (category === 'service') {
        payload = {
          ...basePayload,
          serviceType: serviceData.serviceType,
          durationMinutes: serviceData.durationMinutes,
          serviceNotes: serviceData.serviceNotes || undefined,
        }
      }

      // Step 5: Create or update product
      if (editingId) {
        await updateProduct(editingId, payload)
        showSnackbar('Product updated successfully', 'success')
      } else {
        await createProduct(payload)
        showSnackbar('Product created successfully', 'success')
      }

      // Step 6: Clear pending files and reset form
      setPendingImage2DFiles([])
      setPendingImage3DFiles([])
      resetForms()
      setIsCreating(false)
      setEditingId(null)
      clearDraft() // Clear draft after successful save
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

  // Handle 2D image file selection (no upload, just store files)
  const handleSelect2DFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const fileArray = Array.from(files)

    setPendingImage2DFiles((prev) => {
      // Prevent duplicate files by checking file name and size
      const existingFileKeys = new Set(prev.map((f) => `${f.name}-${f.size}`))
      const newFiles = fileArray.filter((f) => !existingFileKeys.has(`${f.name}-${f.size}`))
      if (newFiles.length === 0) {
        showSnackbar('All selected files already in pending list', 'error')
        return prev
      }
      showSnackbar(`Selected ${newFiles.length} image(s) for upload on save`, 'success')
      return [...prev, ...newFiles]
    })
  }, [showSnackbar])

  // Handle 3D model file selection (no upload, just store files)
  const handleSelect3DFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const fileArray = Array.from(files)

    setPendingImage3DFiles((prev) => {
      // Prevent duplicate files by checking file name and size
      const existingFileKeys = new Set(prev.map((f) => `${f.name}-${f.size}`))
      const newFiles = fileArray.filter((f) => !existingFileKeys.has(`${f.name}-${f.size}`))
      if (newFiles.length === 0) {
        showSnackbar('All selected files already in pending list', 'error')
        return prev
      }
      showSnackbar(`Selected ${newFiles.length} model(s) for upload on save`, 'success')
      return [...prev, ...newFiles]
    })
  }, [showSnackbar])

  // Tags handlers
  const handleAddTag = useCallback(() => {
    const trimmedTag = tagInput.trim().toLowerCase()
    if (!trimmedTag) return

    // Check for duplicates
    if (formData.tags.includes(trimmedTag)) {
      showSnackbar('Tag already exists', 'error')
      return
    }

    setFormData({ ...formData, tags: [...formData.tags, trimmedTag] })
    setTagInput('')
  }, [formData, tagInput, showSnackbar])

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    })
  }, [formData])

  const handleTagInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAddTag()
      }
    },
    [handleAddTag],
  )

  const startEdit = useCallback(
    (product: Product) => {
      setEditingId(product._id)
      setIsCreating(true)
      setCategory(product.category as 'frame' | 'lens' | 'service')

      const initialFormData = {
        name: product.name,
        description: product.description,
        basePrice: product.basePrice,
        tags: product.tags || [],
        isActive: product.isActive ?? true,
        isPreorderEnabled: product.isPreorderEnabled ?? false,
        images2D: product.images2D || [],
        images3D: product.images3D || [],
      }

      setFormData(initialFormData)

      // Clear pending files when editing
      setPendingImage2DFiles([])
      setPendingImage3DFiles([])
      setTagInput('')

      // Only load variants for frame products
      if (product.category === 'frame') {
        // Convert ProductVariant[] to FormVariant[] by adding empty file arrays
        setVariants(
          ((product as Product & { variants?: ProductVariant[] }).variants || []).map(
            (v) => ({
              ...v,
              images2DFiles: [],
              images3DFiles: [],
            })
          )
        )
      } else {
        setVariants([])
      }

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
        }
        setLensData({
          lensType: p.lensType as (typeof LENS_TYPES)[number],
          index: p.index,
          coatings: p.coatings || [],
        })
        setCoatingInput('')
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
                startIcon={<SaveIcon />}
                onClick={saveDraft}
                disabled={isSubmitting}
              >
                Save draft
              </Button>
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

                  <Grid size={12}>
                    <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" p={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight={500}>
                            Pre-order
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Allow customers to order this product even when out of stock
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Chip
                            label={formData.isPreorderEnabled ? 'Enabled' : 'Disabled'}
                            color={formData.isPreorderEnabled ? 'primary' : 'default'}
                            size="small"
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.isPreorderEnabled}
                                onChange={(e) =>
                                  setFormData({ ...formData, isPreorderEnabled: e.target.checked })
                                }
                                color="primary"
                              />
                            }
                            label=""
                          />
                        </Box>
                      </Box>
                    </Card>
                  </Grid>

                  <Grid size={12}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
                      Tags
                    </Typography>
                    <Stack spacing={2}>
                      {/* Tag input field */}
                      <Box display="flex" gap={1}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Type a tag and press Enter"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagInputKeyDown}
                          disabled={isSubmitting}
                          helperText={
                            formData.tags.length > 0
                              ? 'Press Enter to add a tag'
                              : 'Add tags to help categorize your product (optional)'
                          }
                        />
                        <Button
                          variant="outlined"
                          onClick={handleAddTag}
                          disabled={!tagInput.trim() || isSubmitting}
                          startIcon={<AddIcon />}
                        >
                          Add
                        </Button>
                      </Box>

                      {/* Display tags as chips */}
                      {formData.tags.length > 0 && (
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {formData.tags.map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              onDelete={() => handleRemoveTag(tag)}
                              deleteIcon={<CloseIcon fontSize="small" />}
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      )}
                    </Stack>
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
                    <Stack spacing={2}>
                      {/* Upload Button */}
                      <Box>
                        <input
                          id="upload-2d"
                          hidden
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => handleSelect2DFiles(e.target.files)}
                          disabled={isUploadingMedia || isSubmitting}
                        />
                        <label htmlFor="upload-2d">
                          <Button
                            variant="contained"
                            component="span"
                            disabled={isUploadingMedia || isSubmitting}
                            fullWidth
                          >
                            Select 2D Images (PNG, JPG, WebP)
                          </Button>
                        </label>
                      </Box>

                      {/* Existing Images */}
                      {formData.images2D.length > 0 && (
                        <Box>
                          <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 600, color: 'success.main' }}>
                            ✓ {formData.images2D.length} existing image(s)
                          </Typography>
                          <Grid container spacing={1}>
                            {formData.images2D.map((url, index) => (
                              <Grid size={{ xs: 6, sm: 4, md: 3 }} key={`existing-${index}`}>
                                <Card variant="outlined" sx={{ position: 'relative', opacity: 0.9 }}>
                                  <CardMedia
                                    component="img"
                                    height="140"
                                    image={url}
                                    alt={`2D Image ${index + 1}`}
                                    sx={{ objectFit: 'cover' }}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="140" height="140"%3E%3Crect fill="%23f0f0f0" width="140" height="140"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="%23999"%3EInvalid URL%3C/text%3E%3C/svg%3E'
                                    }}
                                  />
                                  <Chip
                                    label="Existing"
                                    size="small"
                                    sx={{
                                      position: 'absolute',
                                      top: 4,
                                      left: 4,
                                      height: 20,
                                      bgcolor: 'success.main',
                                      color: 'white',
                                    }}
                                  />
                                  <IconButton
                                    size="small"
                                    color="error"
                                    sx={{
                                      position: 'absolute',
                                      top: 4,
                                      right: 4,
                                      bgcolor: 'background.paper',
                                    }}
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        images2D: formData.images2D.filter((_, i) => i !== index),
                                      })
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}

                      {/* Pending Files */}
                      {pendingImage2DFiles.length > 0 && (
                        <Box>
                          <Stack spacing={1}>
                            {pendingImage2DFiles.map((file, index) => (
                              <Box
                                key={`pending-${index}`}
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                p={1}
                                border="2px dashed"
                                borderColor="info.main"
                                borderRadius={1}
                                bgcolor="info.lighter"
                              >
                                <Box display="flex" alignItems="center" gap={1} flex={1}>
                                  <Chip
                                    label={`${(file.size / 1024).toFixed(1)}KB`}
                                    size="small"
                                    variant="filled"
                                    color="info"
                                  />
                                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                    {file.name}
                                  </Typography>
                                </Box>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setPendingImage2DFiles((prev) => prev.filter((_, i) => i !== index))
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      )}

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
                    <Stack spacing={2}>
                      {/* Upload Button */}
                      <Box>
                        <input
                          id="upload-3d"
                          hidden
                          type="file"
                          multiple
                          accept=".glb,.gltf,.obj,.usdz"
                          onChange={(e) => handleSelect3DFiles(e.target.files)}
                          disabled={isUploadingMedia || isSubmitting}
                        />
                        <label htmlFor="upload-3d">
                          <Button
                            variant="outlined"
                            component="span"
                            disabled={isUploadingMedia || isSubmitting}
                            fullWidth
                          >
                            Select 3D Models (GLB, OBJ, USDZ)
                          </Button>
                        </label>
                      </Box>

                      {/* Existing 3D Models */}
                      {formData.images3D.length > 0 && (
                        <Box>
                          <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 600, color: 'success.main' }}>
                            ✓ {formData.images3D.length} existing model(s)
                          </Typography>
                          <Stack spacing={1}>
                            {formData.images3D.map((url, index) => (
                              <Box
                                key={`existing-3d-${index}`}
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                p={1}
                                border="1px solid"
                                borderColor="success.main"
                                borderRadius={1}
                                bgcolor="success.lighter"
                              >
                                <Box display="flex" alignItems="center" gap={1} flex={1}>
                                  <Chip
                                    label="Existing"
                                    size="small"
                                    color="success"
                                  />
                                  <Chip
                                    label={url.split('/').pop()?.substring(0, 30) || `Model ${index + 1}`}
                                    size="small"
                                    variant="outlined"
                                  />
                                </Box>
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
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {/* Pending 3D Models */}
                      {pendingImage3DFiles.length > 0 && (
                        <Box>
                          <Stack spacing={1}>
                            {pendingImage3DFiles.map((file, index) => (
                              <Box
                                key={`pending-3d-${index}`}
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                p={1}
                                border="2px dashed"
                                borderColor="info.main"
                                borderRadius={1}
                                bgcolor="info.lighter"
                              >
                                <Box display="flex" alignItems="center" gap={1} flex={1}>
                                  <Chip
                                    label={`${(file.size / 1024 / 1024).toFixed(1)}MB`}
                                    size="small"
                                    variant="filled"
                                    color="info"
                                  />
                                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                    {file.name}
                                  </Typography>
                                </Box>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setPendingImage3DFiles((prev) => prev.filter((_, i) => i !== index))
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      )}
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
                      <Box>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500, mb: 1 }}>
                          Coatings
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            p: 1,
                            minHeight: 56,
                            alignItems: 'center',
                            '&:focus-within': {
                              borderColor: 'primary.main',
                            },
                          }}
                        >
                          {lensData.coatings.map((coating, index) => (
                            <Chip
                              key={index}
                              label={coating}
                              onDelete={() => {
                                setLensData({
                                  ...lensData,
                                  coatings: lensData.coatings.filter((_, i) => i !== index),
                                })
                              }}
                              size="small"
                            />
                          ))}
                          <TextField
                            value={coatingInput}
                            onChange={(e) => setCoatingInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && coatingInput.trim()) {
                                e.preventDefault()
                                setLensData({
                                  ...lensData,
                                  coatings: [...lensData.coatings, coatingInput.trim()],
                                })
                                setCoatingInput('')
                              } else if (e.key === 'Backspace' && !coatingInput && lensData.coatings.length > 0) {
                                setLensData({
                                  ...lensData,
                                  coatings: lensData.coatings.slice(0, -1),
                                })
                              }
                            }}
                            placeholder={lensData.coatings.length === 0 ? 'Type and press Enter to add coatings' : ''}
                            variant="standard"
                            size="small"
                            sx={{
                              flex: 1,
                              minWidth: 120,
                              '& .MuiInputBase-root': {
                                border: 'none',
                                '&:before, &:after': {
                                  display: 'none',
                                },
                              },
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          Press Enter to add each coating (e.g., AR, UV, Scratch resistant)
                        </Typography>
                      </Box>
                    </Grid>
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

            {/* Variants Section (for frames only) */}
            {category === 'frame' && (
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
                        <FrameSizeInput
                          value={variantForm.size}
                          onChange={(size) => setVariantForm({ ...variantForm, size })}
                          error={!!validationErrors.size}
                          required
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
                              <Typography variant="body2" fontWeight={500}>
                                Variant Status
                              </Typography>
                              <Chip
                                label={variantForm.isActive ? 'Active' : 'Inactive'}
                                color={variantForm.isActive ? 'success' : 'default'}
                                size="small"
                              />
                            </Box>
                            <Switch
                              checked={variantForm.isActive}
                              onChange={(e) =>
                                setVariantForm({ ...variantForm, isActive: e.target.checked })
                              }
                              color="success"
                            />
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
                                  images2DUrls: [],
                                  images3DUrls: [],
                                  images2DFiles: [],
                                  images3DFiles: [],
                                  isActive: true,
                                  isPreorderEnabled: false,
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
                                <Box display="flex" alignItems="center" gap={1.5}>
                                  <Chip
                                    label={variant.isActive ? 'Active' : 'Inactive'}
                                    color={variant.isActive ? 'success' : 'default'}
                                    size="small"
                                    variant={variant.isActive ? 'filled' : 'outlined'}
                                  />
                                  <Switch
                                    checked={variant.isActive ?? true}
                                    onChange={() => handleToggleVariantStatus(index)}
                                    color="success"
                                    size="small"
                                  />
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<ImageIcon fontSize="small" />}
                                    onClick={() => handleOpenVariantMedia(index)}
                                    sx={{ minWidth: 'auto', px: 1 }}
                                  >
                                    Media
                                  </Button>
                                  <IconButton size="small" onClick={() => handleEditVariant(index)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<InventoryIcon fontSize="small" />}
                                    onClick={() => handleOpenVariantInventory(index)}
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
                    {isUploadingMedia
                      ? 'Uploading media...'
                      : isSubmitting
                        ? 'Saving...'
                        : editingId
                          ? 'Update Product'
                          : 'Create Product'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </form>

        {/* Variant Media Dialog */}
        {currentVariantIndex !== null && (
          <VariantMediaDialog
            open={mediaDialogOpen}
            onClose={() => setMediaDialogOpen(false)}
            onSave={handleSaveVariantMedia}
            initialImages2DUrls={variants[currentVariantIndex]?.images2D || []}
            initialImages3DUrls={variants[currentVariantIndex]?.images3D || []}
            initialImages2DFiles={variants[currentVariantIndex]?.images2DFiles || []}
            initialImages3DFiles={variants[currentVariantIndex]?.images3DFiles || []}
            variantSku={variants[currentVariantIndex]?.sku || ''}
          />
        )}

        {/* Variant Inventory Dialog */}
        {currentVariantIndex !== null && (
          <VariantInventoryDialog
            open={inventoryDialogOpen}
            onClose={handleCloseInventoryDialog}
            variantSku={variants[currentVariantIndex]?.sku || ''}
            variantInfo={{
              size: variants[currentVariantIndex]?.size,
              color: variants[currentVariantIndex]?.color,
              price: variants[currentVariantIndex]?.price,
            }}
          />
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
