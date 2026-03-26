import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, PipelineStage } from 'mongoose';
import {
  ReturnRequest,
  ReturnStatus,
  ReturnType,
  ReturnReason,
  ReturnItemCondition,
  ReturnItemStatus,
} from '../commons/schemas/return.schema';
import {
  CreateReturnRequestDto,
  UpdateReturnStatusDto,
  VerifyReturnedItemDto,
  ProcessRefundExchangeDto,
  ReturnQueryDto,
  ReturnEligibilityRequestDto,
  InspectReturnDto,
  InspectReturnItemDto,
  ApproveReturnResolutionDto,
  ProcessReturnInventoryDto,
  CreateExchangeOrderDto,
  ExchangeOrderResponseDto,
} from '../commons/dtos/return.dto';
import { PolicyService } from './policy.service';
import { Policy } from '../commons/schemas/policy.schema';
import { Order } from '../commons/schemas/order.schema';
import { User } from '../commons/schemas/user.schema';
import { ORDER_STATUS, ORDER_TYPES, ROLES } from '../shared';
import { POLICY_TYPES } from '../shared';
import {
  InventoryMovement,
  MovementType,
} from '../commons/schemas/inventory-movement.schema';
import type { ReturnPolicyConfig } from '../commons/types/policy.types';

type ReturnDateRange = {
  $gte?: Date;
  $lte?: Date;
};

type ReturnQueryFilter = {
  userId?: string;
  status?: ReturnStatus;
  orderId?: string;
  returnNumber?: string;
  customerEmail?: {
    $regex: string;
    $options: string;
  };
  $or?: Array<
    | { returnNumber: { $regex: string; $options: string } }
    | { orderNumber: { $regex: string; $options: string } }
    | { customerEmail: { $regex: string; $options: string } }
  >;
  createdAt?: ReturnDateRange;
};

type ReturnSort = Record<string, 1 | -1>;

type ReturnStatusUpdatePayload = {
  status: ReturnStatus;
  rejectionReason?: string;
  approvedRefundAmount?: number;
  restockingFee?: number;
  restockingFeePercent?: number;
  managerReviewedAt?: Date;
  managerReviewedBy?: string;
  statusHistory: NonNullable<ReturnRequest['statusHistory']>;
};

type ReturnResolutionUpdatePayload = {
  status: ReturnStatus;
  statusHistory: NonNullable<ReturnRequest['statusHistory']>;
  exchangeDetails?: ReturnRequest['exchangeDetails'];
  refundDetails?: ReturnRequest['refundDetails'];
};

type ReturnStatisticsFilter = {
  createdAt?: ReturnDateRange;
};

/**
 * Return number generator (sequential per year)
 * Format: RET-YYYY-NNNNNN
 */
function generateReturnNumber(lastReturnNumber?: string): string {
  const currentYear = new Date().getFullYear();
  let sequence = 1;

  if (lastReturnNumber) {
    const match = lastReturnNumber.match(/^RET-(\d{4})-(\d+)$/);
    if (match) {
      const year = parseInt(match[1], 10);
      const lastSequence = parseInt(match[2], 10);
      if (year === currentYear) {
        sequence = lastSequence + 1;
      }
    }
  }

  return `RET-${currentYear}-${sequence.toString().padStart(6, '0')}`;
}

/**
 * Status transition rules (Simplified)
 *
 * SUBMITTED → AWAITING_ITEMS → IN_REVIEW → APPROVED/REJECTED → COMPLETED
 */
const STATUS_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  [ReturnStatus.SUBMITTED]: [
    ReturnStatus.AWAITING_ITEMS, // Auto-transition after submission
    ReturnStatus.REJECTED,
    ReturnStatus.CANCELED,
  ],
  [ReturnStatus.AWAITING_ITEMS]: [
    ReturnStatus.IN_REVIEW, // Items received, ready for inspection
    ReturnStatus.CANCELED,
  ],
  [ReturnStatus.IN_REVIEW]: [
    ReturnStatus.APPROVED, // Resolution decided
    ReturnStatus.REJECTED,
  ],
  [ReturnStatus.APPROVED]: [
    ReturnStatus.COMPLETED, // All steps done
  ],
  [ReturnStatus.REJECTED]: [ReturnStatus.CANCELED],
  [ReturnStatus.COMPLETED]: [], // Terminal state
  [ReturnStatus.CANCELED]: [], // Terminal state
};

/**
 * Role permissions for status changes (Simplified)
 *
 * OPERATION: Can mark items received, process exchanges
 *   - Allowed: AWAITING_ITEMS → IN_REVIEW, IN_REVIEW → APPROVED (exchanges only), APPROVED → COMPLETED
 *
 * SALE: Can inspect items, approve resolution, process refunds
 *   - Allowed: All transitions except inventory-first operations
 *
 * MANAGER/ADMIN: Can do everything
 * CUSTOMER: Can submit and cancel own returns
 */
const ROLE_STATUS_PERMISSIONS: Record<ROLES, ReturnStatus[]> = {
  [ROLES.ADMIN]: Object.values(ReturnStatus),
  [ROLES.MANAGER]: Object.values(ReturnStatus),
  [ROLES.OPERATION]: [
    ReturnStatus.IN_REVIEW, // Mark items as received
    ReturnStatus.APPROVED, // Process exchanges
    ReturnStatus.COMPLETED, // Mark inventory as processed
  ],
  [ROLES.SALE]: [
    ReturnStatus.IN_REVIEW, // Inspect items and set condition
    ReturnStatus.APPROVED, // Approve return with resolution
    ReturnStatus.REJECTED, // Reject return
    ReturnStatus.COMPLETED, // Complete refund/exchange
  ],
  [ROLES.CUSTOMER]: [
    ReturnStatus.SUBMITTED, // Create return request
    ReturnStatus.CANCELED, // Cancel own return
  ],
};

