/**
 * Shipping-related constants shared between frontend and backend
 */

import { SHIPPING_METHOD } from '../enums/order.enums';

/**
 * Shipping Method Display Labels
 */
export const SHIPPING_METHOD_LABELS: Record<SHIPPING_METHOD, string> = {
  [SHIPPING_METHOD.STANDARD]: 'Standard Delivery',
  [SHIPPING_METHOD.EXPRESS]: 'Express Delivery',
};

/**
 * Shipping Method Fees (in VND)
 */
export const SHIPPING_METHOD_FEES: Record<SHIPPING_METHOD, number> = {
  [SHIPPING_METHOD.STANDARD]: 30000,
  [SHIPPING_METHOD.EXPRESS]: 50000,
};

/**
 * Shipping Method Estimated Days
 */
export const SHIPPING_METHOD_DAYS: Record<SHIPPING_METHOD, string> = {
  [SHIPPING_METHOD.STANDARD]: '3-5 business days',
  [SHIPPING_METHOD.EXPRESS]: '1-2 business days',
};
