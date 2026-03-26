import { z } from 'zod';
import { ORDER_TYPES, ORDER_STATUS } from '../../shared';
import { ADDRESS_TYPES } from '../../shared';

/**
 * Payment method enum for strict validation
 */
export const PAYMENT_METHOD = {
  CARD: 'card',
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  MOMO: 'momo',
  ZALO_PAY: 'zalo_pay',
} as const;

/**
 * Carrier enum for shipping
 */
export const SHIPPING_CARRIER = {
  GHN: 'GHN',
  GHTK: 'GHTK',
  VIETTEL_POST: 'Viettel Post',
  VNPOST: 'VNPost',
  SHOPEE_EXPRESS: 'Shopee Express',
  GRAB_EXPRESS: 'Grab Express',
  SELF_PICKUP: 'Self Pickup',
} as const;

/**
 * Strict Order Item Schema
 * - All fields required
 * - No extra fields allowed (strict mode)
 * - Quantity and price must be positive
 */
export const OrderItemSchema = z
  .object({
    productId: z
      .string()
      .min(1, 'Product ID is required')
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
    variantSku: z
      .string()
      .min(3, 'Variant SKU must be at least 3 characters')
      .max(50, 'Variant SKU must not exceed 50 characters')
      .trim(),
    quantity: z
      .number()
      .int('Quantity must be an integer')
      .positive('Quantity must be greater than 0')
      .max(999, 'Quantity cannot exceed 999'),
    priceAtOrder: z
      .number()
      .positive('Price at order must be greater than 0')
      .refine((val) => val.toFixed(2).length <= 15, {
        message: 'Price value exceeds maximum allowed',
      }),
  })
  .strict();

/**
 * Strict Shipping Address Schema
 * - For order shipping address
 */
export const ShippingAddressSchema = z
  .object({
    type: z.nativeEnum(ADDRESS_TYPES).optional(),
    fullName: z
      .string()
      .min(1, 'Full name is required')
      .max(100, 'Full name must not exceed 100 characters')
      .trim(),
    phone: z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .max(15, 'Phone number must not exceed 15 digits')
      .regex(/^[0-9+\-\s()]*$/, 'Invalid phone number format'),
    street: z
      .string()
      .min(1, 'Street address is required')
      .max(200, 'Street address must not exceed 200 characters')
      .trim(),
    city: z
      .string()
      .min(1, 'City is required')
      .max(100, 'City must not exceed 100 characters')
      .trim(),
    district: z
      .string()
      .min(1, 'District is required')
      .max(100, 'District must not exceed 100 characters')
      .trim(),
    ward: z
      .string()
      .max(100, 'Ward must not exceed 100 characters')
      .trim()
      .optional(),
    zipCode: z
      .string()
      .max(20, 'Zip code must not exceed 20 characters')
      .optional(),
    notes: z
      .string()
      .max(500, 'Delivery notes must not exceed 500 characters')
      .optional(),
  })
  .strict();

/**
 * Strict Order Payment Schema
 * - For payment information
 */
export const OrderPaymentSchema = z
  .object({
    method: z.nativeEnum(PAYMENT_METHOD),
    amount: z
      .number()
      .positive('Payment amount must be greater than 0')
      .refine((val) => val.toFixed(2).length <= 15, {
        message: 'Amount value exceeds maximum allowed',
      }),
    transactionId: z
      .string()
      .min(1, 'Transaction ID is required')
      .max(100, 'Transaction ID must not exceed 100 characters')
      .trim(),
    paidAt: z
      .string()
      .or(z.date())
      .transform((val) => (typeof val === 'string' ? new Date(val) : val))
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid payment date',
      }),
  })
  .strict();

/**
 * Strict Order Tracking Schema
 * - For shipping tracking information
 */
export const OrderTrackingSchema = z
  .object({
    carrier: z.nativeEnum(SHIPPING_CARRIER),
    trackingNumber: z
      .string()
      .min(1, 'Tracking number is required')
      .max(100, 'Tracking number must not exceed 100 characters')
      .trim(),
  })
  .strict();

/**
 * Strict Order History Schema
 * - For tracking order status changes
 */
