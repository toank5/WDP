import {
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  Min,
  Max,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PRODUCT_CATEGORIES,
  FRAME_TYPE,
  FRAME_SHAPE,
  FRAME_MATERIAL,
  FRAME_GENDER,
  BRIDGE_FIT,
  LENS_TYPE,
  SERVICE_TYPE,
} from '../../shared';
import {
  CategoryRequiredFields,
  Images2DNotEmpty,
  Valid3DUrls,
  UniqueSkusInArray,
} from '../validators/category-validator';

export class ProductVariantDto {
  @ApiProperty({
    description: 'Unique stock keeping unit for the variant',
    example: 'FR-ROUND-52-BLK',
  })
  @IsString()
  @MinLength(3)
  sku: string;

  @ApiProperty({
    description: 'Size of the variant (e.g., frame size, lens diameter)',
    example: '52',
  })
  @IsString()
  size: string;

  @ApiProperty({
    description: 'Color name for the variant',
    example: 'Black',
  })
  @IsString()
  color: string;

  @ApiProperty({
    description:
      'Price override for this variant (if different from base price)',
    example: 219.99,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Weight of the variant in grams',
    example: 25,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({
    description: 'Array of 2D image URLs for this variant',
    type: [String],
    example: ['https://cdn.example.com/variant1.jpg'],
  })
  @IsOptional()
  @IsArray()
  images2D?: string[];

  @ApiPropertyOptional({
    description: 'Array of 3D model URLs for this variant',
    type: [String],
    example: ['https://cdn.example.com/variant1.glb'],
  })
  @IsOptional()
  @IsArray()
  images3D?: string[];

  @ApiPropertyOptional({
    description: 'Whether this variant is active for purchase',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// Frame Product DTO
export class CreateFrameProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Designer Round Eyeglasses',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Detailed product description',
    example: 'Premium round-shaped designer frames with acetate finish',
    maxLength: 2000,
  })
  @IsString()
  @MaxLength(2000)
  description: string;

  @ApiProperty({
    description: 'Base price of the product',
    example: 199.99,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({
    description: 'Array of 2D image URLs',
    type: [String],
    example: [
      'https://cdn.example.com/frame1.jpg',
      'https://cdn.example.com/frame2.jpg',
    ],
  })
  @IsArray()
  images2D: string[];

  @ApiPropertyOptional({
    description: 'Array of 3D model URLs',
    type: [String],
    example: ['https://cdn.example.com/frame1.glb'],
  })
  @IsOptional()
  @IsArray()
  images3D?: string[];

  @ApiPropertyOptional({
    description: 'Product tags for categorization',
    type: [String],
    example: ['premium', 'designer', 'acetate'],
  })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({
    description: 'Frame type',
    enum: FRAME_TYPE,
    example: FRAME_TYPE.FULL_RIM,
  })
  @IsEnum(FRAME_TYPE)
  frameType: FRAME_TYPE;

  @ApiProperty({
    description: 'Frame shape',
    enum: FRAME_SHAPE,
    example: FRAME_SHAPE.ROUND,
  })
  @IsEnum(FRAME_SHAPE)
  shape: FRAME_SHAPE;

  @ApiProperty({
    description: 'Frame material',
    enum: FRAME_MATERIAL,
    example: FRAME_MATERIAL.ACETATE,
  })
  @IsEnum(FRAME_MATERIAL)
  material: FRAME_MATERIAL;

  @ApiPropertyOptional({
    description: 'Target gender',
    enum: FRAME_GENDER,
    example: FRAME_GENDER.UNISEX,
  })
  @IsOptional()
  @IsEnum(FRAME_GENDER)
  gender?: FRAME_GENDER;

  @ApiPropertyOptional({
    description: 'Bridge fit type',
    enum: BRIDGE_FIT,
    example: BRIDGE_FIT.STANDARD,
  })
  @IsOptional()
  @IsEnum(BRIDGE_FIT)
  bridgeFit?: BRIDGE_FIT;

  @ApiProperty({
    description: 'Product variants with different sizes, colors, and SKUs',
    type: [ProductVariantDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants: ProductVariantDto[];
}

// Lens Product DTO
export class CreateLensProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'High-Index Single Vision Lenses',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Detailed product description',
    example: 'Thin and lightweight high-index lenses for strong prescriptions',
    maxLength: 2000,
  })
  @IsString()
  @MaxLength(2000)
  description: string;

  @ApiProperty({
    description: 'Base price of the product',
    example: 89.99,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({
    description: 'Array of 2D image URLs',
    type: [String],
    example: ['https://cdn.example.com/lens1.jpg'],
  })
  @IsArray()
  images2D: string[];

  @ApiPropertyOptional({
    description: 'Array of 3D model URLs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  images3D?: string[];

  @ApiPropertyOptional({
    description: 'Product tags for categorization',
    type: [String],
    example: ['high-index', 'uv-protection', 'scratch-resistant'],
  })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({
    description: 'Lens type',
    enum: LENS_TYPE,
    example: LENS_TYPE.SINGLE_VISION,
  })
  @IsEnum(LENS_TYPE)
  lensType: LENS_TYPE;

  @ApiProperty({
    description: 'Refractive index of the lens',
    example: 1.67,
    minimum: 1.5,
  })
  @IsNumber()
  @Min(1.5)
  index: number;

  @ApiPropertyOptional({
    description: 'Available lens coatings',
    type: [String],
    example: ['UV Protection', 'Anti-Reflective', 'Scratch Resistant'],
  })
  @IsOptional()
  @IsArray()
  coatings?: string[];
}

// Service Product DTO
export class CreateServiceProductDto {
  @ApiProperty({
    description: 'Service name',
    example: 'Eye Examination',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Detailed service description',
    example: 'Comprehensive eye examination by certified optometrist',
    maxLength: 2000,
  })
  @IsString()
  @MaxLength(2000)
  description: string;

  @ApiProperty({
    description: 'Base price of the service',
    example: 75.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({
    description: 'Array of 2D image URLs',
    type: [String],
    example: ['https://cdn.example.com/service1.jpg'],
  })
  @IsArray()
  images2D: string[];

  @ApiPropertyOptional({
    description: 'Array of 3D model URLs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  images3D?: string[];

  @ApiPropertyOptional({
    description: 'Service tags for categorization',
    type: [String],
    example: ['eye-exam', 'optometrist', 'vision-test'],
  })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({
    description: 'Service type',
    enum: SERVICE_TYPE,
    example: SERVICE_TYPE.LENS_REPLACEMENT,
  })
  @IsEnum(SERVICE_TYPE)
  serviceType: SERVICE_TYPE;

  @ApiProperty({
    description: 'Duration of the service in minutes',
    example: 30,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  durationMinutes: number;

  @ApiPropertyOptional({
    description: 'Additional notes about the service',
    example: 'Please arrive 10 minutes early for paperwork',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  serviceNotes?: string;
}

/**
 * Query DTO for listing products with filters and pagination
 */
export class ListProductsQueryDto {
  @ApiPropertyOptional({
    description: 'Search by name, SKU, or variant SKU',
    example: 'designer',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by category',
    enum: PRODUCT_CATEGORIES,
  })
  @IsOptional()
  @IsEnum(PRODUCT_CATEGORIES)
  category?: PRODUCT_CATEGORIES;

  @ApiPropertyOptional({
    description: 'Filter by shape (frames only)',
    example: 'ROUND',
  })
  @IsOptional()
  @IsString()
  shape?: string;

  @ApiPropertyOptional({
    description: 'Filter by material (frames only)',
    example: 'ACETATE',
  })
  @IsOptional()
  @IsString()
  material?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: 'true',
  })
  @IsOptional()
  @IsString()
  status?: 'ACTIVE' | 'INACTIVE';

  @ApiPropertyOptional({
    description: 'Filter products that have 3D media',
    example: 'true',
  })
  @IsOptional()
  @IsString()
  has3D?: 'true' | 'false';

  @ApiPropertyOptional({
    description: 'Filter products that have multiple variants',
    example: 'true',
  })
  @IsOptional()
  @IsString()
  hasVariants?: 'true' | 'false';

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['createdAt', 'name', 'price', 'updatedAt'],
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'name' | 'price' | 'updatedAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

/**
 * Lightweight product item for list views
 */
export class ProductListItemDto {
  @ApiProperty({
    description: 'Product ID',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Designer Round Eyeglasses',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Product slug for URL-friendly identifier',
    example: 'designer-round-eyeglasses',
  })
  slug?: string;

  @ApiProperty({
    description: 'Product category',
    enum: PRODUCT_CATEGORIES,
    example: PRODUCT_CATEGORIES.FRAMES,
  })
  category: PRODUCT_CATEGORIES;

  @ApiPropertyOptional({
    description: 'Frame shape (if applicable)',
    example: 'ROUND',
  })
  shape?: string;

  @ApiPropertyOptional({
    description: 'Frame material (if applicable)',
    example: 'ACETATE',
  })
  material?: string;

  @ApiProperty({
    description: 'Product active status',
    example: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Default 2D image URL',
    example: 'https://cdn.example.com/product.jpg',
  })
  defaultImage2DUrl?: string;

  @ApiProperty({
    description: 'Whether product has 3D media',
    example: true,
  })
  has3D: boolean;

  @ApiProperty({
    description: 'Number of variants',
    example: 5,
  })
  variantCount: number;

  @ApiPropertyOptional({
    description: 'Minimum price across variants',
    example: 199.99,
  })
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price across variants',
    example: 299.99,
  })
  maxPrice?: number;

  @ApiProperty({
    description: 'Creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2024-01-15T00:00:00.000Z',
  })
  updatedAt: Date;
}

/**
 * Paginated product list response
 */
export class ProductListResponseDto {
  @ApiProperty({
    description: 'List of products',
    type: [ProductListItemDto],
  })
  items: ProductListItemDto[];

  @ApiProperty({
    description: 'Total number of items',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
  })
  totalPages: number;
}

// Generic create product DTO that accepts any type
export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Designer Round Eyeglasses',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Product category',
    enum: PRODUCT_CATEGORIES,
    example: PRODUCT_CATEGORIES.FRAMES,
  })
  @IsEnum(PRODUCT_CATEGORIES)
  category: PRODUCT_CATEGORIES;

  @CategoryRequiredFields({
    message: 'Missing required fields for the specified category',
  })
  @ApiProperty({
    description: 'Detailed product description',
    example: 'Premium round-shaped designer frames with acetate finish',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @ApiProperty({
    description: 'Base price of the product',
    example: 199.99,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({
    description: 'Array of 2D image URLs (at least one required)',
    type: [String],
    example: ['https://cdn.example.com/product1.jpg'],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one 2D image is required' })
  @Images2DNotEmpty({ message: 'images2D must contain valid URLs' })
  images2D: string[];

  @ApiPropertyOptional({
    description: 'Array of 3D model URLs',
    type: [String],
    example: ['https://cdn.example.com/product1.glb'],
  })
  @IsOptional()
  @IsArray()
  @Valid3DUrls({ message: 'images3D must contain valid URLs' })
  images3D?: string[];

  @ApiPropertyOptional({
    description: 'Product tags for categorization',
    type: [String],
    example: ['premium', 'designer'],
  })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Whether the product is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether pre-order is enabled for this product',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPreorderEnabled?: boolean;

  // Frame-specific
  @ApiPropertyOptional({
    description: 'Frame type (for frame products)',
    enum: FRAME_TYPE,
    example: FRAME_TYPE.FULL_RIM,
  })
  @IsOptional()
  @IsEnum(FRAME_TYPE)
  frameType?: FRAME_TYPE;

  @ApiPropertyOptional({
    description: 'Frame shape (for frame products)',
    enum: FRAME_SHAPE,
    example: FRAME_SHAPE.ROUND,
  })
  @IsOptional()
  @IsEnum(FRAME_SHAPE)
  shape?: FRAME_SHAPE;

  @ApiPropertyOptional({
    description: 'Frame material (for frame products)',
    enum: FRAME_MATERIAL,
    example: FRAME_MATERIAL.ACETATE,
  })
  @IsOptional()
  @IsEnum(FRAME_MATERIAL)
  material?: FRAME_MATERIAL;

  @ApiPropertyOptional({
    description: 'Target gender (for frame products)',
    enum: FRAME_GENDER,
    example: FRAME_GENDER.UNISEX,
  })
  @IsOptional()
  @IsEnum(FRAME_GENDER)
  gender?: FRAME_GENDER;

  @ApiPropertyOptional({
    description: 'Bridge fit type (for frame products)',
    enum: BRIDGE_FIT,
    example: BRIDGE_FIT.STANDARD,
  })
  @IsOptional()
  @IsEnum(BRIDGE_FIT)
  bridgeFit?: BRIDGE_FIT;

  // Lens-specific
  @ApiPropertyOptional({
    description: 'Lens type (for lens products)',
    enum: LENS_TYPE,
    example: LENS_TYPE.SINGLE_VISION,
  })
  @IsOptional()
  @IsEnum(LENS_TYPE)
  lensType?: LENS_TYPE;

  @ApiPropertyOptional({
    description: 'Refractive index (for lens products)',
    example: 1.67,
    minimum: 1.5,
    maximum: 2.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(1.5, { message: 'Lens index must be at least 1.5' })
  @Max(2.0, { message: 'Lens index must not exceed 2.0' })
  index?: number;

  @ApiPropertyOptional({
    description: 'Available lens coatings (for lens products)',
    type: [String],
    example: ['UV Protection', 'Anti-Reflective'],
  })
  @IsOptional()
  @IsArray()
  coatings?: string[];

  // Service-specific
  @ApiPropertyOptional({
    description: 'Service type (for service products)',
    enum: SERVICE_TYPE,
    example: SERVICE_TYPE.LENS_REPLACEMENT,
  })
  @IsOptional()
  @IsEnum(SERVICE_TYPE)
  serviceType?: SERVICE_TYPE;

  @ApiPropertyOptional({
    description: 'Duration in minutes (for service products)',
    example: 30,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Duration must be at least 1 minute' })
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Additional service notes (for service products)',
    example: 'Please arrive 10 minutes early',
  })
  @IsOptional()
  @IsString()
  serviceNotes?: string;

  // Variants
  @ApiPropertyOptional({
    description: 'Product variants with different SKUs',
    type: [ProductVariantDto],
  })
  @IsOptional()
  @IsArray()
  @UniqueSkusInArray({ message: 'All variant SKUs must be unique' })
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
}

export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'Product name',
    example: 'Updated Product Name',
    minLength: 3,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    description: 'Product category',
    enum: PRODUCT_CATEGORIES,
    example: PRODUCT_CATEGORIES.FRAMES,
  })
  @IsOptional()
  @IsEnum(PRODUCT_CATEGORIES)
  category?: PRODUCT_CATEGORIES;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Updated product description',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Base price',
    example: 249.99,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({
    description: 'Array of 2D image URLs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  images2D?: string[];

  @ApiPropertyOptional({
    description: 'Array of 3D model URLs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  images3D?: string[];

  @ApiPropertyOptional({
    description: 'Product tags',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Product variants',
    type: [ProductVariantDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];

  @ApiPropertyOptional({
    description: 'Whether the product is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether pre-order is enabled for this product',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPreorderEnabled?: boolean;

  // All optional category-specific fields for updates
  @ApiPropertyOptional({
    description: 'Frame type',
    enum: FRAME_TYPE,
  })
  @IsOptional()
  @IsEnum(FRAME_TYPE)
  frameType?: FRAME_TYPE;

  @ApiPropertyOptional({
    description: 'Frame shape',
    enum: FRAME_SHAPE,
  })
  @IsOptional()
  @IsEnum(FRAME_SHAPE)
  shape?: FRAME_SHAPE;

  @ApiPropertyOptional({
    description: 'Frame material',
    enum: FRAME_MATERIAL,
  })
  @IsOptional()
  @IsEnum(FRAME_MATERIAL)
  material?: FRAME_MATERIAL;

  @ApiPropertyOptional({
    description: 'Target gender',
    enum: FRAME_GENDER,
  })
  @IsOptional()
  @IsEnum(FRAME_GENDER)
  gender?: FRAME_GENDER;

  @ApiPropertyOptional({
    description: 'Bridge fit',
    enum: BRIDGE_FIT,
  })
  @IsOptional()
  @IsEnum(BRIDGE_FIT)
  bridgeFit?: BRIDGE_FIT;

  @ApiPropertyOptional({
    description: 'Lens type',
    enum: LENS_TYPE,
  })
  @IsOptional()
  @IsEnum(LENS_TYPE)
  lensType?: LENS_TYPE;

  @ApiPropertyOptional({
    description: 'Lens index',
    example: 1.67,
  })
  @IsOptional()
  @IsNumber()
  index?: number;

  @ApiPropertyOptional({
    description: 'Lens coatings',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  coatings?: string[];

  @ApiPropertyOptional({
    description: 'Service type',
    enum: SERVICE_TYPE,
  })
  @IsOptional()
  @IsEnum(SERVICE_TYPE)
  serviceType?: SERVICE_TYPE;

  @ApiPropertyOptional({
    description: 'Duration in minutes',
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Service notes',
    example: 'Additional notes',
  })
  @IsOptional()
  @IsString()
  serviceNotes?: string;
}
