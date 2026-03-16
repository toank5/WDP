import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Favorite } from '../commons/schemas/favorite.schema';
import { Product } from '../commons/schemas/product.schema';
import { ProductVariant } from '../commons/schemas/product-variant.schema';
import {
  AddFavoriteDto,
  FavoriteItemDto,
  FavoritesListResponseDto,
  AddFavoriteResponseDto,
  RemoveFavoriteResponseDto,
  CheckFavoriteResponseDto,
  FavoriteProductSummaryDto,
} from '../commons/dtos/favorite.dto';

type FavoriteVariantSummary = Pick<
  ProductVariant,
  'sku' | 'color' | 'size' | 'price'
>;

type PopulatedFavoriteProduct = Pick<
  Product,
  '_id' | 'name' | 'category' | 'slug' | 'basePrice' | 'images2D' | 'images3D' | 'isActive' | 'variants'
>;

type PopulatedFavoriteVariant = Pick<
  ProductVariant,
  'sku' | 'color' | 'size' | 'price'
> & {
  _id?: Types.ObjectId | string;
};

type FavoriteQuery = {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  variantId?: Types.ObjectId | { $exists: boolean };
};

type FavoriteLeanDocument = Favorite & {
  _id: Types.ObjectId | string;
  productId: Types.ObjectId | string | PopulatedFavoriteProduct;
  variantId?: Types.ObjectId | string | PopulatedFavoriteVariant;
  createdAt?: Date;
};

@Injectable()
export class FavoriteService {
  constructor(
    @InjectModel(Favorite.name) private favoriteModel: Model<Favorite>,
  ) {}

  /**
   * Get all favorites for a user with populated product details
   */
  async getUserFavorites(userId: string): Promise<FavoritesListResponseDto> {
    const favorites = await this.favoriteModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate('productId')
      .populate('variantId')
      .lean()
      .exec() as FavoriteLeanDocument[];

    const items: FavoriteItemDto[] = [];
    let activeCount = 0;

    for (const fav of favorites) {
      const product = this.asPopulatedProduct(fav.productId);
      const variant = this.asPopulatedVariant(fav.variantId);

      if (!product) {
        // Product was deleted, skip this favorite
        continue;
      }

      const productSummary = this.mapProductToSummary(product, variant);

      if (productSummary.isActive) {
        activeCount++;
      }

      items.push({
        id: this.toIdString(fav._id),
        productId: this.toIdString(product._id),
        variantId: variant?._id ? this.toIdString(variant._id) : undefined,
        variantSku: fav.variantSku,
        addedAt: (fav.createdAt || new Date()).toISOString(),
        product: productSummary,
      });
    }

    return {
      items,
      total: items.length,
      activeCount,
    };
  }

  /**
   * Add a product to user's favorites
   */
  async addFavorite(
    userId: string,
    dto: AddFavoriteDto,
  ): Promise<AddFavoriteResponseDto> {
    const { productId, variantId, variantSku } = dto;

    // Check if already exists
    const existing = await this.favoriteModel.findOne({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
    });

    if (existing) {
      // Already in favorites, return success
      return {
        success: true,
        message: 'Product already in favorites',
      };
    }

    // Create new favorite
    const favorite = new this.favoriteModel({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
      variantId: variantId ? new Types.ObjectId(variantId) : undefined,
      variantSku,
    });

    await favorite.save();

    // Fetch the created favorite with populated data
    const created = await this.favoriteModel
      .findById(favorite._id)
      .populate('productId')
      .populate('variantId')
      .lean() as FavoriteLeanDocument | null;

    if (!created) {
      return {
        success: true,
        message: 'Added to favorites',
      };
    }

    const product = this.asPopulatedProduct(created.productId);
    const variant = this.asPopulatedVariant(created.variantId);

    if (!product) {
      return {
        success: true,
        message: 'Added to favorites',
      };
    }

    const item: FavoriteItemDto = {
      id: this.toIdString(created._id),
      productId: this.toIdString(product._id),
      variantId: variant?._id ? this.toIdString(variant._id) : undefined,
      variantSku: created.variantSku,
      addedAt: (created.createdAt || new Date()).toISOString(),
      product: this.mapProductToSummary(product, variant),
    };

    return {
      success: true,
      message: 'Added to favorites',
      item,
    };
  }

