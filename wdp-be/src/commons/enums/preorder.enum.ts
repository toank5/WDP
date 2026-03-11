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
 * Pre-order status display labels
 */
export const PREORDER_STATUS_LABELS: Record<PREORDER_STATUS, string> = {
  [PREORDER_STATUS.PENDING_STOCK]: 'Waiting for Stock',
  [PREORDER_STATUS.PARTIALLY_RESERVED]: 'Partially Reserved',
  [PREORDER_STATUS.READY_TO_FULFILL]: 'Ready to Ship',
  [PREORDER_STATUS.FULFILLED]: 'Shipped',
  [PREORDER_STATUS.CANCELED]: 'Canceled',
};

/**
 * Pre-order status colors for UI
 */
export const PREORDER_STATUS_COLORS: Record<PREORDER_STATUS, string> = {
  [PREORDER_STATUS.PENDING_STOCK]: 'warning',
  [PREORDER_STATUS.PARTIALLY_RESERVED]: 'info',
  [PREORDER_STATUS.READY_TO_FULFILL]: 'success',
  [PREORDER_STATUS.FULFILLED]: 'default',
  [PREORDER_STATUS.CANCELED]: 'error',
};
