import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, PipelineStage, HydratedDocument } from 'mongoose';
import { Cart } from '../commons/schemas/cart.schema';
import { CartItem } from '../commons/schemas/cart-item.schema';
import { Product } from '../commons/schemas/product.schema';
import {
  AddToCartDto,
  UpdateCartItemDto,
  CartResponseDto,
  CartItemResponseDto,
} from '../dtos/cart.dto';
import { InventoryService } from './inventory.service';
import { ComboService } from './combo.service';

// Type for cart document with Mongoose methods
type CartDocument = HydratedDocument<Cart>;

// Type for aggregated cart item from MongoDB pipeline
interface AggregatedCartItem {
  _id: string;
  productId: mongoose.Types.ObjectId;
  variantSku?: string;
  quantity: number;
  addedAt: Date;
  productName?: string;
  productImage?: string;
  price?: number;
  variantDetails?: {
    size?: string;
    color?: string;
  };
}

// Type for aggregated cart document from MongoDB pipeline
interface AggregatedCart {
  _id: string;
  customerId: mongoose.ObjectId;
  items: AggregatedCartItem[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    private readonly inventoryService: InventoryService,
    private readonly comboService: ComboService,
  ) {}

  /**
   * Get or create cart for a customer
   */
  private async getOrCreateCart(customerId: string): Promise<CartDocument> {
    const customerObjId = new mongoose.Types.ObjectId(customerId);
    let cart = await this.cartModel
      .findOne({ customerId: customerObjId })
      .exec();

    if (!cart) {
      cart = await this.cartModel.create({
        customerId: customerObjId,
        items: [],
      });
    }

    return cart;
  }

