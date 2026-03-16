/**
 * API Types
 * Matches strict Zod schemas from backend
 * These types ensure frontend and backend alignment
 */

// ==================== PRE-ORDER TYPES ====================

/**
 * Pre-order Status enum
 */
export type PreorderStatus =
  | 'PENDING_STOCK'
  | 'PARTIALLY_RESERVED'
  | 'READY_TO_FULFILL'
  | 'FULFILLED'
  | 'CANCELED';

/**
 * Pre-order status display labels
 */
export const PREORDER_STATUS_LABELS: Record<PreorderStatus, string> = {
  PENDING_STOCK: 'Waiting for Stock',
  PARTIALLY_RESERVED: 'Partially Reserved',
  READY_TO_FULFILL: 'Ready to Ship',
  FULFILLED: 'Shipped',
  CANCELED: 'Canceled',
};

/**
 * Pre-order status colors for UI
 */
export const PREORDER_STATUS_COLORS: Record<PreorderStatus, 'warning' | 'info' | 'success' | 'default' | 'error'> = {
  PENDING_STOCK: 'warning',
  PARTIALLY_RESERVED: 'info',
  READY_TO_FULFILL: 'success',
  FULFILLED: 'default',
  CANCELED: 'error',
};

// ==================== USER TYPES ====================

/**
 * User Roles - matches backend ROLES enum
 */
export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATION' | 'SALE' | 'CUSTOMER';

/**
 * Address Types - matches backend ADDRESS_TYPES enum
 */
export type AddressType = 'BILLING' | 'SHIPPING';

/**
 * Address - matches AddressSchema
 */
export interface Address {
  type: AddressType;
  street: string;
  city: string;
  zipCode: string;
}

/**
 * User - matches User schema
 */
export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatar?: string;
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Register Request - matches RegisterUserSchema
 */
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
}

/**
 * Login Request - matches LoginSchema
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Update User Request - matches UpdateUserSchema
 */
export interface UpdateUserRequest {
  email?: string;
  fullName?: string;
  avatar?: string;
  role?: UserRole;
  addresses?: Address[];
}

/**
 * Add Address Request - matches AddAddressSchema
 */
export interface AddAddressRequest extends Address {}

/**
 * Auth Response
 */
export interface AuthResponse {
  accessToken: string;
  user: User;
}

// ==================== CART TYPES ====================

/**
 * Cart Item - matches CartItemSchema
 */
export interface CartItem {
  productId: string;
  variantSku: string;
  quantity: number;
}

/**
 * Add to Cart Request - matches AddToCartSchema
 */
export interface AddToCartRequest {
  productId: string;
  variantSku: string;
  quantity: number;
}

/**
 * Update Cart Item Request - matches UpdateCartItemSchema
 */
export interface UpdateCartItemRequest {
  quantity: number;
}

/**
 * Bulk Add to Cart Request - matches BulkAddToCartSchema
 */
export interface BulkAddToCartRequest {
  items: CartItem[];
}

/**
 * Cart - matches Cart schema
 */
