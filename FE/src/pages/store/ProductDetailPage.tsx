import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'
import { getAllProducts, type Product, type ProductVariant, type FrameProduct } from '@/lib/product-api'
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Chip,
  IconButton,
  Stack,
  Divider,
  Paper,
  Rating,
  Breadcrumbs,
  Link as MuiLink,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  Skeleton,
  Fab,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  ShoppingCart as CartIcon,
  Favorite as WishlistIcon,
  FavoriteBorder as WishlistBorderIcon,
  FlashOn as BuyNowIcon,
  ViewInAr as ThreeDIcon,
  Check as CheckIcon,
  LocalShipping as ShippingIcon,
  AssignmentReturn as ReturnIcon,
  Verified as WarrantyIcon,
  Star as StarIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Close as CloseIcon,
  ArrowUpward as ArrowUpIcon,
  ZoomIn as ZoomInIcon,
  ChevronLeft,
  ChevronRight,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Category as FrameIcon,
  Square as ShapeIcon,
  Texture as MaterialIcon,
  Wc as GenderIcon,
  Straighten as StraightenIcon,
  Visibility as LensIcon,
  Lens as LensIndexIcon,
  Science as CoatingIcon,
  Medication as PrescriptionIcon,
  Build as ServiceIcon,
  Schedule as DurationIcon,
} from '@mui/icons-material'

// ==================== Constants ====================

const VND_FORMATTER = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const formatPrice = (price: number): string => VND_FORMATTER.format(price)

const REASSURANCE_POINTS = [
  { icon: <ShippingIcon fontSize="small" />, text: 'Free shipping on orders over 2.000.000 ₫' },
  { icon: <ReturnIcon fontSize="small" />, text: '30-day return policy' },
  { icon: <WarrantyIcon fontSize="small" />, text: '1-year warranty' },
]

const CATEGORY_LABELS: Record<string, string> = {
  frame: 'Frame',
  lens: 'Lens',
  service: 'Service',
}

const CATEGORY_COLORS: Record<string, 'primary' | 'info' | 'success'> = {
  frame: 'primary',
  lens: 'info',
  service: 'success',
}

// Mock reviews data (replace with real API later)
const MOCK_REVIEWS = [
  {
    id: '1',
    user: 'John D.',
    rating: 5,
    title: 'Great product!',
    comment: 'Very comfortable and stylish. Would recommend to anyone looking for quality eyewear.',
    date: '2024-01-15',
    helpful: 12,
  },
  {
    id: '2',
    user: 'Sarah M.',
    rating: 4,
    title: 'Good value',
    comment: 'Nice frames for the price. Shipping was fast and packaging was secure.',
    date: '2024-01-10',
    helpful: 8,
  },
  {
    id: '3',
    user: 'Minh T.',
    rating: 5,
    title: 'Exceeded expectations',
    comment: 'The quality is amazing and fits perfectly. Will definitely buy again!',
    date: '2024-01-05',
    helpful: 15,
  },
]

// ==================== Types ====================

interface MediaItem {
  type: '2d' | '3d'
  url: string
}

// Type guard for FrameProduct (has variants)
function isFrameProduct(product: Product): product is FrameProduct {
  return product.category === 'frame'
}

interface Spec {
  label: string
  value: string
  icon: React.ReactElement
}

// ==================== Specifications Table ====================

interface SpecsTableProps {
  product: Product
}

