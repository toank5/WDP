import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CheckoutService } from '../services/checkout.service';
import {
  CreateCheckoutDto,
  CreateCheckoutResponseDto,
  VNPayIpnResponseDto,
} from '../dtos/checkout.dto';

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  private readonly logger = new Logger(CheckoutController.name);

  constructor(private readonly checkoutService: CheckoutService) {}

  /**
   * Create checkout session and initiate VNPAY payment
   * POST /checkout/create-payment
   *
   * This endpoint:
   * 1. Fetches user's cart from database
   * 2. Validates inventory
   * 3. Creates order with PENDING_PAYMENT status
   * 4. Returns VNPAY payment URL
   */
  @Post('create-payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create checkout session and initiate VNPAY payment',
    description: `
    Creates a checkout session from the user's cart and generates a VNPAY payment URL.

    Flow:
    1. Fetches cart from database (localStorage is NOT used)
    2. Validates inventory (checks stock for ready-made, allows pre-order)
    3. Creates Order with PENDING_PAYMENT status
    4. Generates VNPAY payment URL with vnp_IpnUrl and vnp_ReturnUrl
    5. Returns payment URL to frontend

    The frontend should redirect the user to the returned paymentUrl.
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Checkout session created successfully',
    type: CreateCheckoutResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (empty cart, insufficient stock, etc.)',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPayment(
    @Body() createCheckoutDto: CreateCheckoutDto,
    @Req() req: Request,
  ): Promise<CreateCheckoutResponseDto> {
    // Get customer ID from JWT token
    const customerId = (req as any).user?.userId || (req as any).user?._id;

    if (!customerId) {
      throw new Error('Customer ID not found in token');
    }

    // Get client IP for VNPAY
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    this.logger.log(
      `Creating checkout for customer ${customerId} from IP ${clientIp}`,
    );

    // Add client IP to DTO
    createCheckoutDto.clientIp = clientIp;

    try {
      const result = await this.checkoutService.createCheckout(
        customerId,
        createCheckoutDto,
      );

      this.logger.log(
        `Checkout payment URL generated | customer=${customerId} orderId=${result.orderId} txnRef=${result.txnRef}`,
      );

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown checkout error';
      this.logger.error(
        `Create payment failed | customer=${customerId} ip=${clientIp} message=${message}`,
      );
      throw error;
    }
  }

  /**
   * VNPAY IPN (Instant Payment Notification) endpoint
   * GET /checkout/vnpay-ipn
   *
   * CRITICAL: This is called by VNPAY server-to-server after payment
   * - Must be idempotent (handle duplicate calls)
   * - Must verify checksum (vnp_SecureHash)
   * - Must update order status and inventory on success
   * - Must return specific JSON format to VNPAY
   */
  @Get('vnpay-ipn')
  @ApiOperation({
    summary: 'VNPAY IPN callback (server-to-server)',
    description: `
    This endpoint is called by VNPAY server-to-server after payment completion.
    Do NOT call this from the frontend.

    Security:
    - Verifies vnp_SecureHash to ensure request is from VNPAY
    - Checks for duplicate processing (idempotency)

    Logic on success (vnp_ResponseCode === '00'):
    - Updates Order status to CONFIRMED
    - For Ready-made items: Decreases Inventory.onHand and reserved
    - For Pre-order items: Sets preorderStatus to PENDING_STOCK
    - Clears user's Cart in database

    Returns:
    - RspCode: '00', Message: 'Confirm Success' on success
    - RspCode: '97' or '99', Message: error message on failure
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'IPN processed successfully',
    type: VNPayIpnResponseDto,
  })
  async handleVnpayIpn(
    @Query() params: Record<string, any>,
  ): Promise<VNPayIpnResponseDto> {
    this.logger.log('Received VNPAY IPN callback', { params });

    try {
      const result = await this.checkoutService.handleVnpayIpn(params);

      if (result.RspCode === '00') {
        this.logger.log('VNPAY IPN processed successfully');
      } else {
        this.logger.warn('VNPAY IPN processing failed', { result });
      }

      return result;
    } catch (error) {
      this.logger.error('Error processing VNPAY IPN', { error: error.message });

      return {
        RspCode: '99',
        Message: 'System error',
      };
    }
  }

  /**
   * VNPAY Return URL endpoint (user browser redirect)
   * GET /checkout/vnpay-return
   *
   * This handles the user's browser redirect back to the site after payment.
   * Verifies checksum and redirects to appropriate page.
   */
  @Get('vnpay-return')
  @ApiOperation({
    summary: 'VNPAY return URL (user browser redirect)',
    description: `
    This endpoint handles the user's browser redirect after VNPAY payment.
    Verifies the checksum and redirects to the appropriate page.

    - On success: Redirects to /order/success?orderId=...
    - On failure: Redirects to /order/failed?orderId=...

    This prevents the redirect loop bug where users were sent back to cart.
    `,
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect to success or failed page',
  })
  async handleVnpayReturn(
    @Query() params: Record<string, string>,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log('===== VNPAY RETURN CALLBACK START =====');
    this.logger.log('Received params:', JSON.stringify(params, null, 2));

    try {
      this.logger.log('Calling handleVnpayReturn service...');
      const result = await this.checkoutService.handleVnpayReturn(params);
      
      this.logger.log('Service returned result:', JSON.stringify(result, null, 2));

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      if (result.success) {
        // Payment successful - redirect to success page
        const orderNumber = result.orderNumber || '';
        const redirectUrl = `${frontendUrl}/order/success?orderNumber=${encodeURIComponent(orderNumber)}`;
        this.logger.log(`✓ Success - Redirecting to: ${redirectUrl}`);
        res.redirect(HttpStatus.FOUND, redirectUrl);
      } else {
        // Payment failed - redirect to failed page
        const orderNumber = result.orderNumber || '';
        const redirectUrl = `${frontendUrl}/order/failed?orderNumber=${encodeURIComponent(orderNumber)}&reason=${encodeURIComponent(result.message)}`;
        this.logger.warn(`✗ Failed - Redirecting to: ${redirectUrl}`);
        res.redirect(HttpStatus.FOUND, redirectUrl);
      }
    } catch (error) {
      this.logger.error('===== EXCEPTION IN VNPAY RETURN HANDLER =====');
      this.logger.error('Error message:', error.message);
      this.logger.error('Error stack:', error.stack);
      this.logger.error('Params received:', JSON.stringify(params, null, 2));

      // On error, redirect to failed page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const redirectUrl = `${frontendUrl}/order/failed?reason=${encodeURIComponent('Payment processing error')}`;
      res.redirect(HttpStatus.FOUND, redirectUrl);
    }
  }

  /**
   * Get order by order number
   * GET /checkout/order/:orderNumber
   *
   * Utility endpoint to fetch order details for frontend display
   */
  @Get('order')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get order by order number',
    description: 'Fetches order details for displaying on success/failed pages',
  })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(
    @Query('orderNumber') orderNumber: string,
    @Req() req: Request,
  ) {
    const order = await this.checkoutService.getOrderByNumber(orderNumber);

    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    // Return complete order object (toObject handles ObjectId conversion)
    return {
      success: true,
      data: (order as any).toObject(),
    };
  }
}
