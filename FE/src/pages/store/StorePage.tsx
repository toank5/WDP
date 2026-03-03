import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'
import { getAllProducts, type Product, type FrameProduct } from '@/lib/product-api'
import {
  Box,
  Container,
  Grid,
  Card,
  CardMedia,
  Typography,
  Button,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Pagination,
  Stack,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  Paper,
  Slider,
  Fab,
  Drawer,
  Skeleton,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  ShoppingCart as CartIcon,
  ArrowBack as ArrowBackIcon,
  ArrowUpward as ArrowUpIcon,
  ViewInAr as ThreeDIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
} from '@mui/icons-material'

// Price formatter for VND
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

// Color options for filtering
const COLOR_OPTIONS = [
  { name: 'Black', value: 'black', hex: '#000000' },
  { name: 'White', value: 'white', hex: '#FFFFFF' },
  { name: 'Red', value: 'red', hex: '#EF4444' },
  { name: 'Blue', value: 'blue', hex: '#3B82F6' },
  { name: 'Green', value: 'green', hex: '#10B981' },
  { name: 'Yellow', value: 'yellow', hex: '#F59E0B' },
  { name: 'Brown', value: 'brown', hex: '#8B5CF6' },
  { name: 'Gray', value: 'gray', hex: '#6B7280' },
  { name: 'Pink', value: 'pink', hex: '#EC4899' },
  { name: 'Silver', value: 'silver', hex: '#9CA3AF' },
]

// Size options
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '52', '54', '56', '58']

const SORT_OPTIONS = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Newest', value: 'newest' },
]

interface FilterState {
  category: string
  minPrice: number
  maxPrice: number
  colors: string[]
  sizes: string[]
  inStockOnly: boolean
  has3D: boolean
}

const DEFAULT_FILTERS: FilterState = {
  category: '',
  minPrice: 0,
  maxPrice: 50000000,
  colors: [],
  sizes: [],
  inStockOnly: false,
  has3D: false,
}

// Type guard for FrameProduct (has variants)
function isFrameProduct(product: Product): product is FrameProduct {
  return product.category === 'frame'
}

// Product Card Component
interface ProductCardProps {
  product: Product & { mainImageUrl: string; tag?: string; variantCount: number }
  onClick: () => void
  onAddToCart: (e: React.MouseEvent) => void
}

