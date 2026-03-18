import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard, UserRole, Roles } from '../commons/guards/rbac.guard';
import { PromotionService } from '../services/promotion.service';
import {
  CreatePromotionDto,
  UpdatePromotionDto,
  ListPromotionsQueryDto,
  ValidatePromotionDto,
} from '../commons/dtos/promotion.dto';
import { ErrorResponseDto } from '../commons/dtos/error-response.dto';
import { PromotionStatus } from '../commons/schemas/promotion.schema';

// Roles that can manage promotions (Manager, Admin)
const PROMOTION_MANAGE_ROLES = [UserRole.MANAGER, UserRole.ADMIN];

// Roles that can view promotions (Manager, Admin, Sale - for checkout)
const PROMOTION_VIEW_ROLES = [
  UserRole.MANAGER,
  UserRole.ADMIN,
  UserRole.SALE,
  UserRole.OPERATION,
];

@ApiTags('promotions')
@Controller('manager/promotions')
@UseGuards(JwtAuthGuard, RbacGuard)
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  /**
   * Create a new promotion
   */
  @Post()
  @Roles(...PROMOTION_MANAGE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create promotion',
    description: 'Create a new promotion code. Requires MANAGER or ADMIN role.',
  })
  @ApiResponse({
    status: 201,
    description: 'Promotion created successfully',
    schema: {
      example: {
        statusCode: 201,
        message: 'Promotion created successfully',
        data: {
          _id: '507f1f77bcf86cd799439011',
          code: 'EYEWEAR20',
          name: 'Summer Sale 20% Off',
          type: 'percentage',
          value: 20,
          minOrderValue: 500000,
          status: 'active',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Promotion code already exists',
    type: ErrorResponseDto,
  })
  async create(@Body() createDto: CreatePromotionDto, @Res() res?: Response) {
    try {
      const promotion = await this.promotionService.create(createDto);
      return res?.status(HttpStatus.CREATED).json({
        statusCode: HttpStatus.CREATED,
        message: 'Promotion created successfully',
        data: promotion,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          return res?.status(HttpStatus.CONFLICT).json({
            statusCode: HttpStatus.CONFLICT,
            message: error.message,
            error: 'PROMOTION_EXISTS',
          });
        }
      }
      throw error;
    }
  }

  /**
   * Get all promotions
   */
  @Get()
  @Roles(...PROMOTION_VIEW_ROLES)
  @ApiOperation({
    summary: 'Get promotions list',
    description: 'Get paginated list of promotions with filters',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: PromotionStatus })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'isFeatured', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Promotions retrieved' })
  async findAll(@Query() query: ListPromotionsQueryDto) {
    const params = {
      search: query.search,
      status: query.status,
      type: query.type,
      isFeatured: query.isFeatured,
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 20,
    };
    const result = await this.promotionService.findAll(params);
    return {
      statusCode: HttpStatus.OK,
      message: 'Promotions retrieved successfully',
      data: result,
    };
  }

  /**
   * Get promotion by ID
   */
  @Get(':id')
  @Roles(...PROMOTION_VIEW_ROLES)
  @ApiOperation({
    summary: 'Get promotion by ID',
    description: 'Get a single promotion by ID',
  })
  @ApiResponse({ status: 200, description: 'Promotion found' })
  @ApiResponse({
    status: 404,
    description: 'Promotion not found',
    type: ErrorResponseDto,
  })
  async findById(@Param('id') id: string, @Res() res?: Response) {
    try {
      const promotion = await this.promotionService.findById(id);
      return res?.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Promotion retrieved successfully',
        data: promotion,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res?.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: error.message,
          error: 'PROMOTION_NOT_FOUND',
        });
      }
      throw error;
    }
  }

  /**
   * Update promotion
   */
  @Patch(':id')
  @Roles(...PROMOTION_MANAGE_ROLES)
  @ApiOperation({
    summary: 'Update promotion',
    description: 'Update promotion information',
  })
  @ApiResponse({ status: 200, description: 'Promotion updated' })
  @ApiResponse({
    status: 404,
    description: 'Promotion not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Promotion code already exists',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePromotionDto,
    @Res() res?: Response,
  ) {
    try {
      const promotion = await this.promotionService.update(id, updateDto);
      return res?.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Promotion updated successfully',
        data: promotion,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res?.status(HttpStatus.NOT_FOUND).json({
            statusCode: HttpStatus.NOT_FOUND,
            message: error.message,
            error: 'PROMOTION_NOT_FOUND',
          });
        }
        if (error.message.includes('already exists')) {
          return res?.status(HttpStatus.CONFLICT).json({
            statusCode: HttpStatus.CONFLICT,
            message: error.message,
            error: 'PROMOTION_EXISTS',
          });
        }
      }
      throw error;
    }
  }

  /**
   * Update promotion status
   */
  @Patch(':id/status')
  @Roles(...PROMOTION_MANAGE_ROLES)
  @ApiOperation({
    summary: 'Update promotion status',
    description:
      'Update promotion status (active, inactive, scheduled, expired)',
  })
  @ApiResponse({ status: 200, description: 'Promotion status updated' })
  @ApiResponse({
    status: 404,
    description: 'Promotion not found',
    type: ErrorResponseDto,
  })
  async setStatus(
    @Param('id') id: string,
    @Body('status') status: PromotionStatus,
    @Res() res?: Response,
  ) {
    try {
      const promotion = await this.promotionService.updateStatus(id, status);
      return res?.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: `Promotion ${status.toLowerCase()} successfully`,
        data: promotion,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res?.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: error.message,
          error: 'PROMOTION_NOT_FOUND',
        });
      }
      throw error;
    }
  }

  /**
   * Delete promotion
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete promotion',
    description: 'Permanently delete a promotion. ADMIN only.',
  })
  @ApiResponse({ status: 200, description: 'Promotion deleted' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin only',
    type: ErrorResponseDto,
  })
  async delete(@Param('id') id: string, @Res() res?: Response) {
    try {
      const promotion = await this.promotionService.delete(id);
      return res?.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Promotion deleted successfully',
        data: promotion,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res?.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: error.message,
          error: 'PROMOTION_NOT_FOUND',
        });
      }
      throw error;
    }
  }

  /**
   * Validate promotion code
   */
  @Post('validate')
  @Roles(...PROMOTION_VIEW_ROLES)
  @ApiOperation({
    summary: 'Validate promotion code',
    description: 'Validate a promotion code and calculate discount',
  })
  @ApiResponse({ status: 200, description: 'Promotion validated' })
  @ApiResponse({
    status: 400,
    description: 'Invalid request',
    type: ErrorResponseDto,
  })
  async validate(@Body() dto: ValidatePromotionDto) {
    const result = await this.promotionService.validateCode(
      dto.code,
      dto.cartTotal,
      dto.productIds,
      dto.customerId,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Promotion validation completed',
      data: result,
    };
  }

  /**
   * Get promotion statistics
   */
  @Get('statistics/overview')
  @Roles(...PROMOTION_VIEW_ROLES)
  @ApiOperation({
    summary: 'Get promotion statistics',
    description: 'Get overview statistics for promotions',
  })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStatistics() {
    const stats = await this.promotionService.getStatistics();
    return {
      statusCode: HttpStatus.OK,
      message: 'Statistics retrieved successfully',
      data: stats,
    };
  }
}

