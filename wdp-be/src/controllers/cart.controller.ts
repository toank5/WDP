import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  BadRequestException,
  HttpStatus,
  HttpCode,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CartService } from '../services/cart.service';
import {
  AddToCartDto,
  UpdateCartItemDto,
  CartResponseDto,
  ClearCartResponseDto,
  MergeCartDto,
  BulkAddToCartDto,
} from '../dtos/cart.dto';
import { RbacGuard, Roles, UserRole } from '../commons/guards/rbac.guard';
import { ErrorResponseDto } from '../commons/dtos/error-response.dto';
import type { AuthenticatedRequest } from '../commons/types/express.types';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
@UseGuards(RbacGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * Get current user's cart
   * GET /cart
   */
  @Get()
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user cart',
    description:
      'Returns the cart for the authenticated user with product details populated.',
  })
  @ApiOkResponse({
    description: 'Cart retrieved successfully',
    type: CartResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getCart(@Req() req: AuthenticatedRequest): Promise<CartResponseDto> {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    return this.cartService.getCustomerCart(userId);
  }

  /**
   * Add item to cart
   * POST /cart/items
   */
  @Post('items')
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add item to cart',
    description:
      'Adds a product (with optional variant) to the cart. If the item already exists, the quantity is increased.',
  })
  @ApiCreatedResponse({
    description: 'Item added to cart successfully',
    type: CartResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request', type: ErrorResponseDto })
  @ApiNotFoundResponse({
    description: 'Product not found',
    type: ErrorResponseDto,
  })
  async addItem(
    @Req() req: AuthenticatedRequest,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<CartResponseDto> {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    return this.cartService.addItem(userId, addToCartDto);
  }

  /**
   * Bulk add items to cart
   * POST /cart/items/bulk
   */
  @Post('items/bulk')
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Bulk add items to cart',
    description: 'Adds multiple items to the cart in a single request.',
  })
  @ApiCreatedResponse({
    description: 'Items added to cart successfully',
    type: CartResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request', type: ErrorResponseDto })
  async bulkAddItems(
    @Req() req: AuthenticatedRequest,
    @Body() bulkAddDto: BulkAddToCartDto,
  ): Promise<CartResponseDto> {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    return this.cartService.bulkAddItems(userId, bulkAddDto.items);
  }

  /**
   * Update cart item quantity
   * PATCH /cart/items/:itemId
   */
  @Patch('items/:itemId')
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update cart item quantity',
    description: 'Updates the quantity of a specific item in the cart.',
  })
  @ApiOkResponse({
    description: 'Item quantity updated successfully',
    type: CartResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request', type: ErrorResponseDto })
  @ApiNotFoundResponse({
    description: 'Cart item not found',
    type: ErrorResponseDto,
  })
  async updateItemQuantity(
    @Req() req: AuthenticatedRequest,
    @Param('itemId') itemId: string,
    @Body() updateDto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    return this.cartService.updateItemQuantity(userId, itemId, updateDto);
  }

  /**
   * Remove item from cart
   * DELETE /cart/items/:itemId
   */
  @Delete('items/:itemId')
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove item from cart',
    description: 'Removes a specific item from the cart.',
  })
  @ApiOkResponse({
    description: 'Item removed successfully',
    type: CartResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Cart item not found',
    type: ErrorResponseDto,
  })
  async removeItem(
    @Req() req: AuthenticatedRequest,
    @Param('itemId') itemId: string,
  ): Promise<CartResponseDto> {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    return this.cartService.removeItem(userId, itemId);
  }

  /**
   * Clear cart
   * DELETE /cart
   */
  @Delete()
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear cart',
    description: 'Removes all items from the cart.',
  })
  @ApiOkResponse({
    description: 'Cart cleared successfully',
    type: ClearCartResponseDto,
  })
  async clearCart(
    @Req() req: AuthenticatedRequest,
  ): Promise<ClearCartResponseDto> {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    return this.cartService.clearCart(userId);
  }

  /**
   * Get cart item count
   * GET /cart/count
   */
  @Get('count')
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get cart item count',
    description:
      'Returns the total number of items in the cart (sum of quantities).',
  })
  @ApiOkResponse({
    description: 'Cart count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 3 },
      },
    },
  })
  async getCartCount(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ count: number }> {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    const count = await this.cartService.getCartItemCount(userId);
    return { count };
  }

  /**
   * Validate cart items (stock availability)
   * GET /cart/validate
   */
  @Get('validate')
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate cart items',
    description:
      'Checks if all items in the cart are available (active and in stock).',
  })
  @ApiOkResponse({
    description: 'Validation result',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        invalidItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              itemId: { type: 'string' },
              reason: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async validateCart(@Req() req: AuthenticatedRequest): Promise<{
    valid: boolean;
    invalidItems: Array<{ itemId: string; reason: string }>;
  }> {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    return this.cartService.validateCartItems(userId);
  }

  /**
   * Merge guest cart to user cart
   * POST /cart/merge
   */
  @Post('merge')
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Merge guest cart to user cart',
    description:
      'Merges items from a guest cart (e.g., from localStorage) to the authenticated user cart.',
  })
  @ApiOkResponse({
    description: 'Cart merged successfully',
    type: CartResponseDto,
  })
  async mergeCart(
    @Req() req: AuthenticatedRequest,
    @Body() mergeDto: MergeCartDto,
  ): Promise<CartResponseDto> {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    return this.cartService.bulkAddItems(userId, mergeDto.items);
  }
}
