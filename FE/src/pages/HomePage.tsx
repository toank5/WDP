import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Stack,
  useTheme,
  useMediaQuery,
  Paper,
  TextField,
  InputAdornment,
  Skeleton,
  Avatar,
  Divider,
} from '@mui/material'
import {
  ArrowRight,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Eye,
  Heart,
  Glasses,
  Sun,
  Watch,
  Sparkles,
  Zap,
  Package,
  Send,
} from 'lucide-react'
import { getAllProducts, type Product, type FrameProduct, formatImageUrl } from '@/lib/product-api'

// Lucide Icon wrapper for MUI sx compatibility
interface LucideIconProps {
  icon: React.ElementType
  size?: number
  color?: string
  sx?: any
}

function LucideIconWrapper({ icon: Icon, size = 24, color, sx = {} }: LucideIconProps) {
  return (
    <Icon
      size={size}
      color={color}
      style={{
        width: size,
        height: size,
        ...sx,
      }}
    />
  )
}

// Price formatter for VND
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

// Type guard for FrameProduct
function isFrameProduct(product: Product): product is FrameProduct {
  return product.category === 'frame'
}

// Category tile data
const categories = [
  {
    title: 'Frames',
    description: 'From classic to bold designs',
    icon: Glasses,
    link: '/products?category=frame',
    color: '#2563eb',
  },
  {
    title: 'Lenses',
    description: 'Single vision to progressive',
    icon: Eye,
    link: '/products?category=lens',
    color: '#8b5cf6',
  },
  {
    title: 'Sunglasses',
    description: 'Style meets protection',
    icon: Sun,
    link: '/products?category=frame&tags=sunglasses',
    color: '#f59e0b',
  },
  {
    title: 'Accessories',
    description: 'Complete your look',
    icon: Watch,
    link: '/products?category=accessories',
    color: '#10b981',
  },
]

// Filter chips for guided discovery
const filterChips = [
  { label: 'Blue Light Glasses', filter: 'blue-light' },
  { label: 'Under 1.000.000 ₫', filter: 'under-1m' },
  { label: 'Minimalist Frames', filter: 'minimalist' },
  { label: '3D View Available', filter: 'has-3d' },
]

// Benefits section data
const benefits = [
  {
    icon: Sparkles,
    title: 'Virtual 3D View',
    description: 'See frames from every angle before you buy',
  },
  {
    icon: Eye,
    title: 'Quality Lenses',
    description: 'Scratch-resistant with UV protection',
  },
  {
    icon: Zap,
    title: 'Fast Delivery',
    description: 'Ship within 2-3 business days',
  },
  {
    icon: RotateCcw,
    title: 'Easy Returns',
    description: '30-day hassle-free returns',
  },
]

// Product Card Component for homepage
interface ProductCardProps {
  product: Product & {
    mainImageUrl?: string
    tag?: string
    variantCount: number
    price?: number
    images2D?: string[]
    images3D?: string[]
  }
  onClick: () => void
  onToggleFavorite?: () => void
  isFavorite?: boolean
}

function ProductCard({ product, onClick, onToggleFavorite, isFavorite }: ProductCardProps) {
  const price = product.price ?? product.basePrice
  const displayImage =
    product.mainImageUrl ||
    (product.images2D?.[0] ? formatImageUrl(product.images2D[0]) : undefined)
  const has3D = product.images3D && product.images3D.length > 0

  return (
    <Card
      sx={{
        borderRadius: 3,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
      onClick={onClick}
    >
      {/* Favorite Button */}
      {onToggleFavorite && (
        <IconButton
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(255,255,255,0.9)',
            zIndex: 1,
            '&:hover': { bgcolor: 'white' },
          }}
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite()
          }}
        >
          <Heart
            size={20}
            fill={isFavorite ? '#ef4444' : 'none'}
            color={isFavorite ? '#ef4444' : 'currentColor'}
          />
        </IconButton>
      )}

      {/* 3D Badge */}
      {has3D && (
        <Chip
          label="3D View"
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            height: 20,
            fontSize: 10,
            bgcolor: 'secondary.main',
            color: 'white',
            fontWeight: 600,
          }}
        />
      )}

      {/* Image */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 180,
          bgcolor: 'grey.50',
          borderRadius: '12px 12px 0 0',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {displayImage ? (
          <Box
            component="img"
            src={displayImage}
            alt={product.name}
            sx={{ height: 180, width: '100%', objectFit: 'contain' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const fallback = e.currentTarget.nextElementSibling as HTMLElement
              if (fallback) fallback.style.display = 'flex'
            }}
          />
        ) : null}
        {!displayImage && (
          <Box sx={{ fontSize: 60, display: displayImage ? 'none' : 'flex' }}>👓</Box>
        )}
      </Box>

      {/* Content */}
      <CardContent sx={{ pb: 2 }}>
        <Typography variant="body2" fontWeight={600} sx={{ mb: 1, minHeight: 40 }}>
          {product.name}
        </Typography>
        <Typography variant="subtitle1" color="primary" fontWeight={700}>
          {formatPrice(price)}
        </Typography>
      </CardContent>
    </Card>
  )
}

