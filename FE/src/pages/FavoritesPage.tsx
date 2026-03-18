import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
  Stack,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Skeleton,
  Divider,
} from '@mui/material'
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ShoppingCart as CartIcon,
  ViewInAr as ThreeDIcon,
  Home as HomeIcon,
  Delete as DeleteIcon,
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
        borderRadius: 3,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
      onClick={() => navigate(`/products/${item.productId}`)}
    >
      <Box sx={{ p: 2 }}>
        {/* Category Badge and Remove Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          {item.category && (
            <Chip
              size="small"
              label={item.category}
              color="primary"
              sx={{ fontWeight: 600, textTransform: 'lowercase' }}
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
              bgcolor: 'background.paper',
              boxShadow: 1,
              '&:hover': {
                bgcolor: 'error.50',
              },
              transition: 'all 0.2s',
            }}
            aria-label="Remove from favorites"
          >
            <DeleteIcon sx={{ color: 'error.main' }} />
          </IconButton>
        </Box>

        {/* Product Image */}
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
          {item.image ? (
            <Box
              component="img"
              src={item.image}
              alt={item.productName}
              sx={{ height: 160, width: '100%', objectFit: 'contain' }}
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
                bgcolor: 'purple.main',
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
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
          {item.productName}
        </Typography>

        {/* Price */}
        <Typography variant="h6" color="primary" fontWeight={700}>
          {item.price ? formatPrice(item.price) : 'Price not available'}
        </Typography>

        {/* Variant Info */}
        {item.variantName && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {item.variantName}
          </Typography>
        )}

        {/* Add to Cart Button */}
        <Button
          fullWidth
          variant={item.isActive ? 'contained' : 'outlined'}
          color={item.isActive ? 'primary' : 'secondary'}
          startIcon={<CartIcon />}
          disabled={!item.isActive || isAddingToCart}
          onClick={handleAddToCart}
          sx={{ mt: 2 }}
        >
          {isAddingToCart ? 'Adding...' : item.isActive ? 'Add to Cart' : 'Unavailable'}
        </Button>
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            My Favorites
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {favorites.length} {favorites.length === 1 ? 'item' : 'items'} saved
          </Typography>
        </Box>
        {favorites.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleClearAll}
          >
            Clear All
          </Button>
        )}
      </Box>

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
        <Box sx={{ textAlign: 'center', py: 12 }}>
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
          <Typography variant="h6" color="text.secondary" gutterBottom>
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
      ) : (
        /* Favorites Grid */
        <Grid container spacing={3}>
          {favorites.map((item) => (
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
