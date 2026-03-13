import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ObjectId } from 'mongoose';
import { Favorite } from '../commons/schemas/favorite.schema';
import {
  AddFavoriteDto,
  FavoriteItemDto,
  FavoritesListResponseDto,
  AddFavoriteResponseDto,
  RemoveFavoriteResponseDto,
  CheckFavoriteResponseDto,
  FavoriteProductSummaryDto,
} from '../commons/dtos/favorite.dto';

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
      .exec();

    const items: FavoriteItemDto[] = [];
    let activeCount = 0;

    for (const fav of favorites) {
      const product: any = fav.productId;
      const variant: any = fav.variantId;

      if (!product) {
        // Product was deleted, skip this favorite
        continue;
      }

      const productSummary = this.mapProductToSummary(product, variant);

      if (productSummary.isActive) {
        activeCount++;
      }

      items.push({
        id: fav._id.toString(),
        productId: fav.productId.toString(),
        variantId: fav.variantId?.toString(),
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
      .lean();

    if (!created) {
      return {
        success: true,
        message: 'Added to favorites',
      };
    }

    const product: any = created.productId;
    const variant: any = created.variantId;

    const item: FavoriteItemDto = {
      id: created._id.toString(),
      productId: created.productId.toString(),
      variantId: created.variantId?.toString(),
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
  async removeFavorite(favoriteId: string, userId: string): Promise<RemoveFavoriteResponseDto> {
    const favorite = await this.favoriteModel.findOne({
      _id: new Types.ObjectId(favoriteId) as any,
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
    const query: any = {
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
    };

    if (variantId) {
      query.variantId = new Types.ObjectId(variantId);
    } else if (variantId === undefined) {
      // No variant specified, remove any variant
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
    const query: any = {
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
    const checkResult = await this.checkFavorite(userId, dto.productId, dto.variantId);

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
  private mapProductToSummary(product: any, variant?: any): FavoriteProductSummaryDto {
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
    const variants = product.variants?.map((v: any) => ({
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
}
