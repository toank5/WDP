import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard, Roles, UserRole } from '../commons/guards/rbac.guard';
import { ReturnService } from '../services/return.service';
import {
  CreateReturnRequestDto,
  UpdateReturnStatusDto,
  VerifyReturnedItemDto,
  ProcessRefundExchangeDto,
  ReturnQueryDto,
  ReturnEligibilityRequestDto,
  ReturnEligibilityResponseDto,
  ReturnResponseDto,
  ReturnStatsDto,
  InspectReturnDto,
  ApproveReturnResolutionDto,
  ProcessReturnInventoryDto,
  CreateExchangeOrderDto,
  ExchangeOrderResponseDto,
} from '../commons/dtos/return.dto';
import { ReturnStatus } from '../commons/schemas/return.schema';

/**
 * Customer Returns Controller
 *
 * Endpoints for customers to:
 * - Check return eligibility
 * - Create return requests
 * - View their return requests
 * - Cancel return requests
 */
@ApiTags('Returns - Customer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('returns')
export class CustomerReturnController {
  constructor(private readonly returnService: ReturnService) {}

  /**
   * Check return eligibility before creating request
   */
  @Post('eligibility')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.CUSTOMER, UserRole.OPERATION, UserRole.SALE, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Check return eligibility for order items' })
  @ApiResponse({ status: 200, description: 'Eligibility check result' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkEligibility(
    @Body() dto: ReturnEligibilityRequestDto,
    @Request() req: any,
  ): Promise<{
    eligible: boolean;
    returnWindowDays?: number;
    daysSinceDelivery?: number;
    daysRemaining?: number;
    ineligibleItems?: Array<{ item: any; reason: string }>;
    estimatedRefundAmount?: number;
    restockingFee?: number;
    restockingFeePercent?: number;
  }> {
    const userId = req.user.userId || req.user._id;
    const eligibility = await this.returnService.checkEligibility(
      dto.orderId,
      userId,
      dto.items,
    );

    // Transform to response format
    const response: any = {
      eligible: eligibility.eligible,
    };

    if (eligibility.policy) {
      const policyConfig = eligibility.policy.config as any;
      response.returnWindowDays = policyConfig.returnWindowDays?.framesOnly || 30;
    }

    if (eligibility.order) {
      const deliveredHistory = eligibility.order.history?.find(
        (h: any) => h.status === 'DELIVERED',
      );
      if (deliveredHistory?.timestamp) {
        const daysSince = Math.floor(
          (Date.now() - new Date(deliveredHistory.timestamp).getTime()) / (1000 * 60 * 60 * 24),
        );
        response.daysSinceDelivery = daysSince;
        response.daysRemaining = (response.returnWindowDays || 30) - daysSince;
      }
    }

    if (eligibility.ineligibleItems) {
      response.ineligibleItems = eligibility.ineligibleItems;
    }

    if (eligibility.estimatedRefundAmount !== undefined) {
      response.estimatedRefundAmount = eligibility.estimatedRefundAmount;
    }

    if (eligibility.restockingFee !== undefined) {
      response.restockingFee = eligibility.restockingFee;
    }

    if (eligibility.restockingFeePercent !== undefined) {
      response.restockingFeePercent = eligibility.restockingFeePercent;
    }

    return response;
  }

  /**
   * Create a new return request
   */
  @Post()
  @Roles(UserRole.CUSTOMER, UserRole.OPERATION, UserRole.SALE)
  @ApiOperation({ summary: 'Create a new return request' })
  @ApiResponse({ status: 201, description: 'Return request created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - ineligible for return' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createReturnRequest(
    @Body() dto: CreateReturnRequestDto,
    @Request() req: any,
  ): Promise<ReturnResponseDto> {
    const userId = req.user.userId || req.user._id;
    const returnRequest = await this.returnService.createReturnRequest(dto, userId);
    return this.toResponseDto(returnRequest);
  }

  /**
   * Get customer's return requests
   */
  @Get('my-returns')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get current customer return requests' })
  @ApiQuery({ name: 'status', required: false, enum: ReturnStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of return requests' })
  async getMyReturns(
    @Query() query: ReturnQueryDto,
    @Request() req: any,
  ): Promise<{
    items: ReturnResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const userId = req.user.userId || req.user._id;
    const userRole = UserRole.CUSTOMER;
    const result = await this.returnService.queryReturnRequests(query, userId, userRole);

    return {
      ...result,
      items: result.items.map(r => this.toResponseDto(r)),
    };
  }

  /**
   * Get return request by ID
   */
  @Get(':id')
  @Roles(UserRole.CUSTOMER, UserRole.OPERATION, UserRole.SALE, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get return request by ID' })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiResponse({ status: 200, description: 'Return request details' })
  @ApiResponse({ status: 404, description: 'Return request not found' })
  async getReturnRequest(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<ReturnResponseDto> {
    const userId = req.user.userId || req.user._id;
    const userRole = req.user.role;
    const returnRequest = await this.returnService.getReturnRequest(id, userId, userRole);
    return this.toResponseDto(returnRequest);
  }

  /**
   * Get return request by return number
   */
  @Get('number/:returnNumber')
  @Roles(UserRole.CUSTOMER, UserRole.OPERATION, UserRole.SALE, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get return request by return number' })
  @ApiParam({ name: 'returnNumber', description: 'Return number (e.g., RET-2024-000123)' })
  @ApiResponse({ status: 200, description: 'Return request details' })
  @ApiResponse({ status: 404, description: 'Return request not found' })
  async getReturnByNumber(
    @Param('returnNumber') returnNumber: string,
    @Request() req: any,
  ): Promise<ReturnResponseDto> {
    const userId = req.user.userId || req.user._id;
    const userRole = req.user.role;
    const returnRequest = await this.returnService.getReturnRequestByNumber(
      returnNumber,
      userId,
      userRole,
    );
    return this.toResponseDto(returnRequest);
  }

  /**
   * Cancel return request
   */
  @Patch(':id/cancel')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Cancel a return request' })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiResponse({ status: 200, description: 'Return request canceled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel return in current status' })
  @ApiResponse({ status: 404, description: 'Return request not found' })
  async cancelReturnRequest(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<ReturnResponseDto> {
    const userId = req.user.userId || req.user._id;
    const userRole = UserRole.CUSTOMER;
    const returnRequest = await this.returnService.cancelReturnRequest(id, userId, userRole);
    return this.toResponseDto(returnRequest);
  }

  /**
   * Convert ReturnRequest entity to response DTO
   */
  private toResponseDto(returnRequest: any): ReturnResponseDto {
    return {
      id: returnRequest._id?.toString(),
      returnNumber: returnRequest.returnNumber,
      orderId: returnRequest.orderId,
      orderNumber: returnRequest.orderNumber,
      userId: returnRequest.userId,
      status: returnRequest.status,
      returnType: returnRequest.returnType,
      reason: returnRequest.reason,
      reasonDetails: returnRequest.reasonDetails,
      items: returnRequest.items,
      requestedRefundAmount: returnRequest.requestedRefundAmount,
      approvedRefundAmount: returnRequest.approvedRefundAmount,
      restockingFee: returnRequest.restockingFee,
      restockingFeePercent: returnRequest.restockingFeePercent,
      staffVerification: returnRequest.staffVerification
        ? {
            receivedAt: returnRequest.staffVerification.receivedAt,
            receivedBy: returnRequest.staffVerification.receivedBy,
            conditionRating: returnRequest.staffVerification.conditionRating,
            quantityVerified: returnRequest.staffVerification.quantityReceived || returnRequest.staffVerification.quantityVerified,
            packagingIntact: returnRequest.staffVerification.packagingIntact,
            allAccessoriesPresent: returnRequest.staffVerification.allAccessoriesPresent,
            warehouseNotes: returnRequest.staffVerification.warehouseNotes,
            itemDisposition: returnRequest.staffVerification.itemDisposition,
            inventoryMovementId: returnRequest.staffVerification.inventoryMovementId,
          }
        : undefined,
      refundDetails: (returnRequest as any).refundDetails
        ? {
            initiatedAt: (returnRequest as any).refundDetails.initiatedAt,
            initiatedBy: (returnRequest as any).refundDetails.initiatedBy,
            refundAmount: (returnRequest as any).refundDetails.refundAmount,
            refundMethod: (returnRequest as any).refundDetails.refundMethod,
            refundTransactionId: (returnRequest as any).refundDetails.refundTransactionId,
            completedAt: (returnRequest as any).refundDetails.completedAt,
            completedBy: (returnRequest as any).refundDetails.completedBy,
            notes: (returnRequest as any).refundDetails.notes,
          }
        : undefined,
      exchangeDetails: (returnRequest as any).exchangeDetails
        ? {
            processedAt: (returnRequest as any).exchangeDetails.processedAt,
            processedBy: (returnRequest as any).exchangeDetails.processedBy,
            exchangeOrderId: (returnRequest as any).exchangeDetails.exchangeOrderId,
            notes: (returnRequest as any).exchangeDetails.notes,
          }
        : undefined,
      customerNotes: returnRequest.customerNotes,
      customerEmail: returnRequest.customerEmail,
      customerPhone: returnRequest.customerPhone,
      rejectionReason: returnRequest.rejectionReason,
      returnTrackingNumber: returnRequest.returnTrackingNumber,
      createdAt: returnRequest.createdAt,
      updatedAt: returnRequest.updatedAt,
      requiresManagerApproval: returnRequest.requiresManagerApproval,
      statusHistory: returnRequest.statusHistory,
      // New fields
      inventoryProcessed: returnRequest.inventoryProcessed,
      inventoryProcessedAt: returnRequest.inventoryProcessedAt,
      inventoryProcessedBy: returnRequest.inventoryProcessedBy,
      revenueImpact: returnRequest.revenueImpact,
    };
  }
}

/**
 * Staff Returns Management Controller
 *
 * Endpoints for staff (Operation/Sale) and managers to:
 * - View all return requests
 * - Update return status
 * - Verify returned items
 * - Process refunds/exchanges
 * - View return statistics
 */
@ApiTags('Returns - Staff Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('staff/returns')
export class StaffReturnController {
  constructor(private readonly returnService: ReturnService) {}

  /**
   * Query all return requests (staff view)
   */
  @Get()
  @Roles(UserRole.OPERATION, UserRole.SALE, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Query all return requests (staff view)' })
  @ApiQuery({ name: 'status', required: false, enum: ReturnStatus })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'orderId', required: false })
  @ApiQuery({ name: 'returnNumber', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of return requests' })
  async queryReturns(
    @Query() query: ReturnQueryDto,
    @Request() req: any,
  ): Promise<{
    items: ReturnResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const userId = req.user.userId || req.user._id;
    const userRole = req.user.role;
    const result = await this.returnService.queryReturnRequests(query, userId, userRole);

    return {
      ...result,
      items: result.items.map(r => this.toResponseDto(r)),
    };
  }

  /**
   * Get return statistics (Manager dashboard)
   */
  @Get('statistics')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get return statistics for manager dashboard' })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiResponse({ status: 200, description: 'Return statistics' })
  async getStatistics(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ): Promise<ReturnStatsDto> {
    const filters: any = {};
    if (fromDate) {
      filters.fromDate = new Date(fromDate);
    }
    if (toDate) {
      filters.toDate = new Date(toDate);
    }

    return this.returnService.getReturnStatistics(filters);
  }

  /**
   * Get return request by ID (staff view)
   */
  @Get(':id')
  @Roles(UserRole.OPERATION, UserRole.SALE, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get return request by ID (staff view)' })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiResponse({ status: 200, description: 'Return request details' })
  @ApiResponse({ status: 404, description: 'Return request not found' })
  async getReturnRequest(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<ReturnResponseDto> {
    const userId = req.user.userId || req.user._id;
    const userRole = req.user.role;
    const returnRequest = await this.returnService.getReturnRequest(id, userId, userRole);
    return this.toResponseDto(returnRequest);
  }

  /**
   * Update return status (Manager/Staff operation)
   */
  @Patch(':id/status')
  @Roles(UserRole.OPERATION, UserRole.SALE, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update return status' })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiResponse({ status: 200, description: 'Return status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Return request not found' })
  async updateReturnStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReturnStatusDto,
    @Request() req: any,
  ): Promise<ReturnResponseDto> {
    const userId = req.user.userId || req.user._id;
    const userRole = req.user.role;
    const returnRequest = await this.returnService.updateReturnStatus(
      id,
      dto,
      userId,
      userRole,
    );
    return this.toResponseDto(returnRequest);
  }

  /**
   * Verify returned item (Staff operation)
   * This is the key operation for Sale/Operation Staff:
   * - Check item condition
   * - Verify quantity
   * - Add staff notes
   * - Transition: AWAITING_ITEMS → IN_REVIEW
   */
  @Patch(':id/verify')
  @Roles(UserRole.OPERATION, UserRole.SALE, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Verify returned item condition (Staff operation)',
    description: 'Staff verifies the physical condition of returned items, checks quantity, packaging, and accessories. Transitions status from AWAITING_ITEMS to IN_REVIEW.',
  })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiResponse({ status: 200, description: 'Item verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status for verification' })
  @ApiResponse({ status: 404, description: 'Return request not found' })
  async verifyReturnedItem(
    @Param('id') id: string,
    @Body() dto: VerifyReturnedItemDto,
    @Request() req: any,
  ): Promise<ReturnResponseDto> {
    const userId = req.user.userId || req.user._id;
    const userRole = req.user.role;
    const returnRequest = await this.returnService.verifyReturnedItem(
      id,
      dto,
      userId,
      userRole,
    );
    return this.toResponseDto(returnRequest);
  }

  /**
   * Process refund/exchange (Staff operation)
   * After verification, staff processes the refund or creates exchange order
   * Transitions: IN_REVIEW → APPROVED
   */
  @Patch(':id/process')
  @Roles(UserRole.OPERATION, UserRole.SALE, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Process refund or exchange (Staff operation)',
    description: 'After verification, staff processes the refund through payment gateway or creates an exchange order. Transitions status from IN_REVIEW to APPROVED.',
  })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiResponse({ status: 200, description: 'Refund/exchange processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status for processing' })
  @ApiResponse({ status: 404, description: 'Return request not found' })
  async processRefundExchange(
    @Param('id') id: string,
    @Body() dto: ProcessRefundExchangeDto,
    @Request() req: any,
  ): Promise<ReturnResponseDto> {
    const userId = req.user.userId || req.user._id;
    const userRole = req.user.role;
    const returnRequest = await this.returnService.processRefundExchange(
      id,
      dto,
      userId,
      userRole,
    );
    return this.toResponseDto(returnRequest);
  }

  /**
   * Inspect Return Items (Sale Staff)
   * POST /staff/returns/:id/inspect
   *
   * Sale Staff inspects returned items and sets:
   * - Condition: RESELLABLE or DAMAGED_UNUSABLE for each item
   * - Resolution type: REFUND or EXCHANGE
   * - Approved refund amount
   *
   * Transition: AWAITING_ITEMS → IN_REVIEW
   */
  @Post(':id/inspect')
  @Roles(UserRole.SALE, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Inspect returned items (Sale Staff)',
    description: 'Sale Staff inspects items, sets condition for each item, and decides resolution type.',
  })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiResponse({ status: 200, description: 'Items inspected successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status for inspection' })
  @ApiResponse({ status: 404, description: 'Return request not found' })
  async inspectReturnItems(
    @Param('id') id: string,
    @Body() dto: InspectReturnDto,
    @Request() req: any,
  ): Promise<ReturnResponseDto> {
    const userId = req.user.userId || req.user._id;
    const userRole = req.user.role;
    const returnRequest = await this.returnService.inspectReturnItems(
      id,
      dto,
      userId,
      userRole,
    );
    return this.toResponseDto(returnRequest);
  }

  /**
   * Approve Return Resolution (Sale Staff)
   * POST /staff/returns/:id/approve
   *
   * Sale Staff approves the return and sets final resolution:
   * - Resolution type: REFUND or EXCHANGE
   * - Approved refund amount
   *
   * Transition: IN_REVIEW → APPROVED
   */
  @Post(':id/approve')
  @Roles(UserRole.SALE, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Approve return resolution (Sale Staff)',
    description: 'Sale Staff approves the return with final resolution (refund or exchange).',
  })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiResponse({ status: 200, description: 'Return approved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status for approval' })
  @ApiResponse({ status: 404, description: 'Return request not found' })
  async approveReturnResolution(
    @Param('id') id: string,
    @Body() dto: ApproveReturnResolutionDto,
    @Request() req: any,
  ): Promise<ReturnResponseDto> {
    const userId = req.user.userId || req.user._id;
    const userRole = req.user.role;
    const returnRequest = await this.returnService.approveReturnResolution(
      id,
      dto,
      userId,
      userRole,
    );
    return this.toResponseDto(returnRequest);
  }

  /**
   * Process Return Inventory (Operation Staff)
   * POST /staff/returns/:id/inventory
   *
   * Operation Staff updates inventory based on item conditions:
   * - RESELLABLE items: Create RETURN_IN movement (stock increases)
   * - DAMAGED_UNUSABLE items: Create SCRAP movement (stock doesn't increase)
   *
   * Transition: APPROVED → COMPLETED (if refund/exchange also done)
   */
  @Post(':id/inventory')
  @Roles(UserRole.OPERATION, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Process return inventory (Operation Staff)',
    description: 'Operation Staff updates inventory based on item conditions set by Sale Staff.',
  })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiResponse({ status: 200, description: 'Inventory processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status for inventory processing' })
  @ApiResponse({ status: 404, description: 'Return request not found' })
  async processReturnInventory(
    @Param('id') id: string,
    @Body() dto: ProcessReturnInventoryDto,
    @Request() req: any,
  ): Promise<ReturnResponseDto> {
    const userId = req.user.userId || req.user._id;
    const userRole = req.user.role;
    const returnRequest = await this.returnService.processReturnInventory(
      id,
      dto,
      userId,
      userRole,
    );
    return this.toResponseDto(returnRequest);
  }

  /**
   * Complete Return (Helper endpoint)
   * POST /staff/returns/:id/complete
   *
   * Called after refund/exchange is processed to check if return can be marked COMPLETED
   */
  @Post(':id/complete')
  @Roles(UserRole.SALE, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Complete return (after resolution finalization)',
    description: 'Called after refund/exchange is processed to mark return as COMPLETED if inventory is also processed.',
  })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiResponse({ status: 200, description: 'Return completed successfully' })
  @ApiResponse({ status: 400, description: 'Return cannot be completed yet' })
  @ApiResponse({ status: 404, description: 'Return request not found' })
  async completeReturn(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<ReturnResponseDto> {
    const userId = req.user.userId || req.user._id;
    const returnRequest = await this.returnService.completeReturnAfterResolution(
      id,
      userId,
    );
    return this.toResponseDto(returnRequest);
  }

  /**
   * Create Exchange Order (Operation Staff)
   * POST /staff/returns/exchange-order
   *
   * Creates a new order for replacement products when processing an exchange return
   */
  @Post('exchange-order')
  @Roles(UserRole.OPERATION, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create exchange order (Operation Staff)',
    description: 'Creates a new order for replacement products when processing an exchange return.',
  })
  @ApiResponse({ status: 201, description: 'Exchange order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Return request not found' })
  async createExchangeOrder(
    @Body() dto: CreateExchangeOrderDto,
    @Request() req: any,
  ): Promise<ExchangeOrderResponseDto> {
    const staffUserId = req.user.userId || req.user._id;
    const userRole = req.user.role;
    return await this.returnService.createExchangeOrder(dto, staffUserId, userRole);
  }

  /**
   * Convert ReturnRequest entity to response DTO
   */
  private toResponseDto(returnRequest: any): ReturnResponseDto {
    return {
      id: returnRequest._id?.toString(),
      returnNumber: returnRequest.returnNumber,
      orderId: returnRequest.orderId,
      orderNumber: returnRequest.orderNumber,
      userId: returnRequest.userId,
      status: returnRequest.status,
      returnType: returnRequest.returnType,
      reason: returnRequest.reason,
      reasonDetails: returnRequest.reasonDetails,
      items: returnRequest.items,
      requestedRefundAmount: returnRequest.requestedRefundAmount,
      approvedRefundAmount: returnRequest.approvedRefundAmount,
      restockingFee: returnRequest.restockingFee,
      restockingFeePercent: returnRequest.restockingFeePercent,
      staffVerification: returnRequest.staffVerification
        ? {
            receivedAt: returnRequest.staffVerification.receivedAt,
            receivedBy: returnRequest.staffVerification.receivedBy,
            conditionRating: returnRequest.staffVerification.conditionRating,
            quantityVerified: returnRequest.staffVerification.quantityReceived || returnRequest.staffVerification.quantityVerified,
            packagingIntact: returnRequest.staffVerification.packagingIntact,
            allAccessoriesPresent: returnRequest.staffVerification.allAccessoriesPresent,
            warehouseNotes: returnRequest.staffVerification.warehouseNotes,
            itemDisposition: returnRequest.staffVerification.itemDisposition,
            inventoryMovementId: returnRequest.staffVerification.inventoryMovementId,
          }
        : undefined,
      refundDetails: (returnRequest as any).refundDetails
        ? {
            initiatedAt: (returnRequest as any).refundDetails.initiatedAt,
            initiatedBy: (returnRequest as any).refundDetails.initiatedBy,
            refundAmount: (returnRequest as any).refundDetails.refundAmount,
            refundMethod: (returnRequest as any).refundDetails.refundMethod,
            refundTransactionId: (returnRequest as any).refundDetails.refundTransactionId,
            completedAt: (returnRequest as any).refundDetails.completedAt,
            completedBy: (returnRequest as any).refundDetails.completedBy,
            notes: (returnRequest as any).refundDetails.notes,
          }
        : undefined,
      exchangeDetails: (returnRequest as any).exchangeDetails
        ? {
            processedAt: (returnRequest as any).exchangeDetails.processedAt,
            processedBy: (returnRequest as any).exchangeDetails.processedBy,
            exchangeOrderId: (returnRequest as any).exchangeDetails.exchangeOrderId,
            notes: (returnRequest as any).exchangeDetails.notes,
          }
        : undefined,
      customerNotes: returnRequest.customerNotes,
      customerEmail: returnRequest.customerEmail,
      customerPhone: returnRequest.customerPhone,
      rejectionReason: returnRequest.rejectionReason,
      returnTrackingNumber: returnRequest.returnTrackingNumber,
      createdAt: returnRequest.createdAt,
      updatedAt: returnRequest.updatedAt,
      requiresManagerApproval: returnRequest.requiresManagerApproval,
      statusHistory: returnRequest.statusHistory,
      // New fields
      inventoryProcessed: returnRequest.inventoryProcessed,
      inventoryProcessedAt: returnRequest.inventoryProcessedAt,
      inventoryProcessedBy: returnRequest.inventoryProcessedBy,
      revenueImpact: returnRequest.revenueImpact,
    };
  }
}
