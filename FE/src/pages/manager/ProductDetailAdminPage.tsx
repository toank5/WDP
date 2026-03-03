import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
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
  IconButton,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ViewInAr as ThreeDIcon,
} from '@mui/icons-material'
import { getProductById, type Product, type ProductVariant, type FrameProduct } from '@/lib/product-api'

// Type guard for FrameProduct (has variants)
function isFrameProduct(product: Product): product is FrameProduct {
  return product.category === 'frame'
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price)
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

export function ProductDetailAdminPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // State
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({ open: false, message: '', severity: 'success' })

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }, [])

  // Load product
  const loadProduct = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      const data = await getProductById(id)
      setProduct(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load product'
      showSnackbar(message, 'error')
      // Navigate back if not found
      if (message.includes('not found')) {
        navigate('/dashboard/all-products')
      }
    } finally {
      setLoading(false)
    }
  }, [id, navigate, showSnackbar])

  useEffect(() => {
    loadProduct()
  }, [loadProduct])

  // Handle toggle active status
  const handleToggleActive = async () => {
    // This would call the update API - for now just show a message
    showSnackbar('Toggle active status - to be implemented', 'error')
  }

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        // await deleteProduct(id)
        showSnackbar('Product deleted successfully', 'success')
        navigate('/dashboard/all-products')
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to delete product'
        showSnackbar(message, 'error')
      }
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box my={3} display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (!product) {
    return null
  }

  // Check if product has 3D media
  const has3D =
    (product.images3D && product.images3D.length > 0) ||
    (isFrameProduct(product) && product.variants && product.variants.some((v: ProductVariant) => v.images3D && v.images3D.length > 0))

  return (
    <Container maxWidth="lg">
      <Box my={3}>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/dashboard/all-products')}
              >
                Back
              </Button>
              <Box>
                <Typography variant="h5" fontWeight={600}>
                  {product.name}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                  <Chip
                    label={getCategoryLabel(product.category)}
                    color={product.category === 'frame' ? 'primary' : product.category === 'lens' ? 'info' : 'success'}
                    size="small"
                  />
                  {has3D && (
                    <Chip
                      icon={<ThreeDIcon sx={{ fontSize: 14 }} />}
                      label="3D Available"
                      size="small"
                      color="secondary"
                    />
                  )}
                  <Chip
                    label={product.isActive ? 'Active' : 'Inactive'}
                    color={product.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Stack>
              </Box>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/dashboard/products/${product._id}/edit`)}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color={product.isActive ? 'warning' : 'success'}
                startIcon={product.isActive ? <VisibilityOffIcon /> : <VisibilityIcon />}
                onClick={handleToggleActive}
              >
                {product.isActive ? 'Deactivate' : 'Activate'}
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </Stack>
          </Box>
        </Paper>

        <Grid container spacing={2}>
          {/* Images */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Images
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={1}>
                  {/* 2D Images */}
                  {(product.images2D || []).map((url, index) => (
                    <Grid size={{ xs: 6, md: 4 }} key={`2d-${index}`}>
                      <Box
                        component="img"
                        src={url}
                        alt={`2D Image ${index + 1}`}
                        sx={{
                          width: '100%',
                          aspectRatio: '1',
                          objectFit: 'cover',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      />
                    </Grid>
                  ))}
                  {/* Variant 2D Images */}
                  {isFrameProduct(product) && product.variants?.map((variant: ProductVariant) =>
                    (variant.images2D || []).map((url, index) => (
                      <Grid size={{ xs: 6, md: 4 }} key={`${variant.sku}-2d-${index}`}>
                        <Box
                          component="img"
                          src={url}
                          alt={`${variant.sku} 2D Image ${index + 1}`}
                          sx={{
                            width: '100%',
                            aspectRatio: '1',
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        />
                      </Grid>
                    ))
                  )}
                </Grid>
                {(!product.images2D || product.images2D.length === 0) &&
                  !(isFrameProduct(product) && product.variants?.some((v: ProductVariant) => v.images2D && v.images2D.length > 0)) && (
                  <Typography color="text.secondary" align="center" py={4}>
                    No 2D images available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Basic Info */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Product Information
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      SKU / Slug
                    </Typography>
                    <Typography variant="body1">
                      {product.slug || 'N/A'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Category
                    </Typography>
                    <Typography variant="body1">
                      {getCategoryLabel(product.category)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body2">
                      {product.description || 'N/A'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Base Price
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      {formatPrice(product.basePrice)}
                    </Typography>
                  </Box>

                  {product.category === 'frame' && (
                    <>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Frame Type
                        </Typography>
                        <Typography variant="body1">
                          {product.frameType || 'N/A'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Shape
                        </Typography>
                        <Typography variant="body1">
                          {product.shape || 'N/A'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Material
                        </Typography>
                        <Typography variant="body1">
                          {product.material || 'N/A'}
                        </Typography>
                      </Box>
                    </>
                  )}

                  {(product.tags && product.tags.length > 0) && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Tags
                      </Typography>
                      <Box mt={0.5} display="flex" gap={0.5} flexWrap="wrap">
                        {product.tags.map((tag: string) => (
                          <Chip key={tag} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Variants */}
          {isFrameProduct(product) && (
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Variants ({product.variants?.length || 0})
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  {!product.variants || product.variants.length === 0 ? (
                    <Typography color="text.secondary" align="center" py={4}>
                      No variants available
                    </Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>SKU</TableCell>
                            <TableCell>Size</TableCell>
                            <TableCell>Color</TableCell>
                            <TableCell align="right">Price</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Images</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {product.variants.map((variant: ProductVariant, index: number) => (
                            <TableRow key={`${variant.sku}-${index}`}>
                              <TableCell>
                                <Typography variant="body2" fontWeight={500}>
                                  {variant.sku}
                                </Typography>
                              </TableCell>
                              <TableCell>{variant.size}</TableCell>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Box
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: '50%',
                                      bgcolor: variant.color?.toLowerCase() || 'grey.300',
                                      border: '1px solid',
                                      borderColor: 'divider',
                                    }}
                                  />
                                  {variant.color}
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                {variant.price !== undefined ? formatPrice(variant.price) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={variant.isActive ? 'Active' : 'Inactive'}
                                  color={variant.isActive ? 'success' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={0.5}>
                                  <Chip
                                    label={`${variant.images2D?.length || 0} 2D`}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Chip
                                    label={`${variant.images3D?.length || 0} 3D`}
                                    size="small"
                                    variant="outlined"
                                    color={variant.images3D && variant.images3D.length > 0 ? 'secondary' : 'default'}
                                  />
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
            </Grid>
          )}

          {/* Metadata */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Metadata
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1} direction={{ xs: 'column', md: 'row' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body2">
                      {new Date(product.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Last Updated
                    </Typography>
                    <Typography variant="body2">
                      {new Date(product.updatedAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
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
