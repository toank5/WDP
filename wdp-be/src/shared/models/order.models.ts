/**
 * Order-related type definitions shared between frontend and backend
 */

import {
  ORDER_STATUS,
  ORDER_TYPES,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  PREORDER_STATUS,
  SHIPPING_CARRIER,
  PRESCRIPTION_REVIEW_STATUS,
  LAB_JOB_STATUS,
} from '../enums/order.enums';

export interface EyePrescription {
  sph: number;
  cyl: number;
  axis: number;
  add: number;
}

export interface TypedPrescription {
  rightEye: EyePrescription;
  leftEye: EyePrescription;
  pd?: number;
  pdRight?: number;
  pdLeft?: number;
  notesFromCustomer?: string;
}

/**
 * Order Item - represents a single item in an order
 */
export interface OrderItem {
  itemId?: string;
  productId: string;
  variantSku: string;
  quantity: number;
  priceAtOrder: number;
  // Pre-order fields
  isPreorder?: boolean;
  preorderStatus?: PREORDER_STATUS;
  expectedShipDate?: string;
  reservedQuantity?: number;
  requiresPrescription?: boolean;
  typedPrescription?: TypedPrescription;
  prescriptionReviewStatus?: PRESCRIPTION_REVIEW_STATUS;
  prescriptionReviewNote?: string;
}

export interface WorkOrder {
  _id?: string;
  orderId: string;
  orderItemId: string;
  rightEye: EyePrescription;
  leftEye: EyePrescription;
  pd?: number;
  pdRight?: number;
  pdLeft?: number;
  lensType: string;
  status: LAB_JOB_STATUS;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Shipping Address
 */
export interface ShippingAddress {
  type?: 'BILLING' | 'SHIPPING';
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
 * Order Payment
 */
export interface OrderPayment {
  method: PAYMENT_METHOD;
  status: PAYMENT_STATUS;
  amount: number;
  transactionId: string;
  paidAt: string | Date;
}

/**
 * Order Tracking
 */
export interface OrderTracking {
  carrier: SHIPPING_CARRIER;
  trackingNumber: string;
}

/**
 * Order History
 */
export interface OrderHistory {
  status: ORDER_STATUS;
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
  orderType: ORDER_TYPES;
  orderStatus: ORDER_STATUS;
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
  orderType: ORDER_TYPES.READY;
}

/**
 * Preorder
 */
export interface Preorder extends BaseOrder {
  orderType: ORDER_TYPES.PREORDER;
  expectedDeliveryDate?: string;
}

/**
 * Exchange Order
 */
export interface ExchangeOrder extends BaseOrder {
  orderType: ORDER_TYPES.EXCHANGE;
  originalOrderId?: string;
  returnRequestId?: string;
}

/**
 * Union type for all order types
 */
export type Order = ReadyOrder | Preorder | ExchangeOrder;

/**
 * Create Order Request
 */
export type CreateOrderRequest =
  | {
      orderType: ORDER_TYPES.READY;
      items: OrderItem[];
      shippingAddress: ShippingAddress;
      payment?: OrderPayment;
      notes?: string;
    }
  | {
      orderType: ORDER_TYPES.PREORDER;
      items: OrderItem[];
      shippingAddress: ShippingAddress;
      payment?: OrderPayment;
      notes?: string;
      expectedDeliveryDate?: string;
    }
  | {
      orderType: ORDER_TYPES.EXCHANGE;
      items: OrderItem[];
      shippingAddress: ShippingAddress;
      payment?: OrderPayment;
      notes?: string;
      originalOrderId?: string;
      returnRequestId?: string;
    };

/**
 * Update Order Status Request
 */
export interface UpdateOrderStatusRequest {
  status: ORDER_STATUS;
  note?: string;
}

/**
 * Update Order Request
 */
export interface UpdateOrderRequest {
  items?: OrderItem[];
  shippingAddress?: ShippingAddress;
  payment?: OrderPayment;
  tracking?: OrderTracking;
  notes?: string;
  assignedStaffId?: string;
}
