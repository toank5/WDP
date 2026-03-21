import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box,
  Container,
  Grid,
  Card,
  Typography,
  Button,
  Chip,
  IconButton,
  Stack,
  Alert,
  Breadcrumbs,
  Skeleton,
  Paper,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  MenuItem,
} from '@mui/material'
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ShoppingCart as CartIcon,
  ViewInAr as ThreeDIcon,
  Home as HomeIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CheckCircleOutline as AvailableIcon,
  HighlightOff as UnavailableIcon,
  CalendarMonth as DateIcon,
  GridView as GridIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material'
import { useAuthStore } from '@/store/auth-store'
import { wishlistApi, type WishlistItem } from '@/lib/wishlist-api'
import { useCart } from '@/store/cart.store'
import { toast } from 'sonner'

// Price formatter for VND
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

// Loading Skeleton
function FavoriteCardSkeleton() {
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

// Favorite Product Card
interface FavoriteCardProps {
  item: WishlistItem
  onRemove: () => void
  isRemoving: boolean
}

function FavoriteCard({ item, onRemove, isRemoving }: FavoriteCardProps) {
  const navigate = useNavigate()
  const { addItem: addToCart } = useCart()
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!item.isActive) {
      toast.error('This product is currently unavailable')
      return
    }

    setIsAddingToCart(true)
    try {
      await addToCart({
        productId: item.productId,
        variantSku: item.variantSku,
        quantity: 1,
        productData: {
          name: item.productName,
          image: item.image,
          price: item.price,
        },
      })
      toast.success('Added to cart')
    } catch (error) {
      console.error('Failed to add to cart:', error)
      toast.error('Failed to add to cart')
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <Card
      sx={{
        borderRadius: 4,
        cursor: 'pointer',
        border: '1px solid',
        borderColor: 'grey.200',
        background: item.isActive
          ? 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)'
          : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        transition: 'all 0.25s ease',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 18px 30px rgba(15, 23, 42, 0.12)',
          borderColor: 'grey.300',
          '& .favorite-image': {
            transform: 'scale(1.05)',
          },
        },
      }}
      onClick={() => navigate(`/products/${item.productId}`)}
    >
      <Box sx={{ p: 2.25 }}>
        {/* Category Badge and Remove Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          {item.category && (
            <Chip
              size="small"
              label={item.category}
              sx={{
                fontWeight: 700,
                textTransform: 'capitalize',
                bgcolor: '#f1f5f9',
                color: '#334155',
                border: '1px solid #e2e8f0',
              }}
            />
          )}
          {!item.category && <Box sx={{ flex: 1 }} />}

          {/* Remove Button */}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            disabled={isRemoving}
            sx={{
              bgcolor: 'rgba(255,255,255,0.95)',
              boxShadow: 1,
              '&:hover': {
                bgcolor: '#f8fafc',
              },
              transition: 'all 0.2s',
            }}
            aria-label="Remove from favorites"
          >
            <DeleteIcon sx={{ color: 'text.secondary' }} />
          </IconButton>
        </Box>

        {/* Product Image */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 2,
            height: 170,
            bgcolor: '#f8fafc',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'grey.200',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {item.image ? (
            <Box
              component="img"
              src={item.image}
              alt={item.productName}
              className="favorite-image"
              sx={{
                height: 170,
                width: '100%',
                objectFit: 'contain',
                transition: 'transform 0.3s ease',
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
          ) : null}
          {!item.image && (
            <Box sx={{ fontSize: 60, display: item.image ? 'none' : 'flex' }}>👓</Box>
          )}

          {/* 3D Badge */}
          {item.has3D && (
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
                bgcolor: '#334155',
                color: 'white',
              }}
            />
          )}

          {/* Unavailable Badge */}
          {!item.isActive && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                Out of Stock
              </Typography>
            </Box>
          )}
        </Box>

        {/* Product Name */}
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{
            mb: 0.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: 56,
          }}
        >
          {item.productName}
        </Typography>

        {/* Price */}
        <Typography variant="h6" color="primary" fontWeight={800}>
          {item.price ? formatPrice(item.price) : 'Price not available'}
        </Typography>

        {/* Variant Info */}
        {item.variantName && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {item.variantName}
          </Typography>
        )}

        <Stack direction="row" spacing={1.25} sx={{ mt: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ViewIcon />}
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/products/${item.productId}`)
            }}
            sx={{ borderRadius: 2.5 }}
          >
            View
          </Button>
          <Button
            fullWidth
            variant={item.isActive ? 'contained' : 'outlined'}
            color={item.isActive ? 'primary' : 'secondary'}
            startIcon={<CartIcon />}
            disabled={!item.isActive || isAddingToCart}
            onClick={handleAddToCart}
            sx={{ borderRadius: 2.5 }}
          >
            {isAddingToCart ? 'Adding...' : item.isActive ? 'Cart' : 'Unavailable'}
          </Button>
        </Stack>
      </Box>
    </Card>
  )
}

export default function FavoritesPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const isCustomer = user?.role === 'CUSTOMER'
  const [favorites, setFavorites] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'unavailable'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'priceAsc' | 'priceDesc' | 'name'>('recent')

  // Load favorites
  const loadFavorites = async () => {
    if (!isAuthenticated || !isCustomer) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const items = await wishlistApi.getItems()
      setFavorites(items)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load favorites'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFavorites()

    // Listen for wishlist updates
    const handleWishlistUpdate = () => {
      loadFavorites()
    }

    window.addEventListener('wishlistUpdated', handleWishlistUpdate)
    return () => window.removeEventListener('wishlistUpdated', handleWishlistUpdate)
  }, [isAuthenticated, isCustomer])

  // Remove favorite
  const handleRemoveFavorite = async (item: WishlistItem) => {
    setRemovingIds((prev) => new Set(prev).add(item.wishlistItemId))

    try {
      await wishlistApi.removeItem({
        productId: item.productId,
        variantId: item.variantId,
        variantSku: item.variantSku,
        favoriteId: item.favoriteId,
      })
      toast.success('Removed from favorites')
    } catch (error) {
      console.error('Failed to remove favorite:', error)
      toast.error('Failed to remove from favorites')
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev)
        next.delete(item.wishlistItemId)
        return next
      })
    }
  }

  // Clear all favorites
  const handleClearAll = async () => {
    try {
      await wishlistApi.clearWishlist()
      toast.success('All favorites removed')
    } catch (error) {
      console.error('Failed to clear favorites:', error)
      toast.error('Failed to clear favorites')
    }
  }

  const visibleFavorites = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase()

    const filtered = favorites.filter((item) => {
      if (statusFilter === 'available' && !item.isActive) return false
      if (statusFilter === 'unavailable' && item.isActive) return false

      if (!needle) return true
      return [item.productName, item.category, item.variantName]
        .filter(Boolean)
        .some((text) => text!.toLowerCase().includes(needle))
    })

    const sorted = [...filtered]
    if (sortBy === 'name') {
      sorted.sort((a, b) => a.productName.localeCompare(b.productName))
    } else if (sortBy === 'priceAsc') {
      sorted.sort((a, b) => (a.price || 0) - (b.price || 0))
    } else if (sortBy === 'priceDesc') {
      sorted.sort((a, b) => (b.price || 0) - (a.price || 0))
    } else {
      sorted.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    }

    return sorted
  }, [favorites, searchTerm, statusFilter, sortBy])

  const availableCount = useMemo(() => favorites.filter((item) => item.isActive).length, [favorites])
  const unavailableCount = favorites.length - availableCount

  // Not logged in or not a customer state
  if (!isAuthenticated && !loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Stack spacing={4} alignItems="center" sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'error.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FavoriteIcon sx={{ fontSize: 40, color: 'error.main' }} />
          </Box>
          <Typography variant="h4" fontWeight={800}>
            Your Favorites
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 500 }}>
            Please log in to view and manage your favorite items.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              onClick={() => navigate('/login')}
              variant="contained"
              size="large"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate('/products')}
              variant="outlined"
              size="large"
            >
              Browse Products
            </Button>
          </Stack>
        </Stack>
      </Container>
    )
  }

  // Logged in but not a customer
  if (isAuthenticated && !isCustomer && !loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Stack spacing={4} alignItems="center" sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'warning.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FavoriteIcon sx={{ fontSize: 40, color: 'warning.main' }} />
          </Box>
          <Typography variant="h4" fontWeight={800}>
            Favorites
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 500 }}>
            The favorites feature is only available for customer accounts.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              onClick={() => navigate('/products')}
              variant="contained"
              size="large"
            >
              Browse Products
            </Button>
            <Button
              onClick={() => navigate(-1)}
              variant="outlined"
              size="large"
            >
              Go Back
            </Button>
          </Stack>
        </Stack>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4.5 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Button
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')}
          sx={{ fontSize: '0.875rem' }}
        >
          Home
        </Button>
        <Typography color="text.primary" fontWeight={600}>
          Favorites
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: { xs: 2, md: 3 },
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'grey.200',
          background: '#ffffff',
        }}
      >
        <Stack spacing={2.2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                My Favorites
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Curated picks you can revisit anytime.
              </Typography>
            </Box>
            {favorites.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleClearAll}
                sx={{ borderRadius: 999 }}
              >
                Clear All
              </Button>
            )}
          </Box>

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3, border: '1px solid', borderColor: 'grey.200', bgcolor: 'white' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <GridIcon sx={{ color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Saved</Typography>
                    <Typography variant="h6" fontWeight={800}>{favorites.length}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3, border: '1px solid', borderColor: 'grey.200', bgcolor: 'white' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AvailableIcon sx={{ color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Available</Typography>
                    <Typography variant="h6" fontWeight={800}>{availableCount}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3, border: '1px solid', borderColor: 'grey.200', bgcolor: 'white' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <UnavailableIcon sx={{ color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Unavailable</Typography>
                    <Typography variant="h6" fontWeight={800}>{unavailableCount}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      {favorites.length > 0 && !loading && (
        <Paper elevation={0} sx={{ mb: 3, p: 2, borderRadius: 3, border: '1px solid', borderColor: 'grey.200', bgcolor: '#fff' }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by product, category, variant"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <ToggleButtonGroup
                size="small"
                exclusive
                fullWidth
                value={statusFilter}
                sx={{
                  '& .MuiToggleButton-root': {
                    textTransform: 'none',
                    color: 'text.secondary',
                    borderColor: 'grey.300',
                  },
                  '& .MuiToggleButton-root.Mui-selected': {
                    bgcolor: '#f1f5f9',
                    color: 'text.primary',
                    borderColor: 'grey.400',
                  },
                  '& .MuiToggleButton-root.Mui-selected:hover': {
                    bgcolor: '#e2e8f0',
                  },
                }}
                onChange={(_, value) => {
                  if (value) setStatusFilter(value)
                }}
              >
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="available">Available</ToggleButton>
                <ToggleButton value="unavailable">Unavailable</ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              >
                <MenuItem value="recent">Newest first</MenuItem>
                <MenuItem value="name">Name A-Z</MenuItem>
                <MenuItem value="priceAsc">Price low-high</MenuItem>
                <MenuItem value="priceDesc">Price high-low</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Loading State */}
      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <FavoriteCardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : favorites.length === 0 ? (
        /* Empty State */
        <Box sx={{ textAlign: 'center', py: 12, px: 2, border: '1px dashed', borderColor: 'grey.300', borderRadius: 4, bgcolor: 'white' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <FavoriteBorderIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
          </Box>
          <Typography variant="h6" color="text.secondary" gutterBottom fontWeight={700}>
            You haven't saved any favorites yet
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
            Start browsing and save items you love by clicking the heart icon
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<CartIcon />}
              onClick={() => navigate('/products')}
            >
              Shop Frames
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
            >
              Return Home
            </Button>
          </Stack>
        </Box>
      ) : visibleFavorites.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, border: '1px dashed', borderColor: 'grey.300', borderRadius: 4 }}>
          <DateIcon sx={{ fontSize: 38, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>
            No matches found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Try another keyword or switch filters to see more items.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setSortBy('recent')
            }}
          >
            Reset filters
          </Button>
        </Box>
      ) : (
        /* Favorites Grid */
        <Grid container spacing={3}>
          {visibleFavorites.map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.wishlistItemId}>
              <FavoriteCard
                item={item}
                onRemove={() => handleRemoveFavorite(item)}
                isRemoving={removingIds.has(item.wishlistItemId)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  )
}
