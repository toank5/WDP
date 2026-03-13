import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  ParseIntPipe,
  DefaultValuePipe,
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
import { FavoriteService } from '../services/favorite.service';
import {
  AddFavoriteDto,
  FavoritesListResponseDto,
  AddFavoriteResponseDto,
  RemoveFavoriteResponseDto,
  CheckFavoriteResponseDto,
  FavoritesCountResponseDto,
} from '../commons/dtos/favorite.dto';
import { RbacGuard, Roles, UserRole } from '../commons/guards/rbac.guard';
import { ErrorResponseDto } from '../commons/dtos/error-response.dto';
import type { AuthenticatedRequest } from '../commons/types/express.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Store - Favorites')
@ApiBearerAuth()
@Controller('store/favorites')
@UseGuards(JwtAuthGuard, RbacGuard)
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  /**
   * Get current user's favorites
   * GET /store/favorites
   */
  @Get()
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user favorites',
    description:
      'Returns all favorites for the authenticated customer with product details populated.',
  })
  @ApiOkResponse({
    description: 'Favorites retrieved successfully',
    type: FavoritesListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getFavorites(@Req() req: AuthenticatedRequest): Promise<FavoritesListResponseDto> {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new Error('User ID not found in request');
    }

    return this.favoriteService.getUserFavorites(userId);
  }

  /**
   * Get favorites count
   * GET /store/favorites/count
   */
  @Get('count')
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get favorites count',
    description: 'Returns the total number of favorites for the authenticated user.',
  })
  @ApiOkResponse({
    description: 'Favorites count retrieved successfully',
    type: FavoritesCountResponseDto,
  })
  async getFavoritesCount(
    @Req() req: AuthenticatedRequest,
  ): Promise<FavoritesCountResponseDto> {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new Error('User ID not found in request');
    }

    const count = await this.favoriteService.getFavoritesCount(userId);
    return { count };
  }

  /**
   * Check if a product is in favorites
   * GET /store/favorites/check
   */
  @Get('check')
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check if product is favorited',
    description: 'Checks if a specific product (with optional variant) is in the user favorites.',
  })
  @ApiOkResponse({
    description: 'Check result',
    type: CheckFavoriteResponseDto,
  })
  async checkFavorite(
    @Req() req: AuthenticatedRequest,
    @Query('productId') productId: string,
    @Query('variantId') variantId?: string,
  ): Promise<CheckFavoriteResponseDto> {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new Error('User ID not found in request');
    }

    return this.favoriteService.checkFavorite(userId, productId, variantId);
  }

  /**
   * Add item to favorites
   * POST /store/favorites
   */
  @Post()
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add to favorites',
    description:
      'Adds a product (with optional variant) to the user favorites. If the product is already in favorites, returns success without duplicate.',
  })
  @ApiCreatedResponse({
    description: 'Item added to favorites successfully',
    type: AddFavoriteResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request', type: ErrorResponseDto })
  async addFavorite(
    @Req() req: AuthenticatedRequest,
    @Body() addFavoriteDto: AddFavoriteDto,
  ): Promise<AddFavoriteResponseDto> {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new Error('User ID not found in request');
    }

    return this.favoriteService.addFavorite(userId, addFavoriteDto);
  }

  /**
   * Toggle item in favorites
   * POST /store/favorites/toggle
   */
  @Post('toggle')
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Toggle favorite',
    description:
      'Adds or removes a product from favorites based on its current state. Returns the new state.',
  })
  @ApiOkResponse({
    description: 'Favorite toggled successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        isFavorited: { type: 'boolean' },
      },
    },
  })
  async toggleFavorite(
    @Req() req: AuthenticatedRequest,
    @Body() addFavoriteDto: AddFavoriteDto,
  ): Promise<{ success: boolean; message: string; isFavorited: boolean }> {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new Error('User ID not found in request');
    }

    return this.favoriteService.toggleFavorite(userId, addFavoriteDto);
  }

  /**
   * Remove item from favorites by favorite ID
   * DELETE /store/favorites/:id
   */
  @Delete(':id')
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove from favorites by ID',
    description: 'Removes a specific favorite item by its favorite ID.',
  })
  @ApiOkResponse({
    description: 'Item removed successfully',
    type: RemoveFavoriteResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Favorite not found',
    type: ErrorResponseDto,
  })
  async removeFavorite(
    @Req() req: AuthenticatedRequest,
    @Param('id') favoriteId: string,
  ): Promise<RemoveFavoriteResponseDto> {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new Error('User ID not found in request');
    }

    return this.favoriteService.removeFavorite(favoriteId, userId);
  }

  /**
   * Remove item from favorites by product ID
   * DELETE /store/favorites/by-product/:productId
   */
  @Delete('by-product/:productId')
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove from favorites by product ID',
    description:
      'Removes a product from favorites by product ID. Optionally specify variant ID in query params.',
  })
  @ApiOkResponse({
    description: 'Item removed successfully',
    type: RemoveFavoriteResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Favorite not found',
    type: ErrorResponseDto,
  })
  async removeFavoriteByProduct(
    @Req() req: AuthenticatedRequest,
    @Param('productId') productId: string,
    @Query('variantId') variantId?: string,
  ): Promise<RemoveFavoriteResponseDto> {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new Error('User ID not found in request');
    }

    return this.favoriteService.removeFavoriteByProduct(productId, userId, variantId);
  }
}
