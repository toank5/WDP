import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RevenueService } from '../services/revenue.service';
import {
  RbacGuard,
  Roles,
  MANAGER_OR_ADMIN,
} from '../commons/guards/rbac.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ErrorResponseDto } from '../commons/dtos/error-response.dto';
import {
  RevenueQueryDto,
  RevenueByProductQueryDto,
} from '../commons/dtos/revenue.dto';

@ApiTags('Revenue')
@Controller('manager/revenue')
@UseGuards(JwtAuthGuard, RbacGuard)
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  /**
   * Get revenue overview metrics
   * GET /manager/revenue/overview
   */
  @Get('overview')
  @Roles(...MANAGER_OR_ADMIN)
  @ApiOperation({
    summary: 'Get revenue overview',
    description:
      'Get summary metrics including total revenue, total orders, and average order value for a date range.',
  })
  @ApiOkResponse({
    description: 'Revenue overview retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Revenue overview retrieved successfully',
        data: {
          totalRevenue: 150000000,
          totalOrders: 150,
          avgOrderValue: 1000000,
          from: '2026-01-01',
          to: '2026-01-31',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getOverview(@Query() query: RevenueQueryDto) {
    try {
      const from = query.from ? new Date(query.from) : undefined;
      const to = query.to ? new Date(query.to) : undefined;

      const result = await this.revenueService.getOverview(from, to);

      return {
        statusCode: 200,
        message: 'Revenue overview retrieved successfully',
        data: result,
      };
    } catch (error) {
      console.error('Revenue overview error:', error);
      throw error;
    }
  }

  /**
   * Get revenue time series data
   * GET /manager/revenue/timeseries
   */
  @Get('timeseries')
  @Roles(...MANAGER_OR_ADMIN)
  @ApiOperation({
    summary: 'Get revenue time series',
    description:
      'Get time-series revenue data grouped by day, week, or month for charting.',
  })
  @ApiOkResponse({
    description: 'Time series data retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Time series data retrieved successfully',
        data: {
          points: [
            {
              periodStart: '2026-01-01',
              revenue: 5000000,
              orders: 5,
            },
            {
              periodStart: '2026-01-02',
              revenue: 7000000,
              orders: 7,
            },
          ],
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getTimeSeries(@Query() query: RevenueQueryDto) {
    try {
      const from = query.from
        ? new Date(query.from)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
      const to = query.to ? new Date(query.to) : new Date();
      const groupBy = query.groupBy || 'day';
      const timezone = query.timezone || 'Asia/Ho_Chi_Minh';

      const result = await this.revenueService.getTimeSeries(
        from,
        to,
        groupBy,
        timezone,
      );

      return {
        statusCode: 200,
        message: 'Time series data retrieved successfully',
        data: result,
      };
    } catch (error) {
      console.error('Revenue time series error:', error);
      throw error;
    }
  }

  /**
   * Get revenue breakdown by category
   * GET /manager/revenue/by-category
   */
  @Get('by-category')
  @Roles(...MANAGER_OR_ADMIN)
  @ApiOperation({
    summary: 'Get revenue by category',
    description: 'Get revenue breakdown by product category for a date range.',
  })
  @ApiOkResponse({
    description: 'Revenue by category retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Revenue by category retrieved successfully',
        data: {
          items: [
            {
              category: 'Men',
              revenue: 50000000,
              orders: 50,
              units: 75,
            },
            {
              category: 'Women',
              revenue: 40000000,
              orders: 40,
              units: 60,
            },
          ],
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getByCategory(@Query() query: RevenueQueryDto) {
    try {
      const from = query.from ? new Date(query.from) : undefined;
      const to = query.to ? new Date(query.to) : undefined;

      const result = await this.revenueService.getByCategory(from, to);

      return {
        statusCode: 200,
        message: 'Revenue by category retrieved successfully',
        data: result,
      };
    } catch (error) {
      console.error('Revenue by category error:', error);
      throw error;
    }
  }

  /**
   * Get revenue breakdown by product
   * GET /manager/revenue/by-product
   */
  @Get('by-product')
  @Roles(...MANAGER_OR_ADMIN)
  @ApiOperation({
    summary: 'Get revenue by product',
    description:
      'Get revenue breakdown by product with pagination and search support.',
  })
  @ApiOkResponse({
    description: 'Revenue by product retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Revenue by product retrieved successfully',
        data: {
          items: [
            {
              productId: '507f1f77bcf86cd799439011',
              name: 'Classic Round Frame',
              revenue: 30000000,
              orders: 30,
              units: 35,
              avgPrice: 857143,
            },
          ],
          total: 42,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getByProduct(@Query() query: RevenueByProductQueryDto) {
    try {
      const from = query.from ? new Date(query.from) : undefined;
      const to = query.to ? new Date(query.to) : undefined;
      const page = query.page || 1;
      const limit = query.limit || 20;
      const search = query.search;

      const result = await this.revenueService.getByProduct({
        from,
        to,
        page,
        limit,
        search,
      });

      return {
        statusCode: 200,
        message: 'Revenue by product retrieved successfully',
        data: result,
      };
    } catch (error) {
      console.error('Revenue by product error:', error);
      throw error;
    }
  }
}
