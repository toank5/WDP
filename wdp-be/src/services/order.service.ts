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
import { CartService } from './cart.service';
import { VNPayService } from './vnpay.service';
import { InventoryService } from './inventory.service';
import {
  CreateOrderDto,
  OrderResponseDto,
  CheckoutResponseDto,
  UpdateOrderStatusDto,
  ApproveOrderDto,
  CancelOrderDto,
  OrderListQueryDto,
  OrderListResponseDto,
  SHIPPING_METHODS,
} from '../dtos/order.dto';
import { ORDER_STATUS, ORDER_TYPES } from '../commons/enums/order.enum';
import { PREORDER_STATUS } from '../commons/enums/preorder.enum';
import { Request } from 'express';
import {
  VNPayCallbackParamsDto,
  VNPayVerificationResultDto,
} from '../dtos/vnpay.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(ProductVariant.name)
    private productVariantModel: Model<ProductVariant>,
    private readonly cartService: CartService,
    private readonly vnpayService: VNPayService,
    private readonly inventoryService: InventoryService,
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
    } = createOrderDto;

    // Calculate totals
    const subtotal = items.reduce(
      (sum, item) => sum + item.priceAtOrder * item.quantity,
      0,
    );
    const shippingFee = this.calculateShippingFee(shippingMethod);
    const tax = this.calculateTax(subtotal);
    const totalAmount = subtotal + shippingFee + tax;

    // Generate order number
    const orderNumber = this.generateOrderNumber();

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
      })),
      subtotal,
      shippingFee,
      tax,
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
          note: 'Order placed, awaiting payment',
        },
      ],
    });
    await order.save();

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
    const { search, page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Operations can see:
    // 1. PROCESSING orders (ready to fulfill - approved by sales)
    // 2. PAID/CONFIRMED orders with preorder items (waiting for stock allocation)
    const baseQuery = {
      $or: [
        { orderStatus: ORDER_STATUS.PROCESSING },
        {
          orderStatus: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.CONFIRMED] },
          'items.isPreorder': true,
        },
      ],
    };

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
   */
  async getSalesPendingApprovalOrders(
    query: OrderListQueryDto,
  ): Promise<OrderListResponseDto> {
    const { search, page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const paidOrderQuery = this.orderModel.find({
      orderStatus: {
        $in: [ORDER_STATUS.PAID, ORDER_STATUS.CONFIRMED],
      },
    });

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

    order.orderStatus = ORDER_STATUS.PROCESSING;

    order.history.push({
      status: ORDER_STATUS.PROCESSING,
      changedBy: approvedBy ? new Types.ObjectId(approvedBy) : undefined,
      timestamp: new Date(),
      note:
        approvalDto.note ||
        'Approved by Sales and sent to Operations queue',
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
          _id: `${String(order._id)}-${String(item.productId)}-${item.variantSku || 'default'}`,
          productId: String(item.productId),
          variantSku: item.variantSku,
          quantity: item.quantity,
          priceAtOrder: item.priceAtOrder,
          productName: product?.name || 'Unknown Product',
          productImage: product?.images2D?.[0],
          variantDetails,
          // Pre-order fields
          isPreorder: item.isPreorder,
          preorderStatus: item.preorderStatus,
          expectedShipDate: item.expectedShipDate,
          reservedQuantity: item.reservedQuantity,
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
    order.orderStatus = updateDto.status;

    // Handle stock based on status changes
    if (
      updateDto.status === ORDER_STATUS.SHIPPED &&
      (previousStatus === ORDER_STATUS.CONFIRMED ||
        previousStatus === ORDER_STATUS.PROCESSING ||
        previousStatus === ORDER_STATUS.PAID)
    ) {
      // Add tracking placeholder
      if (!order.tracking) {
        order.tracking = {
          carrier: 'TBD',
          trackingNumber: 'TBD',
        };
      }
    } else if (updateDto.status === ORDER_STATUS.RETURNED) {
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

    return this.getOrderWithDetails(orderId);
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
        ORDER_STATUS.CANCELLED,
      ],
      // PAID must go through Sales approval first.
      [ORDER_STATUS.PAID]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.PROCESSING]: [
        ORDER_STATUS.SHIPPED,
        ORDER_STATUS.CANCELLED,
      ],
      [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED],
      [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
      [ORDER_STATUS.DELIVERED]: [],
      [ORDER_STATUS.RETURNED]: [],
      [ORDER_STATUS.CANCELLED]: [],
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

    order.orderStatus = ORDER_STATUS.RETURNED;

    // Release reserved stock
    await this.releaseStock(orderId);

    // Add to history
    order.history.push({
      status: ORDER_STATUS.RETURNED,
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
