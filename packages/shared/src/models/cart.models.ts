/**
 * Cart-related type definitions shared between frontend and backend
 */

/**
 * Cart Item
 */
export interface CartItem {
  productId: string;
  variantSku: string;
  quantity: number;
}

/**
 * Add to Cart Request
 */
export interface AddToCartRequest {
  productId: string;
  variantSku: string;
  quantity: number;
}

/**
 * Update Cart Item Request
 */
export interface UpdateCartItemRequest {
  quantity: number;
}

/**
 * Bulk Add to Cart Request
 */
export interface BulkAddToCartRequest {
  items: CartItem[];
}

/**
 * Cart
 */
export interface Cart {
  _id: string;
  customerId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}
