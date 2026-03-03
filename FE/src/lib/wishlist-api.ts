// Wishlist API using localStorage (replace with real API later)

export interface WishlistItem {
  wishlistItemId: string
  productId: string
  productName: string
  variantId?: string
  variantName?: string
  image: string
  addedAt: string
}

const WISHLIST_STORAGE_KEY = 'wishlist'

class WishlistAPI {
  private getWishlist(): WishlistItem[] {
    try {
      const wishlist = localStorage.getItem(WISHLIST_STORAGE_KEY)
      return wishlist ? JSON.parse(wishlist) : []
    } catch {
      return []
    }
  }

  private saveWishlist(wishlist: WishlistItem[]): void {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist))
    window.dispatchEvent(new CustomEvent('wishlistUpdated'))
  }

  // Get all wishlist items
  async getItems(): Promise<WishlistItem[]> {
    return this.getWishlist()
  }

  // Check if a product/variant is in wishlist
  async isFavorited(productId: string, variantId?: string): Promise<boolean> {
    const wishlist = this.getWishlist()
    const wishlistItemId = variantId ? `${productId}-${variantId}` : productId
    return wishlist.some((item) => item.wishlistItemId === wishlistItemId)
  }

  // Add item to wishlist
  async addItem(params: {
    productId: string
    productName: string
    variantId?: string
    variantName?: string
    image: string
  }): Promise<{ success: boolean; message: string }> {
    try {
      const wishlist = this.getWishlist()
      const { productId, productName, variantId, variantName, image } = params

      const wishlistItemId = variantId ? `${productId}-${variantId}` : productId

      // Check if already exists
      const existingItem = wishlist.find((item) => item.wishlistItemId === wishlistItemId)
      if (existingItem) {
        return { success: true, message: 'Already in wishlist' }
      }

      wishlist.push({
        wishlistItemId,
        productId,
        productName,
        variantId,
        variantName,
        image,
        addedAt: new Date().toISOString(),
      })

      this.saveWishlist(wishlist)
      return { success: true, message: 'Added to wishlist' }
    } catch (error) {
      return { success: false, message: 'Failed to add to wishlist' }
    }
  }

  // Remove item from wishlist
  async removeItem(params: { productId: string; variantId?: string }): Promise<{ success: boolean; message: string }> {
    try {
      const wishlist = this.getWishlist()
      const { productId, variantId } = params

      const wishlistItemId = variantId ? `${productId}-${variantId}` : productId
      const filteredWishlist = wishlist.filter((item) => item.wishlistItemId !== wishlistItemId)

      this.saveWishlist(filteredWishlist)
      return { success: true, message: 'Removed from wishlist' }
    } catch (error) {
      return { success: false, message: 'Failed to remove from wishlist' }
    }
  }

  // Toggle item in wishlist (add if not exists, remove if exists)
  async toggleItem(params: {
    productId: string
    productName: string
    variantId?: string
    variantName?: string
    image: string
  }): Promise<{ success: boolean; message: string; isFavorited: boolean }> {
    const isAlreadyFavorited = await this.isFavorited(params.productId, params.variantId)

    if (isAlreadyFavorited) {
      const result = await this.removeItem({ productId: params.productId, variantId: params.variantId })
      return { ...result, isFavorited: false }
    } else {
      const result = await this.addItem(params)
      return { ...result, isFavorited: true }
    }
  }

  // Clear wishlist
  async clearWishlist(): Promise<{ success: boolean; message: string }> {
    try {
      this.saveWishlist([])
      return { success: true, message: 'Wishlist cleared' }
    } catch (error) {
      return { success: false, message: 'Failed to clear wishlist' }
    }
  }

  // Get wishlist count
  async getWishlistCount(): Promise<number> {
    const wishlist = this.getWishlist()
    return wishlist.length
  }
}

export const wishlistApi = new WishlistAPI()