  /**
   * Get customer's cart with populated product details
   */
  async getCustomerCart(customerId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(customerId);

    // Aggregate to get cart with product details
    const pipeline: PipelineStage[] = [
      { $match: { customerId: new mongoose.Types.ObjectId(customerId) } },
      { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $addFields: {
          'items.productName': '$product.name',
          'items.productImage': { $arrayElemAt: ['$product.images2D', 0] },
          'items.price': {
            $cond: {
              if: {
                $and: [
                  { $ne: ['$items.variantSku', null] },
                  { $ne: ['$items.variantSku', ''] },
                ],
              },
              then: {
                $arrayElemAt: [
                  {
                    $map: {
                      input: {
                        $filter: {
                          input: '$product.variants',
                          as: 'variant',
                          cond: { $eq: ['$$variant.sku', '$items.variantSku'] },
                        },
                      },
                      as: 'matchedVariant',
                      in: '$$matchedVariant.price',
                    },
                  },
                  0,
                ],
              },
              else: '$product.basePrice',
            },
          },
          'items.variantDetails': {
            $cond: [
              {
                $and: [
                  { $ne: ['$items.variantSku', null] },
                  { $ne: ['$items.variantSku', ''] },
                ],
              },
              {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: '$product.variants',
                      as: 'variant',
                      cond: { $eq: ['$$variant.sku', '$items.variantSku'] },
                    },
                  },
                  0,
                ],
              },
              null,
            ],
          },
        },
      },
      {
        $group: {
          _id: '$_id',
          customerId: { $first: '$customerId' },
          items: { $push: '$items' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
        },
      },
    ];

    const result = await this.cartModel.aggregate(pipeline).exec();

    if (!result || result.length === 0) {
      return this.mapToResponseDto(cart, []);
    }

    const cartData = result[0] as AggregatedCart;
    const items: CartItemResponseDto[] = cartData.items.map(
      (item: AggregatedCartItem) => ({
        _id: item._id || '',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        productId: item.productId?.toString() || '',
        variantSku: item.variantSku,
        productName: item.productName,
        productImage: item.productImage,
        price: item.price || 0,
        quantity: item.quantity,
        variantDetails: item.variantDetails
          ? {
              size: item.variantDetails.size,
              color: item.variantDetails.color,
            }
          : undefined,
        addedAt: item.addedAt,
      }),
    );

    return this.mapToResponseDto(cart, items);
  }

  /**
   * Add item to cart
   */
  async addItem(
    customerId: string,
    addItemDto: AddToCartDto,
  ): Promise<CartResponseDto> {
    // Validate product exists
    const product = await this.productModel.findById(addItemDto.productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive) {
      throw new BadRequestException('Product is not available');
    }

    // If variant SKU provided, validate it exists and is active
    if (addItemDto.variantSku) {
      // Variants are embedded in the Product document, query the Product model
      const product = await this.productModel
        .findById(addItemDto.productId)
        .exec();

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Find variant within the product's variants array
      const variant = product.variants?.find(
        (v) => v.sku === addItemDto.variantSku,
      );

      if (!variant) {
        throw new NotFoundException('Variant not found');
      }

      if (variant.isActive === false) {
        throw new BadRequestException('Variant is not available');
      }

      // Check stock availability
      const inventory = await this.inventoryService.findBySku(
        addItemDto.variantSku,
      );
      if (!inventory) {
        throw new BadRequestException('Inventory not found for this variant');
      }

      const availableStock =
        inventory.stockQuantity - inventory.reservedQuantity;
      const canFulfillFromStock = addItemDto.quantity <= availableStock;
      const canProceedAsPreorder =
        addItemDto.quantity > availableStock &&
        (product.isPreorderEnabled || false);

      if (!canFulfillFromStock && !canProceedAsPreorder) {
        throw new BadRequestException(
          `Insufficient stock. Only ${availableStock} available.`,
        );
      }
    }

    const cart = await this.getOrCreateCart(customerId);

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex((item) => {
      const itemProductId = (
        item.productId as unknown as mongoose.Types.ObjectId
      ).toString();
      return (
        itemProductId === addItemDto.productId &&
        item.variantSku === (addItemDto.variantSku || '')
      );
    });

    if (existingItemIndex !== -1) {
      // Update quantity of existing item
      const newQuantity =
        cart.items[existingItemIndex].quantity + addItemDto.quantity;
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      const cartItem: CartItem = {
        _id: new mongoose.Types.ObjectId().toString(),
        productId: new mongoose.Types.ObjectId(addItemDto.productId),
        variantSku: addItemDto.variantSku || '',
        quantity: addItemDto.quantity,
        addedAt: new Date(),
      };
      cart.items.push(cartItem);
    }

    await cart.save();
    return this.getCustomerCart(customerId);
  }

  /**
   * Update cart item quantity
   */
  async updateItemQuantity(
    customerId: string,
    itemId: string,
    updateDto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(customerId);

    const itemIndex = cart.items.findIndex(
      (item) => String(item._id) === itemId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Cart item not found');
    }

    // Check stock availability for the new quantity
    const cartItem = cart.items[itemIndex];
    if (cartItem.variantSku) {
      const inventory = await this.inventoryService.findBySku(
        cartItem.variantSku,
      );

      const product = await this.productModel
        .findOne({ 'variants.sku': cartItem.variantSku })
        .exec();
      const preorderEnabled = product?.isPreorderEnabled || false;

      if (inventory) {
        const availableStock =
          inventory.stockQuantity - inventory.reservedQuantity;
        const canFulfillFromStock = updateDto.quantity <= availableStock;
        const canProceedAsPreorder =
          updateDto.quantity > availableStock && preorderEnabled;

        if (!canFulfillFromStock && !canProceedAsPreorder) {
          throw new BadRequestException(
            `Insufficient stock. Only ${availableStock} available.`,
          );
        }
      } else if (!preorderEnabled) {
        throw new BadRequestException('Insufficient stock. Only 0 available.');
      }
    }

    cart.items[itemIndex].quantity = updateDto.quantity;
    await cart.save();

    return this.getCustomerCart(customerId);
  }

  /**
   * Remove item from cart
   */
  async removeItem(
    customerId: string,
    itemId: string,
  ): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(customerId);

    const itemIndex = cart.items.findIndex(
      (item) => String(item._id) === itemId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Cart item not found');
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    return this.getCustomerCart(customerId);
  }

  /**
   * Clear cart
   */
  async clearCart(
    customerId: string,
  ): Promise<{ message: string; itemsRemoved: number }> {
    const cart = await this.getOrCreateCart(customerId);
    const itemsRemoved = cart.items.length;

    cart.items = [];
    await cart.save();

    return {
      message: 'Cart cleared successfully',
      itemsRemoved,
    };
  }

  /**
   * Get cart item count
   */
  async getCartItemCount(customerId: string): Promise<number> {
    const cart = await this.cartModel
      .findOne({
        customerId: new mongoose.Types.ObjectId(customerId),
      } as Record<string, unknown>)
      .exec();
    if (!cart) return 0;

    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Get cart subtotal
   */
  async getCartSubtotal(customerId: string): Promise<number> {
    const cart = await this.getOrCreateCart(customerId);

    let subtotal = 0;
    for (const item of cart.items) {
      const product = await this.productModel.findById(item.productId);
      if (!product) continue;

      let price = product.basePrice;

      if (item.variantSku) {
        // Find variant within the product's variants array
        const variant = product.variants?.find(
          (v) => v.sku === item.variantSku,
        );
        if (variant && variant.price) {
          price = variant.price;
        }
      }

      subtotal += price * item.quantity;
    }

    return subtotal;
  }

  /**
   * Bulk add items to cart
   */
  async bulkAddItems(
    customerId: string,
    items: AddToCartDto[],
  ): Promise<CartResponseDto> {
    for (const item of items) {
      await this.addItem(customerId, item);
    }

    return this.getCustomerCart(customerId);
  }

  /**
   * Validate cart items (stock availability)
   */
  async validateCartItems(customerId: string): Promise<{
    valid: boolean;
    invalidItems: Array<{ itemId: string; reason: string }>;
  }> {
    const cart = await this.getOrCreateCart(customerId);
    const invalidItems: Array<{ itemId: string; reason: string }> = [];

    for (const item of cart.items) {
      const product = await this.productModel.findById(item.productId);

      if (!product || !product.isActive) {
        invalidItems.push({
          itemId: String(item._id),
          reason: 'Product not available',
        });
        continue;
      }

      if (item.variantSku) {
        // Find variant within the product's variants array
        const variant = product.variants?.find(
          (v) => v.sku === item.variantSku,
        );

        if (!variant || variant.isActive === false) {
          invalidItems.push({
            itemId: String(item._id),
            reason: 'Variant not available',
          });
          continue;
        }

        const inventory = await this.inventoryService.findBySku(
          item.variantSku,
        );

        const availableStock = inventory
          ? inventory.stockQuantity - inventory.reservedQuantity
          : 0;
        const canFulfillFromStock = item.quantity <= availableStock;
        const canProceedAsPreorder =
          item.quantity > availableStock &&
          (product.isPreorderEnabled || false);

        if (!canFulfillFromStock && !canProceedAsPreorder) {
          invalidItems.push({
            itemId: String(item._id),
            reason: 'Insufficient stock',
          });
        }
      }
    }

    return {
      valid: invalidItems.length === 0,
      invalidItems,
    };
  }

  /**
   * Map cart entity to response DTO
   */
  private mapToResponseDto(
    cart: Cart,
    items: CartItemResponseDto[],
  ): CartResponseDto {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
      0,
    );

    return {
      _id: cart._id || '',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      customerId: cart.customerId?.toString() || '',
      items,
      totalItems,
      subtotal,
      createdAt: cart.createdAt || new Date(),
      updatedAt: cart.updatedAt || new Date(),
    };
  }

  /**
   * Check for applicable combo pricing in cart
   * Returns combo information if a valid combo exists for the cart items
   */
  async checkComboPricing(customerId: string): Promise<{
    hasCombo: boolean;
    combo?: {
      id: string;
      name: string;
      comboPrice: number;
      originalPrice: number;
      discountAmount: number;
      discountPercentage: number;
    };
    appliedItems?: string[];
  }> {
    const cart = await this.getOrCreateCart(customerId);

    if (!cart.items || cart.items.length < 2) {
      return { hasCombo: false };
    }

    // Get all product IDs in cart
    const productIds = cart.items.map((item) =>
      (item.productId as mongoose.Types.ObjectId).toString(),
    );

    // Check for combo pricing
    const comboResult = await this.comboService.getComboPrice(productIds);

    if (!comboResult.hasCombo) {
      return { hasCombo: false };
    }

    return {
      hasCombo: true,
      combo: comboResult.combo
        ? {
            id: comboResult.combo._id.toString(),
            name: comboResult.combo.name,
            comboPrice: comboResult.comboPrice || 0,
            originalPrice: comboResult.originalPrice || 0,
            discountAmount: comboResult.discountAmount || 0,
            discountPercentage: comboResult.combo.discountPercentage || 0,
          }
        : undefined,
      appliedItems: productIds,
    };
  }

  /**
   * Get cart subtotal with combo pricing applied
   */
  async getCartSubtotalWithCombo(customerId: string): Promise<{
    subtotal: number;
    comboDiscount: number;
    finalTotal: number;
    comboDetails?: {
      id: string;
      name: string;
      discountAmount: number;
    };
  }> {
    const cart = await this.getOrCreateCart(customerId);
    let subtotal = 0;

    // Calculate regular subtotal
    for (const item of cart.items) {
      const product = await this.productModel.findById(item.productId);
      if (!product) continue;

      let price = product.basePrice;

      if (item.variantSku) {
        const variant = product.variants?.find(
          (v) => v.sku === item.variantSku,
        );
        if (variant && variant.price) {
          price = variant.price;
        }
      }

      subtotal += price * item.quantity;
    }

    // Check for combo pricing
    const comboResult = await this.checkComboPricing(customerId);

    let comboDiscount = 0;
    let comboDetails;

    if (comboResult.hasCombo && comboResult.combo) {
      comboDiscount = comboResult.combo.discountAmount;
      comboDetails = {
        id: comboResult.combo.id,
        name: comboResult.combo.name,
        discountAmount: comboResult.combo.discountAmount,
      };
    }

    return {
      subtotal,
      comboDiscount,
      finalTotal: subtotal - comboDiscount,
      comboDetails,
    };
  }
}
