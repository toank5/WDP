export { useUserCart } from './useUserCart'
export type { CartItem, UseUserCartResult } from './useUserCart'

// Cart store hook (recommended for new code)
export { useCart } from '../store/cart.store'
export { migrateGuestCartToUserCart, saveUserCartToGuestCart } from '../store/cart.store'

// Favorites/Wishlist hook and API
export { useFavorites } from './useFavorites'
export type { UseFavoritesResult } from './useFavorites'
export { wishlistApi } from '../lib/wishlist-api'
export type { WishlistItem } from '../lib/wishlist-api'

export { useCameraPermission } from './useCameraPermission'
export type { UseCameraPermissionReturn } from './useCameraPermission'

export { useFaceTracking } from './useFaceTracking'
export type { UseFaceTrackingOptions, UseFaceTrackingReturn } from './useFaceTracking'
export { useFaceTrackingOptimized } from './useFaceTrackingOptimized'
export type { UseFaceTrackingOptimizedOptions, UseFaceTrackingOptimizedReturn } from './useFaceTrackingOptimized'
export { useFaceTrackingReal } from './useFaceTrackingReal'
export type { UseFaceTrackingRealOptions, UseFaceTrackingRealReturn } from './useFaceTrackingReal'

export { useSnapshotCapture } from './useSnapshotCapture'
export type { UseSnapshotCaptureOptions, UseSnapshotCaptureReturn } from './useSnapshotCapture'

// Dashboard hooks
export {
  useManagerDashboard,
  useSaleStaffDashboard,
  useOperationStaffDashboard,
  formatRevenue,
} from './useDashboardData'
export type {
  ManagerKPIs,
  SaleStaffKPIs,
  OperationStaffKPIs,
} from './useDashboardData'

// Return policy hook
export {
  useReturnPolicy,
  isItemReturnable,
  calculateEstimatedRefund,
  getDaysSinceDelivery,
  getProductReturnType,
} from './useReturnPolicy'
export type {
  ReturnPolicy,
  ReturnPolicyWithHelpers,
  ProductReturnType,
} from './useReturnPolicy'
