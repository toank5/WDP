import { z } from 'zod';

/**
 * Strict Supplier Info Schema
 * - All fields required
 * - No extra fields allowed (strict mode)
 * - Expected arrival must be future date
 */
export const SupplierInfoSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Supplier name is required')
      .max(100, 'Supplier name must not exceed 100 characters')
      .trim(),
    contactEmail: z
      .string()
      .email('Invalid contact email format')
      .toLowerCase()
      .trim()
      .optional(),
    contactPhone: z
      .string()
      .min(10, 'Contact phone must be at least 10 digits')
      .max(15, 'Contact phone must not exceed 15 digits')
      .regex(/^[0-9+\-\s()]*$/, 'Invalid phone number format')
      .optional(),
    expectedArrival: z
      .string()
      .or(z.date())
      .transform((val) => (typeof val === 'string' ? new Date(val) : val))
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid expected arrival date',
      })
      .refine((date) => date >= new Date(), {
        message: 'Expected arrival date must be today or in the future',
      }),
    notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
  })
  .strict();

/**
 * Strict Create Inventory Schema
 * - All fields required
 * - No extra fields allowed (strict mode)
 * - Quantities must be non-negative
 * - Business rule: available = stock - reserved
 */
export const CreateInventorySchema = z
  .object({
    sku: z
      .string()
      .min(3, 'SKU must be at least 3 characters')
      .max(50, 'SKU must not exceed 50 characters')
      .trim()
      .toUpperCase(),
    stockQuantity: z
      .number()
      .int('Stock quantity must be an integer')
      .min(0, 'Stock quantity must be at least 0'),
    reservedQuantity: z
      .number()
      .int('Reserved quantity must be an integer')
      .min(0, 'Reserved quantity must be at least 0'),
    reorderLevel: z
      .number()
      .int('Reorder level must be an integer')
      .min(0, 'Reorder level must be at least 0'),
    supplierInfo: SupplierInfoSchema,
  })
  .refine(
    (data) => {
      // Reserved cannot exceed stock
      return data.reservedQuantity <= data.stockQuantity;
    },
    {
      message: 'Reserved quantity cannot exceed stock quantity',
      path: ['reservedQuantity'],
    },
  )
  .strict()
  .transform((data) => {
    // Auto-calculate available quantity
    return {
      ...data,
      availableQuantity: data.stockQuantity - data.reservedQuantity,
    };
  })
  .refine(
    (data) => {
      // Validate calculated available quantity
      return (
        'availableQuantity' in data &&
        typeof data.availableQuantity === 'number' &&
        data.availableQuantity >= 0
      );
    },
    {
      message: 'Available quantity must be non-negative',
      path: ['availableQuantity'],
    },
  );

/**
 * Strict Update Inventory Schema
 * - All fields optional
 * - No extra fields allowed
 * - Same validations as create
 */
export const UpdateInventorySchema = z
  .object({
    stockQuantity: z
      .number()
      .int('Stock quantity must be an integer')
      .min(0, 'Stock quantity must be at least 0')
      .optional(),
    reservedQuantity: z
      .number()
      .int('Reserved quantity must be an integer')
      .min(0, 'Reserved quantity must be at least 0')
      .optional(),
    reorderLevel: z
      .number()
      .int('Reorder level must be an integer')
      .min(0, 'Reorder level must be at least 0')
      .optional(),
    supplierInfo: SupplierInfoSchema.optional(),
  })
  .refine(
    (data) => {
      // At least one field must be provided
      return Object.keys(data).length > 0;
    },
    {
      message: 'At least one field must be provided for update',
    },
  )
  .strict();

/**
 * Strict Stock Adjustment Schema
 * - For adjusting inventory quantities
 * - Supports both positive (add) and negative (remove) adjustments
 */
export const StockAdjustmentSchema = z
  .object({
    sku: z
      .string()
      .min(3, 'SKU must be at least 3 characters')
      .max(50, 'SKU must not exceed 50 characters')
      .trim()
      .toUpperCase(),
    quantity: z
      .number()
      .int('Adjustment quantity must be an integer')
      .refine((val) => val !== 0, {
        message: 'Adjustment quantity cannot be 0',
      }),
    reason: z
      .string()
      .min(1, 'Reason is required')
      .max(500, 'Reason must not exceed 500 characters')
      .trim(),
    reference: z
      .string()
      .max(100, 'Reference must not exceed 100 characters')
      .optional(),
  })
  .strict();

/**
 * Strict Bulk Stock Update Schema
 * - For updating multiple inventory items at once
 */
export const BulkStockUpdateSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            sku: z
              .string()
              .min(3, 'SKU must be at least 3 characters')
              .max(50, 'SKU must not exceed 50 characters')
              .trim()
              .toUpperCase(),
            stockQuantity: z
              .number()
              .int('Stock quantity must be an integer')
              .min(0, 'Stock quantity must be at least 0'),
            reservedQuantity: z
              .number()
              .int('Reserved quantity must be an integer')
              .min(0, 'Reserved quantity must be at least 0')
              .optional(),
          })
          .strict(),
      )
      .min(1, 'At least one item is required')
      .max(100, 'Cannot update more than 100 items at once'),
  })
  .refine(
    (data) => {
      // Check for duplicate SKUs
      const skus = data.items.map((item) => item.sku);
      return new Set(skus).size === skus.length;
    },
    {
      message: 'Duplicate SKUs detected in bulk update',
      path: ['items'],
    },
  )
  .strict();

/**
 * Strict Reservation Schema
 * - For reserving inventory items
 */
export const ReserveInventorySchema = z
  .object({
    sku: z
      .string()
      .min(3, 'SKU must be at least 3 characters')
      .max(50, 'SKU must not exceed 50 characters')
      .trim()
      .toUpperCase(),
    quantity: z
      .number()
      .int('Quantity must be an integer')
      .positive('Quantity must be greater than 0'),
    orderId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID format')
      .optional(),
  })
  .strict();

/**
 * Strict Release Reservation Schema
 * - For releasing reserved inventory
 */
export const ReleaseReservationSchema = z
  .object({
    sku: z
      .string()
      .min(3, 'SKU must be at least 3 characters')
      .max(50, 'SKU must not exceed 50 characters')
      .trim()
      .toUpperCase(),
    quantity: z
      .number()
      .int('Quantity must be an integer')
      .positive('Quantity must be greater than 0'),
    orderId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID format')
      .optional(),
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
export type SupplierInfoInput = z.infer<typeof SupplierInfoSchema>;
export type CreateInventoryInput = z.infer<typeof CreateInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof UpdateInventorySchema>;
export type StockAdjustmentInput = z.infer<typeof StockAdjustmentSchema>;
export type BulkStockUpdateInput = z.infer<typeof BulkStockUpdateSchema>;
export type ReserveInventoryInput = z.infer<typeof ReserveInventorySchema>;
export type ReleaseReservationInput = z.infer<typeof ReleaseReservationSchema>;
