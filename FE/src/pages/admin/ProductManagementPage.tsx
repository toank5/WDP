import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tab,
  Tabs,
  Alert,
  IconButton,
} from '@mui/material'
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Restore as RestoreIcon,
  PhotoCamera as PhotoCameraIcon,
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

const CATEGORIES = ['frame', 'lens', 'service'] as const
const FRAME_TYPES = ['full-rim', 'half-rim', 'rimless'] as const
const FRAME_SHAPES = ['round', 'square', 'oval', 'cat-eye', 'aviator'] as const
const FRAME_MATERIALS = ['metal', 'plastic', 'mixed'] as const
const FRAME_GENDERS = ['men', 'women', 'unisex'] as const
const BRIDGE_FITS = ['standard', 'asian-fit'] as const
const LENS_TYPES = ['single-vision', 'bifocal', 'progressive', 'photochromic'] as const
const SERVICE_TYPES = ['eye-test', 'lens-cutting', 'frame-adjustment', 'cleaning'] as const
const VARIANT_COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Gray', 'Brown', 'Gold', 'Silver'] as const

const formatVNPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [tabValue, setTabValue] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [category, setCategory] = useState<'frame' | 'lens' | 'service'>('frame')
  const [files, setFiles] = useState<File[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: 0,
    tags: '',
  })

  const [frameData, setFrameData] = useState({
    frameType: 'full-rim' as const,
    shape: 'round' as const,
    material: 'metal' as const,
    gender: 'unisex' as const,
    bridgeFit: 'standard' as const,
  })

  const [lensData, setLensData] = useState({
    lensType: 'single-vision' as const,
    index: 1.5,
    coatings: '',
    isPrescriptionRequired: false,
    minSPH: 0,
    maxSPH: 0,
  })

  const [serviceData, setServiceData] = useState({
    serviceType: 'eye-test' as const,
    durationMinutes: 30,
    serviceNotes: '',
  })

  const [variantForm, setVariantForm] = useState({
    sku: '',
    size: '',
    color: '',
    price: 0,
    weight: 0,
  })

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await getAllProducts()
      setProducts(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load products'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleAddVariant = () => {
    if (!variantForm.sku || !variantForm.size || !variantForm.color) {
      toast.error('Please fill all variant fields')
      return
    }

    const newVariant: ProductVariant = {
      sku: variantForm.sku.toUpperCase(),
      size: variantForm.size,
      color: variantForm.color.toLowerCase(),
      price: variantForm.price > 0 ? variantForm.price : undefined,
      weight: variantForm.weight > 0 ? variantForm.weight : undefined,
    }

    if (editingVariantIndex !== null) {
      const updated = [...variants]
      updated[editingVariantIndex] = newVariant
      setVariants(updated)
      setEditingVariantIndex(null)
    } else {
      setVariants([...variants, newVariant])
    }

    setVariantForm({ sku: '', size: '', color: '', price: 0, weight: 0 })
  }

  const handleDeleteVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const handleEditVariant = (index: number) => {
    const variant = variants[index]
    setVariantForm({
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      price: variant.price || 0,
      weight: variant.weight || 0,
    })
    setEditingVariantIndex(index)
  }

  const resetForms = () => {
    setFormData({ name: '', description: '', basePrice: 0, tags: '' })
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
    })
    setServiceData({
      serviceType: 'eye-test',
      durationMinutes: 30,
      serviceNotes: '',
    })
    setVariants([])
    setFiles([])
    setVariantForm({ sku: '', size: '', color: '', price: 0, weight: 0 })
    setEditingVariantIndex(null)
  }

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.description || formData.basePrice <= 0 || variants.length === 0) {
      toast.error('Please fill all required fields and add at least one variant')
      return
    }

    try {
      let payload: any = {
        name: formData.name,
        category,
        description: formData.description,
        basePrice: formData.basePrice,
        images2D: [],
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        variants,
      }

      if (category === 'frame') {
        payload = {
          ...payload,
          frameType: frameData.frameType,
          shape: frameData.shape,
          material: frameData.material,
          gender: frameData.gender,
          bridgeFit: frameData.bridgeFit,
        }
      } else if (category === 'lens') {
        payload = {
          ...payload,
          lensType: lensData.lensType,
          index: lensData.index,
          coatings: lensData.coatings ? lensData.coatings.split(',').map(c => c.trim()) : [],
          isPrescriptionRequired: lensData.isPrescriptionRequired,
          suitableForPrescriptionRange: {
            minSPH: lensData.minSPH || undefined,
            maxSPH: lensData.maxSPH || undefined,
          },
        }
      } else if (category === 'service') {
        payload = {
          ...payload,
          serviceType: serviceData.serviceType,
          durationMinutes: serviceData.durationMinutes,
          serviceNotes: serviceData.serviceNotes || undefined,
        }
      }

      if (editingId) {
        await updateProduct(editingId, payload, files.length > 0 ? files : undefined)
        toast.success('Product updated successfully')
      } else {
        await createProduct(payload, files.length > 0 ? files : undefined)
        toast.success('Product created successfully')
      }

      resetForms()
      setIsCreating(false)
      setEditingId(null)
      loadProducts()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Operation failed'
      toast.error(message)
    }
  }

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return

    try {
      await deleteProduct(deleteConfirmId)
      toast.success('Product deleted successfully')
      setDeleteConfirmOpen(false)
      setDeleteConfirmId(null)
      loadProducts()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed'
      toast.error(message)
    }
  }

  const handleRestore = async (id: string) => {
    try {
      await restoreProduct(id)
      toast.success('Product restored successfully')
      loadProducts()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Restore failed'
      toast.error(message)
    }
  }

  const startEdit = (product: Product) => {
    setEditingId(product._id)
    setIsCreating(true)
    setCategory(product.category as any)

    setFormData({
      name: product.name,
      description: product.description,
      basePrice: product.basePrice,
      tags: (product.tags || []).join(', '),
    })

    setVariants((product as any).variants || [])

    if (product.category === 'frame') {
      const p = product as any
      setFrameData({
        frameType: p.frameType,
        shape: p.shape,
        material: p.material,
        gender: p.gender || 'unisex',
        bridgeFit: p.bridgeFit || 'standard',
      })
    } else if (product.category === 'lens') {
      const p = product as any
      setLensData({
        lensType: p.lensType,
        index: p.index,
        coatings: p.coatings?.join(', ') || '',
        isPrescriptionRequired: p.isPrescriptionRequired,
        minSPH: p.suitableForPrescriptionRange?.minSPH || 0,
        maxSPH: p.suitableForPrescriptionRange?.maxSPH || 0,
      })
    } else if (product.category === 'service') {
      const p = product as any
      setServiceData({
        serviceType: p.serviceType,
        durationMinutes: p.durationMinutes,
        serviceNotes: p.serviceNotes || '',
      })
    }
  }

  const activeProducts = products.filter(p => !p.isDeleted)
  const deletedProducts = products.filter(p => p.isDeleted)

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Product Management
          </Typography>
          <Typography color="text.secondary">
            Manage optical products (Frames, Lenses, Services)
          </Typography>
        </Box>
        {!isCreating && (
          <Button variant="contained" onClick={() => { setIsCreating(true); setEditingId(null) }}>
            Create New Product
          </Button>
        )}
      </Box>

      {isCreating && (
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                  {editingId ? '✏️ Edit Product' : '✨ Create New Product'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {editingId ? 'Update your product information' : 'Add a new product to your optical shop'}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setIsCreating(false)
                  setEditingId(null)
                  resetForms()
                }}
              >
                ✕ Close
              </Button>
            </Box>

            <Box component="form" onSubmit={handleCreateOrUpdate} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Step 1: Category Selection */}
              <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '2px solid #e3f2fd' }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ fontSize: '20px' }}>1️⃣</span> Product Category
                </Typography>
                <FormControl fullWidth disabled={!!editingId}>
                  <Select value={category} onChange={(e) => setCategory(e.target.value as any)}>
                    {CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat === 'frame' && '👓 Frames (Eyeglasses)'}
                        {cat === 'lens' && '🔍 Lenses (Optical)'}
                        {cat === 'service' && '🛠️ Services (Eye Care)'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Step 2: Basic Information */}
              <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '2px solid #f3e5f5' }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ fontSize: '20px' }}>2️⃣</span> Basic Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField label="Product Name" required fullWidth value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  <TextField label="Description" required multiline rows={3} fullWidth value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <TextField label="Base Price (VND)" type="number" required fullWidth value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })} />
                    <TextField label="Tags (comma-separated)" fullWidth value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} />
                  </Box>
                </Box>
              </Box>

              {/* Step 3: Category-Specific Fields */}
              <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '2px solid #e8f5e9' }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ fontSize: '20px' }}>3️⃣</span> Category Details
                </Typography>

                {category === 'frame' && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Frame Type</InputLabel>
                      <Select value={frameData.frameType} onChange={(e) => setFrameData({ ...frameData, frameType: e.target.value as any })} label="Frame Type">
                        {FRAME_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small">
                      <InputLabel>Shape</InputLabel>
                      <Select value={frameData.shape} onChange={(e) => setFrameData({ ...frameData, shape: e.target.value as any })} label="Shape">
                        {FRAME_SHAPES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small">
                      <InputLabel>Material</InputLabel>
                      <Select value={frameData.material} onChange={(e) => setFrameData({ ...frameData, material: e.target.value as any })} label="Material">
                        {FRAME_MATERIALS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small">
                      <InputLabel>Gender</InputLabel>
                      <Select value={frameData.gender} onChange={(e) => setFrameData({ ...frameData, gender: e.target.value as any })} label="Gender">
                        {FRAME_GENDERS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <Box sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Bridge Fit</InputLabel>
                        <Select value={frameData.bridgeFit} onChange={(e) => setFrameData({ ...frameData, bridgeFit: e.target.value as any })} label="Bridge Fit">
                          {BRIDGE_FITS.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                )}

                {category === 'lens' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Lens Type</InputLabel>
                        <Select value={lensData.lensType} onChange={(e) => setLensData({ ...lensData, lensType: e.target.value as any })} label="Lens Type">
                          {LENS_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <TextField label="Refractive Index" type="number" required fullWidth size="small" value={lensData.index} onChange={(e) => setLensData({ ...lensData, index: parseFloat(e.target.value) || 1.5 })} />
                    </Box>
                    <TextField label="Coatings (comma-separated)" fullWidth size="small" value={lensData.coatings} onChange={(e) => setLensData({ ...lensData, coatings: e.target.value })} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Prescription Required</InputLabel>
                        <Select value={lensData.isPrescriptionRequired ? 'yes' : 'no'} onChange={(e) => setLensData({ ...lensData, isPrescriptionRequired: e.target.value === 'yes' })} label="Prescription Required">
                          <MenuItem value="yes">Yes</MenuItem>
                          <MenuItem value="no">No</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <TextField label="Min SPH" type="number" fullWidth size="small" value={lensData.minSPH} onChange={(e) => setLensData({ ...lensData, minSPH: parseFloat(e.target.value) || 0 })} />
                      <TextField label="Max SPH" type="number" fullWidth size="small" value={lensData.maxSPH} onChange={(e) => setLensData({ ...lensData, maxSPH: parseFloat(e.target.value) || 0 })} />
                    </Box>
                  </Box>
                )}

                {category === 'service' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Service Type</InputLabel>
                        <Select value={serviceData.serviceType} onChange={(e) => setServiceData({ ...serviceData, serviceType: e.target.value as any })} label="Service Type">
                          {SERVICE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <TextField label="Duration (minutes)" type="number" required fullWidth size="small" value={serviceData.durationMinutes} onChange={(e) => setServiceData({ ...serviceData, durationMinutes: parseInt(e.target.value) || 30 })} />
                    </Box>
                    <TextField label="Service Notes" multiline rows={2} fullWidth size="small" value={serviceData.serviceNotes} onChange={(e) => setServiceData({ ...serviceData, serviceNotes: e.target.value })} />
                  </Box>
                )}
              </Box>

              {/* Step 4: Images */}
              <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '2px solid #fce4ec' }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ fontSize: '20px' }}>4️⃣</span> Product Images
                </Typography>
                <Box sx={{ p: 3, border: '2px dashed #ec407a', borderRadius: 2, textAlign: 'center', bgcolor: '#fcebf0' }}>
                  <input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.currentTarget.files || []))} style={{ display: 'none' }} id="image-upload" />
                  <label htmlFor="image-upload" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <PhotoCameraIcon sx={{ fontSize: 40, color: '#ec407a' }} />
                      <Typography variant="h6">Click to upload</Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">PNG, JPG, GIF</Typography>
                  </label>
                </Box>
                {files.length > 0 && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {files.map((file, idx) => <Chip key={idx} label={file.name} onDelete={() => setFiles(files.filter((_, i) => i !== idx))} />)}
                  </Box>
                )}
              </Box>

              {/* Step 5: Variants */}
              <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '2px solid #e1bee7' }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ fontSize: '20px' }}>5️⃣</span> Variants
                  {variants.length > 0 && <Chip label={`${variants.length}`} size="small" color="primary" />}
                </Typography>

                <Box sx={{ p: 2, bgcolor: '#f3e5f5', borderRadius: 2, mb: 2 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                    <TextField label="SKU" size="small" fullWidth value={variantForm.sku} onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })} />
                    <TextField label="Size" size="small" fullWidth value={variantForm.size} onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })} />
                    <FormControl fullWidth size="small">
                      <InputLabel>Color</InputLabel>
                      <Select value={variantForm.color} onChange={(e) => setVariantForm({ ...variantForm, color: e.target.value })} label="Color">
                        {VARIANT_COLORS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <TextField label="Price (VND)" type="number" size="small" fullWidth value={variantForm.price} onChange={(e) => setVariantForm({ ...variantForm, price: parseFloat(e.target.value) || 0 })} />
                    <TextField label="Weight (g)" type="number" size="small" fullWidth value={variantForm.weight} onChange={(e) => setVariantForm({ ...variantForm, weight: parseFloat(e.target.value) || 0 })} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="contained" onClick={handleAddVariant} size="small">
                      {editingVariantIndex !== null ? 'Update' : 'Add'} Variant
                    </Button>
                    {editingVariantIndex !== null && (
                      <Button variant="outlined" size="small" onClick={() => { setEditingVariantIndex(null); setVariantForm({ sku: '', size: '', color: '', price: 0, weight: 0 }) }}>
                        Cancel
                      </Button>
                    )}
                  </Box>
                </Box>

                {variants.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    {variants.map((v, i) => {
                      const colorMap: Record<string, string> = {
                        'black': '#000000',
                        'white': '#ffffff',
                        'red': '#f44336',
                        'blue': '#2196f3',
                        'green': '#4caf50',
                        'yellow': '#fdd835',
                        'gray': '#9e9e9e',
                        'brown': '#795548',
                        'gold': '#ffd700',
                        'silver': '#c0c0c0',
                      }
                      const bgColor = colorMap[v.color.toLowerCase()] || '#cccccc'
                      const textColor = ['white', 'yellow', 'gold', 'silver'].includes(v.color.toLowerCase()) ? '#000' : '#fff'
                      
                      return (
                        <Box
                          key={i}
                          onClick={() => handleEditVariant(i)}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: '#fafafa',
                            border: '1.5px solid #e0e0e0',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: '#f5f5f5',
                              borderColor: '#9c27b0',
                              boxShadow: '0 2px 8px rgba(156, 39, 176, 0.15)',
                            },
                            minWidth: '140px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.8,
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                              {v.sku}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteVariant(i)
                              }}
                              sx={{ p: 0.25 }}
                            >
                              <DeleteIcon fontSize="small" sx={{ fontSize: '16px' }} />
                            </IconButton>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: 1,
                                bgcolor: bgColor,
                                border: '1.5px solid #bdbdbd',
                              }}
                              title={v.color}
                            />
                            <Typography variant="caption" fontWeight={500}>
                              {v.color}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                            Size: {v.size}
                          </Typography>
                        </Box>
                      )
                    })}
                  </Box>
                )}
              </Box>

              {/* Step 6: Actions */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button type="submit" variant="contained" size="large">
                  {editingId ? 'Update' : 'Create'}
                </Button>
                <Button variant="outlined" size="large" onClick={() => { setIsCreating(false); setEditingId(null); resetForms() }}>
                  Cancel
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label={`Active (${activeProducts.length})`} />
          <Tab label={`Deleted (${deletedProducts.length})`} />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeProducts.map((product) => (
                <TableRow key={product._id} hover>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{formatVNPrice(product.basePrice)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => startEdit(product)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteClick(product._id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deletedProducts.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => handleRestore(product._id)}>
                      Restore
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Product?</DialogTitle>
        <DialogContent>
          <Typography>This product will be soft-deleted and can be restored later.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
