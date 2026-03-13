import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Combo, ComboStatus } from '../commons/schemas/combo.schema';
import { Product } from '../commons/schemas/product.schema';
import {
  CreateComboDto,
  UpdateComboDto,
  ListCombosQueryDto,
} from '../commons/dtos/combo.dto';

@Injectable()
export class ComboService {
  constructor(
    @InjectModel(Combo.name) private comboModel: Model<Combo>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  /**
   * Create a new combo
   */
  async create(createDto: CreateComboDto): Promise<Combo> {
    // Validate that both products exist
    const [frameProduct, lensProduct] = await Promise.all([
      this.productModel.findById(createDto.frameProductId),
      this.productModel.findById(createDto.lensProductId),
    ]);

    if (!frameProduct) {
      throw new NotFoundException('Frame product not found');
    }

    if (!lensProduct) {
      throw new NotFoundException('Lens product not found');
    }

    // Validate product categories
    if (frameProduct.category !== 'frame') {
      throw new BadRequestException('Frame product must be of category "frame"');
    }

    if (lensProduct.category !== 'lens') {
      throw new BadRequestException('Lens product must be of category "lens"');
    }

    // Check if combo already exists for this frame/lens pair
    const existingCombo = await this.comboModel.findOne({
      frameProductId: createDto.frameProductId,
      lensProductId: createDto.lensProductId,
    });

    if (existingCombo) {
      throw new ConflictException(
        'A combo already exists for this frame and lens combination',
      );
    }

    const combo = new this.comboModel({
      ...createDto,
      frameProductId: createDto.frameProductId,
      lensProductId: createDto.lensProductId,
      status: createDto.status || ComboStatus.ACTIVE,
    });

    return await combo.save();
  }

  /**
   * Get all combos with filtering and pagination
   */
  async findAll(params: ListCombosQueryDto = {}): Promise<{
    items: Array<any>;
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      status,
      frameProductId,
      lensProductId,
      isFeatured,
      page = 1,
      limit = 20,
    } = params;

    const query: Record<string, unknown> = {};

    // Search by name
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by products
    if (frameProductId) {
      query.frameProductId = frameProductId;
    }

    if (lensProductId) {
      query.lensProductId = lensProductId;
    }

    // Filter by featured
    if (isFeatured === 'true') {
      query.isFeatured = true;
    } else if (isFeatured === 'false') {
      query.isFeatured = false;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.comboModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      this.comboModel.countDocuments(query),
    ]);

    // Populate product details
    const populatedItems = await Promise.all(
      items.map(async (item) => {
        const [frame, lens] = await Promise.all([
          this.productModel.findById(item.frameProductId).select('name').lean(),
          this.productModel.findById(item.lensProductId).select('name').lean(),
        ]);

        return {
          ...item,
          frameName: frame?.name,
          lensName: lens?.name,
        };
      }),
    );