// Loading Skeleton
function ProductCardSkeleton() {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <Skeleton variant="rectangular" height={180} sx={{ borderRadius: '12px 12px 0 0' }} />
      <CardContent>
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width={100} />
      </CardContent>
    </Card>
  )
}

export function HomePage() {
  const theme = useTheme()
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'))
  const navigate = useNavigate()

  // State
  const [products, setProducts] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [bestSellers, setBestSellers] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [emailInput, setEmailInput] = useState('')

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAllProducts()

      // Filter out deleted and inactive products
      const activeProducts = data.filter((p) => !p.isDeleted && p.isActive)

      setProducts(activeProducts)

      // Sort by createdAt for new arrivals (newest first)
      const sortedByNewest = [...activeProducts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setNewArrivals(sortedByNewest.slice(0, isTablet ? 4 : 6))

      // For best sellers, we'll use a simple heuristic - products with 3D views first, then by name
      // In a real app, this would come from actual sales data
      const sortedByBestSellers = [...activeProducts]
        .filter((p) => p.category === 'frame')
        .sort((a, b) => {
          const aHas3D = a.images3D && a.images3D.length > 0
          const bHas3D = b.images3D && b.images3D.length > 0
          if (aHas3D && !bHas3D) return -1
          if (!aHas3D && bHas3D) return 1
          return a.name.localeCompare(b.name)
        })
      setBestSellers(sortedByBestSellers.slice(0, isTablet ? 4 : 6))

      // Load favorites from localStorage
      const savedFavorites = localStorage.getItem('favorites')
      if (savedFavorites) {
        setFavorites(new Set(JSON.parse(savedFavorites)))
      }
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      setLoading(false)
    }
  }, [isTablet])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Toggle favorite
  const toggleFavorite = (productId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId)
    } else {
      newFavorites.add(productId)
    }
    setFavorites(newFavorites)
    localStorage.setItem('favorites', JSON.stringify([...newFavorites]))
    window.dispatchEvent(new CustomEvent('wishlistUpdated'))
  }

  // Navigate to product
  const navigateToProduct = (slug: string) => {
    navigate(`/product/${slug}`)
  }

  // Navigate with filters
  const navigateWithFilter = (filter: string) => {
    switch (filter) {
      case 'blue-light':
        navigate('/products?tags=blue-light')
        break
      case 'under-1m':
        navigate('/products?maxPrice=1000000')
        break
      case 'minimalist':
        navigate('/products?style=minimalist')
        break
      case 'has-3d':
        navigate('/products?has3D=true')
        break
      default:
        navigate('/products')
    }
  }

  // Newsletter subscribe
  const handleSubscribe = () => {
    if (emailInput.trim()) {
      // In a real app, this would call an API
      alert(`Thanks for subscribing with: ${emailInput}`)
      setEmailInput('')
    }
  }

  // Enrich product with additional properties
  const enrichProduct = (product: Product) => ({
    ...product,
    mainImageUrl: product.images2D?.[0] ? formatImageUrl(product.images2D[0]) : undefined,
    tag: product.category,
    variantCount: isFrameProduct(product) ? product.variants?.length || 0 : 0,
    price: product.basePrice,
    images3D: product.images3D,
  })

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* ==================== HERO SECTION ==================== */}
      <Box
        sx={{
          position: 'relative',
          bgcolor: { xs: 'background.default', md: 'primary.50' },
          pt: { xs: 2, md: 6 },
          pb: { xs: 6, md: 12 },
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid
            container
            spacing={{ xs: 3, md: 6 }}
            alignItems="center"
            direction={{ xs: 'column-reverse', md: 'row' }}
          >
            {/* Left - Text Content */}
            <Grid size={{ xs: 12, md: 6 }} sx={{ zIndex: 1 }}>
              <Typography
                variant="overline"
                color="primary"
                sx={{ letterSpacing: 3, fontWeight: 600, textTransform: 'uppercase' }}
              >
                Premium Eyewear
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3rem', lg: '3.75rem' },
                  fontWeight: 800,
                  lineHeight: 1.1,
                  mt: 1,
                  mb: 2,
                  color: 'text.primary',
                }}
              >
                See clearly.
                <br />
                Look amazing.
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  mb: 4,
                  maxWidth: 480,
                  lineHeight: 1.7,
                  fontSize: { xs: '1rem', md: '1.125rem' },
                }}
              >
                Discover EyeWear's curated collection of designer frames and lenses, featuring 3D
                view technology and hassle-free returns.
              </Typography>

              {/* CTAs */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ mb: { xs: 4, md: 5 } }}
              >
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<LucideIconWrapper icon={ArrowRight} size={18} />}
                  onClick={() => navigate('/products?category=frame')}
                  fullWidth={{ xs: true, sm: false }}
                  sx={{
                    px: 3,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                  }}
                >
                  Shop all frames
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/products?category=lens')}
                  fullWidth={{ xs: true, sm: false }}
                  sx={{
                    px: 3,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                  }}
                >
                  Explore lenses
                </Button>
              </Stack>

              {/* Trust Points */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      bgcolor: 'success.50',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <RotateCcw size={18} color="#10b981" />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                      Free Returns
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Within 30 days
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      bgcolor: 'primary.50',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Truck size={18} color="#2563eb" />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                      Fast Shipping
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      2-3 business days
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      bgcolor: 'warning.50',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShieldCheck size={18} color="#f59e0b" />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                      Secure Checkout
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      100% protected
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Grid>

            {/* Right - Hero Image */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 600,
                  mx: 'auto',
                  borderRadius: { xs: 3, md: 4 },
                  overflow: 'hidden',
                  boxShadow: { xs: 3, md: 6 },
                  aspectRatio: '4 / 3',
                  bgcolor: 'grey.100',
                }}
              >
                {/* Hero Image */}
                <Box
                  component="img"
                  src="/images/hero-eyewear.webp"
                  alt="Person wearing EyeWear designer glasses"
                  onError={(e) => {
                    // Fallback to emoji if image fails to load
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const fallback = target.nextElementSibling as HTMLElement
                    if (fallback) fallback.style.display = 'flex'
                  }}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                {/* Fallback emoji */}
                <Box
                  sx={{
                    display: 'none',
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: { xs: 100, md: 150 },
                    bgcolor: 'grey.100',
                  }}
                >
                  👓
                </Box>

                {/* Optional overlay badge - 3D View */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: { xs: 12, md: 20 },
                    left: { xs: 12, md: 20 },
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: 2,
                    px: { xs: 2, md: 2.5 },
                    py: { xs: 1, md: 1.5 },
                    boxShadow: 2,
                    maxWidth: { xs: 160, md: 200 },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: 'secondary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <LucideIconWrapper icon={Sparkles} size={16} color="white" />
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="text.primary"
                        sx={{ display: 'block', lineHeight: 1.2 }}
                      >
                        3D View Available
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: '0.7rem' }}
                      >
                        For selected frames
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Optional decorative gradient overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                      'linear-gradient(135deg, rgba(37,99,235,0.05) 0%, rgba(139,92,246,0.05) 100%)',
                    pointerEvents: 'none',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ==================== SHOP BY CATEGORY ==================== */}
      <Box sx={{ py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Shop by category
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Find exactly what you're looking for
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {categories.map((category) => (
              <Grid size={{ xs: 12, sm: 6 }} key={category.title}>
                <Paper
                  component={Link}
                  to={category.link}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 3,
                    height: '100%',
                    minHeight: 120,
                    textDecoration: 'none',
                    borderRadius: 3,
                    transition: 'all 0.2s ease',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                      borderColor: category.color,
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: `${category.color}20`,
                      color: category.color,
                      width: 64,
                      height: 64,
                      mr: 2,
                    }}
                  >
                    <LucideIconWrapper icon={category.icon} size={32} color={category.color} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={700} color="text.primary">
                      {category.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category.description}
                    </Typography>
                  </Box>
                  <LucideIconWrapper icon={ArrowRight} size={20} color={category.color} />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ==================== NEW ARRIVALS ==================== */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'grey.50' }}>
        <Container maxWidth="lg">
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}
          >
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                New arrivals
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Fresh styles just landed
              </Typography>
            </Box>
            <Button
              endIcon={<LucideIconWrapper icon={ArrowRight} size={18} />}
              onClick={() => navigate('/products?sortBy=newest')}
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              View all
            </Button>
          </Box>

          <Grid container spacing={3}>
            {loading
              ? Array.from({ length: isTablet ? 4 : 6 }).map((_, i) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                    <ProductCardSkeleton />
                  </Grid>
                ))
              : newArrivals.map((product) => {
                  const enriched = enrichProduct(product)
                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.slug}>
                      <ProductCard
                        product={enriched}
                        onClick={() => navigateToProduct(product.slug)}
                        onToggleFavorite={() => toggleFavorite(product._id)}
                        isFavorite={favorites.has(product._id)}
                      />
                    </Grid>
                  )
                })}
          </Grid>

          <Box sx={{ mt: 4, textAlign: { xs: 'center', md: 'left' } }}>
            <Button
              variant="outlined"
              endIcon={<LucideIconWrapper icon={ArrowRight} size={18} />}
              onClick={() => navigate('/products?sortBy=newest')}
              sx={{ display: { xs: 'flex', md: 'none' }, mx: 'auto' }}
            >
              View all new arrivals
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ==================== BEST SELLERS ==================== */}
      <Box sx={{ py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}
          >
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Best sellers
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Most loved by our customers
              </Typography>
            </Box>
            <Button
              endIcon={<LucideIconWrapper icon={ArrowRight} size={18} />}
              onClick={() => navigate('/products?category=frame')}
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              View all
            </Button>
          </Box>

          <Grid container spacing={3}>
            {loading
              ? Array.from({ length: isTablet ? 4 : 6 }).map((_, i) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                    <ProductCardSkeleton />
                  </Grid>
                ))
              : bestSellers.map((product) => {
                  const enriched = enrichProduct(product)
                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.slug}>
                      <ProductCard
                        product={enriched}
                        onClick={() => navigateToProduct(product.slug)}
                        onToggleFavorite={() => toggleFavorite(product._id)}
                        isFavorite={favorites.has(product._id)}
                      />
                    </Grid>
                  )
                })}
          </Grid>

          <Box sx={{ mt: 4, textAlign: { xs: 'center', md: 'left' } }}>
            <Button
              variant="outlined"
              endIcon={<LucideIconWrapper icon={ArrowRight} size={18} />}
              onClick={() => navigate('/products?category=frame')}
              sx={{ display: { xs: 'flex', md: 'none' }, mx: 'auto' }}
            >
              View all best sellers
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ==================== GUIDED DISCOVERY ==================== */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: 'primary.main', color: 'white' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: 'white' }}>
              Find your perfect pair
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              Quick filters to help you discover
            </Typography>
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            flexWrap="wrap"
          >
            {filterChips.map((chip) => (
              <Button
                key={chip.label}
                variant="contained"
                onClick={() => navigateWithFilter(chip.filter)}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  px: 3,
                  py: 1.5,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                  },
                }}
              >
                {chip.label}
              </Button>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* ==================== BENEFITS / TRUST ==================== */}
      <Box sx={{ py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Why EyeWear
            </Typography>
            <Typography variant="body1" color="text.secondary">
              The EyeWear difference
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {benefits.map((benefit, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                <Paper
                  sx={{
                    p: 4,
                    height: '100%',
                    textAlign: 'center',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: 'primary.50',
                      color: 'primary.main',
                      width: 64,
                      height: 64,
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <LucideIconWrapper icon={benefit.icon} size={32} />
                  </Avatar>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {benefit.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {benefit.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ==================== 3D VIEW / PRE-ORDER HIGHLIGHT ==================== */}
      {!loading && products.some((p) => p.images3D && p.images3D.length > 0) && (
        <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'secondary.50' }}>
          <Container maxWidth="lg">
            <Paper
              sx={{
                p: { xs: 4, md: 6 },
                borderRadius: 4,
                bgcolor: 'secondary.main',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Decorative circle */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.1)',
                }}
              />

              <Grid
                container
                spacing={4}
                alignItems="center"
                sx={{ position: 'relative', zIndex: 1 }}
              >
                <Grid size={{ xs: 12, md: 8 }}>
                  <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: 'white' }}>
                    Try our 3D View
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ mb: 4, color: 'rgba(255,255,255,0.9)', maxWidth: 500 }}
                  >
                    Experience our frames like never before. Rotate, zoom, and see every detail
                    before you buy.
                  </Typography>
                  <Button
                    variant="contained"
                    endIcon={<LucideIconWrapper icon={Sparkles} size={20} />}
                    onClick={() => navigate('/products?has3D=true')}
                    sx={{
                      bgcolor: 'white',
                      color: 'secondary.main',
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: 'grey.100',
                      },
                    }}
                  >
                    Shop 3D-ready frames
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      fontSize: 120,
                      opacity: 0.3,
                      display: { xs: 'none', md: 'block' },
                    }}
                  >
                    👓
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Container>
        </Box>
      )}

      {/* ==================== NEWSLETTER ==================== */}
      <Box sx={{ py: { xs: 6, md: 10 } }}>
        <Container maxWidth="md">
          <Paper
            sx={{
              p: { xs: 4, md: 6 },
              textAlign: 'center',
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Stay sharp
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Get exclusive offers, new drops, and eyewear tips delivered to your inbox
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
              maxWidth={500}
              mx="auto"
            >
              <TextField
                fullWidth
                placeholder="Enter your email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <LucideIconWrapper icon={Send} size={18} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  bgcolor: 'background.paper',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
              <Button
                variant="contained"
                size="large"
                onClick={handleSubscribe}
                sx={{
                  px: 4,
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 2,
                  whiteSpace: 'nowrap',
                }}
              >
                Subscribe
              </Button>
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              By subscribing, you agree to our Privacy Policy and consent to receive updates.
            </Typography>
          </Paper>
        </Container>
      </Box>

      {/* ==================== FOOTER ==================== */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: 'grey.900', color: 'grey.300' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {/* Brand */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h5" fontWeight={700} sx={{ color: 'white', mb: 2 }}>
                <Box component="span" sx={{ color: 'primary.main' }}>
                  Eye
                </Box>
                Wear
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Premium eyewear, online. Designer frames and lenses delivered to your door.
              </Typography>
              <Stack direction="row" spacing={1}>
                <IconButton size="small" sx={{ color: 'grey.400' }}>
                  <Package size={18} />
                </IconButton>
                <IconButton size="small" sx={{ color: 'grey.400' }}>
                  <ShoppingBag size={18} />
                </IconButton>
              </Stack>
            </Grid>

            {/* Quick Links */}
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'white', mb: 2 }}>
                Shop
              </Typography>
              <Stack spacing={1}>
                <Link
                  to="/products?category=frame"
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  <Typography variant="body2" sx={{ '&:hover': { color: 'white' } }}>
                    Frames
                  </Typography>
                </Link>
                <Link
                  to="/products?category=lens"
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  <Typography variant="body2" sx={{ '&:hover': { color: 'white' } }}>
                    Lenses
                  </Typography>
                </Link>
                <Link
                  to="/products?tags=sunglasses"
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  <Typography variant="body2" sx={{ '&:hover': { color: 'white' } }}>
                    Sunglasses
                  </Typography>
                </Link>
                <Link
                  to="/products?has3D=true"
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  <Typography variant="body2" sx={{ '&:hover': { color: 'white' } }}>
                    3D View
                  </Typography>
                </Link>
              </Stack>
            </Grid>

            {/* Help */}
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'white', mb: 2 }}>
                Help
              </Typography>
              <Stack spacing={1}>
                <Link to="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>
                  <Typography variant="body2" sx={{ '&:hover': { color: 'white' } }}>
                    Contact Us
                  </Typography>
                </Link>
                <Link to="/policies/shipping" style={{ color: 'inherit', textDecoration: 'none' }}>
                  <Typography variant="body2" sx={{ '&:hover': { color: 'white' } }}>
                    Shipping
                  </Typography>
                </Link>
                <Link to="/policies/return" style={{ color: 'inherit', textDecoration: 'none' }}>
                  <Typography variant="body2" sx={{ '&:hover': { color: 'white' } }}>
                    Returns
                  </Typography>
                </Link>
                <Link to="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>
                  <Typography variant="body2" sx={{ '&:hover': { color: 'white' } }}>
                    FAQ
                  </Typography>
                </Link>
              </Stack>
            </Grid>

            {/* Contact */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'white', mb: 2 }}>
                Contact
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">support@eyewear.com</Typography>
                <Typography variant="body2">+84 123 456 789</Typography>
                <Typography variant="body2">Ho Chi Minh City, Vietnam</Typography>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4, borderColor: 'grey.800' }} />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Typography variant="body2" sx={{ color: 'grey.500' }}>
              © 2026 EyeWear. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={3}>
              <Link to="/policies/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>
                <Typography
                  variant="body2"
                  sx={{ color: 'grey.500', '&:hover': { color: 'grey.300' } }}
                >
                  Privacy Policy
                </Typography>
              </Link>
              <Link to="/policies/terms" style={{ color: 'inherit', textDecoration: 'none' }}>
                <Typography
                  variant="body2"
                  sx={{ color: 'grey.500', '&:hover': { color: 'grey.300' } }}
                >
                  Terms of Service
                </Typography>
              </Link>
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

export default HomePage
