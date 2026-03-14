// Product Types

export type ProductCategory = 'all' | 'frame' | 'lens' | 'service'

export type ProductType = 'in-stock' | 'pre-order' | 'custom-order'

export type FrameShape = 'round' | 'square' | 'cat-eye' | 'aviator' | 'wayfarer' | 'browline'

export type FrameMaterial = 'acetate' | 'metal' | 'titanium' | 'plastic' | 'wood'

export type LensType = 'single-vision' | 'bifocal' | 'progressive'

export type LensIndex = '1.5' | '1.56' | '1.6' | '1.67' | '1.74'

export type LensCoating = 'anti-reflective' | 'anti-scratch' | 'anti-fog' | 'uv-protection' | 'blue-light'

export interface ProductFilter {
  category: ProductCategory
  minPrice: number
  maxPrice: number
  colors?: string[]
  sizes?: string[]
  shape?: FrameShape
  material?: FrameMaterial
  lensType?: LensType
  lensIndex?: LensIndex
}

export interface ProductImage {
  id: string
  url: string
  is3D?: boolean
  isPrimary?: boolean
}

export interface ProductVariant {
  id: string
  sku: string
  color: string
  size: string
  price: number
  stock: number
  isAvailable: boolean
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  category: ProductCategory
  type: ProductType
  basePrice: number
  discountPrice?: number
  images: ProductImage[]
  variants: ProductVariant[]
  rating: number
  reviewCount: number
  tags: string[]
  isActive: boolean

  // Frame specific
  shape?: FrameShape
  material?: FrameMaterial
  gender?: 'male' | 'female' | 'unisex'
  frameWidth?: number
  frameHeight?: number
  bridgeWidth?: number
  templeLength?: number

  // Lens specific
  lensType?: LensType
  lensIndex?: LensIndex
  coatings?: LensCoating[]
  brand?: string

  createdAt: string
  updatedAt: string
}

export interface ProductListResponse {
  products: Product[]
  total: number
  page: number
  pageSize: number
}
