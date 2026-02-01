/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../commons/schemas/product.schema';
import {
  CreateProductDto,
  UpdateProductDto,
} from '../commons/dtos/product.dto';
import { PRODUCT_CATEGORIES } from '../commons/enums/product.enum';
import { CloudinaryService } from '../commons/services/cloudinary.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Create product from HTTP request with file upload handling
   * Handles image uploads and product creation
   */
  async createWithFiles(
    createProductDto: CreateProductDto,
    files?: Express.Multer.File[],
  ): Promise<Product> {
    // Upload images to Cloudinary if provided
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      try {
        imageUrls = await this.cloudinaryService.uploadMultipleFiles(
          files,
          'wdp/products',
        );
      } catch (uploadError) {
        throw new BadRequestException(
          `Image upload failed: ${
            uploadError instanceof Error ? uploadError.message : 'Unknown error'
          }`,
        );
      }
    }

    // Create product with uploaded images
    return this.create(createProductDto, imageUrls);
  }

  /**
   * Validate category-specific required fields
   */
  private validateCategorySpecificFields(
    data: any,
    category: PRODUCT_CATEGORIES,
  ): string[] {
    const errors: string[] = [];

    if (category === PRODUCT_CATEGORIES.FRAMES) {
      if (!data.frameType)
        errors.push('frameType is required for frame products');
      if (!data.shape) errors.push('shape is required for frame products');
      if (!data.material)
        errors.push('material is required for frame products');
      if (!data.variants || data.variants.length === 0) {
        errors.push('At least one variant is required for frame products');
      }
      if (data.variants && data.variants.length > 50) {
        errors.push('Maximum 50 variants allowed per product');
      }
    }

    if (category === PRODUCT_CATEGORIES.LENSES) {
      if (!data.lensType) errors.push('lensType is required for lens products');
      if (!data.index) errors.push('index is required for lens products');
      if (data.isPrescriptionRequired === undefined) {
        errors.push('isPrescriptionRequired is required for lens products');
      }
    }

    if (category === PRODUCT_CATEGORIES.SERVICES) {
      if (!data.serviceType)
        errors.push('serviceType is required for service products');
      if (!data.durationMinutes)
        errors.push('durationMinutes is required for service products');
    }

    return errors;
  }

  /**
   * Check SKU uniqueness across all products
   */
  private async checkSkuUniqueness(skus: string[]): Promise<Set<string>> {
    const existingVariants = await this.productModel.find(
      { 'variants.sku': { $in: skus } },
      { 'variants.sku': 1 },
    );

    const existingSKUs = new Set<string>();
    existingVariants.forEach((product) => {
      if (product.variants) {
        product.variants.forEach((variant) => {
          if (skus.includes(variant.sku)) {
            existingSKUs.add(variant.sku);
          }
        });
      }
    });

    return existingSKUs;
  }

  /**
   * Create a new product with full validation
   */
  async create(
    createProductDto: CreateProductDto,
    imageUrls?: string[],
  ): Promise<Product> {
    // Validate with DTO and category-specific fields
    const validatedData = createProductDto as any;

    // Validate category-specific fields
    const categoryErrors = this.validateCategorySpecificFields(
      validatedData,
      validatedData.category,
    );
    if (categoryErrors.length > 0) {
      throw new BadRequestException({
        message: 'Category validation failed',
        errors: categoryErrors,
      });
    }

    // Check SKU uniqueness if variants exist
    if (validatedData.variants && validatedData.variants.length > 0) {
      const skus = validatedData.variants.map((v) => v.sku);
      const duplicateSkus = new Set<string>();

      // Check for duplicates within the same product
      const skuSet = new Set<string>();
      skus.forEach((sku) => {
        if (skuSet.has(sku)) {
          duplicateSkus.add(sku);
        }
        skuSet.add(sku);
      });

      if (duplicateSkus.size > 0) {
        throw new BadRequestException(
          `Duplicate SKUs found: ${Array.from(duplicateSkus).join(', ')}`,
        );
      }

      // Check for existing SKUs in database
      const existingSKUs = await this.checkSkuUniqueness(skus);
      if (existingSKUs.size > 0) {
        throw new ConflictException(
          `SKUs already exist: ${Array.from(existingSKUs).join(', ')}`,
        );
      }
    }

    // Distribute images to variants if provided
    const productData = { ...validatedData };
    if (imageUrls && imageUrls.length > 0 && productData.variants) {
      const imagesPerVariant = Math.ceil(
        imageUrls.length / productData.variants.length,
      );
      let imageIndex = 0;

      productData.variants.forEach((variant: any) => {
        const variantImages = imageUrls.slice(
          imageIndex,
          imageIndex + imagesPerVariant,
        );
        if (variantImages.length > 0) {
          variant.images2D = variantImages;
          imageIndex += variantImages.length;
        }
      });
    }

    const createdProduct = new this.productModel(productData);
    return createdProduct.save();
  }

  /**
   * Find all active products
   */
  async findAll(): Promise<Product[]> {
    return this.productModel.find({ isDeleted: false }).select('-__v').exec();
  }

  /**
   * Find product by ID
   */
  async findOne(id: string): Promise<Product | null> {
    return this.productModel
      .findOne({ _id: id, isDeleted: false })
      .select('-__v')
      .exec();
  }

  /**
   * Find products by category
   */
  async findByCategory(category: PRODUCT_CATEGORIES): Promise<Product[]> {
    return this.productModel
      .find({ category, isDeleted: false, isActive: true })
      .select('-__v')
      .exec();
  }

  /**
   * Search products by tags
   */
  async findByTags(tags: string[]): Promise<Product[]> {
    return this.productModel
      .find({ tags: { $in: tags }, isDeleted: false, isActive: true })
      .select('-__v')
      .exec();
  }

  /**
   * Update product from HTTP request with file upload handling
   * Handles image uploads and product update
   */
  async updateWithFiles(
    id: string,
    updateProductDto: UpdateProductDto,
    files?: Express.Multer.File[],
  ): Promise<Product | null> {
    // Upload images to Cloudinary if provided
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      try {
        imageUrls = await this.cloudinaryService.uploadMultipleFiles(
          files,
          'wdp/products',
        );
      } catch (uploadError) {
        throw new BadRequestException(
          `Image upload failed: ${
            uploadError instanceof Error ? uploadError.message : 'Unknown error'
          }`,
        );
      }
    }

    // Update product with uploaded images
    return this.update(id, updateProductDto, imageUrls);
  }

  /**
   * Update a product with full validation
   */
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    imageUrls?: string[],
  ): Promise<Product | null> {
    const product = await this.productModel.findOne({ _id: id });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    const validatedData = updateProductDto as any;

    // If category is being updated, validate category-specific fields
    if (validatedData && Object.keys(validatedData).length > 0) {
      const categoryErrors = this.validateCategorySpecificFields(
        { ...product.toObject(), ...validatedData },
        product.category,
      );
      if (categoryErrors.length > 0) {
        throw new BadRequestException({
          message: 'Category validation failed',
          errors: categoryErrors,
        });
      }
    }

    // Check SKU uniqueness for new or updated variants
    if (validatedData.variants && validatedData.variants.length > 0) {
      const newSkus = validatedData.variants.map((v) => v.sku);
      const existingSkus = product.variants?.map((v) => v.sku) || [];

      // Only check new SKUs
      const skusToCheck = newSkus.filter((sku) => !existingSkus.includes(sku));

      if (skusToCheck.length > 0) {
        const existingSKUs = await this.checkSkuUniqueness(skusToCheck);
        if (existingSKUs.size > 0) {
          throw new ConflictException(
            `SKUs already exist: ${Array.from(existingSKUs).join(', ')}`,
          );
        }
      }
    }

    // Distribute images if provided
    if (imageUrls && imageUrls.length > 0 && validatedData.variants) {
      const imagesPerVariant = Math.ceil(
        imageUrls.length / validatedData.variants.length,
      );
      let imageIndex = 0;

      validatedData.variants.forEach((variant: any) => {
        const variantImages = imageUrls.slice(
          imageIndex,
          imageIndex + imagesPerVariant,
        );
        if (variantImages.length > 0) {
          variant.images2D = variantImages;
          imageIndex += variantImages.length;
        }
      });
    }

    return this.productModel
      .findByIdAndUpdate(id, validatedData, { new: true })
      .select('-__v')
      .exec();
  }

  /**
   * Soft delete product
   */
  async remove(id: string): Promise<Product | null> {
    return this.productModel
      .findByIdAndUpdate(id, { isDeleted: true }, { new: true })
      .select('-__v')
      .exec();
  }

  /**
   * Restore soft-deleted product
   */
  async restore(id: string): Promise<Product | null> {
    return this.productModel
      .findByIdAndUpdate(id, { isDeleted: false }, { new: true })
      .select('-__v')
      .exec();
  }

  /**
   * Get products with filters
   */
  async findWithFilters(filters: {
    category?: PRODUCT_CATEGORIES;
    shape?: string;
    material?: string;
    lensType?: string;
    serviceType?: string;
    minPrice?: number;
    maxPrice?: number;
    tags?: string[];
    isActive?: boolean;
  }): Promise<Product[]> {
    const query: any = { isDeleted: false };

    if (filters.category) query.category = filters.category;
    if (filters.shape) query.shape = filters.shape;
    if (filters.material) query.material = filters.material;
    if (filters.lensType) query.lensType = filters.lensType;
    if (filters.serviceType) query.serviceType = filters.serviceType;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.basePrice = {};
      if (filters.minPrice !== undefined)
        query.basePrice.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined)
        query.basePrice.$lte = filters.maxPrice;
    }

    return this.productModel.find(query).select('-__v').exec();
  }
}