export const OrderHistorySchema = z
  .object({
    status: z.nativeEnum(ORDER_STATUS),
    changedBy: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
      .optional(),
    timestamp: z
      .string()
      .or(z.date())
      .transform((val) => (typeof val === 'string' ? new Date(val) : val))
      .optional(),
    note: z.string().max(500, 'Note must not exceed 500 characters').optional(),
  })
  .strict();

/**
 * Strict Create Order Schema
 * - For creating new orders
 * - Validates based on order type
 */
const BaseOrderSchema = z
  .object({
    orderType: z.nativeEnum(ORDER_TYPES),
    items: z
      .array(OrderItemSchema)
      .min(1, 'Order must contain at least one item')
      .max(100, 'Order cannot contain more than 100 items'),
    shippingAddress: ShippingAddressSchema,
    payment: OrderPaymentSchema.optional(),
    notes: z
      .string()
      .max(1000, 'Notes must not exceed 1000 characters')
      .optional(),
  })
  .refine(
    (data) => {
      // Calculate total amount from items
      const calculatedTotal = data.items.reduce(
        (sum, item) => sum + item.priceAtOrder * item.quantity,
        0,
      );
      return calculatedTotal > 0;
    },
    {
      message: 'Order total must be greater than 0',
      path: ['items'],
    },
  )
  .strict();

/**
 * Ready Glasses Order Schema
 */
const ReadyOrderSchema = BaseOrderSchema.extend({
  orderType: z.literal(ORDER_TYPES.READY),
});

/**
 * Preorder Order Schema
 */
const PreorderOrderSchema = BaseOrderSchema.extend({
  orderType: z.literal(ORDER_TYPES.PREORDER),
  expectedDeliveryDate: z
    .string()
    .transform((str) => new Date(str))
    .refine((date) => date > new Date(), {
      message: 'Expected delivery date must be in the future',
    })
    .optional(),
});

/**
 * Discriminated union for order types
 */
export const CreateOrderSchema = z.discriminatedUnion('orderType', [
  ReadyOrderSchema,
  PreorderOrderSchema,
]);

/**
 * Strict Update Order Status Schema
 * - For updating order status
 */
export const UpdateOrderStatusSchema = z
  .object({
    status: z.nativeEnum(ORDER_STATUS),
    note: z.string().max(500, 'Note must not exceed 500 characters').optional(),
  })
  .refine((data) => Object.values(ORDER_STATUS).includes(data.status), {
    message: 'Invalid order status transition',
  })
  .strict();

/**
 * Strict Update Order Schema
 * - For general order updates (admin/staff only)
 */
export const UpdateOrderSchema = z
  .object({
    items: z.array(OrderItemSchema).min(1).max(100).optional(),
    shippingAddress: ShippingAddressSchema.optional(),
    payment: OrderPaymentSchema.optional(),
    tracking: OrderTrackingSchema.optional(),
    notes: z.string().max(1000).optional(),
    assignedStaffId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid staff ID format')
      .optional(),
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
 * Strict Update Order Payment Schema
 * - For updating payment information
 */
export const UpdateOrderPaymentSchema = OrderPaymentSchema.partial()
  .strict()
  .refine(
    (data) => {
      // At least one field must be provided
      return Object.keys(data).length > 0;
    },
    {
      message: 'At least one field must be provided for update',
    },
  );

/**
 * Strict Update Order Tracking Schema
 * - For updating tracking information
 */
export const UpdateOrderTrackingSchema = OrderTrackingSchema;

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
export type OrderItemInput = z.infer<typeof OrderItemSchema>;
export type ShippingAddressInput = z.infer<typeof ShippingAddressSchema>;
export type OrderPaymentInput = z.infer<typeof OrderPaymentSchema>;
export type OrderTrackingInput = z.infer<typeof OrderTrackingSchema>;
export type OrderHistoryInput = z.infer<typeof OrderHistorySchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;
export type UpdateOrderPaymentInput = z.infer<typeof UpdateOrderPaymentSchema>;
export type UpdateOrderTrackingInput = z.infer<
  typeof UpdateOrderTrackingSchema
>;
