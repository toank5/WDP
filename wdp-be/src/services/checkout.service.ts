import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, PipelineStage } from 'mongoose';
import { Cart } from '../commons/schemas/cart.schema';
import { Order } from '../commons/schemas/order.schema';
import { OrderItem } from '../commons/schemas/order-item.schema';
import { Product } from '../commons/schemas/product.schema';
import { Inventory } from '../commons/schemas/inventory.schema';
import {
  PREORDER_STATUS,
  ORDER_STATUS,
  ORDER_TYPES,
  PRODUCT_CATEGORIES,
  PRESCRIPTION_REVIEW_STATUS,
  POLICY_TYPES,
  SHIPPING_METHOD,
} from '@eyewear/shared';
import {
  CreateCheckoutDto,
  CheckoutCalculation,
  CheckoutItemDto,
  CheckoutOrderInfo,
  VNPayIpnResponseDto,
} from '../dtos/checkout.dto';
import {
  VNPayVerificationResultDto,
  VNPayCallbackParamsDto,
} from '../dtos/vnpay.dto';
import { CartService } from './cart.service';
import { VNPayService } from './vnpay.service';
import { InventoryService } from './inventory.service';
import { PromotionService } from './promotion.service';
import { PolicyService } from './policy.service';

// Aggregated cart item with product details
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
  requiresPrescription?: boolean;
  typedPrescription?: {
    rightEye: {
      sph: number;
      cyl: number;
      axis: number;
      add: number;
    };
    leftEye: {
      sph: number;
      cyl: number;
      axis: number;
      add: number;
    };
    pd?: number;
    pdRight?: number;
    pdLeft?: number;
    notesFromCustomer?: string;
  };
  product?: {
    _id: mongoose.Types.ObjectId;
    name: string;
    basePrice: number;
    images2D: string[];
    variants: Array<{
      sku: string;
      size: string;
      color: string;
      price: number;
      isActive: boolean;
    }>;
    isActive: boolean;
    isPreorderEnabled: boolean;
    category?: string;
    slug?: string;
  };
}

