import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';

export class RevenueQueryDto {
  @ApiPropertyOptional({
    description: 'Start date in ISO format (e.g., 2026-01-01)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'End date in ISO format (e.g., 2026-12-31)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: 'Time period grouping for time series data',
    enum: ['day', 'week', 'month'],
    default: 'day',
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month';

  @ApiPropertyOptional({
    description: 'Timezone for date grouping (e.g., Asia/Ho_Chi_Minh)',
    example: 'Asia/Ho_Chi_Minh',
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class RevenueByProductQueryDto extends RevenueQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Search by product name or SKU',
    example: 'glass',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class RevenueOverviewResponseDto {
  @ApiProperty({
    description: 'Total revenue in the period',
    example: 150000000,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Total number of orders',
    example: 150,
  })
  totalOrders: number;

  @ApiProperty({
    description: 'Average order value',
    example: 1000000,
  })
  avgOrderValue: number;

  @ApiProperty({
    description: 'Start date of the period',
    example: '2026-01-01',
  })
  from: string;

  @ApiProperty({
    description: 'End date of the period',
    example: '2026-01-31',
  })
  to: string;
}

export class RevenueTimeSeriesPointDto {
  @ApiProperty({
    description: 'Start of the time period',
    example: '2026-01-01T00:00:00.000Z',
  })
  periodStart: string;

  @ApiProperty({
    description: 'Revenue in this period',
    example: 5000000,
  })
  revenue: number;

  @ApiProperty({
    description: 'Number of orders in this period',
    example: 5,
  })
  orders: number;
}

export class RevenueTimeSeriesResponseDto {
  @ApiProperty({
    description: 'Array of time-series data points',
    type: [RevenueTimeSeriesPointDto],
  })
  points: RevenueTimeSeriesPointDto[];
}

export class RevenueByCategoryItemDto {
  @ApiProperty({
    description: 'Product category',
    example: 'Men',
  })
  category: string;

  @ApiProperty({
    description: 'Total revenue for this category',
    example: 50000000,
  })
  revenue: number;

  @ApiProperty({
    description: 'Number of orders in this category',
    example: 50,
  })
  orders: number;

  @ApiProperty({
    description: 'Total units sold in this category',
    example: 75,
  })
  units: number;
}

export class RevenueByCategoryResponseDto {
  @ApiProperty({
    description: 'Revenue breakdown by category',
    type: [RevenueByCategoryItemDto],
  })
  items: RevenueByCategoryItemDto[];
}

export class RevenueByProductItemDto {
  @ApiProperty({
    description: 'Product ID',
    example: '507f1f77bcf86cd799439011',
  })
  productId: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Classic Round Frame',
  })
  name: string;

  @ApiProperty({
    description: 'Total revenue for this product',
    example: 30000000,
  })
  revenue: number;

  @ApiProperty({
    description: 'Number of orders containing this product',
    example: 30,
  })
  orders: number;

  @ApiProperty({
    description: 'Total units sold',
    example: 35,
  })
  units: number;

  @ApiProperty({
    description: 'Average selling price',
    example: 857143,
  })
  avgPrice: number;
}

export class RevenueByProductResponseDto {
  @ApiProperty({
    description: 'Revenue breakdown by product',
    type: [RevenueByProductItemDto],
  })
  items: RevenueByProductItemDto[];

  @ApiProperty({
    description: 'Total number of products',
    example: 42,
  })
  total: number;
}
