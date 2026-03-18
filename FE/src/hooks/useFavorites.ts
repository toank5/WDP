import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { wishlistApi, type WishlistItem } from '@/lib/wishlist-api'

export interface UseFavoritesResult {
  favorites: WishlistItem[]
  isFavorited: (productId: string, variantId?: string) => boolean
  addFavorite: (params: {
    productId: string
    productName: string
    variantId?: string
    variantSku?: string
    variantName?: string
    image: string
    price?: number
    category?: string
    has3D?: boolean
  }) => Promise<{ success: boolean; message: string }>
  removeFavorite: (params: {
    productId: string
    variantId?: string
    variantSku?: string
    favoriteId?: string
  }) => Promise<{ success: boolean; message: string }>
  toggleFavorite: (params: {
    productId: string
    productName: string
    variantId?: string
    variantSku?: string
    variantName?: string
    image: string
    price?: number
    category?: string
    has3D?: boolean
  }) => Promise<{ success: boolean; message: string; isFavorited: boolean }>
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  count: number
}

/**
 * Hook for managing favorites/wishlist
 * - Works with localStorage for guest users
 * - Works with backend API for authenticated users
 * - Automatically migrates guest wishlist to backend on login
 */
export function useFavorites(): UseFavoritesResult {
  const { isAuthenticated } = useAuthStore()
  const [favorites, setFavorites] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>( null)

  // Load favorites
  const loadFavorites = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const items = await wishlistApi.getItems()
      setFavorites(items)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load favorites'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load and reactivity to auth state
  useEffect(() => {
    loadFavorites()
  }, [loadFavorites, isAuthenticated])

  // Listen for wishlist updates
  useEffect(() => {
    const handleWishlistUpdate = () => {
      loadFavorites()
    }

    window.addEventListener('wishlistUpdated', handleWishlistUpdate)
    return () => window.removeEventListener('wishlistUpdated', handleWishlistUpdate)
  }, [loadFavorites])

  // Check if a product is favorited
  const isFavorited = useCallback(
    (productId: string, variantId?: string): boolean => {
      const wishlistItemId = variantId ? `${productId}-${variantId}` : productId
      return favorites.some((item) => item.wishlistItemId === wishlistItemId)
    },
    [favorites]
  )

  // Add favorite
  const addFavorite = useCallback(
    async (params: {
      productId: string
      productName: string
      variantId?: string
      variantSku?: string
      variantName?: string
      image: string
      price?: number
      category?: string
      has3D?: boolean
    }) => {
      return wishlistApi.addItem(params)
    },
    []
  )

  // Remove favorite
  const removeFavorite = useCallback(
    async (params: {
      productId: string
      variantId?: string
      variantSku?: string
      favoriteId?: string
    }) => {
      return wishlistApi.removeItem(params)
    },
    []
  )

  // Toggle favorite
  const toggleFavorite = useCallback(
    async (params: {
      productId: string
      productName: string
      variantId?: string
      variantSku?: string
      variantName?: string
      image: string
      price?: number
      category?: string
      has3D?: boolean
    }) => {
      return wishlistApi.toggleItem(params)
    },
    []
  )

  return {
    favorites,
    isFavorited,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isLoading,
    error,
    refresh: loadFavorites,
    count: favorites.length,
  }
}
