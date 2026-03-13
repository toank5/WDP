import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Promotion, PromotionStatus, PromotionType } from '../commons/schemas/promotion.schema';
import {
  CreatePromotionDto,
  UpdatePromotionDto,
  ListPromotionsQueryDto,
} from '../commons/dtos/promotion.dto';

@Injectable()
export class PromotionService {
  constructor(
    @InjectModel(Promotion.name) private promotionModel: Model<Promotion>,
  ) {}

  /**
   * Create a new promotion
   */
  async create(createDto: CreatePromotionDto): Promise<Promotion> {
    // Check if code already exists
    const existing = await this.promotionModel.findOne({
      code: createDto.code.toUpperCase(),
    });

    if (existing) {
      throw new ConflictException(
        `Promotion with code "${createDto.code}" already exists`,
      );
    }

    // Validate dates
    const startDate = new Date(createDto.startDate);
    const endDate = new Date(createDto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Determine initial status based on dates
    let status = createDto.status || PromotionStatus.ACTIVE;
    if (status !== PromotionStatus.INACTIVE) {
      const now = new Date();
      if (now < startDate) {
        status = PromotionStatus.SCHEDULED;
      } else if (now > endDate) {
        status = PromotionStatus.EXPIRED;
      } else {
        status = PromotionStatus.ACTIVE;
      }
    }

    const promotion = new this.promotionModel({
      ...createDto,
      code: createDto.code.toUpperCase(),
      status,
      usageCount: 0,
    });

    const savedPromotion = await promotion.save();
    return savedPromotion;
  }

  /**
   * Get all promotions with filtering and pagination
   */
  async findAll(params: ListPromotionsQueryDto = {}): Promise<{
    items: Promotion[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      status,
      type,
      isFeatured,
      page = 1,
      limit = 20,
    } = params;

    const query: Record<string, unknown> = {};

    // Search by name or code
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by featured
    if (isFeatured === 'true') {
      query.isFeatured = true;
    } else if (isFeatured === 'false') {
      query.isFeatured = false;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.promotionModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      this.promotionModel.countDocuments(query),
    ]);

    // Add remaining uses
    const itemsWithRemaining = items.map((item) => ({
      ...item,
      remainingUses: item.usageLimit
        ? item.usageLimit - (item.usageCount || 0)
        : undefined,
    }));

    return {
      items: itemsWithRemaining as any,
      total,
      page,
      limit,
    };
  }

