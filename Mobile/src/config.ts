// Import environment configuration
import { API_BASE_URL, APP_CONFIG, IS_DEV } from './utils/env'

// Re-export for convenience
export { API_BASE_URL, APP_CONFIG }
export { IS_DEV as __DEV__ }

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  VERIFY_EMAIL: '/auth/verify-email',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  RESEND_VERIFICATION: '/auth/resend-verification',

  // Products
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (id: string) => `/products/${id}`,
  PRODUCT_CATALOG: '/products/catalog',

  // Cart
  CART: '/cart',
  CART_ITEMS: '/cart/items',
  CART_ITEM: (itemId: string) => `/cart/items/${itemId}`,
  CART_CLEAR: '/cart',
  CART_COUNT: '/cart/count',
  CART_VALIDATE: '/cart/validate',
  CART_MERGE: '/cart/merge',

  // Orders
  ORDERS: '/orders',
  ORDER_DETAIL: (id: string) => `/orders/${id}`,
  ORDER_CANCEL: (id: string) => `/orders/${id}/cancel`,
  CHECKOUT_CREATE_PAYMENT: '/checkout/create-payment',

  // Returns
  RETURNS: '/returns',
  RETURN_REQUEST: '/returns/request',
  RETURN_DETAIL: (id: string) => `/returns/${id}`,
  ORDER_RETURNS: (orderId: string) => `/orders/${orderId}/returns`,

  // Prescriptions
  PRESCRIPTIONS: '/prescriptions',
  PRESCRIPTION_DETAIL: (id: string) => `/prescriptions/${id}`,

  // Wishlist
  WISHLIST: '/wishlist',
  WISHLIST_ADD: (productId: string) => `/wishlist/${productId}`,
  WISHLIST_REMOVE: (productId: string) => `/wishlist/${productId}`,

  // Reviews
  REVIEWS: '/reviews',
  REVIEWS_PRODUCT: (productId: string) => `/reviews/product/${productId}`,
  REVIEW_SUBMIT: '/reviews/submit',

  // Policies
  POLICIES: '/policies',
  POLICY_TYPE: (type: string) => `/policies/${type}`,

  // Promotions
  PROMOTIONS_VALIDATE: '/promotions/validate',
  PROMOTIONS_ACTIVE: '/promotions/active',

  // Inventory
  INVENTORY_CHECK: (sku: string) => `/inventory/${sku}`,
  INVENTORY_BULK_CHECK: '/inventory/check-availability',

  // Account/Profile
  ACCOUNT_PROFILE: '/account/profile',
  ACCOUNT_PREFERENCES: '/account/preferences',
  ACCOUNT_CHANGE_PASSWORD: '/account/change-password',
  ACCOUNT_DELETE: '/account',
  ACCOUNT_SETTINGS: '/account/settings',
}
