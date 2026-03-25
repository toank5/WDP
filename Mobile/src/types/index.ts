// Common Types
export interface ApiResponse<T = any> {
  statusCode: number
  message: string
  data?: T
  metadata?: T
  errors?: Record<string, string> | Array<{ path: string; message: string }>
}

export interface ApiError {
  message: string
  errors?: Record<string, string> | Array<{ path: string; message: string }>
  statusCode: number
}

// Auth Types
export interface AuthUser {
  fullName: string
  email: string
  role: number
  avatar?: string
  addresses?: Address[]
  _id: string
}

export interface AuthPayload {
  accessToken: string
  user: AuthUser
}

// Address Types
export interface Address {
  _id?: string
  fullName: string
  phone: string
  address: string
  city?: string
  district?: string
  ward?: string
  isDefault?: boolean
}

// Product Types
export type ProductCategory = 'frame' | 'lens' | 'service'

export interface ProductVariant {
  sku: string
  size: string
  color: string
  price?: number
  weight?: number
  images2D?: string[]
  images3D?: string[]
  isActive?: boolean
  isPreorderEnabled?: boolean
  preorderExpectedShipStart?: string
  preorderExpectedShipEnd?: string
  preorderLimit?: number
  _id?: string
}

export interface Product {
  _id: string
  name: string
  slug: string
  category: ProductCategory
  description: string
  basePrice: number
  images2D: string[]
  images3D?: string[]
  tags: string[]
  variants?: ProductVariant[]
  isActive: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string

  // Frame-specific
  frameType?: 'full-rim' | 'half-rim' | 'rimless'
  shape?: 'round' | 'square' | 'oval' | 'cat-eye' | 'aviator'
  material?: 'metal' | 'plastic' | 'mixed'
  gender?: 'men' | 'women' | 'unisex'
  bridgeFit?: 'standard' | 'asian-fit'

  // Lens-specific
  lensType?: 'single-vision' | 'bifocal' | 'progressive' | 'photochromic'
  index?: number
  coatings?: string[]

  // Service-specific
  serviceType?: 'eye-test' | 'lens-cutting' | 'frame-adjustment' | 'cleaning'
  durationMinutes?: number
  serviceNotes?: string
}

// Cart Types
export interface CartItem {
  _id: string
  productId: string
  variantSku?: string
  productName?: string
  productImage?: string
  price: number
  quantity: number
  variantDetails?: {
    size?: string
    color?: string
  }
}

export interface CartResponse {
  items: CartItem[]
  totalItems: number
  subtotal: number
  tax?: number
  shipping?: number
  total?: number
}

// Order Types
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipping'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type OrderType = 'in-stock' | 'pre-order'

export interface Order {
  _id: string
  orderNumber: string
  userId: string
  items: OrderItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  status: OrderStatus
  type: OrderType
  shippingAddress: Address
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  productId: string
  variantSku?: string
  productName: string
  productImage: string
  price: number
  quantity: number
}

// Review Types
export interface Review {
  _id: string
  userId: string
  userName: string
  productId: string
  rating: number
  comment: string
  images?: string[]
  createdAt: string
  updatedAt: string
}

export interface ReviewStats {
  averageRating: number
  totalReviews: number
  ratingDistribution: Record<number, number>
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined
  Main: undefined
  ProductDetail: { slug: string; productId: string }
  Cart: undefined
  Checkout: undefined
  OrderDetail: { orderId: string }
  Account: undefined
}

export type MainTabParamList = {
  HomeTab: undefined
  Store: undefined
  Search: undefined
  Cart: undefined
  Account: undefined
}

export type AuthStackParamList = {
  Login: undefined
  Register: undefined
  ForgotPassword: undefined
  ResetPassword: { token: string }
}
