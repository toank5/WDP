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
import { ComboService } from '../services/combo.service';
import {
  CreateComboDto,
  UpdateComboDto,
  ListCombosQueryDto,
  ValidateComboDto,
} from '../commons/dtos/combo.dto';
import { ErrorResponseDto } from '../commons/dtos/error-response.dto';
import { ComboStatus } from '../commons/schemas/combo.schema';

// Roles that can manage combos (Manager, Admin)
const COMBO_MANAGE_ROLES = [UserRole.MANAGER, UserRole.ADMIN];

// Roles that can view combos (Manager, Admin)
const COMBO_VIEW_ROLES = [UserRole.MANAGER, UserRole.ADMIN];

@ApiTags('combos')
@Controller('manager/combos')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ComboController {
  constructor(private readonly comboService: ComboService) {}

  /**
   * Create a new combo
   */
  @Post()
  @Roles(...COMBO_MANAGE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create combo',
    description: 'Create a new frame + lens combo. Requires MANAGER or ADMIN role.',
  })
  @ApiResponse({
    status: 201,
    description: 'Combo created successfully',
    schema: {
      example: {
        statusCode: 201,
        message: 'Combo created successfully',
        data: {
          _id: '507f1f77bcf86cd799439011',
          name: 'Student Package',
          frameProductId: '507f1f77bcf86cd799439012',
          lensProductId: '507f1f77bcf86cd799439013',
          comboPrice: 250000,
          originalPrice: 350000,
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
    description: 'Combo already exists',
    type: ErrorResponseDto,
  })
  async create(@Body() createDto: CreateComboDto, @Res() res?: Response) {
    try {
      const combo = await this.comboService.create(createDto);
      return res?.status(HttpStatus.CREATED).json({
        statusCode: HttpStatus.CREATED,
        message: 'Combo created successfully',
        data: combo,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          return res?.status(HttpStatus.CONFLICT).json({
            statusCode: HttpStatus.CONFLICT,
            message: error.message,
            error: 'COMBO_EXISTS',
          });
        }
        if (error.message.includes('not found')) {
          return res?.status(HttpStatus.NOT_FOUND).json({
            statusCode: HttpStatus.NOT_FOUND,
            message: error.message,
            error: 'PRODUCT_NOT_FOUND',
          });
        }
      }
      throw error;
    }
  }

  /**
   * Get all combos
   */
  @Get()
  @Roles(...COMBO_VIEW_ROLES)
  @ApiOperation({
    summary: 'Get combos list',
    description: 'Get paginated list of combos with filters',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ComboStatus })
  @ApiQuery({ name: 'frameProductId', required: false, type: String })
  @ApiQuery({ name: 'lensProductId', required: false, type: String })
  @ApiQuery({ name: 'isFeatured', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Combos retrieved' })
  async findAll(@Query() query: ListCombosQueryDto) {
    const params = {
      search: query.search,
      status: query.status,
      frameProductId: query.frameProductId,
      lensProductId: query.lensProductId,
      isFeatured: query.isFeatured,
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 20,
    };
    const result = await this.comboService.findAll(params);
    return {
      statusCode: HttpStatus.OK,
      message: 'Combos retrieved successfully',
      data: result,
    };
  }

  /**
   * Get combo by ID
   */
  @Get(':id')
  @Roles(...COMBO_VIEW_ROLES)
  @ApiOperation({
    summary: 'Get combo by ID',
    description: 'Get a single combo by ID',
  })
  @ApiResponse({ status: 200, description: 'Combo found' })
  @ApiResponse({
    status: 404,
    description: 'Combo not found',
    type: ErrorResponseDto,
  })
  async findById(@Param('id') id: string, @Res() res?: Response) {
    try {
      const combo = await this.comboService.findById(id);
      return res?.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Combo retrieved successfully',
        data: combo,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res?.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: error.message,
          error: 'COMBO_NOT_FOUND',
        });
      }
      throw error;
    }
  }

  /**
   * Update combo
   */
  @Patch(':id')
  @Roles(...COMBO_MANAGE_ROLES)
  @ApiOperation({
    summary: 'Update combo',
    description: 'Update combo information',
  })
  @ApiResponse({ status: 200, description: 'Combo updated' })
  @ApiResponse({
    status: 404,
    description: 'Combo not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Combo already exists',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateComboDto,
    @Res() res?: Response,
  ) {
    try {
      const combo = await this.comboService.update(id, updateDto);
      return res?.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Combo updated successfully',
        data: combo,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res?.status(HttpStatus.NOT_FOUND).json({
            statusCode: HttpStatus.NOT_FOUND,
            message: error.message,
            error: 'COMBO_NOT_FOUND',
          });
        }
        if (error.message.includes('already exists')) {
          return res?.status(HttpStatus.CONFLICT).json({
            statusCode: HttpStatus.CONFLICT,
            message: error.message,
            error: 'COMBO_EXISTS',
          });
        }
      }
      throw error;
    }
  }

  /**
   * Update combo status
   */
  @Patch(':id/status')
  @Roles(...COMBO_MANAGE_ROLES)
  @ApiOperation({
    summary: 'Update combo status',
    description: 'Update combo status (active, inactive, scheduled)',
  })
  @ApiResponse({ status: 200, description: 'Combo status updated' })
  @ApiResponse({
    status: 404,
    description: 'Combo not found',
    type: ErrorResponseDto,
  })
  async setStatus(
    @Param('id') id: string,
    @Body('status') status: ComboStatus,
    @Res() res?: Response,
  ) {
    try {
      const combo = await this.comboService.updateStatus(id, status);
      return res?.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: `Combo ${status.toLowerCase()} successfully`,
        data: combo,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res?.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: error.message,
          error: 'COMBO_NOT_FOUND',
        });
      }
      throw error;
    }
  }

  /**
   * Delete combo
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete combo',
    description: 'Permanently delete a combo. ADMIN only.',
  })
  @ApiResponse({ status: 200, description: 'Combo deleted' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin only',
    type: ErrorResponseDto,
  })
  async delete(@Param('id') id: string, @Res() res?: Response) {
    try {
      const combo = await this.comboService.delete(id);
      return res?.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Combo deleted successfully',
        data: combo,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res?.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: error.message,
          error: 'COMBO_NOT_FOUND',
        });
      }
      throw error;
    }
  }

  /**
   * Validate combo for cart
   */
  @Post('validate')
  @Roles(...COMBO_VIEW_ROLES)
  @ApiOperation({
    summary: 'Validate combo',
    description: 'Check if a combo exists for the given frame and lens products',
  })
  @ApiResponse({ status: 200, description: 'Combo validation result' })
  async validate(@Body() dto: ValidateComboDto) {
    const { frameProductId, lensProductId } = this.extractFrameAndLens(dto.productIds);

    if (!frameProductId || !lensProductId) {
      return {
        statusCode: HttpStatus.OK,
        message: 'No combo available',
        data: { hasCombo: false },
      };
    }

    const result = await this.comboService.validateCombo(frameProductId, lensProductId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Combo validation completed',
      data: result,
    };
  }

  /**
   * Get combo statistics
   */
  @Get('statistics/overview')
  @Roles(...COMBO_VIEW_ROLES)
  @ApiOperation({
    summary: 'Get combo statistics',
    description: 'Get overview statistics for combos',
  })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStatistics() {
    const stats = await this.comboService.getStatistics();
    return {
      statusCode: HttpStatus.OK,
      message: 'Statistics retrieved successfully',
      data: stats,
    };
  }

  /**
   * Extract frame and lens product IDs from product list
   */
  private extractFrameAndLens(productIds: string[]): {
    frameProductId?: string;
    lensProductId?: string;
  } {
    // In a real implementation, we would query the database to determine
    // which products are frames and which are lenses
    // For now, this is a placeholder that would need to be implemented
    // with actual product lookups
    return {
      frameProductId: productIds[0],
      lensProductId: productIds[1],
    };
  }
}

