import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../commons/schemas/product.schema';
import { ProductVariant } from '../commons/schemas/product-variant.schema';
import {
  CreateProductDto,
  UpdateProductDto,
} from '../commons/dtos/product.dto';
import { PRODUCT_CATEGORIES } from '@eyewear/shared';
import { CloudinaryService } from '../commons/services/cloudinary.service';
import { InventoryService } from './inventory.service';
import type {
  CreateProductInput,
  VariantInput,
} from '../commons/validations/product-validation.zod';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly inventoryService: InventoryService,
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
    data: Partial<CreateProductDto>,
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
    const validatedData = createProductDto as CreateProductInput;

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
    if (
      'variants' in validatedData &&
      validatedData.variants &&
      validatedData.variants.length > 0
    ) {
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
    if (
      imageUrls &&
      imageUrls.length > 0 &&
      'variants' in productData &&
      productData.variants
    ) {
      const imagesPerVariant = Math.ceil(
        imageUrls.length / productData.variants.length,
      );
      let imageIndex = 0;

      productData.variants.forEach((variant: VariantInput) => {
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

    // Deduplicate product-level images (images2D, images3D)
    if ('images2D' in productData && productData.images2D) {
      productData.images2D = this.deduplicateImageUrls(productData.images2D);
    }
    if ('images3D' in productData && productData.images3D) {
      productData.images3D = this.deduplicateImageUrls(productData.images3D);
    }

    // Deduplicate variant images
    if ('variants' in productData && productData.variants) {
      productData.variants.forEach((variant: VariantInput) => {
        if (variant.images2D) {
          variant.images2D = this.deduplicateImageUrls(variant.images2D);
        }
        if (variant.images3D) {
          variant.images3D = this.deduplicateImageUrls(variant.images3D);
        }
      });
    }

    const createdProduct = new this.productModel(productData);
    const savedProduct = await createdProduct.save();

    // Auto-create inventory entries for all variant SKUs
    if (savedProduct.variants && savedProduct.variants.length > 0) {
      const skus = savedProduct.variants.map((v) => v.sku);
      await this.inventoryService.ensureInventoryForSkus(skus);
    }

    // Auto-create inventory entry for lens products using SKU pattern LENS-{slug}
    if (
      savedProduct.category === PRODUCT_CATEGORIES.LENSES &&
      savedProduct.slug
    ) {
      const lensSku = `LENS-${savedProduct.slug}`;
      await this.inventoryService.ensureInventoryForSkus([lensSku]);
    }

    return savedProduct;
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

    const validatedData = updateProductDto as Partial<CreateProductInput>;

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
    if (
      'variants' in validatedData &&
      validatedData.variants &&
      validatedData.variants.length > 0
    ) {
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
    if (
      imageUrls &&
      imageUrls.length > 0 &&
      'variants' in validatedData &&
      validatedData.variants
    ) {
      const imagesPerVariant = Math.ceil(
        imageUrls.length / validatedData.variants.length,
      );
      let imageIndex = 0;

      validatedData.variants.forEach((variant: VariantInput) => {
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

    // Deduplicate product-level images (images2D, images3D)
    if ('images2D' in validatedData && validatedData.images2D) {
      validatedData.images2D = this.deduplicateImageUrls(
        validatedData.images2D,
      );
    }
    if ('images3D' in validatedData && validatedData.images3D) {
      validatedData.images3D = this.deduplicateImageUrls(
        validatedData.images3D,
      );
    }

    // Deduplicate variant images
    if ('variants' in validatedData && validatedData.variants) {
      validatedData.variants.forEach((variant: VariantInput) => {
        if (variant.images2D) {
          variant.images2D = this.deduplicateImageUrls(variant.images2D);
        }
        if (variant.images3D) {
          variant.images3D = this.deduplicateImageUrls(variant.images3D);
        }
      });
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, validatedData, { new: true })
      .select('-__v')
      .exec();

    // Auto-create inventory entries for all variant SKUs after update
    if (
      updatedProduct &&
      updatedProduct.variants &&
      updatedProduct.variants.length > 0
    ) {
      const skus = updatedProduct.variants.map((v) => v.sku);
      await this.inventoryService.ensureInventoryForSkus(skus);
    }

    // Handle lens product inventory
    if (
      updatedProduct &&
      updatedProduct.category === PRODUCT_CATEGORIES.LENSES
    ) {
      if (updatedProduct.slug) {
        const lensSku = `LENS-${updatedProduct.slug}`;
        await this.inventoryService.ensureInventoryForSkus([lensSku]);
      }
    }

    return updatedProduct;
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
    const query: Record<string, unknown> = { isDeleted: false };

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
      const priceRange: Record<string, unknown> = {};
      if (filters.minPrice !== undefined) priceRange.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) priceRange.$lte = filters.maxPrice;
      query.basePrice = priceRange;
    }

    return this.productModel.find(query).select('-__v').exec();
  }

  /**
   * Helper: Normalize and validate SKU
   */
  private normalizeSku(sku: string): string {
    return sku.trim().toUpperCase();
  }

  /**
   * Helper: Clean image URLs array
   */
  private cleanImageUrls(urls: string[]): string[] {
    if (!Array.isArray(urls)) return [];
    return urls
      .map((url) => url.trim())
      .filter(
        (url) =>
          url.length > 0 &&
          (url.startsWith('http://') || url.startsWith('https://')),
      );
  }

  /**
   * Helper: Deduplicate and clean image URLs array
   * Removes duplicates and invalid URLs
   */
  private deduplicateImageUrls(urls: string[] | undefined): string[] {
    if (!Array.isArray(urls)) return [];
    return Array.from(
      new Set(
        urls
          .map((url) => url.trim())
          .filter(
            (url) =>
              url.length > 0 &&
              (url.startsWith('http://') || url.startsWith('https://')),
          ),
      ),
    );
  }

  /**
   * Add variant to product
   */
  async addVariant(
    productId: string,
    variantData: import('../commons/dtos/product.dto').ProductVariantDto,
  ): Promise<Product | null> {
    const product = await this.productModel.findOne({
      _id: productId,
      isDeleted: false,
    });
    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    // Normalize SKU
    const normalizedSku = this.normalizeSku(variantData.sku);

    // Check if SKU already exists in this product
    if (product.variants?.some((v) => v.sku === normalizedSku)) {
      throw new ConflictException(
        `Variant with SKU ${normalizedSku} already exists in this product`,
      );
    }

    // Check SKU uniqueness across all products
    const existingSKUs = await this.checkSkuUniqueness([normalizedSku]);
    if (existingSKUs.has(normalizedSku)) {
      throw new ConflictException(
        `Variant with SKU ${normalizedSku} already exists in another product`,
      );
    }

    // Clean images if provided
    const cleanedVariant: ProductVariant = {
      sku: normalizedSku,
      size: variantData.size,
      color: variantData.color,
      price: variantData.price,
      weight: variantData.weight,
      images2D: variantData.images2D
        ? this.cleanImageUrls(variantData.images2D)
        : [],
      images3D: variantData.images3D
        ? this.cleanImageUrls(variantData.images3D)
        : [],
      isActive: variantData.isActive ?? true,
    };

    if (!product.variants) {
      product.variants = [];
    }

    product.variants.push(cleanedVariant);
    const savedProduct = await product.save();

    // Auto-create inventory entry for the new variant SKU
    await this.inventoryService.ensureInventoryForSkus([normalizedSku]);

    return savedProduct;
  }

  /**
   * Update variant in product
   */
  async updateVariant(
    productId: string,
    variantId: string,
    variantData: Partial<
      import('../commons/dtos/product.dto').ProductVariantDto
    >,
  ): Promise<Product | null> {
    const product = await this.productModel.findOne({
      _id: productId,
      isDeleted: false,
    });
    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    const variantIndex = product.variants?.findIndex(
      (v) => v.sku === variantId,
    );
    if (variantIndex === undefined || variantIndex === -1) {
      throw new NotFoundException(
        `Variant with SKU ${variantId} not found in product`,
      );
    }

    // If SKU is being updated, validate uniqueness
    if (variantData.sku && variantData.sku !== variantId) {
      const normalizedSku = this.normalizeSku(variantData.sku);

      // Check within same product
      if (
        product.variants?.some(
          (v, i) => i !== variantIndex && v.sku === normalizedSku,
        )
      ) {
        throw new ConflictException(
          `Variant with SKU ${normalizedSku} already exists in this product`,
        );
      }

      // Check across all products
      const existingSKUs = await this.checkSkuUniqueness([normalizedSku]);
      if (existingSKUs.has(normalizedSku)) {
        throw new ConflictException(
          `Variant with SKU ${normalizedSku} already exists in another product`,
        );
      }

      product.variants[variantIndex].sku = normalizedSku;
    }

    // Update other fields
    if (variantData.size !== undefined) {
      product.variants[variantIndex].size = variantData.size;
    }
    if (variantData.color !== undefined) {
      product.variants[variantIndex].color = variantData.color;
    }
    if (variantData.price !== undefined) {
      product.variants[variantIndex].price = variantData.price;
    }
    if (variantData.weight !== undefined) {
      product.variants[variantIndex].weight = variantData.weight;
    }
    if (variantData.isActive !== undefined) {
      product.variants[variantIndex].isActive = variantData.isActive;
    }
    if (variantData.images2D !== undefined) {
      product.variants[variantIndex].images2D = this.cleanImageUrls(
        variantData.images2D,
      );
    }
    if (variantData.images3D !== undefined) {
      product.variants[variantIndex].images3D = this.cleanImageUrls(
        variantData.images3D,
      );
    }

    return product.save();
  }

  /**
   * Remove variant from product
   */
  async removeVariant(
    productId: string,
    variantId: string,
  ): Promise<Product | null> {
    const product = await this.productModel.findOne({
      _id: productId,
      isDeleted: false,
    });
    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    const initialLength = product.variants?.length || 0;
    product.variants =
      product.variants?.filter((v) => v.sku !== variantId) || [];

    if (product.variants.length === initialLength) {
      throw new NotFoundException(
        `Variant with SKU ${variantId} not found in product`,
      );
    }

    return product.save();
  }

  /**
   * List products with filtering, sorting, and pagination (admin catalog view)
   * Used for the "All Products" page in the dashboard
   */
  async list(query: {
    search?: string;
    category?: PRODUCT_CATEGORIES;
    shape?: string;
    material?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    has3D?: 'true' | 'false';
    hasVariants?: 'true' | 'false';
    sortBy?: 'createdAt' | 'name' | 'price' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{
    items: Array<{
      id: string;
      name: string;
      category: PRODUCT_CATEGORIES;
      shape?: string;
      material?: string;
      isActive: boolean;
      defaultImage2DUrl?: string;
      has3D: boolean;
      variantCount: number;
      minPrice?: number;
      maxPrice?: number;
      createdAt: Date;
      updatedAt: Date;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      search,
      category,
      shape,
      material,
      status,
      has3D,
      hasVariants,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = query;

    // Build query filter
    const filter: Record<string, unknown> = { isDeleted: false };

    // Search: name, SKU (variants.sku), or category
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { 'variants.sku': searchRegex },
        { category: searchRegex },
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Shape filter (frames)
    if (shape) {
      filter.shape = new RegExp(shape, 'i');
    }

    // Material filter (frames)
    if (material) {
      filter.material = new RegExp(material, 'i');
    }

    // Status filter
    if (status === 'ACTIVE') {
      filter.isActive = true;
    } else if (status === 'INACTIVE') {
      filter.isActive = false;
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Get total count before pagination
    const total = await this.productModel.countDocuments(filter);

    // Build sort object
    const sortObj: Record<string, 1 | -1> = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Fetch products
    const products = await this.productModel
      .find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    // Process products into lightweight DTOs
    const items = products
      .map((product) => {
        const variantCount = product.variants?.length || 0;

        // Find default 2D image (from product or first variant)
        let defaultImage2DUrl: string | undefined;
        if (product.images2D && product.images2D.length > 0) {
          defaultImage2DUrl = product.images2D[0];
        } else if (product.variants && product.variants.length > 0) {
          const variantWithImage = product.variants.find(
            (v: ProductVariant) => v.images2D && v.images2D.length > 0,
          );
          if (
            variantWithImage?.images2D &&
            variantWithImage.images2D.length > 0
          ) {
            defaultImage2DUrl = variantWithImage.images2D[0];
          }
        }

        // Check if has 3D media
        const hasProduct3D = product.images3D && product.images3D.length > 0;
        const hasVariant3D = product.variants?.some(
          (v: ProductVariant) => v.images3D && v.images3D.length > 0,
        );
        const productHas3D = hasProduct3D || hasVariant3D;

        // Calculate min/max price from variants or basePrice
        let minPrice: number | undefined;
        let maxPrice: number | undefined;
        if (product.variants && product.variants.length > 0) {
          const prices = product.variants.map((v: ProductVariant) => v.price);
          minPrice = Math.min(...prices);
          maxPrice = Math.max(...prices);
        } else {
          minPrice = product.basePrice;
          maxPrice = product.basePrice;
        }

        return {
          id: product._id.toString(),
          name: product.name,
          slug: product.slug,
          category: product.category,
          shape: product.shape,
          material: product.material,
          isActive: product.isActive ?? true,
          defaultImage2DUrl,
          has3D: productHas3D,
          variantCount,
          minPrice,
          maxPrice,
          createdAt: product.createdAt!,
          updatedAt: product.updatedAt!,
        };
      })
      // Post-filter for has3D and hasVariants
      .filter((item) => {
        if (has3D === 'true' && !item.has3D) return false;
        if (has3D === 'false' && item.has3D) return false;
        if (hasVariants === 'true' && item.variantCount <= 1) return false;
        if (hasVariants === 'false' && item.variantCount > 1) return false;
        return true;
      });

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
