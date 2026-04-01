/**
 * Order Type Enumeration
 */
export enum ORDER_TYPES {
  READY = 'READY',
  PREORDER = 'PREORDER',
  EXCHANGE = 'EXCHANGE', // Exchange order created from a return
}

/**
 * Order Status Enumeration
 */
export enum ORDER_STATUS {
  PENDING = 'PENDING',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  ON_HOLD = 'ON_HOLD',
  PROCESSING = 'PROCESSING',
  READY_TO_SHIP = 'READY_TO_SHIP',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  CANCELED = 'CANCELED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

/**
 * Pre-order status enum for order items
 * PENDING_STOCK: Customer paid/placed order, waiting for stock
 * PARTIALLY_RESERVED: Some quantity reserved from incoming/received stock
 * READY_TO_FULFILL: Stock is fully available, waiting to pick/pack
 * FULFILLED: Shipped/delivered
 * CANCELED: Pre-order was canceled
 */
export enum PREORDER_STATUS {
  PENDING_STOCK = 'PENDING_STOCK',
  PARTIALLY_RESERVED = 'PARTIALLY_RESERVED',
  READY_TO_FULFILL = 'READY_TO_FULFILL',
  FULFILLED = 'FULFILLED',
  CANCELED = 'CANCELED',
}

/**
 * Typed prescription review status (sales verification)
 */
export enum PRESCRIPTION_REVIEW_STATUS {
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * Lab work order processing status
 */
export enum LAB_JOB_STATUS {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ISSUE = 'ISSUE',
}

/**
 * Payment Method Enumeration
 */
export enum PAYMENT_METHOD {
  VNPAY = 'VNPAY',
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'card',
  MOMO = 'momo',
  ZALO_PAY = 'zalo_pay',
}

/**
 * Payment Status Enumeration
 */
export enum PAYMENT_STATUS {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

/**
 * Shipping Method Enumeration
 */
export enum SHIPPING_METHOD {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
}

/**
 * Shipping Carriers
 */
export enum SHIPPING_CARRIER {
  GHN = 'GHN',
  GHTK = 'GHTK',
  VIETTEL_POST = 'Viettel Post',
  VNPOST = 'VNPost',
  SHOPEE_EXPRESS = 'Shopee Express',
  GRAB_EXPRESS = 'Grab Express',
  SELF_PICKUP = 'Self Pickup',
}
