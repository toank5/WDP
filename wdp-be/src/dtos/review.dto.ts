import {
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
  Min,
  Max,
  MaxLength,
  MinLength,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'Product ID being reviewed' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Order ID that verifies the purchase' })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiPropertyOptional({ description: 'Product variant SKU (if applicable)' })
  @IsOptional()
  @IsString()
  variantSku?: string;

  @ApiProperty({ description: 'Rating from 1 to 5 stars', example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Review comment', example: 'Great product!' })
  @IsNotEmpty()
  @IsString()
  @MinLength(10, { message: 'Comment must be at least 10 characters long' })
  @MaxLength(1000, { message: 'Comment must not exceed 1000 characters' })
  comment: string;

  @ApiPropertyOptional({
    description: 'Review title/headline',
    example: 'Amazing glasses!',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Array of image URLs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class UpdateReviewDto {
  @ApiPropertyOptional({ description: 'Rating from 1 to 5 stars' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Review comment' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  comment?: string;

  @ApiPropertyOptional({ description: 'Review title/headline' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Array of image URLs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Is review visible' })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}

export class ReviewResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() productId: string;
  @ApiProperty() orderId: string;
  @ApiProperty() variantSku?: string;
  @ApiProperty() rating: number;
  @ApiProperty() comment: string;
  @ApiProperty() title?: string;
  @ApiProperty() images: string[];
  @ApiProperty() isVerifiedPurchase: boolean;
  @ApiProperty() helpfulCount: number;
  @ApiProperty() isVisible: boolean;
  @ApiProperty() response?: string;
  @ApiProperty() responseDate?: Date;
  @ApiProperty() userName?: string;
  @ApiProperty() userAvatar?: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class ReviewStatsDto {
  @ApiProperty({ description: 'Average rating', example: 4.5 })
  averageRating: number;

  @ApiProperty({ description: 'Total number of reviews', example: 42 })
  totalReviews: number;

  @ApiProperty({
    description: 'Number of reviews for each star rating',
    example: { 5: 30, 4: 8, 3: 3, 2: 1, 1: 0 },
  })
  ratingDistribution: Record<number, number>;

  @ApiProperty({ description: 'Percentage of 5-star reviews', example: 71.43 })
  fiveStarPercentage: number;
}

export class MarkReviewHelpfulDto {
  @ApiProperty({
    description: 'Review ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty()
  @IsString()
  reviewId: string;
}

export class AddReviewResponseDto {
  @ApiProperty({ description: 'Admin response to the review' })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  response: string;
}