type VnpParamMap = Record<string, string | number | undefined>;

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  // Default shipping fee (can be made configurable)
  private readonly DEFAULT_SHIPPING_FEE = 30000; // 30,000 VND

  constructor(
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Inventory.name) private inventoryModel: Model<Inventory>,
    private readonly cartService: CartService,
    private readonly vnpayService: VNPayService,
    private readonly inventoryService: InventoryService,
    private readonly promotionService: PromotionService,
    private readonly policyService: PolicyService,
  ) {}

  private async getPrescriptionLensFee(): Promise<number> {
    try {
      const prescriptionPolicy =
        await this.policyService.getCurrentPolicyByType(
          POLICY_TYPES.PRESCRIPTION,
        );
      const fee = Number(
        (
          prescriptionPolicy?.config as {
            prescriptionLensFee?: unknown;
          }
        )?.prescriptionLensFee ?? 0,
      );
      return Number.isFinite(fee) && fee > 0 ? fee : 0;
    } catch {
      return 0;
    }
  }

  private async getShippingFee(
    shippingMethod: SHIPPING_METHOD,
    subtotal: number,
  ): Promise<number> {
    try {
      const shippingPolicy = await this.policyService.getCurrentPolicyByType(
        POLICY_TYPES.SHIPPING,
      );
      const config =
        (shippingPolicy?.config as {
          standardShippingFee?: unknown;
          expressShippingFee?: unknown;
          freeShippingMinAmount?: unknown;
        }) ?? {};

      const standardFee = Number(config.standardShippingFee ?? 30000);
      const expressFee = Number(config.expressShippingFee ?? 50000);
      const freeShippingMinAmount = Number(config.freeShippingMinAmount ?? 0);

      const normalizedStandardFee =
        Number.isFinite(standardFee) && standardFee >= 0 ? standardFee : 30000;
      const normalizedExpressFee =
        Number.isFinite(expressFee) && expressFee >= 0 ? expressFee : 50000;
      const normalizedFreeMin =
        Number.isFinite(freeShippingMinAmount) && freeShippingMinAmount >= 0
          ? freeShippingMinAmount
          : 0;

      if (normalizedFreeMin > 0 && subtotal >= normalizedFreeMin) {
        return 0;
      }

      return shippingMethod === SHIPPING_METHOD.EXPRESS
        ? normalizedExpressFee
        : normalizedStandardFee;
    } catch {
      return shippingMethod === SHIPPING_METHOD.EXPRESS ? 50000 : 30000;
    }
  }

  /**
   * Generate unique order number
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `ORD-${timestamp}-${random}`;
  }

  /**
   * Create checkout session and initiate payment
   * Flow:
   * 1. Fetch user's cart from database
   * 2. Validate inventory (check stock for ready-made, allow pre-order)
   * 3. Create Order with PENDING_PAYMENT status
   * 4. Generate VNPAY payment URL
   * 5. Return payment URL to frontend
   */
  async createCheckout(
    customerId: string,
    createCheckoutDto: CreateCheckoutDto,
  ): Promise<{
    paymentUrl: string;
    orderId: string;
    orderNumber: string;
    txnRef: string;
    amount: number;
  }> {
    // Step 1: Fetch and validate cart
    const cartItems = await this.fetchCartItems(customerId);

    if (!cartItems || cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Step 2: Validate inventory and determine item types
    const checkoutItems: CheckoutItemDto[] = [];
    let hasPreorder = false;
    const prescriptionLensFee = await this.getPrescriptionLensFee();

    for (const item of cartItems) {
      const validation = await this.validateCartItem(item, prescriptionLensFee);

      if (item.requiresPrescription && !item.typedPrescription) {
        throw new BadRequestException(
          `Prescription data is required for ${item.productName || 'this item'}`,
        );
      }

      checkoutItems.push({
        productId: item.productId.toString(),
        variantSku: item.variantSku,
        quantity: item.quantity,
        price: validation.price,
        productName: item.productName,
        productImage: item.productImage,
        variantDetails: item.variantDetails,
        isPreorder: validation.isPreorder,
        requiresPrescription: item.requiresPrescription,
        typedPrescription: item.typedPrescription,
      });

      if (validation.isPreorder) {
        hasPreorder = true;
      }
    }

    // Step 3: Calculate totals (including combo pricing and promotion discounts)
    const calculation = await this.calculateCheckoutTotals(
      checkoutItems,
      customerId,
      createCheckoutDto.shippingMethod || SHIPPING_METHOD.STANDARD,
      createCheckoutDto.promotionCode,
      prescriptionLensFee,
    );

    // Step 4: Create order with PENDING_PAYMENT status
    const orderInfo = await this.createOrderFromCart(
      customerId,
      checkoutItems,
      calculation,
      createCheckoutDto,
      hasPreorder,
    );

    this.logger.log(
      `Created order ${orderInfo.orderNumber} for customer ${customerId}`,
    );

    // Step 5: Generate VNPAY payment URL
    // VNPay must call backend callback endpoints, then backend redirects frontend.
    const callbackBaseUrl = this.getBackendBaseUrl();
    const configuredReturnUrl = process.env.VNPAY_RETURN_URL || '';
    const configuredIpnUrl = process.env.VNPAY_IPN_URL || '';
    const returnUrl =
      configuredReturnUrl.includes('/checkout/vnpay-return') &&
      !configuredReturnUrl.includes(':5173')
        ? configuredReturnUrl
        : `${callbackBaseUrl}/checkout/vnpay-return`;
    const ipnUrl =
      configuredIpnUrl.includes('/checkout/vnpay-ipn') &&
      !configuredIpnUrl.includes(':5173')
        ? configuredIpnUrl
        : `${callbackBaseUrl}/checkout/vnpay-ipn`;

    // Store IPN URL in order info for VNPAY callback
    const orderDescription = `Payment for order ${orderInfo.orderNumber}`;

    const paymentResponse = await this.vnpayService.createPaymentUrl({
      orderId: orderInfo.orderId,
      orderNumber: orderInfo.orderNumber,
      amount: calculation.totalAmount,
      orderDescription,
      clientIp: createCheckoutDto.clientIp || '127.0.0.1',
      returnUrl,
      ipnUrl,
      locale: 'vn',
    });

    this.logger.log(
      `Generated VNPAY payment URL for order ${orderInfo.orderNumber}`,
    );

    return {
      paymentUrl: paymentResponse.paymentUrl,
      orderId: orderInfo.orderId,
      orderNumber: orderInfo.orderNumber,
      txnRef: paymentResponse.txnRef,
      amount: calculation.totalAmount,
    };
  }

  /**
   * Handle VNPAY IPN (Instant Payment Notification)
   * This is called by VNPAY server-to-server after payment
   * CRITICAL: Must be idempotent and secure
   */
  async handleVnpayIpn(
    params: Record<string, string | number | undefined>,
  ): Promise<VNPayIpnResponseDto> {
    try {
      // Verify VNPAY signature - convert params to proper format
      const callbackParams = this.normalizeVnpayParams(params);
      const verification =
        await this.vnpayService.verifyCallback(callbackParams);

      if (!verification.success) {
        this.logger.warn(
          `VNPAY IPN verification failed: ${verification.message}`,
        );
        return { RspCode: '97', Message: verification.message };
      }

      // Resolve order by txnRef first (most reliable), then fallback to orderInfo parsing.
      const order = await this.resolveOrderFromVnpParams(params);

      if (!order) {
        return { RspCode: '01', Message: 'Order not found' };
      }

      // IDEMPOTENCY: Check if order is already paid
      if (
        order.orderStatus === ORDER_STATUS.PAID ||
        order.orderStatus === ORDER_STATUS.CONFIRMED
      ) {
        this.logger.log(
          `Order ${order.orderNumber} already processed, skipping`,
        );
        return { RspCode: '00', Message: 'Confirm Success' };
      }

      // Process successful payment
      if (verification.responseCode === '00') {
        const orderId = order._id?.toString();
        if (!orderId) {
          return { RspCode: '99', Message: 'Order ID is invalid' };
        }

        await this.processSuccessfulPayment(orderId, verification, params);

        this.logger.log(
          `Payment processed successfully for order ${order.orderNumber}`,
        );
        return { RspCode: '00', Message: 'Confirm Success' };
      }

      // Payment failed
      this.logger.warn(
        `Payment failed for order ${order.orderNumber}: ${verification.message}`,
      );

      // Update order status to indicate payment failure
      await this.orderModel.updateOne(
        { _id: order._id },
        {
          orderStatus: ORDER_STATUS.PENDING_PAYMENT,
          $push: {
            history: {
              status: ORDER_STATUS.PENDING_PAYMENT,
              timestamp: new Date(),
              note: `Payment failed: ${verification.message}`,
            },
          },
        },
      );

      return { RspCode: '99', Message: verification.message };
    } catch (error) {
      this.logger.error(`Error processing VNPAY IPN: ${error.message}`);
      return { RspCode: '99', Message: 'System error' };
    }
  }

  /**
   * Handle VNPAY return URL (user browser redirect)
   */
  async handleVnpayReturn(params: Record<string, string>): Promise<{
    success: boolean;
    orderId?: string;
    orderNumber?: string;
    message: string;
  }> {
    // Convert string params to proper format for verification
    const callbackParams: VNPayCallbackParamsDto = {
      vnp_Amount: params.vnp_Amount || '',
      vnp_BankCode: params.vnp_BankCode || '',
      vnp_BankTranNo: params.vnp_BankTranNo || '',
      vnp_CardType: params.vnp_CardType || '',
      vnp_OrderInfo: params.vnp_OrderInfo || '',
      vnp_PayDate: params.vnp_PayDate || '',
      vnp_ResponseCode: params.vnp_ResponseCode || '',
      vnp_TmnCode: params.vnp_TmnCode || '',
      vnp_TransactionNo: params.vnp_TransactionNo || '',
      vnp_TxnRef: params.vnp_TxnRef || '',
      vnp_SecureHash: params.vnp_SecureHash || '',
      vnp_SecureHashType: params.vnp_SecureHashType,
      vnp_TransactionStatus: params.vnp_TransactionStatus,
    };

    const verification = await this.vnpayService.verifyCallback(callbackParams);
    const order = await this.resolveOrderFromVnpParams(params);

    if (!order) {
      return {
        success: false,
        message: 'Order not found',
      };
    }

    // Fallback flow: if IPN did not arrive, return handler finalizes payment once.
    if (
      verification.success &&
      verification.responseCode === '00' &&
      order.orderStatus === ORDER_STATUS.PENDING_PAYMENT
    ) {
      const orderId = order._id?.toString();
      if (!orderId) {
        return {
          success: false,
          message: 'Order ID is invalid',
        };
      }

      await this.processSuccessfulPayment(orderId, verification, params);
    }

    const orderId = order._id?.toString();

    return {
      success: verification.success,
      orderId,
      orderNumber: order.orderNumber,
      message: verification.message,
    };
  }

  /**
   * Process successful payment:
   * 1. Update order status to CONFIRMED
   * 2. Update inventory (decrease for ready-made, set preorder status for pre-orders)
   * 3. Clear user's cart
   */
  private async processSuccessfulPayment(
    orderId: string,
    verification: VNPayVerificationResultDto,
    params: Record<string, string | number | undefined>,
  ): Promise<void> {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const transactionId =
      verification.transactionId ||
      this.safeString(params['vnp_TransactionNo']);
    const txnRef = this.safeString(params['vnp_TxnRef']);
    const paidAt = this.parseVnpPayDate(this.safeString(params['vnp_PayDate']));

    // Update order status
    order.orderStatus = ORDER_STATUS.PAID;
    order.payment = {
      method: 'VNPAY',
      amount: order.totalAmount,
      transactionId,
      paidAt,
      bankCode:
        verification.bankCode || this.safeString(params['vnp_BankCode']),
      bankTransactionNo: this.safeString(params['vnp_BankTranNo']),
      cardType: this.safeString(params['vnp_CardType']),
      txnRef,
      responseCode: verification.responseCode,
      vnpPayDate: paidAt,
    };

    // Process order items and update inventory
    for (const item of order.items) {
      if (item.isPreorder) {
        // Pre-order: Update preorder status to PENDING_STOCK
        item.preorderStatus = PREORDER_STATUS.PENDING_STOCK;
      } else {
        // Ready-made: Reserve stock only after payment success
        if (item.variantSku) {
          await this.inventoryService.reserveStock(
            item.variantSku,
            orderId,
            item.quantity,
          );
        }
      }
    }

    await order.save();

    // Add to order history
    order.history.push({
      status: ORDER_STATUS.PAID,
      timestamp: new Date(),
      note: `Payment received via VNPAY. Transaction ID: ${transactionId}`,
    });
    await order.save();

    // Clear user's cart after successful payment
    await this.cartService.clearCart(order.customerId.toString());

    this.logger.log(
      `Order ${order.orderNumber} payment processed and cart cleared`,
    );
  }

  /**
   * Fetch cart items with product details
   */
  private async fetchCartItems(
    customerId: string,
  ): Promise<AggregatedCartItem[]> {
    const pipeline: PipelineStage[] = [
      {
        $match: { customerId: new mongoose.Types.ObjectId(customerId) },
      },
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
              if: { $ifNull: ['$items.variantSku', false] },
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
              { $ifNull: ['$items.variantSku', false] },
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
        $project: {
          _id: '$items._id',
          productId: '$items.productId',
          variantSku: '$items.variantSku',
          quantity: '$items.quantity',
          addedAt: '$items.addedAt',
          productName: '$items.productName',
          productImage: '$items.productImage',
          price: '$items.price',
          variantDetails: '$items.variantDetails',
          requiresPrescription: '$items.requiresPrescription',
          typedPrescription: '$items.typedPrescription',
          product: 1,
        },
      },
    ];

    const result = await this.cartModel.aggregate(pipeline).exec();
    return result as AggregatedCartItem[];
  }

  /**
   * Validate cart item and determine if it's a pre-order
   */
  private async validateCartItem(
    item: AggregatedCartItem,
    prescriptionLensFee = 0,
  ): Promise<{
    price: number;
    isPreorder: boolean;
    errorMessage?: string;
  }> {
    if (!item.product) {
      throw new BadRequestException('Product information not found');
    }

    const product = item.product;

    if (!product.isActive) {
      throw new BadRequestException(`Product ${product.name} is not available`);
    }

    let price = product.basePrice;
    let isPreorder = false;

    if (item.variantSku) {
      const variant = product.variants?.find((v) => v.sku === item.variantSku);

      if (!variant) {
        throw new BadRequestException('Variant not found');
      }

      if (!variant.isActive) {
        throw new BadRequestException('Variant is not available');
      }

      price = variant.price;
      const inventory = await this.inventoryService.findBySku(item.variantSku);

      if (!inventory) {
        throw new BadRequestException(
          'Inventory information not found for this variant',
        );
      }

      // Pre-order is only allowed when there is no sellable stock.
      const availableStock = inventory.availableQuantity;
      const preorderEnabled = product.isPreorderEnabled || false;
      const canFulfillFromStock = item.quantity <= availableStock;
      const canProceedAsPreorder =
        item.quantity > availableStock && preorderEnabled;
      isPreorder = canProceedAsPreorder;

      if (!canFulfillFromStock && !canProceedAsPreorder) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name} (${variant.size}/${variant.color}). Only ${availableStock} available.`,
        );
      }
    } else {
      // Product without variant - check base inventory
      // For lens products, use LENS-{slug} format
      // For service products, use product._id format (services don't have inventory)
      let inventorySku: string;
      if (product.category === PRODUCT_CATEGORIES.LENSES && product.slug) {
        inventorySku = `LENS-${product.slug}`;
      } else {
        inventorySku = product._id.toString();
      }

      const inventory = await this.inventoryService.findBySku(inventorySku);

      // For service products, inventory check is optional
      const isServiceProduct = product.category === PRODUCT_CATEGORIES.SERVICES;
      if (!inventory && !isServiceProduct) {
        throw new BadRequestException(
          'Inventory information not found for this product',
        );
      }

      if (inventory && inventory.availableQuantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}. Only ${inventory.availableQuantity} available.`,
        );
      }
    }

    const finalPrice =
      price + (item.requiresPrescription ? prescriptionLensFee : 0);

    return { price: finalPrice, isPreorder };
  }

  /**
   * Calculate checkout totals (subtotal + shipping + discounts)
   * Includes combo pricing and promotion discounts
   */
  private async calculateCheckoutTotals(
    items: CheckoutItemDto[],
    customerId: string,
    shippingMethod: SHIPPING_METHOD,
    promotionCode?: string,
    prescriptionLensFee = 0,
  ): Promise<CheckoutCalculation> {
    const prescriptionLensFeeTotal = items.reduce(
      (sum, item) =>
        sum + (item.requiresPrescription ? prescriptionLensFee * item.quantity : 0),
      0,
    );

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const shippingFee = await this.getShippingFee(shippingMethod, subtotal);

    // Check for combo pricing
    let comboDiscount = 0;
    let appliedCombo;

    const comboResult = await this.cartService.checkComboPricing(customerId);
    if (comboResult.hasCombo && comboResult.combo) {
      comboDiscount = comboResult.combo.discountAmount;
      appliedCombo = {
        id: comboResult.combo.id,
        name: comboResult.combo.name,
        discountAmount: comboResult.combo.discountAmount,
      };
    }

    // Check for promotion discount
    let promotionDiscount = 0;
    let appliedPromotion;

    if (promotionCode) {
      const productIds = items.map((item) => item.productId);

      const promotionResult = await this.promotionService.validateCode(
        promotionCode,
        subtotal - comboDiscount,
        productIds,
        customerId,
      );

      if (promotionResult.isValid && promotionResult.discountAmount) {
        promotionDiscount = promotionResult.discountAmount;
        appliedPromotion = {
          code: promotionCode.toUpperCase(),
          discountAmount: promotionDiscount,
          promotionId: promotionResult.promotion?._id?.toString(),
        };

        // Increment promotion usage count
        if (promotionResult.promotion) {
          await this.promotionService.incrementUsage(
            promotionResult.promotion._id.toString(),
          );
        }
      }
    }

    const totalAmount =
      subtotal + shippingFee - comboDiscount - promotionDiscount;

    return {
      subtotal,
      prescriptionLensFeeTotal,
      shippingFee,
      comboDiscount,
      promotionDiscount,
      totalAmount: Math.max(0, totalAmount),
      items,
      appliedPromotion,
      appliedCombo,
    };
  }

  /**
   * Create order from cart items
   */
  private async createOrderFromCart(
    customerId: string,
    items: CheckoutItemDto[],
    calculation: CheckoutCalculation,
    checkoutDto: CreateCheckoutDto,
    hasPreorder: boolean,
  ): Promise<CheckoutOrderInfo> {
    // Generate order number
    const orderNumber = this.generateOrderNumber();

    // Determine order type
    let orderType = ORDER_TYPES.READY;
    if (hasPreorder) {
      orderType = ORDER_TYPES.PREORDER;
    }
    // Can add logic for PRESCRIPTION type if needed

    // Create order items
    const orderItems: OrderItem[] = items.map((item) => ({
      productId: new mongoose.Types.ObjectId(item.productId),
      itemId: new mongoose.Types.ObjectId().toString(),
      variantSku: item.variantSku || '',
      quantity: item.quantity,
      priceAtOrder: item.price,
      isPreorder: item.isPreorder || false,
      preorderStatus: item.isPreorder
        ? PREORDER_STATUS.PENDING_STOCK
        : undefined,
      expectedShipDate: item.isPreorder ? undefined : undefined,
      reservedQuantity: 0,
      requiresPrescription: item.requiresPrescription || false,
      typedPrescription: item.typedPrescription,
      prescriptionReviewStatus:
        item.requiresPrescription && item.typedPrescription
          ? PRESCRIPTION_REVIEW_STATUS.PENDING_REVIEW
          : undefined,
      prescriptionReviewNote: undefined,
    }));

    // Create order
    const order = await this.orderModel.create({
      orderNumber,
      customerId: new mongoose.Types.ObjectId(customerId),
      orderType,
      orderStatus: ORDER_STATUS.PENDING_PAYMENT,
      items: orderItems,
      subtotal: calculation.subtotal,
      shippingFee: calculation.shippingFee,
      comboDiscount: calculation.comboDiscount || 0,
      comboId: calculation.appliedCombo?.id,
      promotionDiscount: calculation.promotionDiscount || 0,
      prescriptionLensFeeTotal: calculation.prescriptionLensFeeTotal || 0,
      promotionCode: calculation.appliedPromotion?.code,
      promotionId: calculation.appliedPromotion?.promotionId
        ? new mongoose.Types.ObjectId(calculation.appliedPromotion.promotionId)
        : undefined,
      totalAmount: calculation.totalAmount,
      tax: 0,
      shippingAddress: checkoutDto.shippingAddress,
      notes: checkoutDto.notes || '',
      history: [
        {
          status: ORDER_STATUS.PENDING_PAYMENT,
          timestamp: new Date(),
          note: 'Order created, awaiting payment',
        },
      ],
    });

    return {
      orderId: order._id.toString(),
      orderNumber,
      customerId,
      totalAmount: calculation.totalAmount,
      items: orderItems.map((item) => ({
        productId: item.productId.toString(),
        variantSku: item.variantSku,
        quantity: item.quantity,
        priceAtOrder: item.priceAtOrder,
        isPreorder: item.isPreorder,
        requiresPrescription: item.requiresPrescription,
      })),
    };
  }

  /**
   * Extract order info from VNPAY order info string
   */
  private extractOrderInfo(
    orderInfoStr?: string,
  ): { orderId: string; orderNumber: string } | undefined {
    if (!orderInfoStr) return undefined;

    // Expected format: "Payment for order ORD-2024-001234"
    // or format with orderId: "Payment for order ORD-2024-001234 (ID: 507f1f77bcf86cd799439011)"

    const match = orderInfoStr.match(/order\s+([A-Z]+-\d+-\d+)/);
    if (!match) return undefined;

    const orderNumber = match[1];
    return { orderNumber, orderId: '' }; // orderId can be fetched from DB
  }

  private async resolveOrderFromVnpParams(
    params: VnpParamMap,
  ): Promise<Order | null> {
    const txnRef = String(params['vnp_TxnRef'] || '').trim();
    if (txnRef) {
      const byTxnRef = await this.orderModel.findOne({ orderNumber: txnRef });
      if (byTxnRef) {
        return byTxnRef;
      }
    }

    const orderInfo = this.extractOrderInfo(
      this.safeString(params['vnp_OrderInfo']),
    );
    if (orderInfo?.orderNumber) {
      return this.orderModel.findOne({ orderNumber: orderInfo.orderNumber });
    }

    return null;
  }

  private parseVnpPayDate(vnpPayDate?: string): Date {
    if (!vnpPayDate || vnpPayDate.length !== 14) {
      return new Date();
    }

    const year = Number(vnpPayDate.slice(0, 4));
    const month = Number(vnpPayDate.slice(4, 6)) - 1;
    const day = Number(vnpPayDate.slice(6, 8));
    const hour = Number(vnpPayDate.slice(8, 10));
    const minute = Number(vnpPayDate.slice(10, 12));
    const second = Number(vnpPayDate.slice(12, 14));

    const parsed = new Date(year, month, day, hour, minute, second);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  /**
   * Normalize VNPAY callback params to proper DTO format
   * Handles string/number conversion and undefined values
   */
  private normalizeVnpayParams(
    params: Record<string, string | number | undefined>,
  ): VNPayCallbackParamsDto {
    const toString = (val: string | number | undefined): string => {
      if (val === undefined || val === null) return '';
      return String(val);
    };

    return {
      vnp_Amount: toString(params.vnp_Amount),
      vnp_BankCode: toString(params.vnp_BankCode),
      vnp_BankTranNo: toString(params.vnp_BankTranNo),
      vnp_CardType: toString(params.vnp_CardType),
      vnp_OrderInfo: toString(params.vnp_OrderInfo),
      vnp_PayDate: toString(params.vnp_PayDate),
      vnp_ResponseCode: toString(params.vnp_ResponseCode),
      vnp_TmnCode: toString(params.vnp_TmnCode),
      vnp_TransactionNo: toString(params.vnp_TransactionNo),
      vnp_TxnRef: toString(params.vnp_TxnRef),
      vnp_SecureHash: toString(params.vnp_SecureHash),
      vnp_SecureHashType: params.vnp_SecureHashType
        ? toString(params.vnp_SecureHashType)
        : undefined,
      vnp_TransactionStatus: params.vnp_TransactionStatus
        ? toString(params.vnp_TransactionStatus)
        : undefined,
    };
  }

  /**
   * Safely convert a value to string, handling undefined and null
   */
  private safeString(value: string | number | undefined | null): string {
    if (value === undefined || value === null) return '';
    return String(value);
  }

  private getBackendBaseUrl(): string {
    const port = process.env.PORT || '8386';
    return `http://localhost:${port}`;
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    return this.orderModel.findOne({ orderNumber });
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    return this.orderModel.findById(orderId);
  }
}