/**
 * Public promotion controller for customers (read-only)
 */
@ApiTags('promotions')
@Controller('promotions')
@UseGuards(JwtAuthGuard, RbacGuard)
export class PublicPromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  /**
   * Get active promotions (public endpoint)
   */
  @Get('active')
  @Roles(
    UserRole.CUSTOMER,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.OPERATION,
    UserRole.SALE,
  )
  @ApiOperation({
    summary: 'Get active promotions',
    description: 'Get all active promotions available for customers',
  })
  @ApiResponse({ status: 200, description: 'Active promotions retrieved' })
  async findActive() {
    const promotions = await this.promotionService.findActive();
    return {
      statusCode: HttpStatus.OK,
      message: 'Active promotions retrieved successfully',
      data: promotions,
    };
  }

  /**
   * Validate promotion code for checkout (public endpoint)
   */
  @Post('validate')
  @Roles(UserRole.CUSTOMER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SALE)
  @ApiOperation({
    summary: 'Validate promotion code (public)',
    description: 'Validate a promotion code during checkout',
  })
  @ApiResponse({ status: 200, description: 'Promotion validated' })
  async validateForCheckout(@Body() dto: ValidatePromotionDto) {
    const result = await this.promotionService.validateCode(
      dto.code,
      dto.cartTotal,
      dto.productIds,
      dto.customerId,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Promotion validated successfully',
      data: result,
    };
  }
}
