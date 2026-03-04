import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Inventory } from '../commons/schemas/inventory.schema';
import { Product } from '../commons/schemas/product.schema';
import { Supplier } from '../commons/schemas/supplier.schema';
import {
  InventoryMovement,
  MovementType,
} from '../commons/schemas/inventory-movement.schema';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  StockAdjustmentDto,
  BulkStockUpdateDto,
  ReserveInventoryDto,
  ReleaseReservationDto,
} from '../commons/dtos/inventory.dto';
import { ProductVariant } from 'src/commons/schemas/product-variant.schema';

/**
 * Enriched inventory item with product/variant information
 */
export interface InventoryItemEnriched extends Inventory {
  productName?: string;
  productCategory?: string;
  variantSize?: string;
  variantColor?: string;
  variantPrice?: number;
  variantIsActive?: boolean;
  productIsActive?: boolean;
  productId?: string;
}

/**
 * Query parameters for inventory list
 */
export interface InventoryQueryParams {
  sku?: string;
  lowStock?: boolean;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Inventory.name) private inventoryModel: Model<Inventory>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Supplier.name) private supplierModel: Model<Supplier>,
    @InjectModel(InventoryMovement.name)
    private movementModel: Model<InventoryMovement>,
  ) {}

  /**
   * Get all inventory items with optional filtering and enrichment
   */
  async findAll(params: InventoryQueryParams = {}): Promise<{
    items: InventoryItemEnriched[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      sku,
      lowStock = false,
      activeOnly = false,
      page = 1,
      limit = 50,
    } = params;

    // Build query
    const query: Record<string, unknown> = {};

    // SKU search (partial match, case-insensitive)
    if (sku) {
      query.sku = { $regex: sku, $options: 'i' };
    }

    // Note: Low stock filter is applied after fetching (see post-filtering below)
    // Cannot use direct query comparison since reorderLevel varies per item

    const skip = (page - 1) * limit;

    // Get inventory items
    const inventoryItems = await this.inventoryModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ sku: 1 })
      .lean();

    // Filter for low stock after query if needed
    let filteredItems = inventoryItems;
    if (lowStock) {
      filteredItems = inventoryItems.filter(
        (item) => item.stockQuantity <= item.reorderLevel,
      );
    }

    // Get all SKUs to fetch product information
    const skus = filteredItems.map((item) => item.sku);

    // Find products containing these SKUs in their variants
    const products = await this.productModel
      .find({ 'variants.sku': { $in: skus }, isDeleted: false })
      .lean();

    // Create a map of SKU to product/variant info
    const skuInfoMap = new Map<
      string,
      {
        productName: string;
        productCategory: string;
        variantSize?: string;
        variantColor?: string;
        variantPrice?: number;
        variantIsActive?: boolean;
        productIsActive: boolean;
        productId: string;
      }
    >();

    for (const product of products) {
      if (product.variants) {
        for (const variant of product.variants) {
          if (skus.includes(variant.sku)) {
            skuInfoMap.set(variant.sku, {
              productName: product.name,
              productCategory: product.category,
              variantSize: variant.size,
              variantColor: variant.color,
              variantPrice: variant.price,
              variantIsActive: variant.isActive,
              productIsActive: product.isActive ?? true,
              productId: product._id.toString(),
            });
          }
        }
      }
    }

    // Enrich inventory items with product information
    let enrichedItems: InventoryItemEnriched[] = filteredItems.map((item) => {
      const info = skuInfoMap.get(item.sku);
      return {
        ...item,
        productName: info?.productName,
        productCategory: info?.productCategory,
        variantSize: info?.variantSize,
        variantColor: info?.variantColor,
        variantPrice: info?.variantPrice,
        variantIsActive: info?.variantIsActive,
        productIsActive: info?.productIsActive ?? true,
        productId: info?.productId,
      };
    });

    // Filter for active variants only if requested
    if (activeOnly) {
      enrichedItems = enrichedItems.filter(
        (item) =>
          item.variantIsActive !== false && item.productIsActive !== false,
      );
    }

    // Get total count
    const total = await this.inventoryModel.countDocuments(query);

    return {
      items: enrichedItems,
      total,
      page,
      limit,
    };
  }

  /**
   * Get inventory item by SKU with enriched product information
   */
  async findBySku(sku: string): Promise<InventoryItemEnriched | null> {
    const inventoryItem = await this.inventoryModel.findOne({ sku }).lean();
    if (!inventoryItem) {
      return null;
    }

    // Find product containing this SKU
    const product = await this.productModel
      .findOne({ 'variants.sku': sku, isDeleted: false })
      .lean();

    let enrichedItem: InventoryItemEnriched = { ...inventoryItem };

    if (product) {
      const variant = product.variants?.find((v) => v.sku === sku);
      enrichedItem = {
        ...inventoryItem,
        productName: product.name,
        productCategory: product.category,
        variantSize: variant?.size,
        variantColor: variant?.color,
        variantPrice: variant?.price,
        variantIsActive: variant?.isActive,
        productIsActive: product.isActive ?? true,
        productId: product._id.toString(),
      };
    }

    return enrichedItem;
  }

  /**
   * Create a new inventory item
   */
  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    // Check if SKU already exists
    const existing = await this.inventoryModel.findOne({
      sku: createInventoryDto.sku,
    });
    if (existing) {
      throw new ConflictException(
        `Inventory item with SKU ${createInventoryDto.sku} already exists`,
      );
    }

    // Validate reserved quantity doesn't exceed stock
    if (
      createInventoryDto.reservedQuantity > createInventoryDto.stockQuantity
    ) {
      throw new BadRequestException(
        'Reserved quantity cannot exceed stock quantity',
      );
    }

    // Calculate available quantity
    const availableQuantity =
      createInventoryDto.stockQuantity - createInventoryDto.reservedQuantity;

    const inventoryItem = new this.inventoryModel({
      ...createInventoryDto,
      availableQuantity,
    });

    return inventoryItem.save();
  }

  /**
   * Auto-create inventory item for new variant SKU
   * Called when a new product variant is created
   */
  async autoCreateForVariant(variant: ProductVariant): Promise<Inventory> {
    // Check if inventory already exists
    const existing = await this.inventoryModel.findOne({ sku: variant.sku });
    if (existing) {
      return existing;
    }

    // Create with default values
    return this.create({
      sku: variant.sku,
      stockQuantity: 0,
      reservedQuantity: 0,
      reorderLevel: 0,
    });
  }

  /**
   * Update inventory item by SKU
   * Only allows updating stock quantities and reorder level
   */
  async updateBySku(
    sku: string,
    updateInventoryDto: UpdateInventoryDto,
  ): Promise<Inventory | null> {
    const inventoryItem = await this.inventoryModel.findOne({ sku });
    if (!inventoryItem) {
      throw new NotFoundException(`Inventory item with SKU ${sku} not found`);
    }

    // Build update object
    const updateData: Partial<Inventory> = {};

    if (updateInventoryDto.stockQuantity !== undefined) {
      updateData.stockQuantity = updateInventoryDto.stockQuantity;
    }

    if (updateInventoryDto.reservedQuantity !== undefined) {
      updateData.reservedQuantity = updateInventoryDto.reservedQuantity;
    }

    if (updateInventoryDto.reorderLevel !== undefined) {
      updateData.reorderLevel = updateInventoryDto.reorderLevel;
    }

    // Recalculate available quantity
    const newStockQuantity =
      updateData.stockQuantity ?? inventoryItem.stockQuantity;
    const newReservedQuantity =
      updateData.reservedQuantity ?? inventoryItem.reservedQuantity;

    if (newReservedQuantity > newStockQuantity) {
      throw new BadRequestException(
        'Reserved quantity cannot exceed stock quantity',
      );
    }

    updateData.availableQuantity = newStockQuantity - newReservedQuantity;

    return this.inventoryModel
      .findOneAndUpdate({ sku }, updateData, { new: true })
      .exec();
  }

  /**
   * Adjust stock quantity by delta
   * Creates a movement record to track the adjustment with supplier info
   * This is the primary method for all stock changes (receive, adjust, issue)
   */
  async adjustStock(
    sku: string,
    adjustmentDto: StockAdjustmentDto,
  ): Promise<Inventory | null> {
    const inventoryItem = await this.inventoryModel.findOne({ sku });
    if (!inventoryItem) {
      throw new NotFoundException(`Inventory item with SKU ${sku} not found`);
    }

    const newStockQuantity = inventoryItem.stockQuantity + adjustmentDto.delta;

    if (newStockQuantity < 0) {
      throw new BadRequestException(
        'Stock quantity cannot be negative. Current: ' +
          inventoryItem.stockQuantity +
          ', Adjustment: ' +
          adjustmentDto.delta,
      );
    }

    if (newStockQuantity < inventoryItem.reservedQuantity) {
      throw new BadRequestException(
        'Stock quantity cannot be less than reserved quantity',
      );
    }

    const availableQuantity = newStockQuantity - inventoryItem.reservedQuantity;

    // Determine movement type based on delta and context
    let movementType: MovementType;
    if (adjustmentDto.delta > 0 && adjustmentDto.supplierId) {
      movementType = MovementType.RECEIPT;
    } else if (adjustmentDto.delta > 0) {
      movementType = MovementType.ADJUSTMENT;
    } else {
      movementType = MovementType.ADJUSTMENT;
    }

    // Build movement record with supplier info
    const movementData: Partial<InventoryMovement> = {
      sku,
      movementType,
      quantity: adjustmentDto.delta,
      stockBefore: inventoryItem.stockQuantity,
      stockAfter: newStockQuantity,
      reason: adjustmentDto.reason,
      reference: adjustmentDto.reference,
      note: adjustmentDto.note,
    };

    // Add supplier info if provided
    if (adjustmentDto.supplierId) {
      const supplier = await this.supplierModel.findById(
        adjustmentDto.supplierId,
      );
      if (supplier) {
        movementData.supplier = {
          supplierId: supplier._id,
          supplierCode: supplier.code,
          supplierName: supplier.name,
          supplierRef: adjustmentDto.supplierRef,
        };
      }
    }

    // Create movement record (audit trail)
    await this.movementModel.create(movementData);

    // Update inventory
    return this.inventoryModel
      .findOneAndUpdate(
        { sku },
        {
          stockQuantity: newStockQuantity,
          availableQuantity,
        },
        { new: true },
      )
      .exec();
  }

  /**
   * Bulk update stock for multiple SKUs
   */
  async bulkUpdateStock(bulkUpdateDto: BulkStockUpdateDto): Promise<{
    success: string[];
    failed: Array<{ sku: string; error: string }>;
  }> {
    const success: string[] = [];
    const failed: Array<{ sku: string; error: string }> = [];

    for (const item of bulkUpdateDto.items) {
      try {
        await this.updateBySku(item.sku, {
          stockQuantity: item.stockQuantity,
          reservedQuantity: item.reservedQuantity,
        });
        success.push(item.sku);
      } catch (error) {
        failed.push({
          sku: item.sku,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { success, failed };
  }

  /**
   * Reserve inventory for an order
   */
  async reserve(
    sku: string,
    reserveDto: ReserveInventoryDto,
  ): Promise<Inventory | null> {
    const inventoryItem = await this.inventoryModel.findOne({ sku });
    if (!inventoryItem) {
      throw new NotFoundException(`Inventory item with SKU ${sku} not found`);
    }

    if (inventoryItem.availableQuantity < reserveDto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${inventoryItem.availableQuantity}, Requested: ${reserveDto.quantity}`,
      );
    }

    const newReservedQuantity =
      inventoryItem.reservedQuantity + reserveDto.quantity;
    const availableQuantity = newReservedQuantity - inventoryItem.stockQuantity;

    return this.inventoryModel
      .findOneAndUpdate(
        { sku },
        {
          reservedQuantity: newReservedQuantity,
          availableQuantity,
        },
        { new: true },
      )
      .exec();
  }

  /**
   * Release reserved inventory
   */
  async releaseReservation(
    sku: string,
    releaseDto: ReleaseReservationDto,
  ): Promise<Inventory | null> {
    const inventoryItem = await this.inventoryModel.findOne({ sku });
    if (!inventoryItem) {
      throw new NotFoundException(`Inventory item with SKU ${sku} not found`);
    }

    const newReservedQuantity =
      inventoryItem.reservedQuantity - releaseDto.quantity;

    if (newReservedQuantity < 0) {
      throw new BadRequestException(
        'Cannot release more than reserved quantity',
      );
    }

    const availableQuantity = inventoryItem.stockQuantity - newReservedQuantity;

    return this.inventoryModel
      .findOneAndUpdate(
        { sku },
        {
          reservedQuantity: newReservedQuantity,
          availableQuantity,
        },
        { new: true },
      )
      .exec();
  }

  /**
   * Confirm reserved stock (convert reserved to actual stock reduction)
   * Called when an order is confirmed/shipped
   */
  async confirmReservation(
    sku: string,
    quantity: number,
  ): Promise<Inventory | null> {
    const inventoryItem = await this.inventoryModel.findOne({ sku });
    if (!inventoryItem) {
      throw new NotFoundException(`Inventory item with SKU ${sku} not found`);
    }

    if (inventoryItem.reservedQuantity < quantity) {
      throw new BadRequestException(
        'Cannot confirm more than reserved quantity',
      );
    }

    const newReservedQuantity = inventoryItem.reservedQuantity - quantity;
    const newStockQuantity = inventoryItem.stockQuantity - quantity;
    const availableQuantity = newStockQuantity - newReservedQuantity;

    if (newStockQuantity < 0) {
      throw new BadRequestException('Stock quantity cannot be negative');
    }

    return this.inventoryModel
      .findOneAndUpdate(
        { sku },
        {
          stockQuantity: newStockQuantity,
          reservedQuantity: newReservedQuantity,
          availableQuantity,
        },
        { new: true },
      )
      .exec();
  }

  /**
   * Check if items are available (for checkout validation)
   */
  async checkAvailability(
    items: Array<{ sku: string; quantity: number }>,
  ): Promise<
    Array<{ sku: string; available: boolean; availableQuantity: number }>
  > {
    const results = await Promise.all(
      items.map(async (item) => {
        const inventory = await this.inventoryModel.findOne({ sku: item.sku });
        if (!inventory) {
          return {
            sku: item.sku,
            available: false,
            availableQuantity: 0,
          };
        }
        return {
          sku: item.sku,
          available: inventory.availableQuantity >= item.quantity,
          availableQuantity: inventory.availableQuantity,
        };
      }),
    );

    return results;
  }

  /**
   * Get low stock items
   */
  async getLowStockItems(): Promise<InventoryItemEnriched[]> {
    const result = await this.findAll({ lowStock: true, activeOnly: true });
    return result.items;
  }

  /**
   * Get movement history for a specific SKU
   */
  async getMovements(
    sku: string,
    options: {
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ movements: InventoryMovement[]; total: number }> {
    const { limit = 50, offset = 0 } = options;

    const [movements, total] = await Promise.all([
      this.movementModel
        .find({ sku })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean()
        .exec(),
      this.movementModel.countDocuments({ sku }),
    ]);

    return { movements, total };
  }

  /**
   * Get all movements (with optional filtering)
   */
  async getAllMovements(
    options: {
      sku?: string;
      movementType?: MovementType;
      supplierId?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ movements: InventoryMovement[]; total: number }> {
    const { sku, movementType, supplierId, limit = 50, offset = 0 } = options;

    const query: Record<string, unknown> = {};

    if (sku) {
      query.sku = sku;
    }

    if (movementType) {
      query.movementType = movementType;
    }

    if (supplierId) {
      query['supplier.supplierId'] = new Types.ObjectId(supplierId);
    }

    const [movements, total] = await Promise.all([
      this.movementModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean()
        .exec(),
      this.movementModel.countDocuments(query),
    ]);

    return { movements, total };
  }

  /**
   * Ensure inventory entries exist for given SKUs
   * Creates inventory records with zero stock for any SKUs that don't exist
   * This is idempotent and safe to call multiple times
   * Called automatically when products/variants are created or updated
   */
  async ensureInventoryForSkus(skus: string[]): Promise<void> {
    // Remove duplicates and filter out empty strings
    const uniqueSkus = Array.from(new Set(skus)).filter(
      (s) => s && s.trim().length > 0,
    );

    if (uniqueSkus.length === 0) {
      return;
    }

    // Find existing inventory items
    const existingItems = await this.inventoryModel
      .find({ sku: { $in: uniqueSkus } })
      .select('sku')
      .lean();

    const existingSkus = new Set(existingItems.map((item) => item.sku));

    // Find SKUs that need inventory records created
    const skusToCreate = uniqueSkus.filter((sku) => !existingSkus.has(sku));

    if (skusToCreate.length === 0) {
      return;
    }

    // Bulk insert inventory records with zero stock
    await this.inventoryModel.collection.insertMany(
      skusToCreate.map((sku) => ({
        sku,
        stockQuantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        reorderLevel: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );
  }

  /**
   * Reserve stock for an order
   * Moves stock from available to reserved
   * @param sku Variant SKU
   * @param orderId Order ID reserving the stock
   * @param quantity Quantity to reserve (defaults to full order quantity)
   */
  async reserveStock(
    sku: string,
    orderId: string,
    quantity?: number,
  ): Promise<Inventory> {
    const inventory = await this.inventoryModel.findOne({ sku });

    if (!inventory) {
      throw new NotFoundException(`Inventory not found for SKU: ${sku}`);
    }

    // If quantity specified, reserve only that amount
    const quantityToReserve = quantity || inventory.availableQuantity;

    if (quantityToReserve > inventory.availableQuantity) {
      throw new BadRequestException(
        `Insufficient stock for SKU ${sku}. Available: ${inventory.availableQuantity}, Requested: ${quantityToReserve}`,
      );
    }

    // Update quantities
    inventory.reservedQuantity += quantityToReserve;
    inventory.availableQuantity -= quantityToReserve;

    await inventory.save();

    // Record movement
    await this.movementModel.create({
      sku,
      movementType: MovementType.RESERVATION,
      quantity: quantityToReserve,
      stockBefore: inventory.stockQuantity,
      stockAfter: inventory.stockQuantity,
      reason: `Reserved for order ${orderId}`,
      orderId: new Types.ObjectId(orderId),
      note: `Reserved for order ${orderId}`,
    });

    return inventory;
  }

  /**
   * Release reserved stock for an order
   * Moves stock from reserved back to available
   * @param orderId Order ID to release stock for
   * @param sku Variant SKU (optional - releases all reserved stock for the order)
   */
  async releaseStock(orderId: string, sku?: string): Promise<void> {
    // Find all reservation movements for this order
    const reservationMovements = await this.movementModel.find({
      referenceId: orderId,
      referenceType: 'ORDER',
      type: MovementType.RESERVATION,
    });

    if (reservationMovements.length === 0) {
      return; // No stock to release
    }

    for (const movement of reservationMovements) {
      // If SKU specified, only process that SKU
      if (sku && movement.sku !== sku) {
        continue;
      }

      const inventory = await this.inventoryModel.findOne({
        sku: movement.sku,
      });
      if (!inventory) continue;

      // Release the reserved quantity
      const quantityToRelease = movement.quantity;

      inventory.reservedQuantity = Math.max(
        0,
        inventory.reservedQuantity - quantityToRelease,
      );
      inventory.availableQuantity += quantityToRelease;

      await inventory.save();

      // Record release movement
      await this.movementModel.create({
        sku: movement.sku,
        movementType: MovementType.RELEASE,
        quantity: quantityToRelease,
        stockBefore: inventory.stockQuantity,
        stockAfter: inventory.stockQuantity,
        reason: `Released from order ${orderId}`,
        orderId: movement.orderId,
        note: `Released from order ${orderId}`,
      });
    }
  }

  /**
   * Confirm stock for an order (when shipped)
   * Moves stock from reserved to deducted (actual stock decrease)
   * @param orderId Order ID being shipped
   * @param sku Variant SKU (optional - confirms all reserved stock for the order)
   */
  async confirmStock(orderId: string, sku?: string): Promise<void> {
    // Find all reservation movements for this order that haven't been confirmed yet
    const reservationMovements = await this.movementModel.find({
      orderId: new Types.ObjectId(orderId),
      movementType: MovementType.RESERVATION,
    });

    // Get movements that have already been confirmed for this order
    const confirmedMovements = await this.movementModel.find({
      orderId: new Types.ObjectId(orderId),
      movementType: MovementType.SALE,
    });

    const confirmedSkus = new Set(confirmedMovements.map((m) => m.sku));

    for (const movement of reservationMovements) {
      // If SKU specified, only process that SKU
      if (sku && movement.sku !== sku) {
        continue;
      }

      // Skip if already confirmed
      if (confirmedSkus.has(movement.sku)) {
        continue;
      }

      const inventory = await this.inventoryModel.findOne({
        sku: movement.sku,
      });
      if (!inventory) continue;

      const quantityToConfirm = movement.quantity;

      // Deduct from stock and release reservation
      inventory.stockQuantity -= quantityToConfirm;
      inventory.reservedQuantity = Math.max(
        0,
        inventory.reservedQuantity - quantityToConfirm,
      );
      inventory.availableQuantity = Math.max(
        0,
        inventory.availableQuantity - quantityToConfirm,
      );

      await inventory.save();

      // Record sale movement
      await this.movementModel.create({
        sku: movement.sku,
        movementType: MovementType.CONFIRMED,
        quantity: quantityToConfirm,
        stockBefore: inventory.stockQuantity + quantityToConfirm,
        stockAfter: inventory.stockQuantity,
        reason: `Sold for order ${orderId}`,
        orderId: movement.orderId,
        note: `Sold for order ${orderId}`,
      });
    }
  }

  /**
   * Get reserved quantity for an order
   * Returns the total reserved quantity for all items in an order
   * @param orderId Order ID
   */
  async getOrderReservedQuantity(orderId: string): Promise<number> {
    const movements = await this.movementModel.find({
      orderId: new Types.ObjectId(orderId),
      movementType: MovementType.RESERVATION,
    });

    return movements.reduce((sum, m) => sum + m.quantity, 0);
  }
}