    return {
      items: populatedItems,
      total,
      page,
      limit,
    };
  }

  /**
   * Get combo by ID
   */
  async findById(id: string): Promise<Combo> {
    const combo = await this.comboModel.findById(id);
    if (!combo) {
      throw new NotFoundException('Combo not found');
    }
    return combo;
  }

  /**
   * Get active combos (for public API)
   */
  async findActive(): Promise<Combo[]> {
    const now = new Date();

    return this.comboModel
      .find({
        status: ComboStatus.ACTIVE,
        $and: [
          {
            $or: [
              { startDate: { $exists: false } },
              { startDate: { $lte: now } },
            ],
          },
          {
            $or: [
              { endDate: { $exists: false } },
              { endDate: { $gte: now } },
            ],
          },
        ],
      })
      .sort({ isFeatured: -1, createdAt: -1 })
      .lean()
      .exec();
  }

  /**
   * Validate combo for cart items
   */
  async validateCombo(frameProductId: string, lensProductId: string): Promise<{
    hasCombo: boolean;
    combo?: Combo;
  }> {
    const now = new Date();

    const combo = await this.comboModel
      .findOne({
        frameProductId,
        lensProductId,
        status: ComboStatus.ACTIVE,
        $and: [
          {
            $or: [
              { startDate: { $exists: false } },
              { startDate: { $lte: now } },
            ],
          },
          {
            $or: [
              { endDate: { $exists: false } },
              { endDate: { $gte: now } },
            ],
          },
        ],
      })
      .lean();

    if (!combo) {
      return { hasCombo: false };
    }

    return {
      hasCombo: true,
      combo,
    };
  }

  /**
   * Get applicable combo price for cart
   */
  async getComboPrice(productIds: string[]): Promise<{
    hasCombo: boolean;
    comboPrice?: number;
    originalPrice?: number;
    discountAmount?: number;
    combo?: Combo;
  }> {
    // Find frames and lenses in the cart
    const products = await this.productModel.find({
      _id: { $in: productIds },
    });

    const frameProduct = products.find((p) => p.category === 'frame');
    const lensProduct = products.find((p) => p.category === 'lens');

    if (!frameProduct || !lensProduct) {
      return { hasCombo: false };
    }

    const { hasCombo, combo } = await this.validateCombo(
      frameProduct._id.toString(),
      lensProduct._id.toString(),
    );

    if (!hasCombo || !combo) {
      return { hasCombo: false };
    }

    // Calculate original price from variants or base price
    let framePrice = frameProduct.basePrice;
    let lensPrice = lensProduct.basePrice;

    // Use variant price if available (simplified - actual logic would check cart variant SKU)
    const originalPrice = framePrice + lensPrice;

    return {
      hasCombo: true,
      comboPrice: combo.comboPrice,
      originalPrice,
      discountAmount: originalPrice - combo.comboPrice,
      combo,
    };
  }

  /**
   * Update combo
   */
  async update(id: string, updateDto: UpdateComboDto): Promise<Combo> {
    const combo = await this.findById(id);

    // If updating product references, validate they exist
    if (updateDto.frameProductId) {
      const frameProduct = await this.productModel.findById(
        updateDto.frameProductId,
      );
      if (!frameProduct) {
        throw new NotFoundException('Frame product not found');
      }
      if (frameProduct.category !== 'frame') {
        throw new BadRequestException('Product must be a frame');
      }
    }

    if (updateDto.lensProductId) {
      const lensProduct = await this.productModel.findById(
        updateDto.lensProductId,
      );
      if (!lensProduct) {
        throw new NotFoundException('Lens product not found');
      }
      if (lensProduct.category !== 'lens') {
        throw new BadRequestException('Product must be a lens');
      }
    }

    // Check for duplicate combo if changing products
    if (updateDto.frameProductId || updateDto.lensProductId) {
      const newFrameId = updateDto.frameProductId || combo.frameProductId;
      const newLensId = updateDto.lensProductId || combo.lensProductId;

      const existingCombo = await this.comboModel.findOne({
        frameProductId: newFrameId,
        lensProductId: newLensId,
        _id: { $ne: id },
      });

      if (existingCombo) {
        throw new ConflictException(
          'A combo already exists for this frame and lens combination',
        );
      }
    }

    Object.assign(combo, updateDto);
    return await combo.save();
  }

  /**
   * Update combo status
   */
  async updateStatus(
    id: string,
    status: ComboStatus,
  ): Promise<Combo> {
    const combo = await this.findById(id);
    combo.status = status;
    return await combo.save();
  }

  /**
   * Delete combo
   */
  async delete(id: string): Promise<Combo> {
    const combo = await this.findById(id);
    await this.comboModel.deleteOne({ _id: id });
    return combo;
  }

  /**
   * Get combo statistics
   */
  async getStatistics(): Promise<{
    totalCombos: number;
    activeCombos: number;
    featuredCombos: number;
    expiringSoon: number;
  }> {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [total, active, featured, expiring] = await Promise.all([
      this.comboModel.countDocuments(),
      this.comboModel.countDocuments({ status: ComboStatus.ACTIVE }),
      this.comboModel.countDocuments({ isFeatured: true }),
      this.comboModel.countDocuments({
        status: ComboStatus.ACTIVE,
        endDate: { $lte: weekFromNow, $gte: now },
      }),
    ]);

    return {
      totalCombos: total,
      activeCombos: active,
      featuredCombos: featured,
      expiringSoon: expiring,
    };
  }
}