  /**
   * Remove a favorite by ID
   */
  async removeFavorite(
    favoriteId: string,
    userId: string,
  ): Promise<RemoveFavoriteResponseDto> {
    const favorite = await this.favoriteModel.findOne({
      _id: new Types.ObjectId(favoriteId),
      userId: new Types.ObjectId(userId),
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoriteModel.deleteOne({ _id: favorite._id });

    return {
      success: true,
      message: 'Removed from favorites',
    };
  }

  /**
   * Remove a favorite by product ID (convenience method)
   */
  async removeFavoriteByProduct(
    productId: string,
    userId: string,
    variantId?: string,
  ): Promise<RemoveFavoriteResponseDto> {
    const query: FavoriteQuery = {
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
    };

    if (variantId) {
      query.variantId = new Types.ObjectId(variantId);
    } else if (variantId === undefined) {
      // No variant specified, remove records without a variant
      query.variantId = { $exists: false };
    }

    const favorite = await this.favoriteModel.findOne(query);

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoriteModel.deleteOne({ _id: favorite._id });

    return {
      success: true,
      message: 'Removed from favorites',
    };
  }

  /**
   * Check if a product is in user's favorites
   */
  async checkFavorite(
    userId: string,
    productId: string,
    variantId?: string,
  ): Promise<CheckFavoriteResponseDto> {
    const query: FavoriteQuery = {
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
    };

    if (variantId) {
      query.variantId = new Types.ObjectId(variantId);
    }

    const favorite = await this.favoriteModel.findOne(query).lean();

    return {
      isFavorited: !!favorite,
      favoriteId: favorite?._id.toString(),
    };
  }

  /**
   * Get favorites count for a user
   */
  async getFavoritesCount(userId: string): Promise<number> {
    const count = await this.favoriteModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });

    return count;
  }

  /**
   * Toggle a product in favorites
   */
  async toggleFavorite(
    userId: string,
    dto: AddFavoriteDto,
  ): Promise<{ success: boolean; message: string; isFavorited: boolean }> {
    const checkResult = await this.checkFavorite(
      userId,
      dto.productId,
      dto.variantId,
    );

    if (checkResult.isFavorited) {
      // Remove from favorites
      await this.removeFavoriteByProduct(dto.productId, userId, dto.variantId);
      return {
        success: true,
        message: 'Removed from favorites',
        isFavorited: false,
      };
    } else {
      // Add to favorites
      await this.addFavorite(userId, dto);
      return {
        success: true,
        message: 'Added to favorites',
        isFavorited: true,
      };
    }
  }

  /**
   * Map product document to summary DTO
   */
  private mapProductToSummary(
    product: PopulatedFavoriteProduct,
    variant?: PopulatedFavoriteVariant,
  ): FavoriteProductSummaryDto {
    // Get image URL
    let imageUrl = '';
    if (product.images2D && product.images2D.length > 0) {
      imageUrl = product.images2D[0];
    }

    // Get price
    let price = product.basePrice || 0;
    if (variant && variant.price) {
      price = variant.price;
    }

    // Get variants summary if available
    const variants = product.variants?.map((v: FavoriteVariantSummary) => ({
      sku: v.sku,
      color: v.color,
      size: v.size,
      price: v.price || product.basePrice,
    }));

    return {
      id: product._id.toString(),
      name: product.name,
      category: product.category,
      slug: product.slug,
      price,
      imageUrl,
      tag: product.category,
      has3D: !!(product.images3D && product.images3D.length > 0),
      isActive: product.isActive ?? true,
      variants,
    };
  }

  private asPopulatedProduct(
    product: FavoriteLeanDocument['productId'],
  ): PopulatedFavoriteProduct | null {
    if (!product || product instanceof Types.ObjectId || typeof product === 'string') {
      return null;
    }

    return product;
  }

  private asPopulatedVariant(
    variant: FavoriteLeanDocument['variantId'],
  ): PopulatedFavoriteVariant | undefined {
    if (!variant || variant instanceof Types.ObjectId || typeof variant === 'string') {
      return undefined;
    }

    return variant;
  }

  private toIdString(value: Types.ObjectId | string): string {
    return typeof value === 'string' ? value : value.toString();
  }
}