export interface Cart {
  _id: string;
  customerId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

// ==================== ORDER TYPES ====================

/**
 * Order Types - matches backend ORDER_TYPES enum
 */
export type OrderType = 'READY' | 'PREORDER' | 'PRESCRIPTION';

/**
 * Order Status - matches backend ORDER_STATUS enum
 */
export type OrderStatus =
  | 'PENDING'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'RETURNED'
  | 'CANCELLED';

/**
 * Payment Methods - matches backend PAYMENT_METHOD enum
 */
export type PaymentMethod = 'card' | 'cash' | 'bank_transfer' | 'momo' | 'zalo_pay';

/**
 * Shipping Carriers - matches backend SHIPPING_CARRIER enum
 */
export type ShippingCarrier =
  | 'GHN'
  | 'GHTK'
  | 'Viettel Post'
  | 'VNPost'
  | 'Shopee Express'
  | 'Grab Express'
  | 'Self Pickup';

/**
 * Order Item - matches OrderItemSchema
 */
export interface OrderItem {
  productId: string;
  variantSku: string;
  quantity: number;
  priceAtOrder: number;
  // Pre-order fields
  isPreorder?: boolean;
  preorderStatus?: PreorderStatus;
  expectedShipDate?: string;
  reservedQuantity?: number;
}

/**
 * Shipping Address - matches ShippingAddressSchema
 */
export interface ShippingAddress {
  type?: AddressType;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  district: string;
  ward?: string;
  zipCode?: string;
  notes?: string;
}

/**
 * Order Payment - matches OrderPaymentSchema
 */
export interface OrderPayment {
  method: PaymentMethod;
  amount: number;
  transactionId: string;
  paidAt: string | Date;
}

/**
 * Order Tracking - matches OrderTrackingSchema
 */
export interface OrderTracking {
  carrier: ShippingCarrier;
  trackingNumber: string;
}

/**
 * Eye Prescription - matches EyePrescriptionSchema
 */
export interface EyePrescription {
  right: number;
  left: number;
}

/**
 * Axis Prescription - matches AxisPrescriptionSchema
 */
export interface AxisPrescription {
  right: number;
  left: number;
}

/**
 * Order Prescription - matches OrderPrescriptionSchema
 */
export interface OrderPrescription {
  pd: number;
  sph: EyePrescription;
  cyl: EyePrescription;
  axis: AxisPrescription;
  add?: {
    right: number;
    left: number;
  };
}

/**
 * Order History - matches OrderHistorySchema
 */
export interface OrderHistory {
  status: OrderStatus;
  changedBy?: string;
  timestamp?: string | Date;
  note?: string;
}

/**
 * Base Order fields
 */
export interface BaseOrder {
  _id: string;
  orderNumber: string;
  customerId?: string;
  orderType: OrderType;
  orderStatus: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress;
  payment?: OrderPayment;
  tracking?: OrderTracking;
  assignedStaffId?: string;
  notes?: string;
  history: OrderHistory[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Ready Glasses Order
 */
export interface ReadyOrder extends BaseOrder {
  orderType: 'READY';
}

/**
 * Preorder
 */
export interface Preorder extends BaseOrder {
  orderType: 'PREORDER';
  expectedDeliveryDate?: string;
}

/**
 * Prescription Order
 */
export interface PrescriptionOrder extends BaseOrder {
  orderType: 'PRESCRIPTION';
  prescription: OrderPrescription;
}

/**
 * Union type for all order types
 */
export type Order = ReadyOrder | Preorder | PrescriptionOrder;

/**
 * Create Order Request - matches CreateOrderSchema
 */
export type CreateOrderRequest =
  | {
      orderType: 'READY';
      items: OrderItem[];
      shippingAddress: ShippingAddress;
      payment?: OrderPayment;
      notes?: string;
    }
  | {
      orderType: 'PREORDER';
      items: OrderItem[];
      shippingAddress: ShippingAddress;
      payment?: OrderPayment;
      notes?: string;
      expectedDeliveryDate?: string;
    }
  | {
      orderType: 'PRESCRIPTION';
      items: OrderItem[];
      shippingAddress: ShippingAddress;
      payment?: OrderPayment;
      notes?: string;
      prescription: OrderPrescription;
    };

/**
 * Update Order Status Request - matches UpdateOrderStatusSchema
 */
export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  note?: string;
}

/**
 * Update Order Request - matches UpdateOrderSchema
 */
export interface UpdateOrderRequest {
  items?: OrderItem[];
  shippingAddress?: ShippingAddress;
  payment?: OrderPayment;
  tracking?: OrderTracking;
  notes?: string;
  assignedStaffId?: string;
}

// ==================== INVENTORY TYPES ====================

/**
 * Supplier Info - matches SupplierInfoSchema
 */
export interface SupplierInfo {
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  expectedArrival: string | Date;
  notes?: string;
}

/**
 * Inventory - matches Inventory schema
 */
export interface Inventory {
  _id: string;
  sku: string;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  supplierInfo: SupplierInfo;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Inventory Request - matches CreateInventorySchema
 */
export interface CreateInventoryRequest {
  sku: string;
  stockQuantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  supplierInfo: SupplierInfo;
}

/**
 * Update Inventory Request - matches UpdateInventorySchema
 */
export interface UpdateInventoryRequest {
  stockQuantity?: number;
  reservedQuantity?: number;
  reorderLevel?: number;
  supplierInfo?: SupplierInfo;
}

/**
 * Stock Adjustment - matches StockAdjustmentSchema
 */
export interface StockAdjustment {
  sku: string;
  quantity: number;
  reason: string;
  reference?: string;
}

/**
 * Bulk Stock Update - matches BulkStockUpdateSchema
 */
export interface BulkStockUpdate {
  items: Array<{
    sku: string;
    stockQuantity: number;
    reservedQuantity?: number;
  }>;
}

/**
 * Reserve Inventory Request - matches ReserveInventorySchema
 */
export interface ReserveInventoryRequest {
  sku: string;
  quantity: number;
  orderId?: string;
}

// ==================== PRODUCT TYPES ====================

/**
 * Product Categories - matches backend PRODUCT_CATEGORIES enum
 */
export type ProductCategory = 'frame' | 'lens' | 'service';

/**
 * Frame Types
 */
export type FrameType = 'full-rim' | 'half-rim' | 'rimless';

/**
 * Frame Shapes
 */
export type FrameShape =
  | 'round'
  | 'square'
  | 'aviator'
  | 'rectangular'
  | 'cat-eye'
  | 'hexagonal'
  | 'oval'
  | 'wayfarer';

/**
 * Frame Materials
 */
export type FrameMaterial = 'metal' | 'plastic' | 'titanium' | 'acetate' | 'mixed';

/**
 * Frame Gender
 */
export type FrameGender = 'unisex' | 'male' | 'female';

/**
 * Bridge Fit
 */
export type BridgeFit = 'asian-fit' | 'standard' | 'wide';

/**
 * Lens Types
 */
export type LensType = 'single-vision' | 'progressive' | 'computer' | 'bifocal' | 'trifocal';

/**
 * Service Types
 */
export type ServiceType = 'fitting' | 'cleaning' | 'repair' | 'eye-test' | 'lens-replacement' | 'adjustment';

/**
 * Product Variant - matches variantSchema
 */
export interface ProductVariant {
  sku: string;
  size: string;
  color: string;
  price: number;
  weight?: number;
  images2D?: string[];
  images3D?: string[];
  isActive?: boolean;
  // Pre-order configuration
  isPreorderEnabled?: boolean;
  preorderExpectedShipStart?: string;
  preorderExpectedShipEnd?: string;
  preorderLimit?: number;
}

/**
 * Frame Product
 */
export interface FrameProduct {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  images2D: string[];
  images3D?: string[];
  tags?: string[];
  category: 'frame';
  frameType: FrameType;
  shape: FrameShape;
  material: FrameMaterial;
  gender?: FrameGender;
  bridgeFit?: BridgeFit;
  variants: ProductVariant[];
  isActive?: boolean;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lens Product
 */
export interface LensProduct {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  images2D: string[];
  images3D?: string[];
  tags?: string[];
  category: 'lens';
  lensType: LensType;
  index: number;
  coatings?: string[];
  isActive?: boolean;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Service Product
 */
export interface ServiceProduct {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  images2D: string[];
  images3D?: string[];
  tags?: string[];
  category: 'service';
  serviceType: ServiceType;
  durationMinutes: number;
  serviceNotes?: string;
  isActive?: boolean;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Union type for all products
 */
export type Product = FrameProduct | LensProduct | ServiceProduct;

// ==================== API ERROR TYPES ====================

/**
 * API Validation Error - matches backend error format
 */
export interface ValidationError {
  path: string;
  message: string;
}

/**
 * API Error Response - matches backend error format
 */
export interface ApiError {
  message: string;
  errors?: Record<string, string>;
  statusCode?: number;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  statusCode?: number;
  message: string;
  data?: T;
  error?: string;
}
