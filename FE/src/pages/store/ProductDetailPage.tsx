import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'
import { useCartStore } from '@/store/cart.store'
import { getAllProducts, checkInventoryAvailability, type Product, type ProductVariant, type FrameProduct, formatImageUrl } from '@/lib/product-api'
import { cartApi } from '@/lib/cart-api'

import { wishlistApi } from '@/lib/wishlist-api'
import { TryOnButton } from '@/components/virtual-tryon/TryOnButton'
import { reviewApi, type Review, type ReviewStats } from '@/lib/review-api'
import { getActiveCombos, type Combo } from '@/lib/combo-api'
import { getActivePromotions, type Promotion, validatePromotion } from '@/lib/promotion-api'
import {
  Box,
  Container,
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
  CircularProgress,
  TextField,
  useTheme,
  useMediaQuery,
  Grid,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  ShoppingCart as CartIcon,
  ShoppingCartOutlined,
  Favorite as WishlistIcon,
  FavoriteBorder as WishlistBorderIcon,
  FlashOn as BuyNowIcon,
  ViewInAr as ThreeDIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ArrowUpward as ArrowUpIcon,
  ZoomIn as ZoomInIcon,
  ChevronLeft,
  ChevronRight,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Lens as LensIndexIcon,
  FiberManualRecord,
  ThumbUpOffAlt,
  Remove as RemoveIcon,
  Add as AddIcon,
  LocalOffer as ComboIcon,
  Discount as DiscountIcon,
  CardGiftcard as GiftIcon,
} from '@mui/icons-material'

// ==================== Constants ====================

const VND_FORMATTER = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const formatPrice = (price: number): string => VND_FORMATTER.format(price)