function ProductCard({ product, onClick, onAddToCart }: ProductCardProps) {
  const price = (product as any).price || product.basePrice
  return (
    <Card
      sx={{
        borderRadius: 3,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
      onClick={onClick}
    >
      <Box sx={{ p: 2 }}>
        {/* Category Badge */}
        {product.tag && (
          <Chip
            size="small"
            label={product.tag}
            color="primary"
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
          {product.mainImageUrl ? (
            <Box
              component="img"
              src={product.mainImageUrl}
              alt={product.name}
              sx={{ height: 160, objectFit: 'contain' }}
            />
          ) : (
            <Box sx={{ fontSize: 60 }}>👓</Box>
          )}
          {/* 3D Badge */}
          {(product as any).images3D && (product as any).images3D.length > 0 && (
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
                bgcolor: 'purple.main',
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
          {formatPrice(price)}
        </Typography>

        {/* Variants */}
        {product.variantCount > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {product.variantCount} variant{product.variantCount > 1 ? 's' : ''} available
          </Typography>
        )}
      </Box>
    </Card>
  )
}

// Loading Skeleton
function ProductCardSkeleton() {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <Box sx={{ p: 2 }}>
        <Skeleton variant="text" width={60} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={160} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="text" width="80%" sx={{ mb: 1 }} />
        <Skeleton variant="text" width={100} />
      </Box>
    </Card>
  )
}

// Filter Content Component (shared between sidebar and drawer)
function FilterContent({
  filters,
  maxPrice,
  onFilterChange,
  onColorToggle,
  onSizeToggle,
  onClearFilters,
  hasActiveFilters,
}: {
  filters: FilterState
  maxPrice: number
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  onColorToggle: (color: string) => void
  onSizeToggle: (size: string) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Filters
        </Typography>
        {hasActiveFilters && (
          <Button size="small" onClick={onClearFilters}>
            Clear
          </Button>
        )}
      </Box>

      <Stack spacing={1.5}>
        {/* Category */}
        <Box>
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            Category
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.category}
              onChange={(e) => onFilterChange('category', e.target.value)}
              displayEmpty
            >
              <MenuItem value="">All Categories</MenuItem>
              <MenuItem value="frame">Frames</MenuItem>
              <MenuItem value="lens">Lenses</MenuItem>
              <MenuItem value="service">Services</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Price Range */}
        <Box>
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            Price Range
          </Typography>
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            {formatPrice(filters.minPrice)} – {formatPrice(filters.maxPrice)}
          </Typography>
          <Slider
            value={[filters.minPrice, filters.maxPrice]}
            onChange={(_, value) => {
              onFilterChange('minPrice', value[0])
              onFilterChange('maxPrice', value[1])
            }}
            min={0}
            max={maxPrice}
            step={500000}
            getAriaValueText={(v) => formatPrice(v as number)}
            sx={{ height: 4 }}
          />
        </Box>

        {/* Colors */}
        <Box>
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            Colors
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {COLOR_OPTIONS.map((color) => {
              const isSelected = filters.colors.includes(color.value)
              return (
                <IconButton
                  key={color.value}
                  onClick={() => onColorToggle(color.value)}
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: color.hex,
                    border: '2px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    borderRadius: '50%',
                    p: 0,
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                    transition: 'transform 0.2s',
                  }}
                >
                  {isSelected && (
                    <Box
                      component="span"
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: color.value === 'white' || color.value === 'silver' ? 'black' : 'white',
                      }}
                    />
                  )}
                </IconButton>
              )
            })}
          </Box>
        </Box>

        {/* Sizes */}
        <Box>
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            Sizes
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {SIZE_OPTIONS.map((size) => {
              const isSelected = filters.sizes.includes(size)
              return (
                <Chip
                  key={size}
                  label={size}
                  onClick={() => onSizeToggle(size)}
                  size="small"
                  variant={isSelected ? 'filled' : 'outlined'}
                  color={isSelected ? 'primary' : 'default'}
                  sx={{ minWidth: 45, height: 22, fontSize: '0.75rem' }}
                />
              )
            })}
          </Box>
        </Box>

        {/* Availability */}
        <Box>
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            Availability
          </Typography>
          <Stack spacing={0.5}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.inStockOnly}
                  onChange={(e) => onFilterChange('inStockOnly', e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="caption" sx={{ fontSize: 13 }}>
                  In Stock Only
                </Typography>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.has3D}
                  onChange={(e) => onFilterChange('has3D', e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="caption" sx={{ fontSize: 13 }}>
                  Has 3D View
                </Typography>
              }
            />
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}

export function StorePage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  // State
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<
    Array<Product & { mainImageUrl: string; tag?: string; variantCount: number }>
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [productsPerPage] = useState(12)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [maxPrice, setMaxPrice] = useState(50000000)

  // Filters
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [sortBy, setSortBy] = useState('relevance')

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllProducts()

      // Filter out deleted products
      const activeProducts = data.filter((p) => !p.isDeleted && p.isActive)

      setProducts(activeProducts)

      // Calculate max price for slider
      if (activeProducts.length > 0) {
        const maxP = Math.max(...activeProducts.map((p) => p.basePrice))
        const roundedMax = Math.ceil(maxP / 1000000) * 1000000
        setMaxPrice(roundedMax)
        setFilters((prev) => ({ ...prev, minPrice: 0, maxPrice: roundedMax }))
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load products'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Apply filters and sorting
  useEffect(() => {
    let filtered = products.map((p) => ({
      ...p,
      mainImageUrl: p.images2D?.[0] || '',
      tag: p.category,
      variantCount: isFrameProduct(p) ? p.variants?.length || 0 : 0,
      price: p.basePrice,
    }))

    // Category filter
    if (filters.category) {
      filtered = filtered.filter((p) => p.category === filters.category)
    }

    // Price range filter
    filtered = filtered.filter((p) => p.price >= filters.minPrice && p.price <= filters.maxPrice)

    // In stock filter
    if (filters.inStockOnly) {
      filtered = filtered.filter((p) => p.isActive)
    }

    // Has 3D filter
    if (filters.has3D) {
      filtered = filtered.filter((p) => (p as any).images3D && (p as any).images3D.length > 0)
    }

    // Color filter (check variant colors)
    if (filters.colors.length > 0) {
      filtered = filtered.filter((p) =>
        isFrameProduct(p) && p.variants?.some((v) =>
          filters.colors.some((c) => v.color?.toLowerCase().includes(c.toLowerCase()))
        )
      )
    }

    // Size filter (check variant sizes)
    if (filters.sizes.length > 0) {
      filtered = filtered.filter((p) =>
        isFrameProduct(p) && p.variants?.some((v) =>
          filters.sizes.includes(v.size)
        )
      )
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      default:
        // Relevance - keep order
        break
    }

    setFilteredProducts(filtered)
    setPage(1)
  }, [products, filters, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * productsPerPage,
    page * productsPerPage
  )

  // Handler functions
  const handleFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleColorToggle = (color: string) => {
    setFilters((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
    }))
  }

  const handleSizeToggle = (size: string) => {
    setFilters((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }))
  }

  const handleClearFilters = () => {
    setFilters({ ...DEFAULT_FILTERS, maxPrice })
  }

  const hasActiveFilters = Boolean(
    filters.category ||
    filters.minPrice > 0 ||
    filters.maxPrice < maxPrice ||
    filters.colors.length > 0 ||
    filters.sizes.length > 0 ||
    filters.inStockOnly ||
    filters.has3D
  )

  // Add to cart
  const handleAddToCart = (e: React.MouseEvent, product: Product & { mainImageUrl: string; variantCount: number }) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existingItem = cart.find((item: any) => item.id === product._id)
    if (existingItem) {
      existingItem.qty += 1
    } else {
      cart.push({
        id: product._id,
        name: product.name,
        price: product.basePrice,
        image: product.mainImageUrl,
        qty: 1,
      })
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new CustomEvent('cartUpdated'))
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Page Title */}
        <Typography variant="h3" fontWeight={700} gutterBottom>
          All Products
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Discover our complete collection of eyewear, lenses, and services
        </Typography>

        {/* Mobile Filter Button */}
        {isMobile && (
          <Box sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilterDrawerOpen(true)}
              fullWidth
            >
              Filters {hasActiveFilters && ` (${hasActiveFilters})`}
            </Button>
          </Box>
        )}

        <Grid container spacing={3}>
          {/* Filters Sidebar (Desktop) */}
          {!isMobile && (
            <Grid size={{ xs: 12, md: 3, lg: 3 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                  maxWidth: 280,
                  mx: { md: 0, xs: 'auto' },
                }}
              >
                <FilterContent
                  filters={filters}
                  maxPrice={maxPrice}
                  onFilterChange={handleFilterChange}
                  onColorToggle={handleColorToggle}
                  onSizeToggle={handleSizeToggle}
                  onClearFilters={handleClearFilters}
                  hasActiveFilters={hasActiveFilters}
                />
              </Paper>
            </Grid>
          )}

          {/* Products Grid */}
          <Grid size={{ xs: 12, md: isMobile ? 12 : 9, lg: 9 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="body1" color="text.secondary">
                Showing {paginatedProducts.length} of {filteredProducts.length} products
              </Typography>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort by"
                >
                  {SORT_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Loading State */}
            {loading ? (
              <Grid container spacing={3}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                    <ProductCardSkeleton />
                  </Grid>
                ))}
              </Grid>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : filteredProducts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 12 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No products found
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Try adjusting your filters
                </Typography>
                <Button variant="outlined" onClick={handleClearFilters} sx={{ mt: 2 }}>
                  Clear All Filters
                </Button>
              </Box>
            ) : (
              <>
                {/* Products Grid */}
                <Grid container spacing={3}>
                  {paginatedProducts.map((product) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.slug}>
                      <ProductCard
                        product={product}
                        onClick={() => navigate(`/product/${product.slug}`)}
                        onAddToCart={(e) => handleAddToCart(e, product)}
                      />
                    </Grid>
                  ))}
                </Grid>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, py: 2 }}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(_, value) => setPage(value)}
                      color="primary"
                      size="large"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="left"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: 300, maxWidth: '85vw' } }}
      >
        <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Filters
            </Typography>
            <IconButton onClick={() => setFilterDrawerOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <FilterContent
            filters={filters}
            maxPrice={maxPrice}
            onFilterChange={handleFilterChange}
            onColorToggle={handleColorToggle}
            onSizeToggle={handleSizeToggle}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </Box>
      </Drawer>

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

export default StorePage
