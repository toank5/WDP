import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  BadRequestException,
  HttpStatus,
  HttpCode,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrderService } from '../services/order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateOrderDto,
  OrderResponseDto,
  CheckoutResponseDto,
  UpdateOrderStatusDto,
  ApproveOrderDto,
  CancelOrderDto,
  OrderListQueryDto,
  OrderListResponseDto,
} from '../dtos/order.dto';
import { RbacGuard, Roles, UserRole } from '../commons/guards/rbac.guard';
import { ErrorResponseDto } from '../commons/dtos/error-response.dto';
import {
  VNPayCallbackParamsDto,
  VNPayVerificationResultDto,
} from '../dtos/vnpay.dto';
import { ORDER_STATUS } from '../commons/enums/order.enum';
import type { AuthenticatedRequest } from '../commons/types/express.types';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Checkout - Create order from cart
   * POST /orders/checkout
   */
  @Post('checkout')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Process checkout',
    description:
      'Creates an order from the current cart, validates stock, and returns payment URL if using VNPAY.',
  })
  @ApiCreatedResponse({
    description: 'Order created successfully',
    type: CheckoutResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request', type: ErrorResponseDto })
  async checkout(
    @Req() req: AuthenticatedRequest,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<CheckoutResponseDto> {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    const clientIp = req.ip || '127.0.0.1';

    // Get frontend URL for return URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    return this.orderService.checkout(
      userId,
      createOrderDto,
      clientIp,
      frontendUrl,
    );
  }

  /**
   * VNPay payment callback
   * GET /orders/vnpay-callback
   */
  @Get('vnpay-callback')
  @ApiOperation({
    summary: 'VNPay payment callback',
    description:
      'Handles payment callback from VNPay after payment completion.',
  })
  @ApiOkResponse({
    description: 'Payment processed',
    type: Object,
  })
  async handleVNPayCallback(
    @Query() callback: VNPayCallbackParamsDto,
    @Query('orderId') orderId: string,
  ): Promise<VNPayVerificationResultDto> {
    if (!orderId) {
      throw new BadRequestException('Order ID is required');
    }

    return this.orderService.handleVNPayCallback(orderId, callback);
  }

  /**
   * Get user's orders
   * GET /orders
   */
  @Get()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(
    UserRole.CUSTOMER,
    UserRole.SALE,
    UserRole.OPERATION,
    UserRole.MANAGER,
    UserRole.ADMIN,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user orders',
    description:
      'Returns a paginated list of orders for the authenticated user.',
  })
  @ApiOkResponse({
    description: 'Orders retrieved successfully',
    type: OrderListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getOrders(
    @Req() req: AuthenticatedRequest,
    @Query() query: OrderListQueryDto,
  ): Promise<OrderListResponseDto> {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    const role = Number(req.user?.role);
    if (role === UserRole.SALE) {
      return this.orderService.getSalesPendingApprovalOrders(query);
    }

    if (
      role === UserRole.OPERATION ||
      role === UserRole.MANAGER ||
      role === UserRole.ADMIN
    ) {
      return this.orderService.getOperationsOrders(query);
    }

    return this.orderService.getCustomerOrders(userId, query);
  }

  /**
   * Get operations order queue
   * GET /orders/ops
   */
  @Get('ops')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATION, UserRole.SALE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get operations orders',
    description:
      'Returns a paginated order queue for order management users (operation staff, sales, manager, admin).',
  })
  @ApiOkResponse({
    description: 'Operations orders retrieved successfully',
    type: OrderListResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ErrorResponseDto })
  async getOperationsOrders(
    @Req() req: AuthenticatedRequest,
    @Query() query: OrderListQueryDto,
  ): Promise<OrderListResponseDto> {
    const role = Number(req.user?.role);
    if (role === UserRole.SALE) {
      return this.orderService.getSalesPendingApprovalOrders(query);
    }

    return this.orderService.getOperationsOrders(query);
  }

  /**
   * Get sales pending-approval queue
   * GET /orders/sales-pending
   */
  @Get('sales-pending')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.SALE, UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get sales pending approvals',
    description:
      'Returns orders waiting for sales approval (PAID normal orders and stock-ready PAID pre-orders).',
  })
  @ApiOkResponse({
    description: 'Sales pending approvals retrieved successfully',
    type: OrderListResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ErrorResponseDto })
  async getSalesPendingApprovals(
    @Query() query: OrderListQueryDto,
  ): Promise<OrderListResponseDto> {
    return this.orderService.getSalesPendingApprovalOrders(query);
  }

  /**
   * Get order by ID
   * GET /orders/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get order details',
    description: 'Returns detailed information about a specific order.',
  })
  @ApiOkResponse({
    description: 'Order retrieved successfully',
    type: OrderResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Order not found',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getOrderById(
    @Req() req: AuthenticatedRequest,
    @Param('id') orderId: string,
  ): Promise<OrderResponseDto> {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    return this.orderService.getOrderById(orderId, userId);
  }

  /**
   * Cancel order
   * POST /orders/:id/cancel
   */
  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel order',
    description:
      'Cancels an order and releases reserved stock. Only allowed for pending or processing orders.',
  })
  @ApiOkResponse({
    description: 'Order cancelled successfully',
    type: OrderResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Order not found',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Cannot cancel order',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async cancelOrder(
    @Req() req: AuthenticatedRequest,
    @Param('id') orderId: string,
    @Body() cancelDto: CancelOrderDto,
  ): Promise<OrderResponseDto> {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    return this.orderService.cancelOrder(orderId, userId, cancelDto);
  }

  /**
   * Update order status (admin/staff only)
   * PATCH /orders/:id/status
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATION, UserRole.SALE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update order status',
    description: 'Updates the status of an order. Admin/Manager/Operation/Sales only.',
  })
  @ApiOkResponse({
    description: 'Order status updated successfully',
    type: OrderResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Order not found',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ErrorResponseDto })
  async updateOrderStatus(
    @Param('id') orderId: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    return this.orderService.updateOrderStatus(orderId, updateDto);
  }

  /**
   * Update order tracking (admin/staff only)
   * POST /orders/:id/tracking
   */
  @Post(':id/tracking')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATION, UserRole.SALE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update order tracking',
    description:
      'Adds tracking information to an order. Admin/Manager/Operation/Sales only.',
  })
  @ApiOkResponse({
    description: 'Tracking updated successfully',
    type: OrderResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Order not found',
    type: ErrorResponseDto,
  })
  @ApiQuery({ name: 'carrier', required: true, type: String })
  @ApiQuery({ name: 'trackingNumber', required: true, type: String })
  @ApiQuery({ name: 'estimatedDelivery', required: false, type: String })
  async updateTracking(
    @Param('id') orderId: string,
    @Query('carrier') carrier: string,
    @Query('trackingNumber') trackingNumber: string,
    @Query('estimatedDelivery') estimatedDelivery?: string,
  ): Promise<OrderResponseDto> {
    const estimatedDeliveryDate = estimatedDelivery
      ? new Date(estimatedDelivery)
      : undefined;

    return this.orderService.updateTracking(
      orderId,
      carrier,
      trackingNumber,
      estimatedDeliveryDate,
    );
  }

  /**
   * Sales gatekeeper approval
   * POST /orders/:id/approve
   */
  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.SALE, UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve order for operations',
    description:
      'Sales/Manager approval that moves an order from PAID to PROCESSING (operations queue).',
  })
  @ApiOkResponse({
    description: 'Order approved and sent to operations',
    type: OrderResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Order cannot be approved in current state',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ErrorResponseDto })
  async approveOrderForOperations(
    @Req() req: AuthenticatedRequest,
    @Param('id') orderId: string,
    @Body() approvalDto: ApproveOrderDto,
  ): Promise<OrderResponseDto> {
    const approverId = req.user?._id?.toString();
    return this.orderService.approveOrderForOperations(
      orderId,
      approvalDto,
      approverId,
    );
  }

  /**
   * Confirm receipt (Operations Staff)
   * POST /orders/:id/confirm-receipt
   */
  @Post(':id/confirm-receipt')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm order receipt',
    description:
      'Confirms that customer received the order and performs final inventory deduction. Restricted to Operations Staff and Manager.',
  })
  @ApiOkResponse({
    description: 'Receipt confirmed successfully',
    type: OrderResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Order not found',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Order not in SHIPPED status',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ErrorResponseDto })
  async confirmReceipt(
    @Param('id') orderId: string,
  ): Promise<OrderResponseDto> {
    return this.orderService.confirmReceipt(orderId);
  }

  /**
   * Get order statistics (admin only)
   * GET /orders/stats/summary
   */
  @Get('stats/summary')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get order statistics',
    description:
      'Returns order statistics grouped by status. Admin/Manager only.',
  })
  @ApiOkResponse({
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        byStatus: {
          type: 'object',
          properties: {
            PENDING: { type: 'number' },
            PROCESSING: { type: 'number' },
            CONFIRMED: { type: 'number' },
            SHIPPED: { type: 'number' },
            DELIVERED: { type: 'number' },
            RETURNED: { type: 'number' },
          },
        },
      },
    },
  })
  async getOrderStats(): Promise<{
    total: number;
    byStatus: Record<ORDER_STATUS, number>;
  }> {
    const total = await this.orderService.getOrderCountByStatus();

    const statusCounts: Record<ORDER_STATUS, number> = {
      [ORDER_STATUS.PENDING]: 0,
      [ORDER_STATUS.PENDING_PAYMENT]: 0,
      [ORDER_STATUS.PAID]: 0,
      [ORDER_STATUS.PROCESSING]: 0,
      [ORDER_STATUS.CONFIRMED]: 0,
      [ORDER_STATUS.SHIPPED]: 0,
      [ORDER_STATUS.DELIVERED]: 0,
      [ORDER_STATUS.RETURNED]: 0,
      [ORDER_STATUS.CANCELLED]: 0,
    };

    for (const status of Object.values(ORDER_STATUS)) {
      statusCounts[status as ORDER_STATUS] =
        await this.orderService.getOrderCountByStatus(status as ORDER_STATUS);
    }

    return {
      total,
      byStatus: statusCounts,
    };
  }
}
