import { z } from 'zod';

/**
 * Strict Cart Item Schema
 * - productId and quantity are required
 * - variantSku is optional (for lens and service products)
 * - No extra fields allowed (strict mode)
 * - Quantity must be positive
 * - SKU must be valid format when provided
 */
export const CartItemSchema = z
  .object({
    productId: z
      .string()
      .min(1, 'Product ID is required')
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
    variantSku: z
      .string()
      .min(3, 'Variant SKU must be at least 3 characters')
      .max(50, 'Variant SKU must not exceed 50 characters')
      .trim()
      .optional(),
    quantity: z
      .number()
      .int('Quantity must be an integer')
      .positive('Quantity must be greater than 0')
      .max(999, 'Quantity cannot exceed 999'),
  })
  .strict();

/**
 * Strict Add to Cart Schema
 * - For adding items to cart
 */
export const AddToCartSchema = CartItemSchema;

/**
 * Strict Update Cart Item Schema
 * - For updating quantity of existing cart items
 * - Quantity must be positive
 */
export const UpdateCartItemSchema = z
  .object({
    quantity: z
      .number()
      .int('Quantity must be an integer')
      .positive('Quantity must be greater than 0')
      .max(999, 'Quantity cannot exceed 999'),
  })
  .refine((data) => data.quantity > 0, {
    message: 'Quantity must be greater than 0',
    path: ['quantity'],
  })
  .strict();

/**
 * Strict Remove from Cart Schema
 * - For removing items from cart
 * - Only requires the cart item identifier
 * - variantSku is optional (for lens and service products)
 */
export const RemoveFromCartSchema = z
  .object({
    productId: z
      .string()
      .min(1, 'Product ID is required')
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
    variantSku: z
      .string()
      .min(3, 'Variant SKU must be at least 3 characters')
      .max(50, 'Variant SKU must not exceed 50 characters')
      .trim()
      .optional(),
  })
  .strict();

/**
 * Bulk Add to Cart Schema
 * - For adding multiple items at once
 */
export const BulkAddToCartSchema = z
  .object({
    items: z
      .array(CartItemSchema)
      .min(1, 'At least one item is required')
      .max(50, 'Cannot add more than 50 items at once'),
  })
  .strict();

/**
 * Format Zod errors for API response
 */
export function formatZodError(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};

  error.issues.forEach((err) => {
    const path = err.path.join('.');
    formatted[path] = err.message;
  });

  return formatted;
}

/**
 * TypeScript types inferred from schemas
 */
export type CartItemInput = z.infer<typeof CartItemSchema>;
export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
export type RemoveFromCartInput = z.infer<typeof RemoveFromCartSchema>;
export type BulkAddToCartInput = z.infer<typeof BulkAddToCartSchema>;