/**
 * Return Service
 *
 * Handles all business logic for customer returns, including:
 * - Return request creation with policy validation
 * - Auto-approval based on return policy
 * - Status transitions with RBAC
 * - Warehouse receipt workflow (Operation Staff)
 * - Refund processing (Sale Staff)
 * - Inventory integration for returned items
 */
@Injectable()
export class ReturnService {
  constructor(
    @InjectModel(ReturnRequest.name) private returnModel: Model<ReturnRequest>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(InventoryMovement.name)
    private movementModel: Model<InventoryMovement>,
    private policyService: PolicyService,
  ) {}

  /**
   * Check if a return is eligible based on policy and order status
   */
  async checkEligibility(
    orderId: string,
    userId: string,
    items: CreateReturnRequestDto['items'],
  ): Promise<{
    eligible: boolean;
    policy?: Policy;
    order?: Order;
    ineligibleItems?: Array<{ item: (typeof items)[0]; reason: string }>;
    estimatedRefundAmount?: number;
    restockingFee?: number;
    restockingFeePercent?: number;
  }> {
    // 1. Get the order - try both _id and orderNumber
    let order = await this.orderModel.findById(orderId);
    if (!order) {
      order = await this.orderModel.findOne({ orderNumber: orderId });
    }

    if (!order) {
      return {
        eligible: false,
        ineligibleItems: items.map((item) => ({
          item,
          reason: `Order "${orderId}" not found`,
        })),
      };
    }

    // 2. Verify order ownership (customer can only return their own orders)
    // Staff/Manager can check all orders for eligibility
    if (order.customerId?.toString() !== userId) {
      return {
        eligible: false,
        ineligibleItems: items.map((item) => ({
          item,
          reason: `This order does not belong to you. You can only return items from your own orders.`,
        })),
      };
    }

    // 3. Check order status - only delivered orders can be returned
    if (order.orderStatus !== ORDER_STATUS.DELIVERED) {
      return {
        eligible: false,
        ineligibleItems: items.map((item) => ({
          item,
          reason: `Order must be delivered before requesting return. Current status: ${order.orderStatus}`,
        })),
      };
    }

    // 4. Get active return policy
    const policyResult = await this.policyService.findAll({
      type: 'return' as POLICY_TYPES,
      isActive: true,
    });
    const policy = policyResult.length > 0 ? policyResult[0] : null;

    if (!policy) {
      return {
        eligible: false,
        ineligibleItems: items.map((item) => ({
          item,
          reason:
            'Return policy is currently not available. Please contact customer support.',
        })),
      };
    }

    // 5. Check each item for eligibility
    const ineligibleItems: Array<{ item: (typeof items)[0]; reason: string }> =
      [];
    const policyConfig = policy.config as ReturnPolicyConfig;

    // Calculate days since delivery
    const deliveredHistory = order.history?.find(
      (h) => h.status === ORDER_STATUS.DELIVERED,
    );
    const daysSinceDelivery = deliveredHistory?.timestamp
      ? Math.floor(
          (Date.now() - new Date(deliveredHistory.timestamp).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    for (const item of items) {
      // Check if item belongs to this order
      // Note: OrderItem is embedded and doesn't have _id, so we match by productId and variantSku
      const orderItem = order.items.find(
        (oi) =>
          oi.productId?.toString() === item.productId &&
          oi.variantSku === item.variantId,
      );
      if (!orderItem) {
        ineligibleItems.push({
          item,
          reason: `"${item.productName}" - Item not found in this order`,
        });
        continue;
      }

      // Check quantity
      if (item.quantity > orderItem.quantity) {
        ineligibleItems.push({
          item,
          reason: `"${item.productName}" - You requested to return ${item.quantity} but only ordered ${orderItem.quantity}`,
        });
        continue;
      }

      // Check return window based on product type
      // isPrescription field removed - always use framesOnly return window
      const windowKey = 'framesOnly';
      const returnWindowDays = policyConfig.returnWindowDays?.[windowKey] || 30;

      if (daysSinceDelivery > returnWindowDays) {
        ineligibleItems.push({
          item,
          reason: `"${item.productName}" - Return window closed (${returnWindowDays} days). It's been ${daysSinceDelivery} days since delivery.`,
        });
        continue;
      }

      // Check non-returnable categories
      // Note: OrderItem doesn't have category field, so we skip this check or would need to look up product
      const nonReturnableCategories =
        policyConfig.nonReturnableCategories || [];
      // For now, skip category check since OrderItem doesn't have this field
      // If needed, would need to populate product data
    }

    // 6. Calculate estimated refund
    const eligibleItems = items.filter(
      (item) =>
        !ineligibleItems.some(
          (ineligible) => ineligible.item.orderItemId === item.orderItemId,
        ),
    );

    let estimatedRefundAmount = 0;
    let restockingFee = 0;
    const restockingFeePercent = policyConfig.restockingFeePercent || 0;

    for (const item of eligibleItems) {
      const itemTotal = item.quantity * item.unitPrice;
      estimatedRefundAmount += itemTotal;
    }

    if (restockingFeePercent > 0) {
      restockingFee = Math.round(
        estimatedRefundAmount * (restockingFeePercent / 100),
      );
      estimatedRefundAmount -= restockingFee;
    }

    return {
      eligible: ineligibleItems.length === 0,
      policy,
      order,
      ineligibleItems: ineligibleItems.length > 0 ? ineligibleItems : undefined,
      estimatedRefundAmount,
      restockingFee,
      restockingFeePercent,
    };
  }

  /**
   * Create a new return request (Simplified Flow)
   *
   * Flow: SUBMITTED → AWAITING_ITEMS (automatic)
   * - No auto-approval logic
   * - No manager approval gate
   * - Direct to AWAITING_ITEMS for customer to ship items
   */
  async createReturnRequest(
    dto: CreateReturnRequestDto,
    userId: string,
  ): Promise<ReturnRequest> {
    // 1. Check eligibility first
    const eligibility = await this.checkEligibility(
      dto.orderId,
      userId,
      dto.items,
    );

    if (!eligibility.eligible) {
      throw new BadRequestException({
        message: 'Return request is not eligible',
        reasons: eligibility.ineligibleItems?.map((i) => i.reason),
      });
    }

    // 2. Generate return number
    const lastReturn = await this.returnModel.findOne().sort({ createdAt: -1 });
    const returnNumber = generateReturnNumber(lastReturn?.returnNumber);

    // 3. Get order and user for customer info
    const order = eligibility.order!;
    const policyConfig = eligibility.policy?.config as ReturnPolicyConfig;

    // Fetch user email if not provided in DTO
    let customerEmail = dto.customerEmail;
    if (!customerEmail) {
      const user = await this.userModel.findById(userId).select('email').exec();
      customerEmail = user?.email;
    }

    // 4. Calculate potential refund amount (for reference)
    const estimatedRefundAmount = eligibility.estimatedRefundAmount;
    const restockingFee = eligibility.restockingFee || 0;
    const restockingFeePercent = eligibility.restockingFeePercent || 0;

    // 5. Create return request with AWAITING_ITEMS status
    const returnRequest = new this.returnModel({
      returnNumber,
      orderId: order._id?.toString() || order.orderNumber,
      orderNumber: order.orderNumber,
      userId,
      status: ReturnStatus.AWAITING_ITEMS, // Direct to awaiting items
      returnType: dto.returnType,
      reason: dto.reason,
      reasonDetails: dto.reasonDetails,
      items: dto.items,
      requestedRefundAmount: dto.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      ),
      // Store estimated amounts for reference (actual approved amount set later by Sale Staff)
      approvedRefundAmount: estimatedRefundAmount,
      restockingFee,
      restockingFeePercent,
      customerNotes: dto.customerNotes,
      customerEmail: customerEmail,
      customerPhone: dto.customerPhone || order.shippingAddress.phone,
      policyVersion: eligibility.policy?.version,
      policyEffectiveDate: eligibility.policy?.effectiveFrom,
      returnShippingAddress: order.shippingAddress,
      requiresManagerApproval: false, // Simplified flow - no manager gate
      statusHistory: [
        {
          status: ReturnStatus.SUBMITTED,
          changedBy: userId,
          changedAt: new Date(),
          notes: 'Return request submitted by customer',
        },
        {
          status: ReturnStatus.AWAITING_ITEMS,
          changedBy: userId,
          changedAt: new Date(),
          notes: 'Awaiting return items from customer',
        },
      ],
    });

    await returnRequest.save();
    return returnRequest;
  }

  /**
   * Get return request by ID
   */
  async getReturnRequest(
    id: string,
    userId: string,
    userRole: ROLES,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.returnModel.findById(id);
    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    // Customers can only view their own returns
    if (userRole === ROLES.CUSTOMER && returnRequest.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return returnRequest;
  }

  /**
   * Get return request by return number
   */
  async getReturnRequestByNumber(
    returnNumber: string,
    userId: string,
    userRole: ROLES,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.returnModel.findOne({ returnNumber });
    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    // Customers can only view their own returns
    if (userRole === ROLES.CUSTOMER && returnRequest.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return returnRequest;
  }

  /**
   * Query return requests with filters
   */
  async queryReturnRequests(
    query: ReturnQueryDto,
    userId: string,
    userRole: ROLES,
  ): Promise<{
    items: ReturnRequest[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      status,
      userId: queryUserId,
      orderId,
      returnNumber,
      search,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Build filter
    const filter: ReturnQueryFilter = {};

    // Customers can only see their own returns
    if (userRole === ROLES.CUSTOMER) {
      filter.userId = userId;
    } else if (queryUserId) {
      filter.userId = queryUserId;
    }

    if (status) {
      filter.status = status;
    }

    if (orderId) {
      filter.orderId = orderId;
    }

    if (returnNumber) {
      filter.returnNumber = returnNumber;
    }

    if (search) {
      filter.$or = [
        { returnNumber: { $regex: search, $options: 'i' } },
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
      ];
    }

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        filter.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        filter.createdAt.$lte = new Date(toDate);
      }
    }

    // Count total
    const total = await this.returnModel.countDocuments(filter);

    // Build sort
    const sort: ReturnSort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with population to get customer email
    const items = await this.returnModel
      .find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    // Populate customer email from user documents for items that don't have it
    const userIds = items.map((item) => item.userId).filter((id) => id);
    const users =
      userIds.length > 0
        ? await this.userModel
            .find({ _id: { $in: userIds } })
            .select('email')
            .exec()
        : [];

    const userMap = new Map(users.map((u) => [u._id.toString(), u.email]));

    // Augment items with customer email if missing
    const itemsWithCustomerInfo = items.map((item) => {
      if (!item.customerEmail) {
        item.customerEmail = userMap.get(item.userId?.toString()) || undefined;
      }
      return item;
    });

    return { items: itemsWithCustomerInfo, total, page, limit };
  }

  /**
   * Update return status
   */
  async updateReturnStatus(
    id: string,
    dto: UpdateReturnStatusDto,
    userId: string,
    userRole: ROLES,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.returnModel.findById(id);
    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    // 1. Check if user role has permission for this status change
    const allowedStatuses = ROLE_STATUS_PERMISSIONS[userRole] || [];
    if (!allowedStatuses.includes(dto.status)) {
      throw new ForbiddenException(
        `Role ${userRole} is not allowed to change status to ${dto.status}`,
      );
    }

    // 2. Check if status transition is valid
    const allowedTransitions = STATUS_TRANSITIONS[returnRequest.status] || [];
    if (!allowedTransitions.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${returnRequest.status} to ${dto.status}`,
      );
    }

    // 3. Additional validation based on target status
    if (dto.status === ReturnStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException(
        'Rejection reason is required when rejecting a return',
      );
    }

    if (dto.status === ReturnStatus.APPROVED && !dto.approvedRefundAmount) {
      throw new BadRequestException('Approved refund amount is required');
    }

    // 4. Update return request
    // Add to status history
    const historyEntry = {
      status: dto.status,
      changedBy: userId,
      changedAt: new Date(),
      notes: dto.rejectionReason || undefined,
    };

    const updateData: ReturnStatusUpdatePayload = {
      status: dto.status,
      statusHistory: [...(returnRequest.statusHistory || []), historyEntry],
    };

    if (dto.rejectionReason) {
      updateData.rejectionReason = dto.rejectionReason;
    }

    if (dto.approvedRefundAmount !== undefined) {
      updateData.approvedRefundAmount = dto.approvedRefundAmount;
    }

    if (dto.restockingFee !== undefined) {
      updateData.restockingFee = dto.restockingFee;
    }

    if (dto.restockingFeePercent !== undefined) {
      updateData.restockingFeePercent = dto.restockingFeePercent;
    }

    // Manager approval tracking
    if (
      dto.status === ReturnStatus.APPROVED ||
      dto.status === ReturnStatus.REJECTED
    ) {
      updateData.managerReviewedAt = new Date();
      updateData.managerReviewedBy = userId;
    }

    const updated = await this.returnModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updated) {
      throw new NotFoundException('Return request not found');
    }

    return updated;
  }

  /**
   * Verify returned item (Staff operation)
   * Transitions AWAITING_ITEMS → IN_REVIEW
   */
  async verifyReturnedItem(
    id: string,
    dto: VerifyReturnedItemDto,
    staffUserId: string,
    userRole: ROLES,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.returnModel.findById(id);
    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    // Check if in correct status
    if (returnRequest.status !== ReturnStatus.AWAITING_ITEMS) {
      throw new BadRequestException(
        `Can only verify items with status ${ReturnStatus.AWAITING_ITEMS}`,
      );
    }

    // Check permissions
    const allowedStatuses = ROLE_STATUS_PERMISSIONS[userRole] || [];
    if (!allowedStatuses.includes(ReturnStatus.IN_REVIEW)) {
      throw new ForbiddenException('Only staff can verify returned items');
    }

    // Determine item disposition based on condition
    let itemDisposition: 'RESALEABLE' | 'DAMAGED' | 'SCRAPPED' = 'RESALEABLE';
    const conditionRating = dto.verification.conditionRating;
    if (conditionRating === 'UNACCEPTABLE') {
      itemDisposition = 'SCRAPPED';
    } else if (conditionRating === 'POOR') {
      itemDisposition = 'DAMAGED';
    } else {
      itemDisposition = 'RESALEABLE';
    }

    // Update with verification data using new schema structure
    const verificationData = {
      receivedAt: new Date(),
      receivedBy: staffUserId,
      conditionRating: dto.verification.conditionRating,
      quantityReceived: dto.verification.quantityVerified,
      packagingIntact: dto.verification.packagingIntact,
      allAccessoriesPresent: dto.verification.allAccessoriesPresent,
      warehouseNotes: dto.verification.staffNotes,
      itemDisposition,
    };

    const statusHistoryEntry = {
      status: ReturnStatus.IN_REVIEW,
      changedBy: staffUserId,
      changedAt: new Date(),
      notes: `Item received: ${conditionRating} condition, disposition: ${itemDisposition}`,
    };

    // Create inventory movements for resaleable items
    const movementIds: string[] = [];
    if (itemDisposition === 'RESALEABLE') {
      for (const item of returnRequest.items) {
        const sku = item.sku || item.variantId;
        if (sku) {
          try {
            const movement = new this.movementModel({
              sku,
              movementType: MovementType.RETURN,
              quantity: item.quantity, // Positive = adding to stock
              stockBefore: 0, // Will be updated by inventory service
              stockAfter: 0,
              reason: 'Customer return - Resalable item',
              reference: returnRequest.returnNumber,
              note: `Return ${returnRequest.returnNumber}, item: ${item.productName}`,
              orderId: new Types.ObjectId(returnRequest.orderId),
              productId: new Types.ObjectId(item.productId),
              performedBy: new Types.ObjectId(staffUserId),
            });
            const savedMovement = await movement.save();
            movementIds.push(savedMovement._id.toString());
          } catch (err) {
            console.error(
              `Failed to create inventory movement for SKU ${sku}:`,
              err,
            );
          }
        }
      }
    }

    const updated = await this.returnModel.findByIdAndUpdate(
      id,
      {
        status: ReturnStatus.IN_REVIEW,
        staffVerification: {
          ...verificationData,
          inventoryMovementId: movementIds[0], // Store primary movement reference
        },
        // Update item-level status
        items: returnRequest.items.map((item) => ({
          ...item,
          itemStatus: itemDisposition,
          quantityReceived: dto.verification.quantityVerified || item.quantity,
          receivedAt: new Date(),
          receivedBy: staffUserId,
          inventoryMovementId: movementIds.find((id) => {
            // Match movement to item by SKU
            const movement = movementIds.find((mId) => {
              // We'd need to look up the movement, but for now just assign by index
              return true;
            });
            return movementIds[0]; // Simplified for now
          }),
        })),
        statusHistory: [
          ...(returnRequest.statusHistory || []),
          statusHistoryEntry,
        ],
      },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Return request not found');
    }

    return updated;
  }

  /**
   * Process refund/exchange (Staff operation)
   * Transitions IN_REVIEW → APPROVED
   */
  async processRefundExchange(
    id: string,
    dto: ProcessRefundExchangeDto,
    staffUserId: string,
    userRole: ROLES,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.returnModel.findById(id);
    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    // Check if in correct status
    if (returnRequest.status !== ReturnStatus.IN_REVIEW) {
      throw new BadRequestException(
        `Can only process refunds/exchanges with status ${ReturnStatus.IN_REVIEW}`,
      );
    }

    // Determine new status - always APPROVED in simplified flow
    const newStatus = ReturnStatus.APPROVED;

    // Check permissions for status change
    const allowedStatuses = ROLE_STATUS_PERMISSIONS[userRole] || [];
    if (!allowedStatuses.includes(newStatus)) {
      throw new ForbiddenException(
        `Role ${userRole} is not allowed to process this action`,
      );
    }

    // Role-based access control for processing:
    // - Sale Staff: Can only process REFUND requests
    // - Operation Staff: Can only process EXCHANGE requests
    // - Manager/Admin: Can process both
    const isExchange = !!dto.details.exchangeOrderId;
    const isRefund = !!dto.details.refundAmount;

    if (userRole === ROLES.SALE && isExchange) {
      throw new ForbiddenException(
        'Sale Staff can only process REFUND returns. Exchange returns must be processed by Operation Staff.',
      );
    }

    if (userRole === ROLES.OPERATION && isRefund) {
      throw new ForbiddenException(
        'Operation Staff can only process EXCHANGE returns. Refund returns must be processed by Sale Staff.',
      );
    }

    // Update with refund/exchange details
    const refundExchangeData = {
      processedAt: new Date(),
      processedBy: staffUserId,
      ...dto.details,
    };

    const statusHistoryEntry = {
      status: newStatus,
      changedBy: staffUserId,
      changedAt: new Date(),
      notes: dto.details.notes || 'Refund/exchange approved',
    };

    // Determine which field to update based on action type
    const updateData: ReturnResolutionUpdatePayload = {
      status: newStatus,
      statusHistory: [
        ...(returnRequest.statusHistory || []),
        statusHistoryEntry,
      ],
    };

    if (dto.details.exchangeOrderId) {
      // Exchange
      updateData.exchangeDetails = {
        processedAt: new Date(),
        processedBy: staffUserId,
        exchangeOrderId: dto.details.exchangeOrderId,
        notes: dto.details.notes,
      };
    } else {
      // Refund
      updateData.refundDetails = {
        initiatedAt: new Date(),
        initiatedBy: staffUserId,
        completedAt: new Date(),
        completedBy: staffUserId,
        refundAmount: dto.details.refundAmount,
        refundMethod: dto.details.refundMethod,
        refundTransactionId: dto.details.refundTransactionId,
        notes: dto.details.notes,
      };
    }

    const updated = await this.returnModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updated) {
      throw new NotFoundException('Return request not found');
    }

    // TODO: Integrate with actual payment gateway for refund
    // TODO: Create exchange order if applicable

    return updated;
  }

  /**
   * Cancel return request
   * Customer can cancel their own returns if not yet processed
   */
  async cancelReturnRequest(
    id: string,
    userId: string,
    userRole: ROLES,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.returnModel.findById(id);
    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    // Customers can only cancel their own returns
    if (userRole === ROLES.CUSTOMER && returnRequest.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Check if cancellation is allowed
    const cancellableStatuses = [
      ReturnStatus.SUBMITTED,
      ReturnStatus.AWAITING_ITEMS,
      ReturnStatus.IN_REVIEW,
    ];

    if (!cancellableStatuses.includes(returnRequest.status)) {
      throw new BadRequestException(
        `Cannot cancel return with status ${returnRequest.status}`,
      );
    }

    const statusHistoryEntry = {
      status: ReturnStatus.CANCELED,
      changedBy: userId,
      changedAt: new Date(),
      notes: 'Return canceled by customer',
    };

    const updated = await this.returnModel.findByIdAndUpdate(
      id,
      {
        status: ReturnStatus.CANCELED,
        statusHistory: [
          ...(returnRequest.statusHistory || []),
          statusHistoryEntry,
        ],
      },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Return request not found');
    }

    return updated;
  }

  /**
   * Get return statistics for manager dashboard
   */
  async getReturnStatistics(filters?: {
    fromDate?: Date;
    toDate?: Date;
  }): Promise<{
    totalReturns: number;
    pendingApproval: number;
    awaitingItem: number;
    verifiedPendingAction: number;
    totalRefundAmount: number;
    approvedReturns: number;
    rejectedReturns: number;
    avgProcessingTimeDays: number;
    returnsByReason: Record<string, number>;
  }> {
    const dateFilter: ReturnStatisticsFilter = {};
    if (filters?.fromDate || filters?.toDate) {
      dateFilter.createdAt = {};
      if (filters.fromDate) {
        dateFilter.createdAt.$gte = filters.fromDate;
      }
      if (filters.toDate) {
        dateFilter.createdAt.$lte = filters.toDate;
      }
    }

    // Get all returns in date range
    const returns = await this.returnModel.find(dateFilter).exec();

    // Calculate statistics
    const totalReturns = returns.length;
    const pendingApproval = returns.filter(
      (r) => r.status === ReturnStatus.IN_REVIEW,
    ).length;
    const awaitingItem = returns.filter(
      (r) => r.status === ReturnStatus.AWAITING_ITEMS,
    ).length;
    const verifiedPendingAction = returns.filter(
      (r) => r.status === ReturnStatus.APPROVED,
    ).length;

    const completedReturns = returns.filter(
      (r) => r.status === ReturnStatus.COMPLETED,
    );
    const totalRefundAmount = completedReturns.reduce(
      (sum, r) => sum + (r.approvedRefundAmount || 0),
      0,
    );

    const approvedReturns = returns.filter((r) =>
      [ReturnStatus.APPROVED, ReturnStatus.COMPLETED].includes(r.status),
    ).length;
    const rejectedReturns = returns.filter((r) =>
      [ReturnStatus.REJECTED].includes(r.status),
    ).length;

    // Average processing time (from creation to completion)
    const processingTimes = completedReturns
      .filter(
        (r) => r.refundDetails?.completedAt || r.exchangeDetails?.processedAt,
      )
      .map((r) => {
        const created = r.createdAt
          ? new Date(r.createdAt).getTime()
          : Date.now();
        const refundCompleted = r.refundDetails?.completedAt
          ? new Date(r.refundDetails.completedAt).getTime()
          : 0;
        const exchangeProcessed = r.exchangeDetails?.processedAt
          ? new Date(r.exchangeDetails.processedAt).getTime()
          : 0;
        const processed = refundCompleted || exchangeProcessed || Date.now();
        return (processed - created) / (1000 * 60 * 60 * 24); // days
      });

    const avgProcessingTimeDays =
      processingTimes.length > 0
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        : 0;

    // Returns by reason
    const returnsByReason: Record<string, number> = {};
    for (const r of returns) {
      const reason = r.reason;
      returnsByReason[reason] = (returnsByReason[reason] || 0) + 1;
    }

    return {
      totalReturns,
      pendingApproval,
      awaitingItem,
      verifiedPendingAction,
      totalRefundAmount,
      approvedReturns,
      rejectedReturns,
      avgProcessingTimeDays: Math.round(avgProcessingTimeDays * 10) / 10,
      returnsByReason,
    };
  }

  /**
   * Inspect Return Items (Sale Staff)
   *
   * When items are received, Sale Staff inspects each item and sets:
   * - Condition: RESELLABLE or DAMAGED_UNUSABLE
   * - Quantity received
   * - Inspection notes
   *
   * Transition: AWAITING_ITEMS → IN_REVIEW
   */
  async inspectReturnItems(
    returnId: string,
    dto: InspectReturnDto,
    staffUserId: string,
    userRole: ROLES,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.returnModel.findById(returnId);
    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    // Check permission (SALE, MANAGER, ADMIN can inspect)
    const canInspect = [ROLES.SALE, ROLES.MANAGER, ROLES.ADMIN].includes(
      userRole,
    );
    if (!canInspect) {
      throw new ForbiddenException(
        'You do not have permission to inspect return items',
      );
    }

    // Check status transition
    const allowedTransitions = [
      ReturnStatus.AWAITING_ITEMS,
      ReturnStatus.IN_REVIEW, // Already in review, can re-inspect
    ];
    if (!allowedTransitions.includes(returnRequest.status)) {
      throw new BadRequestException(
        `Cannot inspect items in current status: ${returnRequest.status}. Expected: AWAITING_ITEMS or IN_REVIEW`,
      );
    }

    // Update each item with condition and inspection details
    for (const itemDto of dto.items) {
      const itemIndex = returnRequest.items.findIndex(
        (i) => i.orderItemId === itemDto.orderItemId,
      );
      if (itemIndex === -1) {
        throw new NotFoundException(
          `Item with orderItemId "${itemDto.orderItemId}" not found in return request`,
        );
      }

      const item = returnRequest.items[itemIndex];

      // Update item fields
      item.condition = itemDto.condition;
      item.quantityReceived = itemDto.quantityReceived;
      item.inspectionNotes = itemDto.inspectionNotes;
      item.inspectedBy = staffUserId;
      item.inspectedAt = new Date();

      // Update itemStatus based on condition for inventory tracking
      if (itemDto.condition === ReturnItemCondition.RESELLABLE) {
        item.itemStatus = ReturnItemStatus.RESALEABLE;
      } else if (itemDto.condition === ReturnItemCondition.DAMAGED_UNUSABLE) {
        item.itemStatus = ReturnItemStatus.SCRAPPED;
      }

      returnRequest.items[itemIndex] = item;
    }

    // Store resolution info
    returnRequest.resolutionType = dto.resolutionType;
    returnRequest.approvedRefundAmount = dto.approvedRefundAmount;
    if (dto.restockingFee !== undefined) {
      returnRequest.restockingFee = dto.restockingFee;
    }

    // Transition to IN_REVIEW
    returnRequest.status = ReturnStatus.IN_REVIEW;
    await this.addStatusHistory(
      returnRequest,
      ReturnStatus.IN_REVIEW,
      staffUserId,
      'Items inspected by Sale Staff',
    );

    await returnRequest.save();
    return returnRequest;
  }

  /**
   * Approve Return Resolution (Sale Staff)
   *
   * After inspection, Sale Staff approves the return and sets resolution:
   * - resolutionType: REFUND or EXCHANGE
   * - approvedRefundAmount: final refund amount (with fees applied)
   *
   * Transition: IN_REVIEW → APPROVED
   */
  async approveReturnResolution(
    returnId: string,
    dto: ApproveReturnResolutionDto,
    staffUserId: string,
    userRole: ROLES,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.returnModel.findById(returnId);
    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    // Check permission (SALE, MANAGER, ADMIN can approve)
    const canApprove = [ROLES.SALE, ROLES.MANAGER, ROLES.ADMIN].includes(
      userRole,
    );
    if (!canApprove) {
      throw new ForbiddenException(
        'You do not have permission to approve return resolution',
      );
    }

    // Check status transition
    const allowedTransitions = [ReturnStatus.IN_REVIEW];
    if (!allowedTransitions.includes(returnRequest.status)) {
      throw new BadRequestException(
        `Cannot approve return in current status: ${returnRequest.status}. Expected: IN_REVIEW`,
      );
    }

    // Set resolution details
    returnRequest.resolutionType = dto.resolutionType;
    returnRequest.approvedRefundAmount = dto.approvedRefundAmount;
    if (dto.restockingFee !== undefined) {
      returnRequest.restockingFee = dto.restockingFee;
    }

    // Initialize refund/exchange details
    if (dto.resolutionType === ReturnType.REFUND) {
      returnRequest.refundDetails = {
        initiatedAt: new Date(),
        initiatedBy: staffUserId,
        refundAmount: dto.approvedRefundAmount,
        refundMethod: dto.refundMethod,
        notes: dto.notes,
      };
    } else if (dto.resolutionType === ReturnType.EXCHANGE) {
      returnRequest.exchangeDetails = {
        processedAt: new Date(),
        processedBy: staffUserId,
        notes: dto.notes,
      };
    }

    // Transition to APPROVED
    returnRequest.status = ReturnStatus.APPROVED;
    await this.addStatusHistory(
      returnRequest,
      ReturnStatus.APPROVED,
      staffUserId,
      `Return approved: ${dto.resolutionType} - ${dto.notes || ''}`,
    );

    await returnRequest.save();
    return returnRequest;
  }

  /**
   * Process Return Inventory (Operation Staff)
   *
   * After return is approved, Operation Staff updates inventory based on item conditions:
   * - RESELLABLE items: Create RETURN_IN movement (stock increases)
   * - DAMAGED_UNUSABLE items: Create SCRAP movement (stock doesn't increase, tracked separately)
   *
   * Transition: APPROVED → COMPLETED (after both refund/exchange AND inventory processed)
   */
  async processReturnInventory(
    returnId: string,
    dto: ProcessReturnInventoryDto,
    staffUserId: string,
    userRole: ROLES,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.returnModel.findById(returnId);
    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    // Check permission (OPERATION, MANAGER, ADMIN can process inventory)
    const canProcessInventory = [
      ROLES.OPERATION,
      ROLES.MANAGER,
      ROLES.ADMIN,
    ].includes(userRole);
    if (!canProcessInventory) {
      throw new ForbiddenException(
        'You do not have permission to process return inventory',
      );
    }

    // Check status - must be APPROVED (already inspected and resolution decided)
    if (returnRequest.status !== ReturnStatus.APPROVED) {
      throw new BadRequestException(
        `Cannot process inventory in current status: ${returnRequest.status}. Expected: APPROVED`,
      );
    }

    // Check if already processed
    if (returnRequest.inventoryProcessed) {
      throw new BadRequestException(
        'Inventory has already been processed for this return',
      );
    }

    // Create inventory movements for each item based on condition
    const movementPromises = dto.inventoryMovements.map(async (movement) => {
      const inventoryMovement = new this.movementModel({
        sku: movement.sku,
        type: movement.type as MovementType,
        quantityChange: movement.quantity,
        reason: movement.reason,
        reference: returnRequest.returnNumber,
        referenceType: 'RETURN',
        performedBy: staffUserId,
        performedAt: new Date(),
      });
      return inventoryMovement.save();
    });

    await Promise.all(movementPromises);

    // Mark return as inventory processed
    returnRequest.inventoryProcessed = true;
    returnRequest.inventoryProcessedAt = new Date();
    returnRequest.inventoryProcessedBy = staffUserId;

    // Mark each item as inventory processed
    returnRequest.items.forEach((item) => {
      item.inventoryProcessed = true;
      if (!item.inventoryMovementId) {
        // Link inventory movement to item (by matching SKU)
        const movement = dto.inventoryMovements.find((m) => m.sku === item.sku);
        if (movement) {
          item.inventoryMovementId = movement.type; // Store movement type as reference
        }
      }
    });

    // Check if we can transition to COMPLETED
    // COMPLETED requires: inventoryProcessed = true AND (refund completed OR exchange processed)
    const canComplete = this.checkIfReturnCanBeCompleted(returnRequest);
    if (canComplete) {
      returnRequest.status = ReturnStatus.COMPLETED;
      await this.addStatusHistory(
        returnRequest,
        ReturnStatus.COMPLETED,
        staffUserId,
        'Return completed: inventory processed and resolution finalized',
      );

      // Record revenue impact for refunds
      if (
        returnRequest.resolutionType === ReturnType.REFUND &&
        returnRequest.approvedRefundAmount
      ) {
        const order = await this.orderModel.findById(returnRequest.orderId);
        if (order) {
          returnRequest.revenueImpact = {
            originalRevenue: order.totalAmount,
            refundAmount: returnRequest.approvedRefundAmount,
            netRevenue: order.totalAmount - returnRequest.approvedRefundAmount,
            recordedAt: new Date(),
          };
        }
      }
    }

    await returnRequest.save();
    return returnRequest;
  }

  /**
   * Complete Return (Helper for Sale Staff)
   *
   * After refund/exchange is processed, call this to check if return can be marked COMPLETED
   * Used after: refund completed OR exchange order created
   */
  async completeReturnAfterResolution(
    returnId: string,
    staffUserId: string,
  ): Promise<ReturnRequest> {
    const returnRequest = await this.returnModel.findById(returnId);
    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    // Check if we can transition to COMPLETED
    const canComplete = this.checkIfReturnCanBeCompleted(returnRequest);
    if (!canComplete) {
      throw new BadRequestException(
        'Cannot complete return yet. Both inventory processing and resolution finalization are required.',
      );
    }

    returnRequest.status = ReturnStatus.COMPLETED;
    await this.addStatusHistory(
      returnRequest,
      ReturnStatus.COMPLETED,
      staffUserId,
      'Return completed: all steps finalized',
    );

    // Record revenue impact for refunds
    if (
      returnRequest.resolutionType === ReturnType.REFUND &&
      returnRequest.approvedRefundAmount
    ) {
      const order = await this.orderModel.findById(returnRequest.orderId);
      if (order) {
        returnRequest.revenueImpact = {
          originalRevenue: order.totalAmount,
          refundAmount: returnRequest.approvedRefundAmount,
          netRevenue: order.totalAmount - returnRequest.approvedRefundAmount,
          recordedAt: new Date(),
        };
      }
    }

    await returnRequest.save();
    return returnRequest;
  }

  /**
   * Check if return can be marked as COMPLETED
   * COMPLETED requires: inventoryProcessed = true AND (refund completed OR exchange processed)
   */
  private checkIfReturnCanBeCompleted(returnRequest: ReturnRequest): boolean {
    // Must have inventory processed
    if (!returnRequest.inventoryProcessed) {
      return false;
    }

    const resolutionType = returnRequest.resolutionType;

    // For REFUND: check if refund is completed
    if (resolutionType === ReturnType.REFUND) {
      return !!(
        returnRequest.refundDetails?.completedAt ||
        returnRequest.refundDetails?.refundTransactionId
      );
    }

    // For EXCHANGE: check if exchange order is created
    if (resolutionType === ReturnType.EXCHANGE) {
      return !!returnRequest.exchangeDetails?.exchangeOrderId;
    }

    return false;
  }

  /**
   * Add status history entry
   */
  private async addStatusHistory(
    returnRequest: ReturnRequest,
    status: ReturnStatus,
    changedBy: string,
    notes?: string,
  ): Promise<void> {
    if (!returnRequest.statusHistory) {
      returnRequest.statusHistory = [];
    }
    returnRequest.statusHistory.push({
      status,
      changedBy,
      changedAt: new Date(),
      notes,
    });
  }

  /**
   * Create Exchange Order (Operation Staff)
   *
   * Creates a new order for replacement products when processing an exchange return
   */
  async createExchangeOrder(
    dto: CreateExchangeOrderDto,
    staffUserId: string,
    userRole: ROLES,
  ): Promise<ExchangeOrderResponseDto> {
    // 1. Verify return exists and is in correct status
    const returnRequest = await this.returnModel.findById(dto.returnId);
    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    // Only Operation staff (and above) can create exchange orders
    if (
      userRole !== ROLES.OPERATION &&
      userRole !== ROLES.MANAGER &&
      userRole !== ROLES.ADMIN
    ) {
      throw new ForbiddenException(
        'Only Operation Staff and above can create exchange orders',
      );
    }

    // Return must be for exchange type
    if (returnRequest.returnType !== ReturnType.EXCHANGE) {
      throw new BadRequestException(
        'Cannot create exchange order for a non-exchange return',
      );
    }

    // 2. Get original order for customer info
    const originalOrder = await this.orderModel.findById(returnRequest.orderId);
    if (!originalOrder) {
      throw new NotFoundException('Original order not found');
    }

    // 3. Generate exchange order number (uses ORD prefix to match validation pattern)
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    const exchangeOrderNumber = `ORD-${timestamp}-${random}`;

    // 4. Calculate total amount (should be 0 for direct exchange, or handle price differences)
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    // 5. Create the exchange order
    const exchangeOrder = new this.orderModel({
      orderNumber: exchangeOrderNumber,
      customerId: originalOrder.customerId,
      orderType: ORDER_TYPES.EXCHANGE,
      orderStatus: ORDER_STATUS.CONFIRMED, // Exchange orders are confirmed automatically
      items: dto.items.map((item) => ({
        _id: new Types.ObjectId(),
        productId: item.productId,
        variantSku: item.variantId,
        productName: item.productName,
        productImage: item.productImage,
        priceAtOrder: item.unitPrice,
        quantity: item.quantity,
        sku: item.sku,
      })),
      totalAmount,
      subtotal: totalAmount,
      shippingFee: 0, // Free shipping for exchanges
      tax: 0,
      shippingAddress: originalOrder.shippingAddress,
      // Store reference to the original return
      notes:
        dto.notes || `Exchange order for return ${returnRequest.returnNumber}`,
      metadata: {
        returnId: dto.returnId,
        returnNumber: returnRequest.returnNumber,
        originalOrderId: originalOrder._id?.toString(),
        originalOrderNumber: originalOrder.orderNumber,
        isExchangeOrder: true,
      },
    });

    await exchangeOrder.save();

    // 6. Update the return request with the exchange order ID
    returnRequest.exchangeDetails = {
      processedAt: new Date(),
      processedBy: staffUserId,
      exchangeOrderId: exchangeOrder._id?.toString(),
      notes: dto.notes,
    };
    await returnRequest.save();

    // 7. Return the exchange order info
    return {
      id: exchangeOrder._id?.toString() || '',
      orderNumber: exchangeOrder.orderNumber,
      returnId: dto.returnId,
      returnNumber: returnRequest.returnNumber,
      customerId: originalOrder.customerId?.toString() || '',
      orderType: ORDER_TYPES.EXCHANGE,
      orderStatus: ORDER_STATUS.CONFIRMED,
      items: dto.items,
      totalAmount,
      createdAt: exchangeOrder.createdAt || new Date(),
      notes: dto.notes,
    };
  }
}
