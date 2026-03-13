// Colors (MUI Primary Colors from FE)
export const COLORS = {
  // Brand colors
  primary: '#1976d2',
  primaryDark: '#115293',
  primaryLight: '#63a4ff',
  secondary: '#9c27b0',
  secondaryDark: '#6a0080',
  secondaryLight: '#d05ce3',

  // Status colors
  success: '#4caf50',
  successDark: '#1b5e20',
  successLight: '#81c784',
  error: '#f44336',
  errorDark: '#b71c1c',
  errorLight: '#e57373',
  warning: '#ff9800',
  warningDark: '#e65100',
  warningLight: '#ffb74d',
  info: '#2196f3',
  infoDark: '#0d47a1',
  infoLight: '#64b5f6',

  // Neutral colors
  white: '#ffffff',
  black: '#000000',
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
}

// Color options for filtering (from FE)
export const COLOR_OPTIONS = [
  { name: 'Black', value: 'black', hex: '#000000' },
  { name: 'White', value: 'white', hex: '#FFFFFF' },
  { name: 'Red', value: 'red', hex: '#EF4444' },
  { name: 'Blue', value: 'blue', hex: '#3B82F6' },
  { name: 'Green', value: 'green', hex: '#10B981' },
  { name: 'Yellow', value: 'yellow', hex: '#F59E0B' },
  { name: 'Brown', value: 'brown', hex: '#8B5CF6' },
  { name: 'Gray', value: 'gray', hex: '#6B7280' },
  { name: 'Pink', value: 'pink', hex: '#EC4899' },
  { name: 'Silver', value: 'silver', hex: '#9CA3AF' },
]

// Size options for filtering (from FE)
export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '52', '54', '56', '58']

// Product categories
export const PRODUCT_CATEGORIES = [
  { label: 'Frames', value: 'frame' as const, icon: '👓' },
  { label: 'Lenses', value: 'lens' as const, icon: '🔍' },
  { label: 'Services', value: 'service' as const, icon: '🛠️' },
]

// Sort options
export const SORT_OPTIONS = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Newest', value: 'newest' },
]

// Order statuses
export const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ xử lý', color: COLORS.warning },
  processing: { label: 'Đang xử lý', color: COLORS.info },
  shipping: { label: 'Đang giao', color: COLORS.primary },
  delivered: { label: 'Đã giao', color: COLORS.success },
  cancelled: { label: 'Đã hủy', color: COLORS.error },
  refunded: { label: 'Đã hoàn tiền', color: COLORS.grey[600] },
}

// Frame types
export const FRAME_TYPES = [
  { label: 'Full Rim', value: 'full-rim' },
  { label: 'Half Rim', value: 'half-rim' },
  { label: 'Rimless', value: 'rimless' },
]

// Frame shapes
export const FRAME_SHAPES = [
  { label: 'Round', value: 'round' },
  { label: 'Square', value: 'square' },
  { label: 'Oval', value: 'oval' },
  { label: 'Cat Eye', value: 'cat-eye' },
  { label: 'Aviator', value: 'aviator' },
]

// Frame materials
export const FRAME_MATERIALS = [
  { label: 'Metal', value: 'metal' },
  { label: 'Plastic', value: 'plastic' },
  { label: 'Mixed', value: 'mixed' },
]

// Frame genders
export const FRAME_GENDERS = [
  { label: 'Men', value: 'men' },
  { label: 'Women', value: 'women' },
  { label: 'Unisex', value: 'unisex' },
]

// Lens types
export const LENS_TYPES = [
  { label: 'Single Vision', value: 'single-vision' },
  { label: 'Bifocal', value: 'bifocal' },
  { label: 'Progressive', value: 'progressive' },
  { label: 'Photochromic', value: 'photochromic' },
]

// Service types
export const SERVICE_TYPES = [
  { label: 'Eye Test', value: 'eye-test' },
  { label: 'Lens Cutting', value: 'lens-cutting' },
  { label: 'Frame Adjustment', value: 'frame-adjustment' },
  { label: 'Cleaning', value: 'cleaning' },
]

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  PRODUCTS_PER_PAGE: 12,
}

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@wdp_auth_token',
  USER_DATA: '@wdp_user_data',
  CART_DATA: '@wdp_cart_data',
  GUEST_CART: '@wdp_guest_cart',
  WISHLIST: '@wdp_wishlist',
}

// Validation regex
export const VALIDATION = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /(84|0[3|5|7|8|9])+([0-9]{8})\b/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/,
}

// Toast duration
export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 3000,
  LONG: 5000,
}

// Animation duration
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
}
