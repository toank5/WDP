/**
 * Cart-related type definitions shared between frontend and backend
 */

import { TypedPrescription } from './order.models';

/**
 * Cart Item
 */
export interface CartItem {
  productId: string;
  variantSku?: string; // Optional for lens and service products
  quantity: number;
  requiresPrescription?: boolean;
  typedPrescription?: TypedPrescription;
}

/**
 * Add to Cart Request
 */
export interface AddToCartRequest {
  productId: string;
  variantSku?: string; // Optional for lens and service products
  quantity: number;
  requiresPrescription?: boolean;
  typedPrescription?: TypedPrescription;
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
