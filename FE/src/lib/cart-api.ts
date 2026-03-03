// Cart API using localStorage (replace with real API later)

export interface CartItem {
  cartItemId: string
  id: string
  name: string
  price: number
  variantSku?: string
  variantName?: string
  qty: number
  image: string
}

const CART_STORAGE_KEY = 'cart'

class CartAPI {
  private getCart(): CartItem[] {
    try {
      const cart = localStorage.getItem(CART_STORAGE_KEY)
      return cart ? JSON.parse(cart) : []
    } catch {
      return []
    }
  }

  private saveCart(cart: CartItem[]): void {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    window.dispatchEvent(new CustomEvent('cartUpdated'))
  }

  // Get all cart items
  async getItems(): Promise<CartItem[]> {
    return this.getCart()
  }

  // Add item to cart
  async addItem(params: { variantId?: string; productId: string; quantity: number; productData: any }): Promise<{ success: boolean; message: string }> {
    try {
      const cart = this.getCart()
      const { variantId, productId, quantity, productData } = params

      const cartItemId = variantId ? `${productId}-${variantId}` : productId

      const existingItem = cart.find((item) => item.cartItemId === cartItemId)

      if (existingItem) {
        existingItem.qty += quantity
      } else {
        cart.push({
          cartItemId,
          id: productId,
          name: productData.name,
          price: productData.price,
          variantSku: productData.variantSku,
          variantName: productData.variantName,
          qty: quantity,
          image: productData.image,
        })
      }

      this.saveCart(cart)
      return { success: true, message: 'Added to cart' }
    } catch (error) {
      return { success: false, message: 'Failed to add to cart' }
    }
  }

  // Update item quantity
  async updateItem(cartItemId: string, quantity: number): Promise<{ success: boolean; message: string }> {
    try {
      const cart = this.getCart()
      const item = cart.find((item) => item.cartItemId === cartItemId)

      if (item) {
        if (quantity <= 0) {
          return this.removeItem(cartItemId)
        }
        item.qty = quantity
        this.saveCart(cart)
        return { success: true, message: 'Cart updated' }
      }

      return { success: false, message: 'Item not found' }
    } catch (error) {
      return { success: false, message: 'Failed to update cart' }
    }
  }

  // Remove item from cart
  async removeItem(cartItemId: string): Promise<{ success: boolean; message: string }> {
    try {
      const cart = this.getCart()
      const filteredCart = cart.filter((item) => item.cartItemId !== cartItemId)
      this.saveCart(filteredCart)
      return { success: true, message: 'Removed from cart' }
    } catch (error) {
      return { success: false, message: 'Failed to remove item' }
    }
  }

  // Clear cart
  async clearCart(): Promise<{ success: boolean; message: string }> {
    try {
      this.saveCart([])
      return { success: true, message: 'Cart cleared' }
    } catch (error) {
      return { success: false, message: 'Failed to clear cart' }
    }
  }

  // Get cart total
  async getCartTotal(): Promise<number> {
    const cart = this.getCart()
    return cart.reduce((total, item) => total + item.price * item.qty, 0)
  }

  // Get cart item count
  async getCartCount(): Promise<number> {
    const cart = this.getCart()
    return cart.reduce((count, item) => count + item.qty, 0)
  }
}

export const cartApi = new CartAPI()
