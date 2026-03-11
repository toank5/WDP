import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ReviewService } from '../services/review.service';
import { CreateReviewDto, UpdateReviewDto, ReviewStatsDto, AddReviewResponseDto } from '../dtos/review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard, Roles, UserRole, MANAGER_OR_ADMIN } from '../commons/guards/rbac.guard';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  /**
   * Create a new review
   * Only accessible after order is delivered
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a product review',
    description: 'Create a review for a product from a delivered order. User can only review products from orders with DELIVERED status.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Review created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Order not delivered, duplicate review, or validation error' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Order not found' })
  async createReview(
    @Request() req,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    const userId = req.user?._id?.toString();
    if (!userId) throw new BadRequestException('User ID not found in request');
    const userName = req.user.fullName;
    const userAvatar = req.user.avatar;

    const review = await this.reviewService.createReview(
      userId,
      createReviewDto,
      userName,
      userAvatar,
    );

    return {
      success: true,
      message: 'Review submitted successfully',
      data: review,
    };
  }

  /**
   * Get reviews for a specific product
   */
  @Get('product/:productId')
  @ApiOperation({
    summary: 'Get product reviews',
    description: 'Get paginated reviews for a specific product with sorting options',
  })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['recent', 'helpful', 'rating-high', 'rating-low'], example: 'recent' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Reviews retrieved successfully' })
  async getProductReviews(
    @Param('productId') productId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sortBy') sortBy: 'recent' | 'helpful' | 'rating-high' | 'rating-low' = 'recent',
  ) {
    const result = await this.reviewService.getProductReviews(productId, page, limit, sortBy);
    return {
      success: true,
      ...result,
    };
  }

  /**
   * Get product review statistics
   */
  @Get('product/:productId/stats')
  @ApiOperation({
    summary: 'Get product review statistics',
    description: 'Get average rating, total reviews, and rating distribution for a product',
  })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Stats retrieved successfully' })
  async getProductStats(@Param('productId') productId: string): Promise<ReviewStatsDto> {
    return this.reviewService.getProductStats(productId);
  }

  /**
   * Get current user's reviews
   */
  @Get('my-reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user reviews',
    description: 'Get all reviews written by the authenticated user',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: HttpStatus.OK, description: 'User reviews retrieved successfully' })
  async getMyReviews(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const userId = req.user?._id?.toString();
    if (!userId) throw new BadRequestException('User ID not found in request');
    const result = await this.reviewService.getUserReviews(userId, page, limit);
    return {
      success: true,
      ...result,
    };
  }

  /**
   * Get products that user can review (from delivered orders)
   */
  @Get('can-review/:productId/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check if user can review a product',
    description: 'Check if the authenticated user can review a specific product from a specific order',
  })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiQuery({ name: 'variantSku', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Check completed successfully' })
  async canUserReviewProduct(
    @Request() req,
    @Param('productId') productId: string,
    @Param('orderId') orderId: string,
    @Query('variantSku') variantSku?: string,
  ) {
    const userId = req.user?._id?.toString();
    if (!userId) throw new BadRequestException('User ID not found in request');
    const result = await this.reviewService.canUserReviewProduct(
      userId,
      productId,
      orderId,
      variantSku,
    );
    return {
      success: true,
      ...result,
    };
  }

  /**
   * Get all products user hasn't reviewed yet from delivered orders
   */
  @Get('unreviewed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get unreviewed products',
    description: 'Get all products from delivered orders that the user hasn\'t reviewed yet',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Unreviewed products retrieved successfully' })
  async getUnreviewedProducts(@Request() req) {
    const userId = req.user?._id?.toString();
    if (!userId) throw new BadRequestException('User ID not found in request');
    const products = await this.reviewService.getUnreviewedProducts(userId);

    // Populate product details
    const populatedProducts = await Promise.all(
      products.map(async (product) => {
        // Note: In a real implementation, you would fetch product details here
        // For now, return the basic structure
        return product;
      }),
    );

    return {
      success: true,
      data: populatedProducts,
    };
  }

  /**
   * Get a single review by ID
   */
  @Get(':reviewId')
  @ApiOperation({
    summary: 'Get review by ID',
    description: 'Get detailed information about a specific review',
  })
  @ApiParam({ name: 'reviewId', description: 'Review ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Review retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Review not found' })
  async getReviewById(@Param('reviewId') reviewId: string) {
    const review = await this.reviewService.getReviewById(reviewId);
    return {
      success: true,
      data: review,
    };
  }

  /**
   * Update a review
   */
  @Put(':reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a review',
    description: 'Update an existing review (only by the review owner)',
  })
  @ApiParam({ name: 'reviewId', description: 'Review ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Review updated successfully' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not the review owner' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Review not found' })
  async updateReview(
    @Param('reviewId') reviewId: string,
    @Request() req,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    const userId = req.user?._id?.toString();
    if (!userId) throw new BadRequestException('User ID not found in request');
    const review = await this.reviewService.updateReview(reviewId, userId, updateReviewDto);

    return {
      success: true,
      message: 'Review updated successfully',
      data: review,
    };
  }

  /**
   * Delete a review
   */
  @Delete(':reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a review',
    description: 'Delete a review (only by the review owner)',
  })
  @ApiParam({ name: 'reviewId', description: 'Review ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Review deleted successfully' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not the review owner' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Review not found' })
  async deleteReview(@Param('reviewId') reviewId: string, @Request() req) {
    const userId = req.user?._id?.toString();
    if (!userId) throw new BadRequestException('User ID not found in request');
    await this.reviewService.deleteReview(reviewId, userId);
  }

  /**
   * Mark a review as helpful
   */
  @Post(':reviewId/helpful')
  @ApiOperation({
    summary: 'Mark review as helpful',
    description: 'Increment the helpful count for a review',
  })
  @ApiParam({ name: 'reviewId', description: 'Review ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Review marked as helpful' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Review not found' })
  async markAsHelpful(@Param('reviewId') reviewId: string) {
    const review = await this.reviewService.markAsHelpful(reviewId);
    return {
      success: true,
      message: 'Review marked as helpful',
      data: review,
    };
  }

  /**
   * Add admin response to a review
   */
  @Post(':reviewId/response')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add admin response to review',
    description: 'Add a response from admin/staff to a customer review',
  })
  @ApiParam({ name: 'reviewId', description: 'Review ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Response added successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Review not found' })
  async addReviewResponse(
    @Param('reviewId') reviewId: string,
    @Body() addReviewResponseDto: AddReviewResponseDto,
  ) {
    const review = await this.reviewService.addReviewResponse(reviewId, addReviewResponseDto);
    return {
      success: true,
      message: 'Response added successfully',
      data: review,
    };
  }

  /**
   * Toggle review visibility (Admin only)
   */
  @Post(':reviewId/toggle-visibility')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(...MANAGER_OR_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Toggle review visibility',
    description: 'Show or hide a review (admin moderation)',
  })
  @ApiParam({ name: 'reviewId', description: 'Review ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Visibility toggled successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Review not found' })
  async toggleVisibility(@Param('reviewId') reviewId: string) {
    const review = await this.reviewService.toggleReviewVisibility(reviewId);
    return {
      success: true,
      message: `Review is now ${review.isVisible ? 'visible' : 'hidden'}`,
      data: review,
    };
  }
}
