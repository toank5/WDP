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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from '@mui/material'
import {
  ExpandMore,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  updateProduct,
  type CreateProductPayload,
  type UpdateProductPayload,
  type Product,
  type ProductVariant,
} from '@/lib/product-api'

const PRODUCT_CATEGORIES = ['FRAMES', 'LENSES', 'SERVICES'] as const
const VARIANT_TYPES = ['AVIATOR', 'ROUND'] as const
const VARIANT_COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Gray', 'Brown', 'Gold', 'Silver'] as const

// Format price to Vietnamese currency
const formatVNPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

type ProductFormData = {
  name: string
  category: 'FRAMES' | 'LENSES' | 'SERVICES'
  description: string
  basePrice: number
  variants: ProductVariant[]
}

type VariantFormData = {
  sku: string
  type: 'AVIATOR' | 'ROUND'
  size: string
  color: string
  imageFiles: File[]
}

export function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: 'FRAMES',
    description: '',
    basePrice: 0,
    variants: [],
  })
  const [variantForm, setVariantForm] = useState<VariantFormData>({
    sku: '',
    type: 'AVIATOR',
    size: '',
    color: '',
    imageFiles: [],
  })
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null)

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
    const newVariant: ProductVariant = {
      sku: variantForm.sku,
      type: variantForm.type,
      size: variantForm.size,
      color: variantForm.color,
      images: [], // Images will be handled separately during product creation
    }

    if (editingVariantIndex !== null) {
      const updatedVariants = [...formData.variants]
      updatedVariants[editingVariantIndex] = newVariant
      setFormData({ ...formData, variants: updatedVariants })
      setEditingVariantIndex(null)
    } else {
      setFormData({ ...formData, variants: [...formData.variants, newVariant] })
    }

    setVariantForm({
      sku: '',
      type: 'AVIATOR',
      size: '',
      color: '',
      imageFiles: [],
    })
  }

  const handleEditVariant = (index: number) => {
    const variant = formData.variants[index]
    setVariantForm({
      sku: variant.sku,
      type: variant.type,
      size: variant.size,
      color: variant.color,
      imageFiles: [],
    })
    setEditingVariantIndex(index)
  }

  const handleDeleteVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index),
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload: CreateProductPayload = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        basePrice: formData.basePrice,
        variants: formData.variants,
      }

      // Collect all image files from variants
      const allFiles: File[] = []
      formData.variants.forEach((variant: any) => {
        if (variant.imageFiles) {
          allFiles.push(...variant.imageFiles)
        }
      })

      await createProduct(payload, allFiles.length > 0 ? allFiles : undefined)
      toast.success('Product created successfully')
      setIsCreating(false)
      setFormData({
        name: '',
        category: 'FRAMES',
        description: '',
        basePrice: 0,
        variants: [],
      })
      loadProducts()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create product'
      toast.error(message)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    try {
      const payload: UpdateProductPayload = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        basePrice: formData.basePrice,
        variants: formData.variants,
      }

      // Collect all image files from variants
      const allFiles: File[] = []
      formData.variants.forEach((variant: any) => {
        if (variant.imageFiles) {
          allFiles.push(...variant.imageFiles)
        }
      })

      await updateProduct(editingProduct._id, payload, allFiles.length > 0 ? allFiles : undefined)
      toast.success('Product updated successfully')
      setEditingProduct(null)
      setFormData({
        name: '',
        category: 'FRAMES',
        description: '',
        basePrice: 0,
        variants: [],
      })
      loadProducts()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update product'
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
      const message = err instanceof Error ? err.message : 'Failed to delete product'
      toast.error(message)
    }
  }

  const startEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description,
      basePrice: product.basePrice,
      variants: product.variants,
    })
  }

  const cancelForm = () => {
    setIsCreating(false)
    setEditingProduct(null)
    setFormData({
      name: '',
      category: 'FRAMES',
      description: '',
      basePrice: 0,
      variants: [],
    })
    setVariantForm({
      sku: '',
      type: 'AVIATOR',
      size: '',
      color: '',
      imageFiles: [],
    })
    setEditingVariantIndex(null)
  }

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
            Manage products with variants
          </Typography>
        </Box>
        {!isCreating && !editingProduct && (
          <Button variant="contained" onClick={() => setIsCreating(true)}>
            Create New Product
          </Button>
        )}
      </Box>

      {(isCreating || editingProduct) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
              {editingProduct ? 'Edit Product' : 'Create New Product'}
            </Typography>
            <Box component="form" onSubmit={editingProduct ? handleUpdate : handleCreate} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Product Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Blue Light Glasses"
                fullWidth
              />
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  label="Category"
                >
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Description"
                required
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product details..."
                fullWidth
              />
              <TextField
                label="Base Price"
                type="number"
                required
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
                inputProps={{ step: '0.01', min: '0' }}
                fullWidth
              />

              {/* Variants Section */}
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Product Variants ({formData.variants.length})
                </Typography>

                {/* Variant Form */}
                <Box sx={{ mb: 2, p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid #ddd' }}>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 2 }}>
                    {editingVariantIndex !== null ? 'Edit Variant' : 'Add New Variant'}
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                    <TextField
                      label="SKU"
                      size="small"
                      value={variantForm.sku}
                      onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                      placeholder="e.g., BLUE-LIGHT-001"
                    />
                    <FormControl size="small">
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={variantForm.type}
                        onChange={(e) => setVariantForm({ ...variantForm, type: e.target.value as any })}
                        label="Type"
                      >
                        {VARIANT_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Size"
                      size="small"
                      value={variantForm.size}
                      onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                      placeholder="e.g., M, L, XL"
                    />
                    <FormControl size="small">
                      <InputLabel>Color</InputLabel>
                      <Select
                        value={variantForm.color}
                        onChange={(e) => setVariantForm({ ...variantForm, color: e.target.value })}
                        label="Color"
                      >
                        {VARIANT_COLORS.map((color) => (
                          <MenuItem key={color} value={color}>
                            {color}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Product Images {variantForm.imageFiles.length > 0 && `(${variantForm.imageFiles.length} selected)`}
                  </Typography>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.currentTarget.files || [])
                      setVariantForm({ ...variantForm, imageFiles: files })
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                  {variantForm.imageFiles.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {variantForm.imageFiles.map((file, idx) => (
                        <Chip
                          key={idx}
                          label={file.name}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                          onDelete={() => {
                            setVariantForm({
                              ...variantForm,
                              imageFiles: variantForm.imageFiles.filter((_, i) => i !== idx),
                            })
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button variant="contained" onClick={handleAddVariant}>
                    {editingVariantIndex !== null ? 'Update Variant' : 'Add Variant'}
                  </Button>
                  {editingVariantIndex !== null && (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setEditingVariantIndex(null)
                        setVariantForm({ sku: '', type: 'AVIATOR', size: '', color: '', imageFiles: [] })
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Variants List */}
              {formData.variants.length > 0 && (
                  <Box>
                    {formData.variants.map((variant, idx) => (
                      <Accordion key={idx}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%' }}>
                            <Chip label={variant.sku} size="small" />
                            <Chip label={variant.type} size="small" variant="outlined" />
                            <Typography variant="body2">{variant.size} - {variant.color}</Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Images:</strong> {variant.images.length} image(s)
                            </Typography>
                            {variant.images.map((img, imgIdx) => (
                              <Typography key={imgIdx} variant="caption" sx={{ display: 'block', mb: 0.5, wordBreak: 'break-all' }}>
                                {img}
                              </Typography>
                            ))}
                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                              <Button size="small" variant="outlined" onClick={() => handleEditVariant(idx)}>
                                Edit
                              </Button>
                              <Button size="small" color="error" variant="outlined" onClick={() => handleDeleteVariant(idx)}>
                                Delete
                              </Button>
                            </Box>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button type="submit" variant="contained">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </Button>
                <Button variant="outlined" onClick={cancelForm}>
                  Cancel
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Base Price</TableCell>
              <TableCell>Variants</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product._id} hover>
                <TableCell>
                  <Typography fontWeight={600}>{product.name}</Typography>
                </TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{formatVNPrice(product.basePrice)}</TableCell>
                <TableCell>
                  <Chip label={`${product.variants.length} variant(s)`} size="small" />
                </TableCell>
                <TableCell>
                  {new Date(product.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button variant="outlined" size="small" onClick={() => startEdit(product)}>
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDeleteClick(product._id)}
                    >
                      Delete
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {products.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">No products found</Typography>
          </Box>
        )}
      </TableContainer>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this product? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