/**
 * Public combo controller for customers (read-only)
 */
@ApiTags('combos')
@Controller('combos')
@UseGuards(JwtAuthGuard, RbacGuard)
export class PublicComboController {
  constructor(private readonly comboService: ComboService) {}

  /**
   * Get active combos (public endpoint)
   */
  @Get('active')
  @Roles(UserRole.CUSTOMER, UserRole.MANAGER, UserRole.ADMIN, UserRole.OPERATION, UserRole.SALE)
  @ApiOperation({
    summary: 'Get active combos',
    description: 'Get all active combos available for customers',
  })
  @ApiResponse({ status: 200, description: 'Active combos retrieved' })
  async findActive() {
    const combos = await this.comboService.findActive();
    return {
      statusCode: HttpStatus.OK,
      message: 'Active combos retrieved successfully',
      data: combos,
    };
  }

  /**
   * Get applicable combo price for cart items
   */
  @Post('check-price')
  @Roles(UserRole.CUSTOMER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Check combo price',
    description: 'Check if a combo price applies to the cart items',
  })
  @ApiResponse({ status: 200, description: 'Combo price check result' })
  async checkComboPrice(@Body() dto: ValidateComboDto) {
    const result = await this.comboService.getComboPrice(dto.productIds);
    return {
      statusCode: HttpStatus.OK,
      message: 'Combo price checked successfully',
      data: result,
    };
  }
}
