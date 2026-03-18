// Wishlist API using localStorage (guest) and backend API (authenticated users)

import { api } from './api-client'
import { unwrapApiPayload, unwrapApiPayloadOrDefault } from './type-guards'
import { useAuthStore } from '@/store/auth-store'

export interface WishlistItem {
  wishlistItemId: string
  favoriteId?: string  // Backend favorite ID (when authenticated)
  productId: string
  productName: string
  variantId?: string
  variantSku?: string
  variantName?: string
  image: string
  price?: number
  category?: string
  has3D?: boolean
  isActive?: boolean
  addedAt: string
}

export interface FavoriteProductSummary {
  id: string
  name: string
  category: string
  slug?: string
  price: number
  imageUrl: string
  tag?: string
  has3D: boolean
  isActive: boolean
  variants?: Array<{
    sku: string
    color: string
    size: string
    price: number
  }>
}

const WISHLIST_STORAGE_KEY = 'guest_wishlist'

class WishlistAPI {
  /**
   * Get guest wishlist from localStorage
   */
  private getGuestWishlist(): WishlistItem[] {
    try {
      const wishlist = localStorage.getItem(WISHLIST_STORAGE_KEY)
      return wishlist ? JSON.parse(wishlist) : []
    } catch {
      return []
    }
  }