  /**
   * Get promotion by ID
   */
  async findById(id: string): Promise<Promotion> {
    const promotion = await this.promotionModel.findById(id);
    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }
    return promotion;
  }

  /**
   * Get promotion by code
   */
  async findByCode(code: string): Promise<Promotion> {
    const promotion = await this.promotionModel.findOne({
      code: code.toUpperCase(),
    }).lean();

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    return promotion as unknown as Promotion;
  }

  /**
   * Get active promotions (for public API)
   */
  async findActive(): Promise<Promotion[]> {
    const now = new Date();

    return this.promotionModel
      .find({
        status: PromotionStatus.ACTIVE,
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
      .sort({ isFeatured: -1, createdAt: -1 })
      .lean()
      .exec();
  }

  /**
   * Validate promotion code for checkout
   */
  async validateCode(
    code: string,
    cartTotal: number,
    productIds?: string[],
    customerId?: string,
  ): Promise<{
    isValid: boolean;
    promotion?: any;
    discountAmount?: number;
    message?: string;
  }> {
    const promotion = await this.promotionModel.findOne({
      code: code.toUpperCase(),
    }).lean();

    if (!promotion) {
      return {
        isValid: false,
        message: 'Invalid promotion code',
      };
    }

    const now = new Date();

    // Check status
    if (promotion.status === PromotionStatus.INACTIVE) {
      return {
        isValid: false,
        message: 'This promotion is inactive',
      };
    }

    if (promotion.status === PromotionStatus.EXPIRED) {
      return {
        isValid: false,
        message: 'This promotion has expired',
      };
    }

    // Check dates
    if (now < promotion.startDate) {
      return {
        isValid: false,
        message: 'This promotion has not started yet',
      };
    }

    if (now > promotion.endDate) {
      return {
        isValid: false,
        message: 'This promotion has expired',
      };
    }

    // Check usage limit
    if (promotion.usageLimit && (promotion.usageCount || 0) >= promotion.usageLimit) {
      return {
        isValid: false,
        message: 'This promotion has reached its usage limit',
      };
    }

    // Check minimum order value
    if (cartTotal < promotion.minOrderValue) {
      return {
        isValid: false,
        message: `Minimum order value of ${promotion.minOrderValue} required`,
      };
    }

    // Calculate discount based on scope
    let discountAmount = 0;
    let applicableAmount = cartTotal;

    // If scope is specific categories or products, calculate applicable amount
    if (promotion.scope === 'specific_categories' && productIds?.length) {
      // For now, apply to full cart - in production, would filter by category
      applicableAmount = cartTotal;
    } else if (promotion.scope === 'specific_products' && productIds?.length) {
      // Check if cart contains applicable products
      const hasApplicableProduct = productIds.some((id) =>
        promotion.applicableProductIds?.includes(id),
      );

      if (!hasApplicableProduct) {
        return {
          isValid: false,
          message: 'This promotion does not apply to any items in your cart',
        };
      }
    }

    // Calculate discount
    // Normalize type to string for reliable comparison
    const promotionType = String(promotion.type).toLowerCase();
    console.log('[PromotionService] Calculating discount:', {
      promotionType,
      rawType: promotion.type,
      typeofType: typeof promotion.type,
      promotionValue: promotion.value,
      applicableAmount,
    });

    if (promotionType === 'percentage') {
      // Calculate percentage discount
      discountAmount = (applicableAmount * promotion.value) / 100;
      console.log('[PromotionService] Percentage discount calculated:', {
        applicableAmount,
        percentage: promotion.value,
        discountAmount,
      });
    } else {
      // Fixed amount
      discountAmount = Math.min(promotion.value, applicableAmount);
      console.log('[PromotionService] Fixed amount discount calculated:', discountAmount);
    }

    // Return promotion with explicit type string to ensure correct serialization
    // Ensure _id is properly converted to string for API response
    const promotionResponse = {
      ...promotion,
      type: promotionType as PromotionType,
      _id: promotion._id?.toString(), // Explicitly convert ObjectId to string
    };

    console.log('[PromotionService] Returning promotion:', {
      _id: promotionResponse._id,
      _idType: typeof promotionResponse._id,
      code: promotionResponse.code,
      type: promotionResponse.type,
    });

    return {
      isValid: true,
      promotion: promotionResponse,
      discountAmount,
    };
  }

  /**
   * Update promotion
   */
  async update(id: string, updateDto: UpdatePromotionDto): Promise<Promotion> {
    const promotion = await this.findById(id);

    // If updating code, check for duplicates
    if (updateDto.code && updateDto.code.toUpperCase() !== promotion.code) {
      const existing = await this.promotionModel.findOne({
        code: updateDto.code.toUpperCase(),
        _id: { $ne: id },
      });

      if (existing) {
        throw new ConflictException('Promotion code already exists');
      }
    }

    // Validate dates if both provided
    if (updateDto.startDate || updateDto.endDate) {
      const startDate = updateDto.startDate
        ? new Date(updateDto.startDate)
        : promotion.startDate;
      const endDate = updateDto.endDate
        ? new Date(updateDto.endDate)
        : promotion.endDate;

      if (endDate <= startDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    // Apply updates individually
    if (updateDto.name) promotion.name = updateDto.name;
    if (updateDto.description) promotion.description = updateDto.description;
    if (updateDto.code) promotion.code = updateDto.code.toUpperCase();
    if (updateDto.value !== undefined) promotion.value = updateDto.value;
    if (updateDto.minOrderValue !== undefined) promotion.minOrderValue = updateDto.minOrderValue;
    if (updateDto.startDate) promotion.startDate = new Date(updateDto.startDate);
    if (updateDto.endDate) promotion.endDate = new Date(updateDto.endDate);
    if (updateDto.usageLimit !== undefined) promotion.usageLimit = updateDto.usageLimit;
    if (updateDto.maxUsesPerCustomer !== undefined) promotion.maxUsesPerCustomer = updateDto.maxUsesPerCustomer;
    if (updateDto.isStackable !== undefined) promotion.isStackable = updateDto.isStackable;
    if (updateDto.tags) promotion.tags = updateDto.tags;
    if (updateDto.isFeatured !== undefined) promotion.isFeatured = updateDto.isFeatured;
    if (updateDto.status) promotion.status = updateDto.status;

    const savedPromotion = await promotion.save();
    return savedPromotion;
  }

  /**
   * Update promotion status
   */
  async updateStatus(
    id: string,
    status: PromotionStatus,
  ): Promise<Promotion> {
    const promotion = await this.promotionModel.findById(id);
    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }
    promotion.status = status;
    return await promotion.save();
  }

  /**
   * Increment usage count
   */
  async incrementUsage(id: string): Promise<void> {
    await this.promotionModel.updateOne(
      { _id: id },
      { $inc: { usageCount: 1 } },
    );
  }

  /**
   * Delete promotion
   */
  async delete(id: string): Promise<Promotion> {
    const promotion = await this.promotionModel.findById(id);
    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }
    await this.promotionModel.deleteOne({ _id: id });
    return promotion;
  }

  /**
   * Get promotion statistics
   */
  async getStatistics(): Promise<{
    totalPromotions: number;
    activePromotions: number;
    scheduledPromotions: number;
    expiredPromotions: number;
    featuredPromotions: number;
    totalUsage: number;
  }> {
    const now = new Date();

    const [total, active, scheduled, expired, featured] = await Promise.all([
      this.promotionModel.countDocuments(),
      this.promotionModel.countDocuments({ status: PromotionStatus.ACTIVE }),
      this.promotionModel.countDocuments({ status: PromotionStatus.SCHEDULED }),
      this.promotionModel.countDocuments({ status: PromotionStatus.EXPIRED }),
      this.promotionModel.countDocuments({ isFeatured: true }),
    ]);

    // Get total usage
    const usageAgg = await this.promotionModel
      .aggregate([
        {
          $group: {
            _id: null,
            totalUsage: { $sum: '$usageCount' },
          },
        },
      ])
      .exec();

    const totalUsage = usageAgg[0]?.totalUsage || 0;

    return {
      totalPromotions: total,
      activePromotions: active,
      scheduledPromotions: scheduled,
      expiredPromotions: expired,
      featuredPromotions: featured,
      totalUsage,
    };
  }
}
