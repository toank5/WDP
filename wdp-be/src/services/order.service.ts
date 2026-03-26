import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import mongoose from 'mongoose';
import { Order } from '../commons/schemas/order.schema';
import { OrderItem } from '../commons/schemas/order-item.schema';
import { Product } from '../commons/schemas/product.schema';
import { ProductVariant } from '../commons/schemas/product-variant.schema';
import { User } from '../commons/schemas/user.schema';
import { WorkOrder } from '../commons/schemas/work-order.schema';
import { CartService } from './cart.service';
import { VNPayService } from './vnpay.service';
import { InventoryService } from './inventory.service';
import { CloudinaryService } from '../commons/services/cloudinary.service';
import { PromotionService } from './promotion.service';
import {
  CreateOrderDto,
  OrderResponseDto,
  CheckoutResponseDto,
  UpdateOrderStatusDto,
  ApproveOrderDto,
  UpdateManufacturingStatusDto,
  CancelOrderDto,
  OrderListQueryDto,
  OrderListResponseDto,
  ReviewPrescriptionDto,
  PrescriptionQueueQueryDto,
  LabJobQueryDto,
  LabJobResponseDto,
  UpdateLabJobStatusDto,
  SHIPPING_METHODS,
} from '../dtos/order.dto';

import {
  ORDER_STATUS,
  ORDER_TYPES,
  PREORDER_STATUS,
  PRESCRIPTION_REVIEW_STATUS,
  LAB_JOB_STATUS,
} from '../shared';
import { Request } from 'express';
import {
  VNPayCallbackParamsDto,
  VNPayVerificationResultDto,
} from '../dtos/vnpay.dto';
import { EmailService } from '../mail/email.service';

type OrderStatusPredicate =
  | ORDER_STATUS
  | {
      $in: ORDER_STATUS[];
    };

