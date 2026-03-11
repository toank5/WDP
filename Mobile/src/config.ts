// API Configuration
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000' // Development backend URL
  : 'https://your-production-api.com' // Production backend URL

// App Configuration
export const APP_CONFIG = {
  name: 'WDP Glasses Shop',
  version: '1.0.0',
  currency: 'VND',
  locale: 'vi-VN',
}

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

  // Inventory
  INVENTORY_CHECK: (sku: string) => `/inventory/${sku}`,
  INVENTORY_BULK_CHECK: '/inventory/check-availability',
}