  /**
   * Save guest wishlist to localStorage
   */
  private saveGuestWishlist(wishlist: WishlistItem[]): void {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist))
      window.dispatchEvent(new CustomEvent('wishlistUpdated'))
    } catch (error) {
      console.error('Failed to save guest wishlist:', error)
    }
  }

  /**
   * Check if user is authenticated customer
   * Role is stored as string 'CUSTOMER' from the backend
   */
  private isCustomerUser(): boolean {
    const authState = useAuthStore.getState()
    return !!(
      authState.isAuthenticated &&
      authState.accessToken &&
      authState.user?.role === 'CUSTOMER'
    )
  }

  /**
   * Get all wishlist items
   * - If authenticated: fetch from backend
   * - If not authenticated: fetch from localStorage
   */
  async getItems(): Promise<WishlistItem[]> {
    if (this.isCustomerUser()) {
      try {
        const response = await api.get('/store/favorites')
        const data = unwrapApiPayloadOrDefault<{ items: any[] }>(response.data, { items: [] })

        if (data.items) {
          return data.items.map((item: any) => ({
            wishlistItemId: item.id,
            favoriteId: item.id,
            productId: item.productId,
            productName: item.product.name,
            variantId: item.variantId,
            variantSku: item.variantSku,
            variantName: item.variantSku,
            image: item.product.imageUrl,
            price: item.product.price,
            category: item.product.category,
            has3D: item.product.has3D,
            isActive: item.product.isActive,
            addedAt: item.addedAt,
          }))
        }
        return []
      } catch (error) {
        console.error('Failed to fetch favorites from backend:', error)
        return []
      }
    }

    // Guest user: return from localStorage
    return this.getGuestWishlist()
  }

  /**
   * Check if a product/variant is in wishlist
   */
  async isFavorited(productId: string, variantId?: string): Promise<boolean> {
    if (this.isCustomerUser()) {
      try {
        const params = new URLSearchParams({ productId })
        if (variantId) {
          params.append('variantId', variantId)
        }
        const response = await api.get(`/store/favorites/check?${params.toString()}`)
        const data = unwrapApiPayloadOrDefault<{ isFavorited: boolean }>(response.data, { isFavorited: false })
        return data.isFavorited
      } catch (error) {
        console.error('Failed to check favorite status:', error)
        return false
      }
    }

    // Guest user: check localStorage
    const wishlist = this.getGuestWishlist()
    const wishlistItemId = variantId ? `${productId}-${variantId}` : productId
    return wishlist.some((item) => item.wishlistItemId === wishlistItemId)
  }

  /**
   * Add item to wishlist
   */
  async addItem(params: {
    productId: string
    productName: string
    variantId?: string
    variantSku?: string
    variantName?: string
    image: string
    price?: number
    category?: string
    has3D?: boolean
  }): Promise<{ success: boolean; message: string }> {
    if (this.isCustomerUser()) {
      try {
        await api.post('/store/favorites', {
          productId: params.productId,
          variantId: params.variantId,
          variantSku: params.variantSku,
        })

        window.dispatchEvent(new CustomEvent('wishlistUpdated'))
        return { success: true, message: 'Added to favorites' }
      } catch (error) {
        console.error('Failed to add to favorites:', error)
        return { success: false, message: 'Failed to add to favorites' }
      }
    }

    // Guest user: add to localStorage
    try {
      const wishlist = this.getGuestWishlist()
      const { productId, productName, variantId, variantSku, variantName, image, price, category, has3D } = params

      const wishlistItemId = variantSku ? `${productId}-${variantSku}` : productId

      // Check if already exists
      const existingItem = wishlist.find((item) => item.wishlistItemId === wishlistItemId)
      if (existingItem) {
        return { success: true, message: 'Already in favorites' }
      }

      wishlist.push({
        wishlistItemId,
        productId,
        productName,
        variantId,
        variantSku,
        variantName,
        image,
        price,
        category,
        has3D,
        addedAt: new Date().toISOString(),
      })

      this.saveGuestWishlist(wishlist)
      return { success: true, message: 'Added to favorites' }
    } catch (error) {
      return { success: false, message: 'Failed to add to favorites' }
    }
  }

  /**
   * Remove item from wishlist
   */
  async removeItem(params: { productId: string; variantId?: string; variantSku?: string; favoriteId?: string }): Promise<{ success: boolean; message: string }> {
    if (this.isCustomerUser()) {
      try {
        // If we have the favoriteId, use it; otherwise use product ID
        if (params.favoriteId) {
          await api.delete(`/store/favorites/${params.favoriteId}`)
        } else {
          const url = params.variantId || params.variantSku
            ? `/store/favorites/by-product/${params.productId}?variantId=${params.variantId || params.variantSku}`
            : `/store/favorites/by-product/${params.productId}`
          await api.delete(url)
        }

        window.dispatchEvent(new CustomEvent('wishlistUpdated'))
        return { success: true, message: 'Removed from favorites' }
      } catch (error) {
        console.error('Failed to remove from favorites:', error)
        return { success: false, message: 'Failed to remove from favorites' }
      }
    }

    // Guest user: remove from localStorage
    try {
      const wishlist = this.getGuestWishlist()
      const { productId, variantId, variantSku } = params

      const wishlistItemId = variantSku ? `${productId}-${variantSku}` :
                            (variantId ? `${productId}-${variantId}` : productId)

      const filteredWishlist = wishlist.filter((item) => item.wishlistItemId !== wishlistItemId)

      this.saveGuestWishlist(filteredWishlist)
      return { success: true, message: 'Removed from favorites' }
    } catch (error) {
      return { success: false, message: 'Failed to remove from favorites' }
    }
  }

  /**
   * Toggle item in wishlist (add if not exists, remove if exists)
   */
  async toggleItem(params: {
    productId: string
    productName: string
    variantId?: string
    variantSku?: string
    variantName?: string
    image: string
    price?: number
    category?: string
    has3D?: boolean
  }): Promise<{ success: boolean; message: string; isFavorited: boolean }> {
    if (this.isCustomerUser()) {
      try {
        const response = await api.post('/store/favorites/toggle', {
          productId: params.productId,
          variantId: params.variantId,
          variantSku: params.variantSku,
        })

        const data = unwrapApiPayloadOrDefault<{ message: string; isFavorited: boolean }>(response.data, { message: 'Toggled favorites', isFavorited: false })
        window.dispatchEvent(new CustomEvent('wishlistUpdated'))

        return {
          success: true,
          message: data.message,
          isFavorited: data.isFavorited,
        }
      } catch (error) {
        console.error('Failed to toggle favorites:', error)
        return { success: false, message: 'Failed to toggle favorites', isFavorited: false }
      }
    }

    // Guest user: toggle in localStorage
    const isAlreadyFavorited = await this.isFavorited(params.productId, params.variantId)

    if (isAlreadyFavorited) {
      const result = await this.removeItem({ productId: params.productId, variantId: params.variantId, variantSku: params.variantSku })
      return { ...result, isFavorited: false }
    } else {
      const result = await this.addItem(params)
      return { ...result, isFavorited: true }
    }
  }

  /**
   * Clear wishlist
   */
  async clearWishlist(): Promise<{ success: boolean; message: string }> {
    if (this.isCustomerUser()) {
      try {
        const items = await this.getItems()
        for (const item of items) {
          if (item.favoriteId) {
            await api.delete(`/store/favorites/${item.favoriteId}`)
          }
        }

        window.dispatchEvent(new CustomEvent('wishlistUpdated'))
        return { success: true, message: 'Wishlist cleared' }
      } catch (error) {
        return { success: false, message: 'Failed to clear wishlist' }
      }
    }

    // Guest user: clear localStorage
    try {
      this.saveGuestWishlist([])
      return { success: true, message: 'Wishlist cleared' }
    } catch (error) {
      return { success: false, message: 'Failed to clear wishlist' }
    }
  }

  /**
   * Get wishlist count
   */
  async getWishlistCount(): Promise<number> {
    if (this.isCustomerUser()) {
      try {
        const response = await api.get('/store/favorites/count')
        const data = unwrapApiPayloadOrDefault<{ count: number }>(response.data, { count: 0 })
        return data.count
      } catch (error) {
        console.error('Failed to get wishlist count:', error)
        return 0
      }
    }

    // Guest user: count from localStorage
    const wishlist = this.getGuestWishlist()
    return wishlist.length
  }

  /**
   * Migrate guest wishlist to user wishlist (called after login)
   */
  async migrateGuestWishlist(): Promise<void> {
    if (!this.isCustomerUser()) {
      return
    }

    const guestWishlist = this.getGuestWishlist()
    if (guestWishlist.length === 0) {
      return
    }

    try {
      // Add each guest wishlist item to backend
      for (const item of guestWishlist) {
        await api.post('/store/favorites', {
          productId: item.productId,
          variantId: item.variantId,
          variantSku: item.variantSku,
        })
      }

      // Clear guest wishlist
      this.saveGuestWishlist([])

      // Dispatch update event
      window.dispatchEvent(new CustomEvent('wishlistUpdated'))

      console.log('Guest wishlist migrated to backend successfully')
    } catch (error) {
      console.error('Failed to migrate guest wishlist:', error)
    }
  }

  /**
   * Save user wishlist to guest wishlist (called before logout)
   */
  async saveUserWishlistToGuest(): Promise<void> {
    if (!this.isCustomerUser()) {
      return
    }

    try {
      const items = await this.getItems()
      if (items.length > 0) {
        this.saveGuestWishlist(items)
        console.log('User wishlist saved to guest storage')
      }
    } catch (error) {
      console.error('Failed to save user wishlist to guest storage:', error)
    }
  }
}

export const wishlistApi = new WishlistAPI()