type OrderBaseQuery = {
  orderStatus?: OrderStatusPredicate;
  'items.isPreorder'?: boolean;
  $or?: Array<{
    orderStatus: OrderStatusPredicate;
    'items.isPreorder'?: boolean;
  }>;
};

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(WorkOrder.name) private workOrderModel: Model<WorkOrder>,
    @InjectModel(ProductVariant.name)
    private productVariantModel: Model<ProductVariant>,
    private readonly cartService: CartService,
    private readonly vnpayService: VNPayService,
    private readonly inventoryService: InventoryService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly promotionService: PromotionService,
    private readonly emailService: EmailService,
  ) {}

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
   * Calculate shipping fee
   */
  private calculateShippingFee(shippingMethod: string): number {
    if (shippingMethod === 'EXPRESS') {
      return SHIPPING_METHODS.EXPRESS.fee;
    }
    return SHIPPING_METHODS.STANDARD.fee;
  }

  /**
   * Calculate tax (10% of subtotal)
   */
  private calculateTax(subtotal: number): number {
    return Math.round(subtotal * 0.1);
  }

  /**
   * Process checkout - create order from cart
   */
  async checkout(
    customerId: string,
    createOrderDto: CreateOrderDto,
    clientIp: string,
    frontendUrl: string,
  ): Promise<CheckoutResponseDto> {
    // Validate cart items
    const validation = await this.cartService.validateCartItems(customerId);
    if (!validation.valid) {
      throw new BadRequestException(
        `Some items are not available: ${validation.invalidItems.map((i) => i.reason).join(', ')}`,
      );
    }

    const {
      items,
      shippingAddress,
      shippingMethod,
      payment,
      orderType,
      notes,
      promotionCode,
    } = createOrderDto;

    // Calculate totals
    const subtotal = items.reduce(
      (sum, item) => sum + item.priceAtOrder * item.quantity,
      0,
    );
    const shippingFee = this.calculateShippingFee(shippingMethod);
    const tax = this.calculateTax(subtotal);

    // Validate and apply promotion code if provided
    let promotionDiscount = 0;
    let appliedPromotionId: string | undefined;
    let appliedPromotionCode: string | undefined;

    if (promotionCode) {
      console.log('[OrderService] Validating promotion code:', promotionCode);
      const productIds = items.map((item) => item.productId);
      const validationResult = await this.promotionService.validateCode(
        promotionCode,
        subtotal,
        productIds,
        customerId,
      );

      console.log('[OrderService] Validation result:', {
        isValid: validationResult.isValid,
        discountAmount: validationResult.discountAmount,
        promotion: validationResult.promotion,
        promotionId: validationResult.promotion?._id,
        promotionIdType: typeof validationResult.promotion?._id,
      });

      if (!validationResult.isValid) {
        throw new BadRequestException(
          validationResult.message || 'Invalid promotion code',
        );
      }

      promotionDiscount = validationResult.discountAmount || 0;

      // Extract promotionId - handle both string and ObjectId formats
      const promoId = validationResult.promotion?._id;
      if (promoId) {
        appliedPromotionId =
          typeof promoId === 'string' ? promoId : String(promoId);
        console.log(
          '[OrderService] Extracted promotionId:',
          appliedPromotionId,
        );
      }
      appliedPromotionCode = validationResult.promotion?.code;

      console.log('[OrderService] Final discount applied:', {
        promotionCode,
        promotionDiscount,
        subtotal,
        totalAmount: subtotal + shippingFee + tax - promotionDiscount,
      });

      // Increment promotion usage count
      if (appliedPromotionId) {
        await this.promotionService.incrementUsage(appliedPromotionId);
      }
    }

    // Calculate final total: subtotal + shipping + tax - promotion discount
    const totalAmount = subtotal + shippingFee + tax - promotionDiscount;

    // Generate order number
    const orderNumber = this.generateOrderNumber();

    // Debug: Log promotion details before creating order
    console.log('[OrderService] Creating order with promotion details:', {
      appliedPromotionId,
      appliedPromotionCode,
      promotionDiscount,
      promotionIdType: typeof appliedPromotionId,
    });

    // Prepare promotionId - wrap in try-catch to handle invalid ObjectId
    let promotionObjectId: Types.ObjectId | undefined;
    if (appliedPromotionId) {
      try {
        promotionObjectId = new Types.ObjectId(appliedPromotionId);
        console.log(
          '[OrderService] Created ObjectId:',
          promotionObjectId.toString(),
        );
      } catch (error) {
        console.error(
          '[OrderService] Failed to create ObjectId from:',
          appliedPromotionId,
          error,
        );
        // Continue without promotionId if conversion fails
      }
    }

    // Create order - use new Document() + save() for better type inference
    const order = new this.orderModel({
      orderNumber,
      customerId: new Types.ObjectId(customerId),
      orderType: orderType || ORDER_TYPES.READY,
      orderStatus: ORDER_STATUS.PENDING_PAYMENT,
      items: items.map((item) => ({
        productId: new mongoose.Types.ObjectId(item.productId),
        variantSku: item.variantSku,
        quantity: item.quantity,
        priceAtOrder: item.priceAtOrder,
        requiresPrescription: item.requiresPrescription || false,
        typedPrescription: item.typedPrescription,
        prescriptionReviewStatus:
          item.requiresPrescription && item.typedPrescription
            ? PRESCRIPTION_REVIEW_STATUS.PENDING_REVIEW
            : undefined,
      })),
      subtotal,
      shippingFee,
      tax,
      promotionDiscount,
      promotionId: promotionObjectId,
      promotionCode: appliedPromotionCode,
      totalAmount,
      shippingAddress,
      payment: {
        method: payment.method,
        amount: totalAmount,
      },
      tracking: null,
      notes: notes || '',
      history: [
        {
          status: ORDER_STATUS.PENDING_PAYMENT,
          timestamp: new Date(),
          note: promotionCode
            ? `Order placed with promotion code: ${promotionCode}`
            : 'Order placed, awaiting payment',
        },
      ],
    });
    await order.save();

    // Debug: Log saved order promotion details
    console.log('[OrderService] Order saved with promotion details:', {
      orderId: order._id.toString(),
      promotionId: order.promotionId?.toString(),
      promotionCode: order.promotionCode,
      promotionDiscount: order.promotionDiscount,
    });

    // Generate payment URL if VNPAY
    let paymentUrl: string | undefined;

    if (payment.method === 'VNPAY') {
      const returnUrl = `${frontendUrl}/order-success/${order._id}`;
      const paymentRequest = {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        amount: totalAmount,
        orderDescription: `Payment for order ${orderNumber}`,
        clientIp,
        returnUrl,
      };

      const vnpayResponse =
        await this.vnpayService.createPaymentUrl(paymentRequest);
      paymentUrl = vnpayResponse.paymentUrl;

      // Update order with transaction reference
      order.payment.transactionId = vnpayResponse.txnRef;
      await order.save();
    }

    // Enrich order with product details for response
    const orderResponse = await this.getOrderWithDetails(order._id.toString());

    return {
      order: orderResponse,
      paymentUrl,
    };
  }

  /**
   * Handle VNPay payment callback
   */
  async handleVNPayCallback(
    orderId: string,
    callback: VNPayCallbackParamsDto,
  ): Promise<VNPayVerificationResultDto> {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify callback
    const result = await this.vnpayService.verifyCallback(callback);

    // Update order based on payment result
    if (result.success) {
      order.payment.paidAt = new Date();
      order.payment.transactionId =
        result.transactionId || callback.vnp_TransactionNo;
      order.orderStatus = ORDER_STATUS.PAID;

      // Reserve stock
      await this.reserveStock(order.items, order._id.toString());

      // Add to history
      order.history.push({
        status: ORDER_STATUS.PAID,
        timestamp: new Date(),
        note: 'Payment successful via VNPay',
      });

      const hasPrescriptionItems = order.items.some(
        (item) => item.requiresPrescription,
      );

      if (!hasPrescriptionItems) {
        order.orderStatus = ORDER_STATUS.PROCESSING;
        order.history.push({
          status: ORDER_STATUS.PROCESSING,
          timestamp: new Date(),
          note: 'No prescription review required. Order moved to PROCESSING.',
        });
      }
    } else {
      order.orderStatus = ORDER_STATUS.RETURNED;

      // Add to history
      order.history.push({
        status: ORDER_STATUS.RETURNED,
        timestamp: new Date(),
        note: `Payment failed: ${result.message}`,
      });
    }

    await order.save();

    return result;
  }

  /**
   * Reserve stock for order items on successful payment
   * Skips reservation for pre-order items (they don't have stock yet)
   *
   * @param orderItems Array of order items
   * @param orderId Order ID for tracking
   */
  private async reserveStock(
    orderItems: OrderItem[],
    orderId: string,
  ): Promise<void> {
    for (const item of orderItems) {
      if (!item.variantSku) {
        continue;
      }

      // Exception: Skip reservation for pre-order items
      // Pre-orders don't have stock available yet, they will be reserved when stock arrives
      if (item.isPreorder) {
        continue;
      }

      // Reserve the specific quantity from the order item
      await this.inventoryService.reserveStock(
        item.variantSku,
        orderId,
        item.quantity,
      );
    }
  }

  /**
   * Release reserved stock
   */
  private async releaseStock(orderId: string): Promise<void> {
    const order = await this.orderModel.findById(orderId);
    if (!order) return;

    for (const item of order.items) {
      if (item.variantSku) {
        await this.inventoryService.releaseStock(orderId, item.variantSku);
      }
    }
  }

  /**
   * Confirm stock (when order is shipped)
   */
  private async confirmStock(orderId: string): Promise<void> {
    const order = await this.orderModel.findById(orderId);
    if (!order) return;

    for (const item of order.items) {
      if (item.variantSku) {
        await this.inventoryService.confirmStock(orderId, item.variantSku);
      }
    }
  }

  /**
   * Get user's orders with pagination
   */
  async getCustomerOrders(
    customerId: string,
    query: OrderListQueryDto,
  ): Promise<OrderListResponseDto> {
    const {
      status,
      search,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query using mongoose query builder
    const orderQuery = this.orderModel.find({
      customerId: new Types.ObjectId(customerId),
    });

    if (status) {
      orderQuery.where('orderStatus').equals(status);
    }

    if (search) {
      orderQuery.or([
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
      ]);
    }

    // Count total - clone the query conditions
    const countQuery = this.orderModel.find({
      customerId: new Types.ObjectId(customerId),
    });
    if (status) {
      countQuery.where('orderStatus').equals(status);
    }
    if (search) {
      countQuery.or([
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
      ]);
    }
    const total = await countQuery.countDocuments();

    // Get orders
    const orders = await orderQuery
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limitNum)
      .exec();

    // Enrich with product details
    const enrichedOrders = await Promise.all(
      orders.map(async (order) =>
        this.getOrderWithDetails(order._id.toString()),
      ),
    );

    return {
      orders: enrichedOrders,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Get operations order queue with pagination
   * (no customer scoping, restricted by controller RBAC)
   */
  async getOperationsOrders(
    query: OrderListQueryDto,
  ): Promise<OrderListResponseDto> {
    const {
      search,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      showAll,
    } = query;

    console.log('🔍 [getOperationsOrders] Query params:', {
      status,
      showAll,
      search,
      page,
      limit,
    });

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // If showAll is true, show all orders (no status filter)
    // If status is explicitly filtered, use it
    // Otherwise use default queue behavior
    let baseQuery: OrderBaseQuery;
    if (showAll === 'true') {
      console.log('📋 Using showAll mode - returning ALL orders');
      baseQuery = {}; // No filter, show all orders
    } else if (status) {
      console.log('📋 Filtering by status:', status);
      baseQuery = { orderStatus: status };
    } else {
      console.log(
        '📋 Using default Operations queue (PROCESSING + PAID/CONFIRMED preorders)',
      );
      // Default: Operations can see active work queue
      // 1. PROCESSING orders (ready to fulfill - approved by sales)
      // 2. READY_TO_SHIP orders (waiting shipping handoff)
      // 3. PAID/CONFIRMED orders with preorder items (waiting for stock allocation)
      baseQuery = {
        $or: [
          { orderStatus: ORDER_STATUS.PROCESSING },
          { orderStatus: ORDER_STATUS.READY_TO_SHIP },
          {
            orderStatus: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.CONFIRMED] },
            'items.isPreorder': true,
          },
        ],
      };
    }

    const orderQuery = this.orderModel.find(baseQuery);

    if (search) {
      orderQuery.or([
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
      ]);
    }

    // Count total - clone the query conditions
    const countQuery = this.orderModel.find(baseQuery);
    if (search) {
      countQuery.or([
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
      ]);
    }
    const total = await countQuery.countDocuments();

    // Get orders
    const orders = await orderQuery
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limitNum)
      .exec();

    // Enrich with product details
    const enrichedOrders = await Promise.all(
      orders.map(async (order) =>
        this.getOrderWithDetails(order._id.toString()),
      ),
    );

    return {
      orders: enrichedOrders,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Get sales pending-approval queue:
   * - normal orders: PAID/CONFIRMED
   * - pre-orders: PAID/CONFIRMED (visibility), approval still requires stock-ready
   * If status filter is provided, shows filtered orders instead
   */
  async getSalesPendingApprovalOrders(
    query: OrderListQueryDto,
  ): Promise<OrderListResponseDto> {
    const {
      search,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      showAll,
    } = query;

    console.log('🔍 [getSalesPendingApprovalOrders] Query params:', {
      status,
      showAll,
      search,
      page,
      limit,
    });

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // If showAll is true, show all orders (no status filter)
    // If status is explicitly filtered, use it
    // Otherwise use default queue behavior for Sales
    let baseQuery: OrderBaseQuery;
    if (showAll === 'true') {
      console.log('📋 Using showAll mode - returning ALL orders');
      baseQuery = {}; // No filter, show all orders
    } else if (status) {
      console.log('📋 Filtering by status:', status);
      baseQuery = { orderStatus: status };
    } else {
      console.log('📋 Using default Sales queue (PAID/CONFIRMED orders)');
      // Default: Sales sees pending approval orders
      baseQuery = {
        orderStatus: {
          $in: [ORDER_STATUS.PAID, ORDER_STATUS.CONFIRMED],
        },
      };
    }

    const paidOrderQuery = this.orderModel.find(baseQuery);

    if (search) {
      paidOrderQuery.or([
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
      ]);
    }

    const paidOrders = await paidOrderQuery
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .exec();

    const total = paidOrders.length;
    const pagedOrders = paidOrders.slice(skip, skip + limitNum);

    const enrichedOrders = await Promise.all(
      pagedOrders.map(async (order) =>
        this.getOrderWithDetails(order._id.toString()),
      ),
    );

    return {
      orders: enrichedOrders,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Sales gatekeeper action:
   * Approve order and send to operations queue.
   */
  async approveOrderForOperations(
    orderId: string,
    approvalDto: ApproveOrderDto,
    approvedBy?: string,
  ): Promise<OrderResponseDto> {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      order.orderStatus !== ORDER_STATUS.PAID &&
      order.orderStatus !== ORDER_STATUS.CONFIRMED
    ) {
      throw new BadRequestException(
        `Only PAID/CONFIRMED orders can be approved. Current status: ${order.orderStatus}`,
      );
    }

    const preorderItems = order.items.filter((item) => item.isPreorder);
    if (preorderItems.length > 0) {
      const notReady = preorderItems.find(
        (item) => item.preorderStatus !== PREORDER_STATUS.READY_TO_FULFILL,
      );

      if (notReady) {
        throw new BadRequestException(
          'Pre-order stock is not ready. Wait until preorder status is READY_TO_FULFILL.',
        );
      }
    }

    if (!this.areAllPrescriptionItemsApproved(order)) {
      throw new BadRequestException(
        'Prescription items are not fully approved. Review prescription items first.',
      );
    }

    order.orderStatus = ORDER_STATUS.PROCESSING;

    order.history.push({
      status: ORDER_STATUS.PROCESSING,
      changedBy: approvedBy ? new Types.ObjectId(approvedBy) : undefined,
      timestamp: new Date(),
      note:
        approvalDto.note || 'Approved by Sales and sent to Operations queue',
    });

    await order.save();
    return this.getOrderWithDetails(orderId);
  }

  async getPrescriptionQueue(
    query: PrescriptionQueueQueryDto,
  ): Promise<OrderResponseDto[]> {
    const filterStatus =
      query.status || PRESCRIPTION_REVIEW_STATUS.PENDING_REVIEW;
    const orders = await this.orderModel
      .find({
        items: {
          $elemMatch: {
            requiresPrescription: true,
            prescriptionReviewStatus: filterStatus,
          },
        },
      })
      .sort({ createdAt: -1 })
      .exec();

    const mapped = await Promise.all(
      orders.map((order) => this.getOrderWithDetails(String(order._id))),
    );

    return mapped.map((order) => ({
      ...order,
      items: order.items.filter(
        (item) =>
          item.requiresPrescription &&
          item.prescriptionReviewStatus === filterStatus,
      ),
    }));
  }

  async getPrescriptionOrderItem(orderItemId: string): Promise<{
    order: OrderResponseDto;
    item: OrderResponseDto['items'][number];
  }> {
    const order = await this.orderModel.findOne({
      'items.itemId': orderItemId,
    });
    if (!order) {
      throw new NotFoundException('Prescription item not found');
    }

    const enriched = await this.getOrderWithDetails(String(order._id));
    const item = enriched.items.find((i) => i.itemId === orderItemId);
    if (!item) {
      throw new NotFoundException('Prescription item not found');
    }

    return { order: enriched, item };
  }

  async reviewPrescription(
    orderItemId: string,
    dto: ReviewPrescriptionDto,
    reviewedBy?: string,
  ): Promise<{ order: OrderResponseDto; workOrder?: LabJobResponseDto }> {
    if (
      dto.status === PRESCRIPTION_REVIEW_STATUS.REJECTED &&
      !dto.note?.trim()
    ) {
      throw new BadRequestException('Rejection note is required');
    }

    if (
      dto.status !== PRESCRIPTION_REVIEW_STATUS.APPROVED &&
      dto.status !== PRESCRIPTION_REVIEW_STATUS.REJECTED
    ) {
      throw new BadRequestException('Only APPROVED or REJECTED are allowed');
    }

    const order = await this.orderModel.findOne({
      'items.itemId': orderItemId,
    });
    if (!order) {
      throw new NotFoundException('Prescription item not found');
    }

    const item = order.items.find((i) => i.itemId === orderItemId);
    if (!item || !item.requiresPrescription) {
      throw new NotFoundException('Prescription item not found');
    }

    item.prescriptionReviewStatus = dto.status;
    item.prescriptionReviewNote = dto.note?.trim() || undefined;

    order.history.push({
      status: order.orderStatus,
      changedBy: reviewedBy ? new Types.ObjectId(reviewedBy) : undefined,
      timestamp: new Date(),
      note: `Prescription ${dto.status} for item ${orderItemId}${dto.note ? `: ${dto.note}` : ''}`,
    });

    if (dto.status === PRESCRIPTION_REVIEW_STATUS.REJECTED) {
      await order.save();
      await this.notifyPrescriptionRejected(order, item);
      return { order: await this.getOrderWithDetails(String(order._id)) };
    }

    const workOrder = await this.createWorkOrderFromOrderItem(order, item);

    if (this.areAllPrescriptionItemsApproved(order)) {
      if (order.orderStatus === ORDER_STATUS.PAID) {
        order.orderStatus = ORDER_STATUS.PROCESSING;
        order.history.push({
          status: ORDER_STATUS.PROCESSING,
          changedBy: reviewedBy ? new Types.ObjectId(reviewedBy) : undefined,
          timestamp: new Date(),
          note: 'All prescription items approved. Order moved to PROCESSING.',
        });
      }
    }

    await order.save();

    return {
      order: await this.getOrderWithDetails(String(order._id)),
      workOrder,
    };
  }

  async getLabJobs(query: LabJobQueryDto): Promise<LabJobResponseDto[]> {
    const statuses = query.status
      ? [query.status]
      : [LAB_JOB_STATUS.PENDING, LAB_JOB_STATUS.IN_PROGRESS];

    const jobs = await this.workOrderModel
      .find({ status: { $in: statuses } })
      .sort({ createdAt: -1 })
      .exec();

    return Promise.all(jobs.map((job) => this.mapLabJob(job)));
  }

  async updateLabJobStatus(
    workOrderId: string,
    dto: UpdateLabJobStatusDto,
    updatedBy?: string,
  ): Promise<LabJobResponseDto> {
    const workOrder = await this.workOrderModel.findById(workOrderId);
    if (!workOrder) {
      throw new NotFoundException('Lab job not found');
    }

    if (dto.status === LAB_JOB_STATUS.ISSUE && !dto.note?.trim()) {
      throw new BadRequestException(
        'Issue note is required when setting status to ISSUE',
      );
    }

    workOrder.status = dto.status;
    workOrder.notes = dto.note || workOrder.notes;
    await workOrder.save();

    const order = await this.orderModel.findById(workOrder.orderId);
    if (order) {
      order.history.push({
        status: order.orderStatus,
        changedBy: updatedBy ? new Types.ObjectId(updatedBy) : undefined,
        timestamp: new Date(),
        note: `Lab job ${String(workOrder._id)} updated to ${dto.status}${dto.note ? `: ${dto.note}` : ''}`,
      });

      if (dto.status === LAB_JOB_STATUS.COMPLETED) {
        const allCompleted = await this.areAllOrderWorkOrdersCompleted(
          String(order._id),
        );

        if (allCompleted && order.orderStatus === ORDER_STATUS.PROCESSING) {
          order.orderStatus = ORDER_STATUS.READY_TO_SHIP;
          order.history.push({
            status: ORDER_STATUS.READY_TO_SHIP,
            changedBy: updatedBy ? new Types.ObjectId(updatedBy) : undefined,
            timestamp: new Date(),
            note: 'All lab jobs completed. Order moved to READY_TO_SHIP.',
          });
        }
      }

      await order.save();
    }

    if (dto.status === LAB_JOB_STATUS.ISSUE) {
      await this.notifyLabIssue(workOrder, dto.note);
    }

    return this.mapLabJob(workOrder);
  }

  private async createWorkOrderFromOrderItem(
    order: Order,
    item: OrderItem,
  ): Promise<LabJobResponseDto> {
    if (!item.typedPrescription || !item.itemId) {
      throw new BadRequestException(
        'Prescription snapshot is missing for work order',
      );
    }

    let existing = await this.workOrderModel.findOne({
      orderItemId: item.itemId,
    });
    if (!existing) {
      existing = await this.workOrderModel.create({
        orderId: order._id,
        orderItemId: item.itemId,
        rightEye: item.typedPrescription.rightEye,
        leftEye: item.typedPrescription.leftEye,
        pd: item.typedPrescription.pd,
        pdRight: item.typedPrescription.pdRight,
        pdLeft: item.typedPrescription.pdLeft,
        lensType: 'STANDARD',
        status: LAB_JOB_STATUS.PENDING,
      });
    }

    return this.mapLabJob(existing);
  }

  private async mapLabJob(workOrder: WorkOrder): Promise<LabJobResponseDto> {
    const order = await this.orderModel.findById(workOrder.orderId);
    const item = order?.items.find((it) => it.itemId === workOrder.orderItemId);
    const customer = order
      ? await this.userModel
          .findById(order.customerId)
          .select('fullName')
          .exec()
      : null;
    const product = item
      ? await this.productModel.findById(item.productId).select('name').exec()
      : null;

    return {
      _id: String(workOrder._id),
      orderId: String(workOrder.orderId),
      orderItemId: workOrder.orderItemId,
      rightEye: workOrder.rightEye,
      leftEye: workOrder.leftEye,
      pd: workOrder.pd,
      pdRight: workOrder.pdRight,
      pdLeft: workOrder.pdLeft,
      lensType: workOrder.lensType,
      status: workOrder.status,
      notes: workOrder.notes,
      orderNumber: order?.orderNumber,
      customerName: customer?.fullName,
      frameName: product?.name,
      frameSku: item?.variantSku,
    };
  }

  private async notifyPrescriptionRejected(
    order: Order,
    item: OrderItem,
  ): Promise<void> {
    const user = await this.userModel
      .findById(order.customerId)
      .select('email fullName');
    if (!user?.email) {
      return;
    }

    try {
      await this.emailService.sendEmail({
        to: user.email,
        subject: `Prescription update required for order ${order.orderNumber}`,
        html: `<p>Hi ${user.fullName || 'Customer'},</p><p>Your prescription for item ${item.itemId} in order <strong>${order.orderNumber}</strong> needs correction.</p><p>Note from our sales staff: ${item.prescriptionReviewNote || 'Please contact support.'}</p>`,
      });
    } catch {
      // Email failures should not block order workflow.
    }
  }

  private async notifyLabIssue(
    workOrder: WorkOrder,
    note?: string,
  ): Promise<void> {
    const order = await this.orderModel.findById(workOrder.orderId);
    if (!order) {
      return;
    }

    const user = await this.userModel
      .findById(order.customerId)
      .select('email fullName');
    if (!user?.email) {
      return;
    }

    try {
      await this.emailService.sendEmail({
        to: user.email,
        subject: `Lab issue update for order ${order.orderNumber}`,
        html: `<p>Hi ${user.fullName || 'Customer'},</p><p>Our lab reported an issue while processing your prescription order ${order.orderNumber}.</p><p>${note || 'Our support team will contact you shortly.'}</p>`,
      });
    } catch {
      // Ignore email errors.
    }
  }

  /**
   * Operations: Update manufacturing status
   */
  async updateManufacturingStatus(
    orderId: string,
    dto: UpdateManufacturingStatusDto,
    updatedBy?: string,
  ): Promise<OrderResponseDto> {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.orderStatus !== ORDER_STATUS.PROCESSING) {
      throw new BadRequestException(
        'Only orders in PROCESSING status can be updated',
      );
    }

    // Find the item
    const item = order.items.find(
      (item) => String(item.productId) === dto.itemId,
    );

    if (!item) {
      throw new NotFoundException('Order item not found');
    }

    // Update item manufacturing status
    if (item.manufacturingStatus !== undefined) {
      item.manufacturingStatus = dto.status as NonNullable<
        OrderItem['manufacturingStatus']
      >;
    }

    order.history.push({
      status: order.orderStatus,
      changedBy: updatedBy ? new Types.ObjectId(updatedBy) : undefined,
      timestamp: new Date(),
      note:
        dto.note ||
        `Manufacturing status updated to ${dto.status} for item ${dto.itemId}`,
    });

    await order.save();
    return this.getOrderWithDetails(orderId);
  }

  /**
   * Upload manufacturing proof for OrderItem
   * Operations staff uploads photo of finished glasses
   * itemId is the index of the item in the items array
   */
  async uploadManufacturingProof(
    orderId: string,
    itemId: string,
    file: Express.Multer.File,
  ): Promise<OrderResponseDto> {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // itemId is the index in the items array
    const itemIndex = parseInt(itemId, 10);
    if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= order.items.length) {
      throw new NotFoundException('Order item not found');
    }

    const item = order.items[itemIndex];

    // Upload the proof image to Cloudinary
    const proofUrl = await this.cloudinaryService.uploadFile(
      file,
      'wdp/manufacturing-proofs',
    );

    // Update OrderItem with manufacturing proof
    item.manufacturingProofUrl = proofUrl;
    item.manufacturingStatus = 'COMPLETED';
    item.manufacturedAt = new Date();

    order.history.push({
      status: order.orderStatus,
      timestamp: new Date(),
      note: `Manufacturing proof uploaded for item at index ${itemIndex}. Status set to COMPLETED.`,
    });

    await order.save();
    return this.getOrderWithDetails(orderId);
  }

  /**
   * Get order by ID
   */
  async getOrderById(
    orderId: string,
    customerId?: string,
  ): Promise<OrderResponseDto> {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if customer owns this order
    if (customerId && String(order.customerId) !== customerId) {
      throw new UnauthorizedException(
        'You do not have permission to view this order',
      );
    }

    return this.getOrderWithDetails(orderId);
  }

  /**
   * Get order with enriched product details
   */
  private async getOrderWithDetails(
    orderId: string,
  ): Promise<OrderResponseDto> {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Get product details for each item
    const itemsWithDetails = await Promise.all(
      order.items.map(async (item) => {
        const product = await this.productModel.findById(item.productId);

        let variantDetails: { size?: string; color?: string } | undefined =
          undefined;
        if (item.variantSku) {
          const variant = await this.productVariantModel.findOne({
            sku: item.variantSku,
            productId: item.productId,
          });
          if (variant) {
            variantDetails = {
              size: variant.size,
              color: variant.color,
            };
          }
        }

        return {
          _id:
            item.itemId ||
            `${String(order._id)}-${String(item.productId)}-${item.variantSku || 'default'}`,
          itemId: item.itemId,
          productId: String(item.productId),
          variantSku: item.variantSku,
          quantity: item.quantity,
          priceAtOrder: item.priceAtOrder,
          productName: product?.name || 'Unavailable Product',
          productImage: product?.images2D?.[0],
          variantDetails,
          // Pre-order fields
          isPreorder: item.isPreorder,
          preorderStatus: item.preorderStatus,
          expectedShipDate: item.expectedShipDate,
          reservedQuantity: item.reservedQuantity,
          requiresPrescription: item.requiresPrescription,
          typedPrescription: item.typedPrescription,
          prescriptionReviewStatus: item.prescriptionReviewStatus,
          prescriptionReviewNote: item.prescriptionReviewNote,
          manufacturingStatus: item.manufacturingStatus,
          manufacturingProofUrl: item.manufacturingProofUrl,
          manufacturedAt: item.manufacturedAt,
        };
      }),
    );

    return {
      _id: String(order._id),
      orderNumber: order.orderNumber,
      customerId: String(order.customerId),
      orderType: order.orderType,
      orderStatus: order.orderStatus,
      items: itemsWithDetails,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      tax: order.tax,
      prescriptionLensFeeTotal: order.prescriptionLensFeeTotal,
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      payment: order.payment
        ? {
            method: order.payment.method,
            amount: order.payment.amount,
            transactionId: order.payment.transactionId,
            paidAt: order.payment.paidAt,
            status: order.payment.paidAt ? 'PAID' : 'PENDING',
          }
        : undefined,
      tracking: order.tracking
        ? {
            carrier: order.tracking.carrier,
            trackingNumber: order.tracking.trackingNumber,
            estimatedDelivery: order.tracking.estimatedDelivery,
            actualDelivery: order.tracking.actualDelivery,
          }
        : undefined,
      assignedStaffId: order.assignedStaffId
        ? String(order.assignedStaffId)
        : undefined,
      notes: order.notes,
      history: order.history.map((h) => ({
        status: h.status,
        changedBy: h.changedBy ? h.changedBy.toHexString() : undefined,
        timestamp: h.timestamp,
        note: h.note,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  /**
   * Update order status (admin/staff only)
   */
  async updateOrderStatus(
    orderId: string,
    updateDto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate status transition
    if (!this.isValidStatusTransition(order.orderStatus, updateDto.status)) {
      throw new BadRequestException(
        `Cannot change order status from ${order.orderStatus} to ${updateDto.status}. ` +
          `Please follow the valid order status flow.`,
      );
    }

    const previousStatus = order.orderStatus;

    if (
      updateDto.status === ORDER_STATUS.PROCESSING &&
      !this.areAllPrescriptionItemsApproved(order)
    ) {
      throw new BadRequestException(
        'Prescription items must be approved before moving order to PROCESSING',
      );
    }

    if (updateDto.status === ORDER_STATUS.READY_TO_SHIP) {
      await this.ensurePrescriptionWorkOrdersCompleted(order);
    }

    if (updateDto.status === ORDER_STATUS.SHIPPED) {
      await this.ensurePrescriptionWorkOrdersCompleted(order);
    }

    order.orderStatus = updateDto.status;

    // Handle stock based on status changes
    if (
      updateDto.status === ORDER_STATUS.SHIPPED &&
      (previousStatus === ORDER_STATUS.CONFIRMED ||
        previousStatus === ORDER_STATUS.PROCESSING ||
        previousStatus === ORDER_STATUS.READY_TO_SHIP ||
        previousStatus === ORDER_STATUS.PAID)
    ) {
      // Add tracking placeholder
      if (!order.tracking) {
        order.tracking = {
          carrier: 'TBD',
          trackingNumber: 'TBD',
        };
      }
    } else if (
      updateDto.status === ORDER_STATUS.RETURNED ||
      updateDto.status === ORDER_STATUS.CANCELED ||
      updateDto.status === ORDER_STATUS.CANCELLED
    ) {
      // Release stock if cancelled/returned
      await this.releaseStock(orderId);
    }

    // Add to history
    order.history.push({
      status: updateDto.status,
      timestamp: new Date(),
      note:
        updateDto.note ||
        `Status changed from ${previousStatus} to ${updateDto.status}`,
    });

    await order.save();

    if (updateDto.status === ORDER_STATUS.SHIPPED) {
      await this.notifyOrderShipped(order);
    }

    return this.getOrderWithDetails(orderId);
  }

  private async ensurePrescriptionWorkOrdersCompleted(
    order: Order,
  ): Promise<void> {
    const prescribedItems = order.items.filter(
      (item) => item.requiresPrescription,
    );
    if (prescribedItems.length === 0) {
      return;
    }

    const itemIds = prescribedItems
      .map((item) => item.itemId)
      .filter(Boolean) as string[];
    if (itemIds.length !== prescribedItems.length) {
      throw new BadRequestException(
        'Prescription items are missing identifiers',
      );
    }

    const jobs = await this.workOrderModel
      .find({ orderItemId: { $in: itemIds } })
      .select('orderItemId status')
      .exec();

    const allCompleted = itemIds.every((itemId) =>
      jobs.some(
        (job) =>
          job.orderItemId === itemId && job.status === LAB_JOB_STATUS.COMPLETED,
      ),
    );

    if (!allCompleted) {
      throw new BadRequestException(
        'All prescription lab jobs must be COMPLETED before shipping',
      );
    }
  }

  private areAllPrescriptionItemsApproved(order: Order): boolean {
    const prescribedItems = order.items.filter(
      (item) => item.requiresPrescription,
    );
    if (prescribedItems.length === 0) {
      return true;
    }

    return prescribedItems.every(
      (item) =>
        item.prescriptionReviewStatus === PRESCRIPTION_REVIEW_STATUS.APPROVED,
    );
  }

  private async areAllOrderWorkOrdersCompleted(
    orderId: string,
  ): Promise<boolean> {
    const order = await this.orderModel
      .findById(orderId)
      .select('items')
      .exec();
    if (!order) {
      return false;
    }

    const prescribedItems = order.items.filter(
      (item) => item.requiresPrescription,
    );
    if (prescribedItems.length === 0) {
      return true;
    }

    const requiredItemIds = prescribedItems
      .map((item) => item.itemId)
      .filter((itemId): itemId is string => Boolean(itemId));

    if (requiredItemIds.length !== prescribedItems.length) {
      return false;
    }

    const jobs = await this.workOrderModel
      .find({
        orderId: new Types.ObjectId(orderId),
        orderItemId: { $in: requiredItemIds },
      })
      .select('orderItemId status')
      .exec();

    return requiredItemIds.every((itemId) =>
      jobs.some(
        (job) =>
          job.orderItemId === itemId && job.status === LAB_JOB_STATUS.COMPLETED,
      ),
    );
  }

  private async notifyOrderShipped(order: Order): Promise<void> {
    const user = await this.userModel
      .findById(order.customerId)
      .select('email fullName');
    if (!user?.email || !order.tracking?.trackingNumber) {
      return;
    }

    try {
      await this.emailService.sendOrderShippedEmail(
        user.email,
        user.fullName || 'Customer',
        order.orderNumber,
        order.tracking.trackingNumber,
        '',
      );
    } catch {
      // Ignore notification failures.
    }
  }

  /**
   * Validate status transition
   */
  private isValidStatusTransition(
    currentStatus: ORDER_STATUS,
    newStatus: ORDER_STATUS,
  ): boolean {
    const validTransitions: Record<ORDER_STATUS, ORDER_STATUS[]> = {
      [ORDER_STATUS.PENDING]: [ORDER_STATUS.PENDING_PAYMENT],
      [ORDER_STATUS.PENDING_PAYMENT]: [
        ORDER_STATUS.PAID,
        ORDER_STATUS.CANCELED,
        ORDER_STATUS.CANCELLED,
      ],
      // PAID must go through Sales approval first.
      [ORDER_STATUS.PAID]: [
        ORDER_STATUS.PROCESSING,
        ORDER_STATUS.ON_HOLD,
        ORDER_STATUS.CANCELED,
        ORDER_STATUS.CANCELLED,
      ],
      [ORDER_STATUS.ON_HOLD]: [
        ORDER_STATUS.PAID,
        ORDER_STATUS.PROCESSING,
        ORDER_STATUS.CANCELED,
        ORDER_STATUS.CANCELLED,
      ],
      [ORDER_STATUS.PROCESSING]: [
        ORDER_STATUS.READY_TO_SHIP,
        ORDER_STATUS.CANCELED,
        ORDER_STATUS.CANCELLED,
      ],
      [ORDER_STATUS.READY_TO_SHIP]: [
        ORDER_STATUS.SHIPPED,
        ORDER_STATUS.CANCELED,
        ORDER_STATUS.CANCELLED,
      ],
      [ORDER_STATUS.CONFIRMED]: [
        ORDER_STATUS.PROCESSING,
        ORDER_STATUS.READY_TO_SHIP,
      ],
      [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
      [ORDER_STATUS.DELIVERED]: [],
      [ORDER_STATUS.RETURNED]: [],
      [ORDER_STATUS.CANCELED]: [ORDER_STATUS.REFUNDED],
      [ORDER_STATUS.CANCELLED]: [],
      [ORDER_STATUS.REFUNDED]: [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Cancel order
   */
  async cancelOrder(
    orderId: string,
    customerId: string,
    cancelDto: CancelOrderDto,
  ): Promise<OrderResponseDto> {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (String(order.customerId) !== customerId) {
      throw new UnauthorizedException(
        'You do not have permission to cancel this order',
      );
    }

    // Can only cancel pending or processing orders
    if (
      order.orderStatus !== ORDER_STATUS.PENDING &&
      order.orderStatus !== ORDER_STATUS.PROCESSING
    ) {
      throw new BadRequestException(
        'Cannot cancel order at this stage. Please contact support.',
      );
    }

    order.orderStatus = ORDER_STATUS.CANCELED;

    // Release reserved stock
    await this.releaseStock(orderId);

    // Add to history
    order.history.push({
      status: ORDER_STATUS.CANCELED,
      timestamp: new Date(),
      note: `Order cancelled by customer. Reason: ${cancelDto.reason}`,
    });

    await order.save();

    return this.getOrderWithDetails(orderId);
  }

  /**
   * Update order tracking
   */
  async updateTracking(
    orderId: string,
    carrier: string,
    trackingNumber: string,
    estimatedDelivery?: Date,
  ): Promise<OrderResponseDto> {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.tracking = {
      carrier,
      trackingNumber,
      estimatedDelivery,
    };

    await order.save();

    return this.getOrderWithDetails(orderId);
  }

  /**
   * Confirm receipt (Operations Staff action)
   * Marks order as DELIVERED and performs final inventory deduction
   * Requirements:
   * - Order must be in SHIPPED status
   * - Deducts physical stock (onHand) for each item
   * - Releases reservation for each item
   * - Creates inventory movement records
   * - Sets deliveredAt timestamp
   */
  async confirmReceipt(orderId: string): Promise<OrderResponseDto> {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate order status is SHIPPED
    if (order.orderStatus !== ORDER_STATUS.SHIPPED) {
      throw new BadRequestException(
        `Order must be in SHIPPED status to confirm receipt. Current status: ${order.orderStatus}`,
      );
    }

    // Confirm stock through InventoryService - this handles reservation release and stock deduction
    await this.inventoryService.confirmStock(orderId);

    // Update order status and set deliveredAt
    order.orderStatus = ORDER_STATUS.DELIVERED;
    if (!order.tracking) {
      order.tracking = {
        carrier: '',
        trackingNumber: '',
      };
    }
    order.tracking.actualDelivery = new Date();

    // Add to history
    order.history.push({
      status: ORDER_STATUS.DELIVERED,
      timestamp: new Date(),
      note: 'Customer receipt confirmed by operations staff',
    });

    await order.save();

    return this.getOrderWithDetails(orderId);
  }

  /**
   * Get order count by status
   */
  async getOrderCountByStatus(status?: ORDER_STATUS): Promise<number> {
    const filter = status ? { orderStatus: status } : {};
    return this.orderModel.countDocuments(filter);
  }
}