const REASSURANCE_POINTS = [
  { icon: '🚚', text: 'Free shipping on orders over 2.000.000 ₫' },
  { icon: '🔄', text: '30-day return policy' },
  { icon: '✅', text: '1-year warranty' },
  { icon: '🔒', text: 'Secure payment' },
  { icon: '📞', text: '24/7 customer support' },
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

// Use mock reviews as fallback if API fails
const REVIEWS_FALLBACK = MOCK_REVIEWS

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
  const getSpecs = (): { label: string; value: string; emoji?: string }[] => {
    const specs: { label: string; value: string; emoji?: string }[] = []

    if (product.category === 'frame') {
      specs.push({ label: 'Frame Type', value: product.frameType || 'N/A', emoji: '👓' })
      specs.push({ label: 'Shape', value: product.shape || 'N/A', emoji: '🔷' })
      specs.push({ label: 'Material', value: product.material || 'N/A', emoji: '✨' })
      if (product.gender) specs.push({ label: 'Gender', value: product.gender, emoji: '👤' })
      if (product.bridgeFit) specs.push({ label: 'Bridge Fit', value: product.bridgeFit, emoji: '📏' })
    } else if (product.category === 'lens') {
      specs.push({ label: 'Lens Type', value: product.lensType || 'N/A', emoji: '👁️' })
      specs.push({ label: 'Index', value: product.index?.toString() || 'N/A', emoji: '🔍' })
      if (product.coatings?.length) specs.push({ label: 'Coatings', value: product.coatings.join(', '), emoji: '🛡️' })
    } else if (product.category === 'service') {
      specs.push({ label: 'Service Type', value: product.serviceType || 'N/A', emoji: '🔧' })
      specs.push({ label: 'Duration', value: `${product.durationMinutes || 0} minutes`, emoji: '⏱️' })
    }

    return specs
  }

  const specs = getSpecs()

  if (specs.length === 0) return null

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
      {specs.map((spec) => (
        <Box
          key={spec.label}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1.25,
            borderRadius: 2,
            bgcolor: 'grey.50',
            transition: 'all 0.2s',
            border: '1px solid transparent',
            '&:hover': {
              bgcolor: 'primary.50',
              borderColor: 'primary.100',
              transform: 'translateX(2px)',
            },
          }}
        >
          <Box sx={{ fontSize: 16 }}>{spec.emoji || '📋'}</Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', mb: 0.25 }}>
              {spec.label}
            </Typography>
            <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {spec.value}
            </Typography>
          </Box>
        </Box>
      ))}
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
  const [hoveredImage, setHoveredImage] = useState<number | null>(null)

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
        elevation={3}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}
      >
        <Skeleton variant="rectangular" sx={{ aspectRatio: '4 / 3' }} animation="wave" />
        <Box sx={{ p: 2.5, display: 'flex', gap: 1.5 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rectangular" width={72} height={72} sx={{ borderRadius: 2 }} animation="wave" />
          ))}
        </Box>
      </Paper>
    )
  }

  return (
    <Paper
      elevation={3}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }}
    >
      {/* Main Viewer */}
      <Box
        sx={{
          position: 'relative',
          aspectRatio: '4 / 3',
          bgcolor: 'grey.50',
          cursor: activeMedia?.type === '2d' ? 'zoom-in' : 'default',
          overflow: 'hidden',
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
              transition: 'transform 0.3s ease',
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
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            }}
          >
            <ThreeDIcon sx={{ fontSize: 80, color: 'white', mb: 2, animation: 'pulse 2s infinite' }} />
            <Typography variant="h5" color="white" fontWeight={700}>
              3D View
            </Typography>
            <Typography variant="body2" color="white" sx={{ opacity: 0.9, mt: 1 }}>
              Drag to rotate • Scroll to zoom
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
              fontSize: 80,
              bgcolor: 'grey.100',
            }}
          >
            👓
          </Box>
        )}

        {/* Previous/Next Navigation Arrows - Enhanced */}
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
                left: 12,
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                color: 'text.primary',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                width: 44,
                height: 44,
                '&:hover': {
                  bgcolor: 'white',
                  color: 'primary.main',
                  transform: 'translateY(-50%) scale(1.1)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 2,
              }}
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
                right: 12,
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                color: 'text.primary',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                width: 44,
                height: 44,
                '&:hover': {
                  bgcolor: 'white',
                  color: 'primary.main',
                  transform: 'translateY(-50%) scale(1.1)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 2,
              }}
              aria-label="Next image"
            >
              {isMobile ? <KeyboardArrowRight /> : <ChevronRight />}
            </IconButton>
          </>
        )}

        {/* Enhanced Image counter */}
        {hasMultipleImages && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              px: 2,
              py: 0.75,
              borderRadius: 2,
              fontSize: '0.8rem',
              fontWeight: 600,
              backdropFilter: 'blur(8px)',
              zIndex: 2,
            }}
          >
            {activeImageIndex + 1} <Box component="span" sx={{ opacity: 0.6, mx: 0.5 }}>/</Box> {allMedia.length}
          </Box>
        )}

        {/* Dots indicator */}
        {hasMultipleImages && allMedia.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 0.75,
              zIndex: 2,
            }}
          >
            {allMedia.map((_, index) => (
              <Box
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  onImageSelect(index)
                }}
                sx={{
                  width: index === activeImageIndex ? 24 : 8,
                  height: 8,
                  borderRadius: 1,
                  bgcolor: index === activeImageIndex ? 'white' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  '&:hover': {
                    bgcolor: index === activeImageIndex ? 'white' : 'rgba(255,255,255,0.6)',
                    width: index === activeImageIndex ? 24 : 12,
                  },
                }}
              />
            ))}
          </Box>
        )}

        {/* Enhanced zoom button */}
        {activeMedia?.type === '2d' && (
          <IconButton
            sx={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              width: 40,
              height: 40,
              '&:hover': {
                bgcolor: 'white',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s',
              zIndex: 2,
            }}
            onClick={(e) => {
              e.stopPropagation()
              onZoomOpen()
            }}
            aria-label="Zoom image"
          >
            <ZoomInIcon />
          </IconButton>
        )}

        {/* Enhanced 3D badge */}
        {activeMedia?.type === '3d' && (
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              color: 'primary.main',
              px: 2,
              py: 0.75,
              borderRadius: 2,
              fontSize: '0.8rem',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <ThreeDIcon sx={{ fontSize: 16 }} />
            3D View
          </Box>
        )}
      </Box>

      {/* Enhanced Thumbnails */}
      {hasMultipleImages && (
        <Box sx={{
          p: 2.5,
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
              onMouseEnter={() => setHoveredImage(index)}
              onMouseLeave={() => setHoveredImage(null)}
              sx={{
                minWidth: 72,
                width: 72,
                height: 72,
                flexShrink: 0,
                borderRadius: 3,
                overflow: 'hidden',
                cursor: 'pointer',
                border: '2px solid',
                borderColor: index === activeImageIndex ? 'primary.main' : 'divider',
                position: 'relative',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: index === activeImageIndex ? 'scale(1.05)' : (hoveredImage === index ? 'scale(1.02)' : 'scale(1)'),
                boxShadow: index === activeImageIndex ? `0 0 0 3px ${theme.palette.primary.main}25` : 'none',
                '&:hover': {
                  borderColor: index === activeImageIndex ? 'primary.main' : 'text.secondary',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
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
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  }}
                >
                  <ThreeDIcon sx={{ color: 'white', fontSize: 28 }} />
                </Box>
              )}
              {media.type === '3d' && (
                <Chip
                  label="3D"
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    height: 18,
                    fontSize: '0.65rem',
                    bgcolor: 'primary.main',
                    color: 'white',
                    fontWeight: 700,
                  }}
                />
              )}
              {index === activeImageIndex && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  <CheckIcon sx={{ color: 'white', fontSize: 14 }} />
                </Box>
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
    <Paper elevation={3} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
      <Stack spacing={2.5}>
        <Skeleton variant="text" width="90%" height={36} />
        <Skeleton variant="text" width="50%" height={24} />
        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
        <Divider />
        <Skeleton variant="text" width="40%" height={20} />
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rectangular" width={50} height={50} sx={{ borderRadius: '50%' }} />
          <Skeleton variant="rectangular" width={50} height={50} sx={{ borderRadius: '50%' }} />
          <Skeleton variant="rectangular" width={50} height={50} sx={{ borderRadius: '50%' }} />
          <Skeleton variant="rectangular" width={50} height={50} sx={{ borderRadius: '50%' }} />
        </Stack>
        <Skeleton variant="rectangular" height={50} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={50} sx={{ borderRadius: 2 }} />
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
  const mainImage = formatImageUrl(product.images2D?.[0])
  const variantCount = isFrameProduct(product) ? product.variants?.length || 0 : 0

  return (
    <Paper
      onClick={onClick}
      sx={{
        borderRadius: 4,
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        height: '100%',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
          borderColor: 'primary.main',
        },
      }}
      elevation={1}
    >
      <Box sx={{ p: 2.5 }}>
        {/* Category Badge */}
        {product.category && (
          <Chip
            size="small"
            label={CATEGORY_LABELS[product.category] || product.category}
            color={CATEGORY_COLORS[product.category] || 'default'}
            sx={{
              mb: 2,
              fontWeight: 700,
              textTransform: 'uppercase',
              fontSize: '0.65rem',
              letterSpacing: 0.5,
              height: 20,
            }}
          />
        )}

        {/* Main Image */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 2.5,
            height: 160,
            bgcolor: 'grey.50',
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
            transition: 'all 0.3s',
          }}
        >
          {mainImage ? (
            <Box
              component="img"
              src={mainImage}
              alt={product.name}
              sx={{
                height: 140,
                width: '100%',
                objectFit: 'contain',
                transition: 'transform 0.3s',
              }}
            />
          ) : null}
          {!mainImage && (
            <Box sx={{ fontSize: 60, display: mainImage ? 'none' : 'flex' }}>👓</Box>
          )}

          {/* 3D Badge - Enhanced */}
          {product.images3D && product.images3D.length > 0 && (
            <Chip
              icon={<ThreeDIcon sx={{ fontSize: 11 }} />}
              label="3D"
              size="small"
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: 'primary.main',
                color: 'white',
              }}
            />
          )}

          {/* Quick View Overlay on Hover */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.3s',
              '&:hover': {
                opacity: 1,
              },
            }}
          >
            <Button
              variant="contained"
              size="small"
              sx={{
                borderRadius: 2,
                fontWeight: 600,
              }}
            >
              Quick View
            </Button>
          </Box>
        </Box>

        {/* Product Name */}
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, lineHeight: 1.3, minHeight: 34 }}>
          {product.name}
        </Typography>

        {/* Price - Enhanced */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="h6" color="primary.main" fontWeight={800}>
            {formatPrice(product.basePrice)}
          </Typography>
        </Box>

        {/* Variants */}
        {variantCount > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontWeight: 500 }}>
            {variantCount} {variantCount > 1 ? 'variants' : 'variant'} available
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

  // Inventory state
  const [inventory, setInventory] = useState<{
    availableQuantity: number
    isInStock: boolean
  } | null>(null)
  const [checkingInventory, setCheckingInventory] = useState(false)

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
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  })

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsError, setReviewsError] = useState<string | null>(null)

  // Combos and Promotions state
  const [applicableCombos, setApplicableCombos] = useState<Combo[]>([])
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([])
  const [combosLoading, setCombosLoading] = useState(false)
  const [promotionsLoading, setPromotionsLoading] = useState(false)

  // Promo code input state
  const [promoCode, setPromoCode] = useState('')
  const [validatedPromotion, setValidatedPromotion] = useState<Promotion | null>(null)
  const [promoValidationLoading, setPromoValidationLoading] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)

  // ==================== Computed Values ====================

  const averageRating = reviewStats?.averageRating ?? 0
  const totalReviews = reviewStats?.totalReviews ?? 0

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
            allVariantImages2D.push(
              ...variant.images2D.map(formatImageUrl).filter((url): url is string => url !== undefined)
            )
          }
          if (variant.images3D?.length) {
            allVariantImages3D.push(
              ...variant.images3D.map(formatImageUrl).filter((url): url is string => url !== undefined)
            )
          }
        }
      })
    }

    // Format base images (filter out undefined)
    const formattedBaseImages2D = baseImages2D.map(formatImageUrl).filter((url): url is string => url !== undefined)
    const formattedBaseImages3D = baseImages3D.map(formatImageUrl).filter((url): url is string => url !== undefined)

    // Combine: all variant images + base images (deduplicated)
    const images2D: string[] = [...new Set([...allVariantImages2D, ...formattedBaseImages2D])]
    const images3D: string[] = [...new Set([...allVariantImages3D, ...formattedBaseImages3D])]

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

  // Get final price after applying promotion discount
  const getFinalPrice = () => {
    const basePrice = getDisplayPrice()
    if (!validatedPromotion) return basePrice

    // Calculate discount based on promotion type
    let discount = 0
    if (validatedPromotion.type === 'percentage') {
      discount = Math.round((basePrice * validatedPromotion.value) / 100)
    } else {
      // Fixed amount discount
      discount = Math.min(validatedPromotion.value, basePrice)
    }

    const finalPrice = Math.max(0, basePrice - discount)
    return finalPrice
  }

  // Check stock - more lenient: allow add to cart if product is active OR if any variant exists
  const isInStock = () => {
    if (!product) return false
    // If a variant is selected, check if that specific variant is active
    if (selectedVariant) return selectedVariant.isActive !== false
    // If no variant selected, allow if product is active OR if product has any active variants
    if (product.isActive) return true
    // Check for variants (only frame products have variants)
    if ('variants' in product && product.variants && product.variants.length > 0) {
      return product.variants.some((v: any) => v.isActive !== false)
    }
    return false
  }

  // Get stock message
  const getStockMessage = () => {
    if (!product) return ''
    if (selectedVariant) {
      return selectedVariant.isActive !== false ? 'In Stock' : 'Out of Stock'
    }
    if (product.isActive) return 'In Stock'
    if ('variants' in product && product.variants && product.variants.length > 0) {
      return product.variants.some((v: any) => v.isActive !== false) ? 'Select options' : 'Out of Stock'
    }
    return 'Out of Stock'
  }

  // Check if pre-order is enabled for the product
  const isPreorderEnabled = () => {
    if (!product) return false
    return product.isPreorderEnabled === true
  }

  // Get actual stock status considering inventory
  const getStockStatus = () => {
    // If we have inventory data, use it
    if (inventory !== null) {
      return {
        isInStock: inventory.isInStock,
        availableQuantity: inventory.availableQuantity,
      }
    }

    // Fallback to variant active status
    const variantActive = selectedVariant?.isActive !== false
    return {
      isInStock: variantActive,
      availableQuantity: variantActive ? 999 : 0, // Large number for "in stock"
    }
  }

  // Get appropriate stock message and status for display
  const getStockDisplayInfo = () => {
    if (!product) {
      return { message: 'Product not available', showPreorderBadge: false, stockStatus: 'unavailable' }
    }

    // For lens and service products, they don't have variants
    if (!isFrameProduct(product)) {
      if (!product.isActive) {
        return { message: 'Product not available', showPreorderBadge: false, stockStatus: 'unavailable' }
      }
      return {
        message: 'In Stock',
        showPreorderBadge: false,
        stockStatus: 'in-stock',
      }
    }

    // For frame products, check if variant is selected
    if (!selectedVariant) {
      return { message: 'Select options', showPreorderBadge: false, stockStatus: 'select' }
    }

    const variantActive = selectedVariant.isActive !== false
    const preorderEnabled = isPreorderEnabled()
    const stockStatus = getStockStatus()

    console.log('[StockDisplay] variantActive:', variantActive, 'preorderEnabled:', preorderEnabled, 'stockStatus:', stockStatus)

    // Case 1: In Stock (has inventory available)
    if (stockStatus.isInStock && stockStatus.availableQuantity > 0) {
      return {
        message: stockStatus.availableQuantity > 10
          ? 'In Stock'
          : `Only ${stockStatus.availableQuantity} left`,
        showPreorderBadge: false,
        stockStatus: 'in-stock',
      }
    }

    // Case 2: Out of stock but pre-order enabled
    if (preorderEnabled && !stockStatus.isInStock) {
      const shipRange = getExpectedShipDateRange()
      return {
        message: shipRange
          ? `Expected shipping: ${shipRange}`
          : 'Available for pre-order',
        showPreorderBadge: true,
        stockStatus: 'preorder',
      }
    }

    // Case 3: Out of stock and not pre-orderable
    if (!stockStatus.isInStock && !preorderEnabled) {
      return {
        message: 'Out of Stock',
        showPreorderBadge: false,
        stockStatus: 'out-of-stock',
      }
    }

    // Case 4: Variant inactive
    if (!variantActive) {
      return {
        message: 'This variant is unavailable',
        showPreorderBadge: false,
        stockStatus: 'unavailable',
      }
    }

    // Default fallback
    return {
      message: 'Select options',
      showPreorderBadge: false,
      stockStatus: 'select',
    }
  }

  // Get expected ship date range for pre-order (no longer used - dates removed)
  const getExpectedShipDateRange = () => {
    return null
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

  // Fetch reviews when product changes
  useEffect(() => {
    const fetchReviews = async () => {
      if (!product?._id) return

      setReviewsLoading(true)
      setReviewsError(null)

      try {
        // Fetch reviews and stats in parallel
        const [reviewsData, statsData] = await Promise.all([
          reviewApi.getProductReviews(product._id, 1, 10, 'recent'),
          reviewApi.getProductStats(product._id),
        ])

        setReviews(reviewsData.reviews)
        setReviewStats(statsData)
      } catch (err) {
        console.error('Failed to fetch reviews:', err)
        setReviewsError(err instanceof Error ? err.message : 'Failed to load reviews')
        // Use fallback reviews on error
        setReviews(REVIEWS_FALLBACK as unknown as Review[])
        // Set fallback stats based on the mock reviews
        const fallbackStats: ReviewStats = {
          averageRating: 4.5,
          totalReviews: REVIEWS_FALLBACK.length,
          ratingDistribution: { 1: 0, 2: 0, 3: 1, 4: 2, 5: 5 },
          fiveStarPercentage: 62.5,
        }
        setReviewStats(fallbackStats)
      } finally {
        setReviewsLoading(false)
      }
    }

    fetchReviews()
  }, [product?._id])

  // Fetch applicable combos and active promotions when product changes
  useEffect(() => {
    const fetchCombosAndPromotions = async () => {
      if (!product) return

      // Fetch combos that include this product (as frame or lens)
      if (product.category === 'frame' || product.category === 'lens') {
        setCombosLoading(true)
        try {
          const allCombos = await getActiveCombos()
          const applicable = allCombos.filter(
            (combo) =>
              combo.frameProductId === product._id || combo.lensProductId === product._id
          )
          setApplicableCombos(applicable)
        } catch (err) {
          console.error('Failed to fetch combos:', err)
        } finally {
          setCombosLoading(false)
        }
      }

      // Fetch all active promotions (customers can use these at checkout)
      setPromotionsLoading(true)
      try {
        const promos = await getActivePromotions()
        setActivePromotions(promos)
      } catch (err) {
        console.error('Failed to fetch promotions:', err)
      } finally {
        setPromotionsLoading(false)
      }
    }

    fetchCombosAndPromotions()
  }, [product])

  // Reset variant state when product changes
  // Note: This is handled by the auto-selection logic in loadProduct()
  useEffect(() => {
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

  // Fetch inventory when selected variant changes
  useEffect(() => {
    const fetchInventory = async () => {
      if (!selectedVariant?.sku) {
        setInventory(null)
        return
      }

      setCheckingInventory(true)
      try {
        const inventoryData = await checkInventoryAvailability(selectedVariant.sku)
        console.log('[Inventory] Fetched inventory for SKU:', selectedVariant.sku, inventoryData)
        console.log('[Inventory] Variant isPreorderEnabled:', selectedVariant.isPreorderEnabled)
        if (inventoryData) {
          setInventory({
            availableQuantity: inventoryData.availableQuantity,
            isInStock: inventoryData.isInStock,
          })
        } else {
          // Fallback: if inventory API fails, use variant active status
          setInventory({
            availableQuantity: selectedVariant.isActive !== false ? 999 : 0,
            isInStock: selectedVariant.isActive !== false,
          })
        }
      } catch (err) {
        console.error('[Inventory] Error fetching inventory:', err)
        // On error, fallback to variant active status
        setInventory({
          availableQuantity: selectedVariant.isActive !== false ? 999 : 0,
          isInStock: selectedVariant.isActive !== false,
        })
      } finally {
        setCheckingInventory(false)
      }
    }

    fetchInventory()
  }, [selectedVariant])

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
    if (!product) return

    // Check if user is authenticated
    const authState = useAuthStore.getState()
    if (!authState.isAuthenticated) {
      setSnackbarState({
        open: true,
        message: 'Please login to add items to cart',
        severity: 'warning',
      })
      // Show toast for a moment before navigating
      setTimeout(() => {
        navigate('/login')
      }, 1500)
      return
    }

    setIsAdding(true)
    try {
      // Generate variant name and SKU based on product type
      let variantName = 'Standard'
      let itemVariantSku: string | undefined = selectedVariant?.sku

      if (isFrameProduct(product) && selectedVariant) {
        variantName = `${selectedVariant.size} - ${selectedVariant.color}`
      } else if (product.category === 'lens') {
        // For lens products, don't send variantSku - they don't have variants
        itemVariantSku = undefined
        variantName = `Index ${product.index}`
      } else if (product.category === 'service') {
        // For service products, don't send variantSku - they don't have variants
        itemVariantSku = undefined
        variantName = `${product.durationMinutes || 0} min`
      }

      const result = await cartApi.addItem({
        variantSku: itemVariantSku,
        productId: product._id,
        quantity,
        productData: {
          name: product.name,
          price: getDisplayPrice(),
          variantSku: itemVariantSku,
          variantName,
          image: images2D[0] ? formatImageUrl(images2D[0]) : '',
        },
      })

      setSnackbarState({
        open: true,
        message: result.message,
        severity: result.success ? ('success' as const) : ('error' as const),
      })
    } catch (err) {
      setSnackbarState({ open: true, message: 'Failed to add to cart', severity: 'error' as const })
    } finally {
      setIsAdding(false)
    }
  }

  // Buy now
  const handleBuyNow = async () => {
    await handleAddToCart()
    navigate('/checkout')
  }

  // Toggle wishlist
  const toggleWishlist = async () => {
    if (!product) return

    try {
      // Generate variant SKU and name based on product type
      let variantId: string | undefined = selectedVariant?.sku
      let variantName: string | undefined

      if (isFrameProduct(product) && selectedVariant) {
        variantName = `${selectedVariant.size} - ${selectedVariant.color}`
      } else if (product.category === 'lens') {
        // For lens products, use the generated SKU format LENS-{slug}
        variantId = product.slug ? `LENS-${product.slug}` : undefined
        variantName = `Index ${product.index}`
      }

      const result = await wishlistApi.toggleItem({
        productId: product._id,
        productName: product.name,
        variantId,
        variantName,
        image: formatImageUrl(images2D[0]) || '',
      })

      setIsInWishlist(result.isFavorited)
      setSnackbarState({
        open: true,
        message: result.message,
        severity: result.success ? ('success' as const) : ('error' as const),
      })
    } catch (err) {
      setSnackbarState({ open: true, message: 'Failed to update wishlist', severity: 'error' as const })
    }
  }

  // Validate promo code
  const handleValidatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code')
      setValidatedPromotion(null)
      return
    }

    setPromoValidationLoading(true)
    setPromoError(null)
    setValidatedPromotion(null)

    try {
      const cartTotal = getDisplayPrice()
      const result = await validatePromotion({
        code: promoCode.trim().toUpperCase(),
        cartTotal,
        productIds: product ? [product._id] : [],
      })

      if (result.isValid && result.promotion) {
        setValidatedPromotion(result.promotion)
        setPromoCode(result.promotion.code) // Update to uppercase from server

        // Save to cart store for use during checkout
        // Note: discountAmount is included from API response for backend verification
        useCartStore.getState().setPromotionCode({
          code: result.promotion.code,
          name: result.promotion.name,
          type: result.promotion.type,
          value: result.promotion.value,
          description: result.promotion.description,
          minOrderValue: result.promotion.minOrderValue,
          discountAmount: result.discountAmount || 0, // Store API-calculated discount
        })

        // Calculate discount locally for notification
        let discount = 0
        if (result.promotion.type === 'percentage') {
          discount = Math.round((cartTotal * result.promotion.value) / 100)
        } else {
          discount = Math.min(result.promotion.value, cartTotal)
        }

        setSnackbarState({
          open: true,
          message: `Promo code applied! Save ${formatPrice(discount)}`,
          severity: 'success',
        })
      } else {
        setPromoError(result.message || 'Invalid promo code')
        setValidatedPromotion(null)
      }
    } catch (err) {
      console.error('Failed to validate promo code:', err)
      setPromoError('Failed to validate promo code')
      setValidatedPromotion(null)
    } finally {
      setPromoValidationLoading(false)
    }
  }

  // Handle promo code input key press (Enter to validate)
  const handlePromoCodeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleValidatePromoCode()
    }
  }

  // Clear promo code
  const handleClearPromoCode = () => {
    setPromoCode('')
    setValidatedPromotion(null)
    setPromoError(null)
    // Also clear from cart store
    useCartStore.getState().clearPromotionCode()
  }

  // Load wishlist state when product or variant changes
  useEffect(() => {
    if (!product) return

    const checkWishlistStatus = async () => {
      const isFavorited = await wishlistApi.isFavorited(product._id, selectedVariant?.sku)
      setIsInWishlist(isFavorited)
    }

    checkWishlistStatus()
  }, [product, selectedVariant])

  // ==================== Render ====================

  const uniqueColors = getUniqueColors()
  const uniqueSizes = getUniqueSizes()

  // Loading state
  if (loading) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* Enhanced Loading Skeleton */}
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Container maxWidth="lg">
            <Skeleton variant="text" width={200} height={32} sx={{ py: 2.5 }} />
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ py: 5 }}>
          <Skeleton variant="rectangular" width={150} height={40} sx={{ mb: 4, borderRadius: 3 }} />
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
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Enhanced Back Link */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{
            mb: 3,
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.85rem',
            py: 0.75,
            px: 1.5,
          }}
        >
          Back to Products
        </Button>

        {/* Main Section: Media Gallery + Purchase Panel */}
        <Grid container spacing={3}>
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

          {/* Purchase Panel (Right) - Enhanced */}
          <Grid size={{ xs: 12, md: 5, lg: 4 }}>
            <Paper
              elevation={2}
              sx={{
                p: 2.5,
                borderRadius: 3,
                position: { md: 'sticky' },
                top: { md: 96 },
                maxHeight: { md: 'calc(100vh - 120px)' },
                overflowY: 'auto',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack spacing={1.5}>
                {/* Product Name & Brand */}
                <Box>
                  {product.category && (
                    <Chip
                      label={CATEGORY_LABELS[product.category] || product.category}
                      color={CATEGORY_COLORS[product.category] || 'default'}
                      size="small"
                      sx={{
                        mb: 1,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        fontSize: '0.65rem',
                        letterSpacing: 0.5,
                        height: 20,
                      }}
                    />
                  )}
                  <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1.3, fontSize: '1.25rem' }}>
                    {product.name}
                  </Typography>
                  {product.brand && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.8rem' }}>
                      by {product.brand}
                    </Typography>
                  )}
                </Box>

                {/* Rating with stars */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    <Rating value={averageRating} precision={0.5} readOnly size="small" sx={{ color: 'warning.main', fontSize: '1rem' }} />
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                      {averageRating.toFixed(1)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    ({totalReviews})
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                    <FiberManualRecord sx={{ fontSize: 6, color: 'success.main' }} />
                    <Typography variant="caption" color="success.main" fontWeight={500} sx={{ fontSize: '0.7rem' }}>
                      Verified
                    </Typography>
                  </Box>
                </Box>

                {/* Enhanced Price Display */}
                <Box sx={{ bgcolor: 'primary.50', p: 1.5, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    {validatedPromotion ? (
                      <>
                        {/* Show discounted price */}
                        <Typography variant="h4" color="error.main" fontWeight={700} sx={{ lineHeight: 1, fontSize: '1.5rem' }}>
                          {formatPrice(getFinalPrice())}
                        </Typography>
                        {/* Show original price with strikethrough */}
                        <Typography variant="body1" color="text.secondary" sx={{ textDecoration: 'line-through', fontSize: '0.95rem' }}>
                          {formatPrice(getDisplayPrice())}
                        </Typography>
                      </>
                    ) : (
                      <>
                        {/* No promotion - show normal price */}
                        <Typography variant="h4" color="primary.main" fontWeight={700} sx={{ lineHeight: 1, fontSize: '1.5rem' }}>
                          {formatPrice(getDisplayPrice())}
                        </Typography>
                        {product.basePrice !== getDisplayPrice() && (
                          <Typography variant="body1" color="text.secondary" sx={{ textDecoration: 'line-through', fontSize: '0.95rem' }}>
                            {formatPrice(product.basePrice)}
                          </Typography>
                        )}
                      </>
                    )}
                  </Box>
                  {selectedVariant && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block', fontSize: '0.7rem' }}>
                      {selectedVariant.size} • {selectedVariant.color}
                    </Typography>
                  )}
                </Box>

                {/* Pre-order Info Message */}
                {(() => {
                  const stockInfo = getStockDisplayInfo()
                  if (stockInfo.showPreorderBadge) {
                    return (
                      <Alert
                        severity="info"
                        variant="outlined"
                        sx={{
                          mt: 0.5,
                          py: 0.5,
                          px: 1,
                          '& .MuiAlert-message': { py: 0, fontSize: '0.75rem' },
                        }}
                      >
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                          {stockInfo.message}
                        </Typography>
                      </Alert>
                    )
                  }
                  return null
                })()}

                {/* Stock Status */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {(() => {
                    const stockInfo = getStockDisplayInfo()

                    if (stockInfo.stockStatus === 'select') {
                      return (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          {stockInfo.message}
                        </Typography>
                      )
                    }

                    // Pre-order case
                    if (stockInfo.showPreorderBadge) {
                      return (
                        <>
                          <Chip
                            label="Pre-order"
                            color="info"
                            size="small"
                            sx={{ fontSize: '0.65rem', fontWeight: 600, height: 20 }}
                          />
                          <Typography variant="caption" color="info.main" fontWeight={500} sx={{ fontSize: '0.75rem' }}>
                            {stockInfo.message}
                          </Typography>
                        </>
                      )
                    }

                    // In stock case
                    if (stockInfo.stockStatus === 'in-stock') {
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CheckIcon sx={{ fontSize: 14, color: 'success.main' }} />
                          <Typography variant="caption" color="success.main" fontWeight={500} sx={{ fontSize: '0.8rem' }}>
                            {stockInfo.message}
                          </Typography>
                        </Box>
                      )
                    }

                    // Out of stock case
                    return (
                      <Typography variant="caption" color="error.main" fontWeight={500} sx={{ fontSize: '0.8rem' }}>
                        {stockInfo.message}
                      </Typography>
                    )
                  })()}
                </Box>

                <Divider />

                {/* Enhanced Variant Selectors */}
                {uniqueColors.length > 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Color
                      </Typography>
                      <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
                        {selectedColor || 'Select'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {uniqueColors.map((color) => {
                        const isSelected = selectedColor === color
                        const hasVariantInStock = isFrameProduct(product) && product.variants?.some(
                          (v) => v.color === color && v.isActive !== false
                        )

                        // Get color hex from common color names
                        const colorMap: Record<string, string> = {
                          'Black': '#1a1a1a',
                          'White': '#ffffff',
                          'Red': '#e53935',
                          'Blue': '#1e88e5',
                          'Green': '#43a047',
                          'Yellow': '#fdd835',
                          'Brown': '#795548',
                          'Gray': '#9e9e9e',
                          'Silver': '#bdbdbd',
                          'Gold': '#ffc107',
                          'Pink': '#e91e63',
                          'Purple': '#9c27b0',
                          'Orange': '#ff9800',
                          'Beige': '#d7ccc8',
                          'Clear': '#e0f7fa',
                          'Tortoise': '#8d6e63',
                        }

                        const colorHex = colorMap[color] || '#9e9e9e'

                        return (
                          <Box
                            key={color}
                            onClick={() => hasVariantInStock && handleColorSelect(color)}
                            sx={{
                              position: 'relative',
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              bgcolor: colorHex,
                              cursor: hasVariantInStock ? 'pointer' : 'not-allowed',
                              border: '2px solid',
                              borderColor: isSelected ? 'primary.main' : 'divider',
                              opacity: hasVariantInStock ? 1 : 0.3,
                              transition: 'all 0.2s',
                              boxShadow: isSelected ? `0 0 0 2px ${theme.palette.primary.main}25` : '0 1px 3px rgba(0,0,0,0.1)',
                              '&:hover': hasVariantInStock ? {
                                transform: 'scale(1.08)',
                                boxShadow: `0 0 0 2px ${theme.palette.primary.main}40`,
                              } : {},
                            }}
                            title={color}
                          >
                            {isSelected && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: -3,
                                  right: -3,
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  bgcolor: 'primary.main',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                }}
                              >
                                <CheckIcon sx={{ color: 'white', fontSize: 10 }} />
                              </Box>
                            )}
                          </Box>
                        )
                      })}
                    </Box>
                  </Box>
                )}

                {uniqueSizes.length > 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Size
                      </Typography>
                      <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
                        {selectedSize || 'Select'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                      {uniqueSizes.map((size) => {
                        const isSelected = selectedSize === size
                        const hasVariantInStock = isFrameProduct(product) && product.variants?.some(
                          (v) => v.size === size && v.isActive !== false
                        )
                        return (
                          <Box
                            key={size}
                            onClick={() => hasVariantInStock && handleSizeSelect(size)}
                            sx={{
                              px: 2,
                              py: 0.75,
                              borderRadius: 2,
                              border: '1.5px solid',
                              borderColor: isSelected ? 'primary.main' : 'divider',
                              bgcolor: isSelected ? 'primary.main' : 'background.paper',
                              color: isSelected ? 'white' : 'text.primary',
                              cursor: hasVariantInStock ? 'pointer' : 'not-allowed',
                              opacity: hasVariantInStock ? 1 : 0.35,
                              transition: 'all 0.2s',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              minWidth: 50,
                              textAlign: 'center',
                              boxShadow: isSelected ? `0 2px 8px ${theme.palette.primary.main}35` : 'none',
                              '&:hover': hasVariantInStock ? {
                                borderColor: isSelected ? 'primary.main' : 'text.secondary',
                                transform: 'translateY(-1px)',
                              } : {},
                            }}
                          >
                            {size}
                          </Box>
                        )
                      })}
                    </Box>
                  </Box>
                )}

                {/* Enhanced Quantity */}
                <Box>
                  <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                    Quantity
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        border: '1.5px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <IconButton
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        sx={{
                          borderRadius: 0,
                          p: 0.75,
                          bgcolor: quantity > 1 ? 'grey.50' : 'transparent',
                          '&:hover': { bgcolor: 'grey.100' },
                          '&:disabled': { bgcolor: 'transparent' },
                        }}
                      >
                        <RemoveIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <Typography
                        sx={{
                          px: 2,
                          py: 0.75,
                          minWidth: 40,
                          textAlign: 'center',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                        }}
                      >
                        {quantity}
                      </Typography>
                      <IconButton
                        onClick={() => setQuantity(quantity + 1)}
                        sx={{
                          borderRadius: 0,
                          p: 0.75,
                          bgcolor: 'grey.50',
                          '&:hover': { bgcolor: 'grey.100' },
                        }}
                      >
                        <AddIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>

                {/* Promo Code Input */}
                <Box>
                  <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                    Promo Code
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.75 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Enter code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      onKeyPress={handlePromoCodeKeyPress}
                      disabled={promoValidationLoading}
                      error={!!promoError}
                      helperText={promoError}
                      sx={{
                        '& .MuiInputBase-input': {
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          letterSpacing: 1,
                          fontSize: '0.85rem',
                        },
                        '& .MuiFormHelperText-root': {
                          fontSize: '0.7rem',
                          mt: 0.5,
                        },
                      }}
                    />
                    {validatedPromotion ? (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={handleClearPromoCode}
                        sx={{ minWidth: 70, fontSize: '0.8rem' }}
                      >
                        Clear
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleValidatePromoCode}
                        disabled={promoValidationLoading || !promoCode.trim()}
                        sx={{ minWidth: 70, fontSize: '0.8rem' }}
                      >
                        {promoValidationLoading ? '...' : 'Apply'}
                      </Button>
                    )}
                  </Box>

                  {/* Validated Promotion Details */}
                  {validatedPromotion && (
                    <Box
                      sx={{
                        mt: 1.5,
                        p: 1.25,
                        borderRadius: 2,
                        bgcolor: 'success.50',
                        border: '1px solid',
                        borderColor: 'success.200',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <DiscountIcon color="success" sx={{ fontSize: 16 }} />
                          <Typography variant="body2" fontWeight={600} color="success.dark" sx={{ fontSize: '0.85rem' }}>
                            {validatedPromotion.name}
                          </Typography>
                        </Box>
                        <Chip
                          label={
                            validatedPromotion.type === 'percentage'
                              ? `${validatedPromotion.value}% OFF`
                              : `${formatPrice(validatedPromotion.value)} OFF`
                          }
                          size="small"
                          color="success"
                          sx={{ fontWeight: 600, height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                      {validatedPromotion.description && (
                        <Typography variant="caption" color="success.dark" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                          {validatedPromotion.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        {validatedPromotion.minOrderValue > 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            Min. order: {formatPrice(validatedPromotion.minOrderValue)}
                          </Typography>
                        )}
                        {validatedPromotion.endDate && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            Expires: {new Date(validatedPromotion.endDate).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Virtual Try-On Button */}
                <TryOnButton
                  productId={product?.id || ''}
                  variantId={selectedVariant?.id || ''}
                  disabled={!product || !selectedVariant}
                />

                {/* Enhanced Action Buttons */}
                <Stack spacing={1}>
                  {(() => {
                    const stockInfo = getStockDisplayInfo()

                    // Determine button style and text based on stock status
                    const isPreorder = stockInfo.showPreorderBadge
                    const isOutOfStock = stockInfo.stockStatus === 'out-of-stock' || stockInfo.stockStatus === 'unavailable'
                    const isSelecting = stockInfo.stockStatus === 'select'

                    return (
                      <>
                        <Button
                          fullWidth
                          variant={isPreorder ? 'outlined' : 'contained'}
                          size="medium"
                          startIcon={isPreorder ? <ShoppingCartOutlined /> : <CartIcon />}
                          disabled={isOutOfStock || isSelecting || isAdding}
                          onClick={handleAddToCart}
                          sx={{
                            py: 1,
                            borderRadius: 2.5,
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            textTransform: 'none',
                            boxShadow: isPreorder ? 'none' : `0 2px 8px ${theme.palette.primary.main}30`,
                            ...(isPreorder && {
                              borderColor: 'info.main',
                              color: 'info.main',
                              borderWidth: 1.5,
                              '&:hover': {
                                borderColor: 'info.dark',
                                bgcolor: 'info.50',
                              },
                            }),
                            ...(isOutOfStock && {
                              bgcolor: 'action.disabledBackground',
                              color: 'text.disabled',
                            }),
                          }}
                        >
                          {isAdding
                            ? 'Adding...'
                            : isPreorder
                              ? 'Pre-order Now'
                              : isOutOfStock
                                ? 'Out of Stock'
                                : 'Add to Cart'}
                        </Button>

                        <Box sx={{ display: 'flex', gap: 0.75 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            color="secondary"
                            size="medium"
                            startIcon={<BuyNowIcon />}
                            disabled={isOutOfStock || isSelecting || isAdding}
                            onClick={handleBuyNow}
                            sx={{
                              py: 1,
                              borderRadius: 2.5,
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              textTransform: 'none',
                              boxShadow: `0 2px 8px ${theme.palette.secondary.main}30`,
                            }}
                          >
                            Buy Now
                          </Button>
                          <Button
                            variant={isInWishlist ? 'contained' : 'outlined'}
                            color={isInWishlist ? 'error' : 'default'}
                            size="medium"
                            onClick={toggleWishlist}
                            sx={{
                              px: 1.5,
                              minWidth: 'auto',
                              borderRadius: 2.5,
                              ...(isInWishlist && {
                                boxShadow: `0 2px 8px ${theme.palette.error.main}30`,
                              }),
                            }}
                          >
                            {isInWishlist ? <WishlistIcon /> : <WishlistBorderIcon />}
                          </Button>
                        </Box>
                      </>
                    )
                  })()}
                </Stack>

                {/* Enhanced Reassurance Points */}
                <Box sx={{ bgcolor: 'grey.50', p: 1.5, borderRadius: 2.5 }}>
                  <Stack spacing={1}>
                    {REASSURANCE_POINTS.map((point) => (
                      <Box key={point.text} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ fontSize: 16 }}>{point.icon}</Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ fontSize: '0.75rem' }}>
                          {point.text}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    {product.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Enhanced Below-Fold Sections */}
        <Stack spacing={3} sx={{ mt: 6 }}>
          {/* Description - Enhanced */}
          <Paper elevation={1} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 3, pt: 2.5, pb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                <Box sx={{ width: 3, height: 18, borderRadius: 1.5, bgcolor: 'primary.main' }} />
                <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.1rem' }}>
                  Description
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.secondary', fontSize: '0.95rem' }}>
                {product.description}
              </Typography>
            </Box>
          </Paper>

          {/* Specifications - Enhanced */}
          <Paper elevation={1} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 3, pt: 2.5, pb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 2 }}>
                <Box sx={{ width: 3, height: 18, borderRadius: 1.5, bgcolor: 'primary.main' }} />
                <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.1rem' }}>
                  Specifications
                </Typography>
              </Box>
              <SpecsTable product={product} />
            </Box>
          </Paper>

          {/* Reviews - Enhanced */}
          <Paper elevation={1} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 3, pt: 2.5, pb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 2 }}>
                <Box sx={{ width: 3, height: 18, borderRadius: 1.5, bgcolor: 'primary.main' }} />
                <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.1rem' }}>
                  Customer Reviews ({totalReviews})
                </Typography>
              </Box>

              {/* Rating Summary - Enhanced */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  mb: 3,
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 2.5,
                  flexWrap: 'wrap',
                }}
              >
                <Box sx={{ textAlign: 'center', minWidth: 90 }}>
                  <Typography variant="h3" fontWeight={700} color="primary.main" sx={{ fontSize: '2.5rem', lineHeight: 1 }}>
                    {averageRating.toFixed(1)}
                  </Typography>
                  <Rating
                    value={averageRating}
                    precision={0.5}
                    readOnly
                    size="small"
                    sx={{ mt: 0.5, color: 'warning.main', fontSize: '1rem' }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500, fontSize: '0.75rem' }}>
                    {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                  </Typography>
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 180 }}>
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviewStats?.ratingDistribution?.[stars] ?? 0
                    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
                    return (
                      <Box
                        key={stars}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 0.75,
                        }}
                      >
                        <Typography variant="caption" fontWeight={600} sx={{ minWidth: 35, fontSize: '0.75rem' }}>
                          {stars} star
                        </Typography>
                        <Box
                          sx={{
                            flexGrow: 1,
                            height: 8,
                            bgcolor: 'grey.200',
                            borderRadius: 1.5,
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              height: '100%',
                              bgcolor: 'warning.main',
                              borderRadius: 1.5,
                              width: `${percentage}%`,
                              transition: 'width 0.5s ease',
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 25, textAlign: 'right', fontSize: '0.75rem' }}>
                          {count}
                        </Typography>
                      </Box>
                    )
                  })}
                </Box>
              </Box>

              {/* Reviews List - Enhanced */}
              <Stack spacing={2}>
                {reviewsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={28} />
                  </Box>
                ) : reviews.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                      No reviews yet. Be the first to review this product!
                    </Typography>
                  </Box>
                ) : (
                  reviews.map((review) => (
                    <Paper
                      key={review._id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        borderColor: 'divider',
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: 2,
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 1.5 }}>
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '1rem',
                            flexShrink: 0,
                          }}
                        >
                          {review.userName?.charAt(0) || 'U'}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.75 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.9rem' }}>
                                {review.userName || 'Anonymous'}
                              </Typography>
                              {review.isVerifiedPurchase && (
                                <Chip
                                  label="Verified"
                                  size="small"
                                  icon={<CheckIcon sx={{ fontSize: 12 }} />}
                                  sx={{
                                    bgcolor: 'success.50',
                                    color: 'success.dark',
                                    fontWeight: 600,
                                    fontSize: '0.65rem',
                                    height: 18,
                                  }}
                                />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Rating value={review.rating} readOnly size="small" sx={{ color: 'warning.main', fontSize: '0.9rem' }} />
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                {new Date(review.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                          {review.title && (
                            <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 1, fontSize: '0.95rem', color: 'text.primary' }}>
                              {review.title}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6, fontSize: '0.85rem' }}>
                            {review.comment}
                          </Typography>
                          {review.images && review.images.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.75, mt: 1.5 }}>
                              {review.images.map((image, idx) => (
                                <Box
                                  key={idx}
                                  component="img"
                                  src={formatImageUrl(image)}
                                  alt={`Review image ${idx + 1}`}
                                  sx={{
                                    width: 50,
                                    height: 50,
                                    objectFit: 'cover',
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                  }}
                                />
                              ))}
                            </Box>
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.5 }}>
                            <Button size="small" startIcon={<ThumbUpOffAlt sx={{ fontSize: 14 }} />} sx={{ fontSize: '0.8rem', py: 0.5 }}>
                              Helpful ({review.helpfulCount})
                            </Button>
                            <Button size="small" sx={{ fontSize: '0.8rem', py: 0.5 }}>Report</Button>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  ))
                )}
              </Stack>
            </Box>
          </Paper>
        </Stack>

        {/* Combos & Deals Section */}
        {applicableCombos.length > 0 && (
          <Box sx={{ mt: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 2.5 }}>
              <ComboIcon sx={{ color: 'success.main', fontSize: 22 }} />
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.15rem' }}>
                Combo Deals
              </Typography>
              <Chip
                label={`${applicableCombos.length} available`}
                size="small"
                color="success"
                sx={{ ml: 'auto', fontWeight: 600, fontSize: '0.7rem', height: 20 }}
              />
            </Box>
            <Grid container spacing={2}>
              {applicableCombos.map((combo) => (
                <Grid size={{ xs: 12, md: 6 }} key={combo._id}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'success.100',
                      borderRadius: 2.5,
                      background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.03) 0%, rgba(255, 255, 255, 1) 100%)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600} color="success.dark" sx={{ fontSize: '0.95rem' }}>
                          {combo.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.75rem' }}>
                          {combo.description}
                        </Typography>
                      </Box>
                      <Chip
                        label={`-${combo.discountPercentage.toFixed(0)}%`}
                        color="success"
                        size="small"
                        sx={{ fontWeight: 700, fontSize: '0.8rem', height: 22 }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
                      <Box sx={{ flex: 1, minWidth: 100 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Regular
                        </Typography>
                        <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.disabled', fontSize: '0.85rem' }}>
                          {formatPrice(combo.originalPrice)}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 100 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Combo
                        </Typography>
                        <Typography variant="subtitle2" color="success.main" fontWeight={700} sx={{ fontSize: '0.95rem' }}>
                          {formatPrice(combo.comboPrice)}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 100 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Save
                        </Typography>
                        <Typography variant="body2" color="success.dark" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                          {formatPrice(combo.discountAmount)}
                        </Typography>
                      </Box>
                    </Box>
                    {combo.isFeatured && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                        <GiftIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                        <Typography variant="caption" color="warning.dark" fontWeight={600}>
                          Featured Deal
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Enhanced Related Products */}
        {relatedProducts.length > 0 && (
          <Box sx={{ mt: 8 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
              <Box sx={{ width: 4, height: 28, borderRadius: 2, bgcolor: 'primary.main' }} />
              <Typography variant="h5" fontWeight={800}>
                You May Also Like
              </Typography>
            </Box>
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

      {/* Enhanced Zoom Dialog */}
      <Dialog
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'grey.50',
            px: 3,
            py: 2,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            {product.name}
          </Typography>
          <IconButton
            onClick={() => setZoomOpen(false)}
            sx={{
              bgcolor: 'grey.200',
              '&:hover': { bgcolor: 'grey.300' },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            p: 0,
            bgcolor: 'grey.900',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              p: 3,
            }}
          >
            {images2D[activeImageIndex] ? (
              <Box
                component="img"
                src={images2D[activeImageIndex]}
                alt={product.name}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: 2,
                }}
              />
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <ThreeDIcon sx={{ fontSize: 100, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" color="white" fontWeight={700}>
                  3D Model Viewer
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.7)">
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

      {/* Enhanced Scroll to Top Button */}
      <Fab
        color="primary"
        size="medium"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
          '&:hover': {
            transform: 'scale(1.1)',
          },
          transition: 'all 0.2s',
        }}
      >
        <ArrowUpIcon />
      </Fab>
    </Box>
  )
}

export default ProductDetailPage
