// Colors (Matching FE Web UI Design)
export const COLORS = {
  // Brand colors (from FE theme.ts)
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#3b82f6',
  primaryContainer: '#eff6ff',
  secondary: '#8b5cf6',
  secondaryDark: '#7c3aed',
  secondaryLight: '#a78bfa',
  secondaryContainer: '#f3e8ff',

  // Status colors (from FE theme.ts)
  success: '#10b981',
  successDark: '#059669',
  successLight: '#34d399',
  successContainer: '#f0fdf4',
  error: '#ef4444',
  errorDark: '#dc2626',
  errorLight: '#f87171',
  errorContainer: '#fef2f2',
  warning: '#f59e0b',
  warningDark: '#d97706',
  warningLight: '#fbbf24',
  warningContainer: '#fffbeb',
  info: '#0ea5e9',
  infoDark: '#0284c7',
  infoLight: '#38bdf8',
  infoContainer: '#f0f9ff',

  // Neutral colors (from FE theme.ts)
  white: '#ffffff',
  black: '#000000',
  background: '#f8fafc',
  paper: '#ffffff',
  grey: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  // Text colors (from FE theme.ts)
  text: {
    primary: '#0f172a',
    secondary: '#64748b',
    disabled: '#94a3b8',
  },
  // Border colors (from FE theme.ts)
  border: '#e2e8f0',
  divider: '#e2e8f0',
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
  pending: { label: 'Pending', color: COLORS.warning },
  processing: { label: 'Processing', color: COLORS.info },
  shipping: { label: 'Shipping', color: COLORS.primary },
  delivered: { label: 'Delivered', color: COLORS.success },
  cancelled: { label: 'Cancelled', color: COLORS.error },
  refunded: { label: 'Refunded', color: COLORS.grey[600] },
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