function SpecsTable({ product }: SpecsTableProps) {
  const getSpecs = (): Spec[] => {
    const specs: Spec[] = []

    if (product.category === 'frame') {
      specs.push({ label: 'Frame Type', value: product.frameType || 'N/A', icon: <FrameIcon fontSize="small" /> })
      specs.push({ label: 'Shape', value: product.shape || 'N/A', icon: <ShapeIcon fontSize="small" /> })
      specs.push({ label: 'Material', value: product.material || 'N/A', icon: <MaterialIcon fontSize="small" /> })
      if (product.gender) specs.push({ label: 'Gender', value: product.gender, icon: <GenderIcon fontSize="small" /> })
      if (product.bridgeFit) specs.push({ label: 'Bridge Fit', value: product.bridgeFit, icon: <StraightenIcon fontSize="small" /> })
    } else if (product.category === 'lens') {
      specs.push({ label: 'Lens Type', value: product.lensType || 'N/A', icon: <LensIcon fontSize="small" /> })
      specs.push({ label: 'Index', value: product.index?.toString() || 'N/A', icon: <LensIndexIcon fontSize="small" /> })
      if (product.coatings?.length) specs.push({ label: 'Coatings', value: product.coatings.join(', '), icon: <CoatingIcon fontSize="small" /> })
      specs.push({ label: 'Prescription Required', value: product.isPrescriptionRequired ? 'Yes' : 'No', icon: <PrescriptionIcon fontSize="small" /> })
    } else if (product.category === 'service') {
      specs.push({ label: 'Service Type', value: product.serviceType || 'N/A', icon: <ServiceIcon fontSize="small" /> })
      specs.push({ label: 'Duration', value: `${product.durationMinutes || 0} minutes`, icon: <DurationIcon fontSize="small" /> })
    }

    return specs
  }

  const specs = getSpecs()

  if (specs.length === 0) return null

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Specifications
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {specs.map((spec) => (
          <Box key={spec.label} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Box sx={{ color: 'primary.main', mt: 0.3 }}>
              {spec.icon}
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                {spec.label}
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {spec.value}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

// ==================== Media Gallery Component ====================

interface MediaGalleryProps {
  images2D: string[]
  images3D: string[]
  activeImageIndex: number
  onImageSelect: (index: number) => void
  onZoomOpen: () => void
  productName: string
  loading?: boolean
}

function MediaGallery({
  images2D,
  images3D,
  activeImageIndex,
  onImageSelect,
  onZoomOpen,
  productName,
  loading = false,
}: MediaGalleryProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const allMedia: MediaItem[] = [
    ...images2D.map((url) => ({ type: '2d' as const, url })),
    ...images3D.map((url) => ({ type: '3d' as const, url })),
  ]

  const activeMedia = allMedia[activeImageIndex]
  const hasMultipleImages = allMedia.length > 1

  // Navigate to previous image
  const goToPrevious = () => {
    if (!hasMultipleImages) return
    const newIndex = activeImageIndex === 0 ? allMedia.length - 1 : activeImageIndex - 1
    onImageSelect(newIndex)
  }

  // Navigate to next image
  const goToNext = () => {
    if (!hasMultipleImages) return
    const newIndex = activeImageIndex === allMedia.length - 1 ? 0 : activeImageIndex + 1
    onImageSelect(newIndex)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeImageIndex, allMedia.length])

  // Touch swipe support for mobile
  const touchStartRef = useRef<number | null>(null)
  const touchEndRef = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return

    const swipeDistance = touchStartRef.current - touchEndRef.current
    const minSwipeDistance = 50

    if (swipeDistance > minSwipeDistance) {
      goToNext() // Swipe left -> next image
    } else if (swipeDistance < -minSwipeDistance) {
      goToPrevious() // Swipe right -> previous image
    }

    touchStartRef.current = null
    touchEndRef.current = null
  }

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}
      >
        <Skeleton variant="rectangular" sx={{ aspectRatio: '4 / 3' }} />
        <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rectangular" width={64} height={64} />
          ))}
        </Box>
      </Paper>
    )
  }

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      {/* Main Viewer */}
      <Box
        sx={{
          position: 'relative',
          aspectRatio: '4 / 3',
          bgcolor: 'grey.50',
          cursor: activeMedia?.type === '2d' ? 'zoom-in' : 'default',
        }}
        onClick={() => activeMedia?.type === '2d' && onZoomOpen()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {activeMedia?.type === '2d' ? (
          <Box
            component="img"
            src={activeMedia.url}
            alt={productName}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        ) : activeMedia?.type === '3d' ? (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.dark',
            }}
          >
            <ThreeDIcon sx={{ fontSize: 64, color: 'white', mb: 1 }} />
            <Typography variant="h6" color="white" fontWeight={600}>
              3D View
            </Typography>
            <Typography variant="body2" color="white" sx={{ opacity: 0.8 }}>
              Drag to rotate
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 60,
            }}
          >
            👓
          </Box>
        )}

        {/* Previous/Next Navigation Arrows */}
        {hasMultipleImages && (
          <>
            <IconButton
              onClick={(e) => {
                e.stopPropagation()
                goToPrevious()
              }}
              sx={{
                position: 'absolute',
                top: '50%',
                left: 8,
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                color: 'text.primary',
                boxShadow: 1,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 1)',
                  color: 'primary.main',
                },
                transition: 'all 0.2s',
                zIndex: 2,
              }}
              size={isMobile ? 'small' : 'medium'}
              aria-label="Previous image"
            >
              {isMobile ? <KeyboardArrowLeft /> : <ChevronLeft />}
            </IconButton>

            <IconButton
              onClick={(e) => {
                e.stopPropagation()
                goToNext()
              }}
              sx={{
                position: 'absolute',
                top: '50%',
                right: 8,
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                color: 'text.primary',
                boxShadow: 1,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 1)',
                  color: 'primary.main',
                },
                transition: 'all 0.2s',
                zIndex: 2,
              }}
              size={isMobile ? 'small' : 'medium'}
              aria-label="Next image"
            >
              {isMobile ? <KeyboardArrowRight /> : <ChevronRight />}
            </IconButton>
          </>
        )}

        {/* Image counter indicator */}
        {hasMultipleImages && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 500,
              zIndex: 2,
            }}
          >
            {activeImageIndex + 1} / {allMedia.length}
          </Box>
        )}

        {activeMedia?.type === '2d' && (
          <IconButton
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              boxShadow: 1,
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
              transition: 'all 0.2s',
              zIndex: 2,
            }}
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              onZoomOpen()
            }}
            aria-label="Zoom image"
          >
            <ZoomInIcon fontSize="small" />
          </IconButton>
        )}

        {/* 3D badge */}
        {activeMedia?.type === '3d' && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              bgcolor: 'primary.main',
              color: 'white',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 600,
              zIndex: 2,
            }}
          >
            3D
          </Box>
        )}
      </Box>

      {/* Thumbnails */}
      {hasMultipleImages && (
        <Box sx={{
          p: 2,
          display: 'flex',
          gap: 1.5,
          overflowX: 'auto',
          bgcolor: 'background.paper',
          '&::-webkit-scrollbar': {
            height: 6,
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'divider',
            borderRadius: 3,
          },
          '&::-webkit-scrollbar-thumb:hover': {
            bgcolor: 'text.secondary',
          },
        }}>
          {allMedia.map((media, index) => (
            <Box
              key={`${media.type}-${media.url}-${index}`}
              onClick={() => onImageSelect(index)}
              sx={{
                minWidth: 64,
                height: 64,
                flexShrink: 0,
                borderRadius: 2,
                overflow: 'hidden',
                cursor: 'pointer',
                border: '2px solid',
                borderColor: index === activeImageIndex ? 'primary.main' : 'transparent',
                position: 'relative',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: index === activeImageIndex ? 'primary.main' : 'text.secondary',
                  transform: 'scale(1.05)',
                },
              }}
            >
              {media.type === '2d' ? (
                <Box
                  component="img"
                  src={media.url}
                  alt={`${productName} thumbnail ${index + 1}`}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'primary.dark',
                  }}
                >
                  <ThreeDIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
              )}
              {media.type === '3d' && (
                <Chip
                  label="3D"
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    height: 16,
                    fontSize: '0.6rem',
                    bgcolor: 'primary.main',
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              )}
              {index === activeImageIndex && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    border: '2px solid',
                    borderColor: 'primary.main',
                    borderRadius: 1,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  )
}

// ==================== Detail Panel Skeleton ====================

function DetailPanelSkeleton() {
  return (
    <Paper elevation={1} sx={{ p: 2.5, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Skeleton variant="text" width="80%" height={32} />
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="60%" height={40} />
        <Divider />
        <Skeleton variant="rectangular" height={40} />
        <Skeleton variant="rectangular" height={40} />
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rectangular" width={60} height={36} />
          <Skeleton variant="rectangular" width={36} height={36} />
        </Stack>
      </Stack>
    </Paper>
  )
}

// ==================== Related Product Card ====================

interface RelatedProductCardProps {
  product: Product
  onClick: () => void
}

function RelatedProductCard({ product, onClick }: RelatedProductCardProps) {
  const mainImage = product.images2D?.[0] || ''
  const variantCount = isFrameProduct(product) ? product.variants?.length || 0 : 0

  return (
    <Paper
      onClick={onClick}
      sx={{
        borderRadius: 3,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
      elevation={0}
    >
      <Box sx={{ p: 2 }}>
        {/* Category Badge */}
        {product.category && (
          <Chip
            size="small"
            label={CATEGORY_LABELS[product.category] || product.category}
            color={CATEGORY_COLORS[product.category] || 'default'}
            sx={{ mb: 2, fontWeight: 600, textTransform: 'lowercase' }}
          />
        )}

        {/* Main Image */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 2,
            height: 160,
            bgcolor: 'grey.50',
            borderRadius: 2,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {mainImage ? (
            <Box
              component="img"
              src={mainImage}
              alt={product.name}
              sx={{ height: 160, objectFit: 'contain' }}
            />
          ) : (
            <Box sx={{ fontSize: 60 }}>👓</Box>
          )}
          {/* 3D Badge */}
          {product.images3D && product.images3D.length > 0 && (
            <Chip
              icon={<ThreeDIcon sx={{ fontSize: 10 }} />}
              label="3D"
              size="small"
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                height: 18,
                fontSize: 9,
                bgcolor: 'primary.main',
                color: 'white',
              }}
            />
          )}
        </Box>

        {/* Product Name */}
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
          {product.name}
        </Typography>

        {/* Price */}
        <Typography variant="h6" color="primary" fontWeight={700}>
          {formatPrice(product.basePrice)}
        </Typography>

        {/* Variants */}
        {variantCount > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {variantCount} variant{variantCount > 1 ? 's' : ''} available
          </Typography>
        )}
      </Box>
    </Paper>
  )
}

// ==================== Main Component ====================

export function ProductDetailPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  // ==================== State ====================

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Variant state
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  // Media state
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)

  // Cart/Wishlist state
  const [isAdding, setIsAdding] = useState(false)
  const [isInWishlist, setIsInWishlist] = useState(false)

  // Snackbar state
  const [snackbar, setSnackbarState] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  // ==================== Computed Values ====================

  const averageRating = MOCK_REVIEWS.length > 0
    ? MOCK_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / MOCK_REVIEWS.length
    : 0

  // Get current images based on selected variant
  // Shows ALL variant images from all variants, plus base product images
  const getCurrentImages = () => {
    const baseImages2D = product?.images2D || []
    const baseImages3D = product?.images3D || []

    // Collect images from ALL variants (for frame products)
    let allVariantImages2D: string[] = []
    let allVariantImages3D: string[] = []

    if (product && isFrameProduct(product) && product.variants) {
      product.variants.forEach((variant) => {
        if (variant.isActive !== false) {
          if (variant.images2D?.length) {
            allVariantImages2D.push(...variant.images2D)
          }
          if (variant.images3D?.length) {
            allVariantImages3D.push(...variant.images3D)
          }
        }
      })
    }

    // Combine: all variant images + base images (deduplicated)
    const images2D = [...new Set([...allVariantImages2D, ...baseImages2D])]
    const images3D = [...new Set([...allVariantImages3D, ...baseImages3D])]

    return { images2D, images3D }
  }

  const { images2D, images3D } = getCurrentImages()

  // Get unique colors and sizes from variants
  const getUniqueColors = () => {
    if (!product || !isFrameProduct(product)) return []
    return (
      product.variants
        ?.filter((v) => v.isActive !== false)
        .map((v) => v.color)
        .filter((c, i, arr) => c && arr.indexOf(c) === i) || []
    )
  }

  const getUniqueSizes = () => {
    if (!product || !isFrameProduct(product)) return []
    return (
      product.variants
        ?.filter((v) => v.isActive !== false)
        .map((v) => v.size)
        .filter((s, i, arr) => s && arr.indexOf(s) === i) || []
    )
  }

  // Get display price
  const getDisplayPrice = () => {
    if (!product) return 0
    return selectedVariant?.price || product.basePrice
  }

  // Check stock
  const isInStock = () => {
    if (!product) return false
    if (selectedVariant) return selectedVariant.isActive !== false
    return product.isActive
  }

  // Get stock message
  const getStockMessage = () => {
    if (!product) return ''
    if (selectedVariant) {
      return selectedVariant.isActive !== false ? 'In Stock' : 'Out of Stock'
    }
    return product.isActive ? 'In Stock' : 'Out of Stock'
  }

  // ==================== Handlers ====================

  // Load product by slug
  const loadProduct = useCallback(async () => {
    if (!slug) {
      setError('Product slug is required')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Load all products and find by slug (since API doesn't have slug lookup)
      const allProducts = await getAllProducts()
      const found = allProducts.find((p) => p.slug === slug)

      if (!found) {
        throw new Error('Product not found')
      }

      setProduct(found)

      // Auto-select first in-stock variant (only for frame products)
      if (isFrameProduct(found) && found.variants && found.variants.length > 0) {
        const firstInStock = found.variants.find((v) => v.isActive !== false) || found.variants[0]
        setSelectedVariant(firstInStock)
        setSelectedColor(firstInStock.color)
        setSelectedSize(firstInStock.size)
      }

      setActiveImageIndex(0)

      // Load related products
      const related = allProducts
        .filter(
          (p) => p.category === found.category && p._id !== found._id && !p.isDeleted && p.isActive
        )
        .slice(0, 8)
      setRelatedProducts(related)

      window.scrollTo(0, 0)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load product'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    loadProduct()
  }, [loadProduct])

  // Reset variant state when product changes
  useEffect(() => {
    setSelectedColor(null)
    setSelectedSize(null)
    setSelectedVariant(null)
    setActiveImageIndex(0)
  }, [product?._id])

  // Update selected variant when color or size changes
  useEffect(() => {
    if (!product || !isFrameProduct(product)) return

    if (selectedColor && selectedSize) {
      const variant = product.variants?.find(
        (v) => v.color === selectedColor && v.size === selectedSize && v.isActive !== false
      )
      setSelectedVariant(variant || null)
    }
  }, [selectedColor, selectedSize, product])

  // Handle color selection
  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    // If a size is already selected, the useEffect will update the variant
    // If not, select the first available size for this color
    if (!selectedSize) {
      const uniqueSizes = getUniqueSizes()
      if (uniqueSizes.length > 0) {
        setSelectedSize(uniqueSizes[0])
      }
    }
  }

  // Handle size selection
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size)
    // If a color is already selected, the useEffect will update the variant
    // If not, select the first available color for this size
    if (!selectedColor) {
      const uniqueColors = getUniqueColors()
      if (uniqueColors.length > 0) {
        setSelectedColor(uniqueColors[0])
      }
    }
  }

  // Add to cart
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (!product) return

    setIsAdding(true)
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const cartItemId = selectedVariant ? `${product._id}-${selectedVariant.sku}` : product._id

      const existingItem = cart.find((item: any) => item.cartItemId === cartItemId)
      if (existingItem) {
        existingItem.qty += quantity
      } else {
        cart.push({
          cartItemId,
          id: product._id,
          name: product.name,
          price: getDisplayPrice(),
          variantSku: selectedVariant?.sku,
          variantName: selectedVariant
            ? `${selectedVariant.size} - ${selectedVariant.color}`
            : 'Standard',
          qty: quantity,
          image: images2D[0] || '',
        })
      }

      localStorage.setItem('cart', JSON.stringify(cart))
      window.dispatchEvent(new CustomEvent('cartUpdated'))

      setSnackbarState({ open: true, message: 'Added to cart!', severity: 'success' })
    } catch (err) {
      setSnackbarState({ open: true, message: 'Failed to add to cart', severity: 'error' })
    } finally {
      setIsAdding(false)
    }
  }

  // Buy now
  const handleBuyNow = () => {
    handleAddToCart()
    navigate('/checkout')
  }

  // Toggle wishlist
  const toggleWishlist = () => {
    setIsInWishlist((prev) => !prev)
    setSnackbarState({
      open: true,
      message: isInWishlist ? 'Removed from wishlist' : 'Added to wishlist',
      severity: 'success',
    })
  }

  // ==================== Render ====================

  const uniqueColors = getUniqueColors()
  const uniqueSizes = getUniqueSizes()

  // Loading state
  if (loading) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
          <Skeleton variant="text" width={400} height={24} sx={{ mb: 4 }} />
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 7, lg: 8 }}>
              <MediaGallery loading={true} images2D={[]} images3D={[]} activeImageIndex={0} onImageSelect={() => {}} onZoomOpen={() => {}} productName="" />
            </Grid>
            <Grid size={{ xs: 12, md: 5, lg: 4 }}>
              <DetailPanelSkeleton />
            </Grid>
          </Grid>
        </Container>
      </Box>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Product not found'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back to Products
        </Button>
      </Container>
    )
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Breadcrumbs sx={{ py: 2 }} aria-label="breadcrumb">
            <MuiLink component={Link} to="/" underline="hover" color="text.primary">
              Home
            </MuiLink>
            <MuiLink component={Link} to="/products" underline="hover" color="text.primary">
              All Products
            </MuiLink>
            {product.category && (
              <MuiLink
                component={Link}
                to={`/products?category=${product.category}`}
                underline="hover"
                color="text.primary"
              >
                {CATEGORY_LABELS[product.category] || product.category}
              </MuiLink>
            )}
            <Typography color="text.primary">{product.name}</Typography>
          </Breadcrumbs>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Back Link */}
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>
          Back to Products
        </Button>

        {/* Main Section: Media Gallery + Purchase Panel */}
        <Grid container spacing={4}>
          {/* Media Gallery (Left) */}
          <Grid size={{ xs: 12, md: 7, lg: 8 }}>
            <MediaGallery
              images2D={images2D}
              images3D={images3D}
              activeImageIndex={activeImageIndex}
              onImageSelect={setActiveImageIndex}
              onZoomOpen={() => setZoomOpen(true)}
              productName={product.name}
            />
          </Grid>

          {/* Purchase Panel (Right) */}
          <Grid size={{ xs: 12, md: 5, lg: 4 }}>
            <Paper
              elevation={1}
              sx={{
                p: 2.5,
                borderRadius: 3,
                position: { md: 'sticky' },
                top: { md: 96 },
                maxHeight: { md: 'calc(100vh - 120px)' },
                overflowY: 'auto',
              }}
            >
              <Stack spacing={1.5}>
                {/* Product Name */}
                <Typography variant="h5" fontWeight={700}>
                  {product.name}
                </Typography>

                {/* Category Badge */}
                {product.category && (
                  <Chip
                    label={CATEGORY_LABELS[product.category] || product.category}
                    color={CATEGORY_COLORS[product.category] || 'default'}
                    size="small"
                    sx={{ alignSelf: 'flex-start' }}
                  />
                )}

                {/* Rating */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Rating value={averageRating} precision={0.5} readOnly size="small" />
                  <Typography variant="caption" color="text.secondary">
                    ({MOCK_REVIEWS.length} reviews)
                  </Typography>
                </Box>

                {/* Price */}
                <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                  <Typography variant="h4" color="primary.main" fontWeight={700}>
                    {formatPrice(getDisplayPrice())}
                  </Typography>
                </Box>

                {/* Stock Status */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {isInStock() ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
                      <CheckIcon fontSize="small" />
                      <Typography variant="body2" color="success.main" fontWeight={500}>
                        {getStockMessage()}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="error.main" fontWeight={500}>
                      {getStockMessage()}
                    </Typography>
                  )}
                </Box>

                <Divider />

                {/* Variant Selectors */}
                {uniqueColors.length > 0 && (
                  <Box>
                    <Typography variant="caption" fontWeight={600} gutterBottom display="block">
                      Color: {selectedColor || 'Select a color'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {uniqueColors.map((color) => {
                        const isSelected = selectedColor === color
                        const hasVariantInStock = isFrameProduct(product) && product.variants?.some(
                          (v) => v.color === color && v.isActive !== false
                        )
                        return (
                          <Chip
                            key={color}
                            label={color}
                            onClick={() => handleColorSelect(color)}
                            disabled={!hasVariantInStock}
                            size="small"
                            variant={isSelected ? 'filled' : 'outlined'}
                            color={isSelected ? 'primary' : 'default'}
                            sx={{
                              minWidth: 60,
                              height: 28,
                              fontSize: '0.75rem',
                              opacity: hasVariantInStock ? 1 : 0.4,
                            }}
                          />
                        )
                      })}
                    </Box>
                  </Box>
                )}

                {uniqueSizes.length > 0 && (
                  <Box>
                    <Typography variant="caption" fontWeight={600} gutterBottom display="block">
                      Size: {selectedSize || 'Select a size'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {uniqueSizes.map((size) => {
                        const isSelected = selectedSize === size
                        const hasVariantInStock = isFrameProduct(product) && product.variants?.some(
                          (v) => v.size === size && v.isActive !== false
                        )
                        return (
                          <Chip
                            key={size}
                            label={size}
                            onClick={() => handleSizeSelect(size)}
                            disabled={!hasVariantInStock}
                            size="small"
                            variant={isSelected ? 'filled' : 'outlined'}
                            color={isSelected ? 'primary' : 'default'}
                            sx={{
                              minWidth: 50,
                              height: 28,
                              fontSize: '0.75rem',
                              opacity: hasVariantInStock ? 1 : 0.4,
                            }}
                          />
                        )
                      })}
                    </Box>
                  </Box>
                )}

                {/* Quantity */}
                <Box>
                  <Typography variant="caption" fontWeight={600} gutterBottom display="block">
                    Quantity
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 2,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography
                        sx={{
                          px: 2,
                          py: 1,
                          minWidth: 40,
                          textAlign: 'center',
                          fontSize: '0.875rem',
                        }}
                      >
                        {quantity}
                      </Typography>
                      <IconButton size="small" onClick={() => setQuantity(quantity + 1)}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>

                {/* Action Buttons */}
                <Stack spacing={1}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<CartIcon />}
                    disabled={!isInStock() || isAdding}
                    onClick={handleAddToCart}
                    sx={{ py: 1.5 }}
                  >
                    {isAdding ? 'Adding...' : 'Add to Cart'}
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    color="secondary"
                    size="large"
                    startIcon={<BuyNowIcon />}
                    disabled={!isInStock()}
                    onClick={handleBuyNow}
                    sx={{ py: 1.5 }}
                  >
                    Buy Now
                  </Button>
                  <Button
                    fullWidth
                    variant={isInWishlist ? 'contained' : 'outlined'}
                    color={isInWishlist ? 'error' : 'primary'}
                    size="large"
                    onClick={toggleWishlist}
                    startIcon={isInWishlist ? <WishlistIcon /> : <WishlistBorderIcon />}
                    sx={{ py: 1 }}
                  >
                    {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  </Button>
                </Stack>

                {/* Reassurance Points */}
                <Stack direction="column" spacing={0.5} sx={{ pt: 0.5 }}>
                  {REASSURANCE_POINTS.map((point) => (
                    <Box key={point.text} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ color: 'success.main', fontSize: 16 }}>{point.icon}</Box>
                      <Typography variant="caption" color="text.secondary">
                        {point.text}
                      </Typography>
                    </Box>
                  ))}
                </Stack>

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {product.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Below-Fold Sections */}
        <Stack spacing={3} sx={{ mt: 6 }}>
          {/* Description */}
          <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3 }}>
            <Box sx={{ px: 3, pt: 3, pb: 2 }}>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Description
              </Typography>
              <Divider />
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" sx={{ lineHeight: 1.8, maxWidth: 800 }}>
                  {product.description}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Specifications */}
          <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3 }}>
            <Box sx={{ px: 3, pt: 3, pb: 2 }}>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Specifications
              </Typography>
              <Divider />
              <Box sx={{ mt: 2 }}>
                <SpecsTable product={product} />
              </Box>
            </Box>
          </Paper>

          {/* Reviews */}
          <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3 }}>
            <Box sx={{ px: 3, pt: 3, pb: 2 }}>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Reviews ({MOCK_REVIEWS.length})
              </Typography>
              <Divider />
              <Box sx={{ mt: 2 }}>
                {/* Rating Summary */}
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 4, mb: 4, flexWrap: 'wrap' }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight={700} color="primary.main">
                      {averageRating.toFixed(1)}
                    </Typography>
                    <Rating
                      value={averageRating}
                      precision={0.5}
                      readOnly
                      size="large"
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {MOCK_REVIEWS.length} reviews
                    </Typography>
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = MOCK_REVIEWS.filter((r) => Math.floor(r.rating) === stars).length
                      const percentage = MOCK_REVIEWS.length > 0 ? (count / MOCK_REVIEWS.length) * 100 : 0
                      return (
                        <Box
                          key={stars}
                          sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
                        >
                          <Typography variant="body2">{stars}</Typography>
                          <StarIcon sx={{ fontSize: 16 }} />
                          <Box
                            sx={{ flexGrow: 1, height: 8, bgcolor: 'grey.200', borderRadius: 1 }}
                          >
                            <Box
                              sx={{
                                height: '100%',
                                bgcolor: 'warning.main',
                                borderRadius: 1,
                                width: `${percentage}%`,
                              }}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {count}
                          </Typography>
                        </Box>
                      )
                    })}
                  </Box>
                </Box>

                {/* Reviews List */}
                <Stack spacing={2}>
                  {MOCK_REVIEWS.map((review) => (
                    <Paper key={review.id} variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 600,
                          }}
                        >
                          {review.user.charAt(0)}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {review.user}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Rating value={review.rating} readOnly size="small" />
                            <Typography variant="caption" color="text.secondary">
                              {review.date}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        {review.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {review.comment}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            </Box>
          </Paper>
        </Stack>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <Box sx={{ mt: 6 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              You May Also Like
            </Typography>
            <Grid container spacing={3}>
              {relatedProducts.map((relatedProduct) => (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={relatedProduct._id}>
                  <RelatedProductCard
                    product={relatedProduct}
                    onClick={() => navigate(`/product/${relatedProduct.slug}`)}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>

      {/* Zoom Dialog */}
      <Dialog open={zoomOpen} onClose={() => setZoomOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          {product.name}
          <IconButton onClick={() => setZoomOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.50',
              borderRadius: 2,
              p: 2,
            }}
          >
            {images2D[activeImageIndex] ? (
              <Box
                component="img"
                src={images2D[activeImageIndex]}
                alt={product.name}
                sx={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
              />
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <ThreeDIcon sx={{ fontSize: 80, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  3D Model Viewer
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Full 3D viewer coming soon
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbarState({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarState({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Scroll to Top Button */}
      <Fab
        color="primary"
        size="small"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        <ArrowUpIcon />
      </Fab>
    </Box>
  )
}

export default ProductDetailPage
