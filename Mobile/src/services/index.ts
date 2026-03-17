// Services exports

// Core API client
export {
  api,
  API_ENDPOINTS,
  get,
  post,
  put,
  patch,
  del,
  handleApiError,
  extractApiMessage,
} from './api'

// Auth API
export {
  login,
  register,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerification,
} from './auth-api'

// Product API
export {
  getAllProducts,
  getProductById,
  getProductsCatalog,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  type ProductCatalogParams,
  type ProductCatalogResponse,
  type CreateProductPayload,
} from './product-api'

// Cart API
export {
  getCart,
  addToCart,
  bulkAddCartItems,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount,
  validateCart,
  mergeCart,
} from './cart-api'

// Order API
export {
  getOrders,
  getOrderById,
  createOrder,
  cancelOrder,
  type CreateOrderPayload,
} from './order-api'

// Review API
export {
  getProductReviews,
  getProductReviewStats,
  createReview,
  updateReview,
  deleteReview,
  type CreateReviewPayload,
} from './review-api'

// Wishlist API
export { getWishlist, addToWishlist, removeFromWishlist } from './wishlist-api'
