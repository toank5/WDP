import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from '../commons/schemas/review.schema';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewStatsDto,
  AddReviewResponseDto,
} from '../dtos/review.dto';
import { ORDER_STATUS } from '../shared';
import { Order } from '../commons/schemas/order.schema';

type ReviewQuery = {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  orderId: Types.ObjectId;
  variantSku?: string;
};
type ReviewSort = Record<string, 1 | -1>;

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel('Review') private reviewModel: Model<ReviewDocument>,
    @InjectModel('Order') private orderModel: Model<Order>,
  ) {}

  /**
   * Create a new review
   * Validates that:
   * 1. Order exists and belongs to the user
   * 2. Order status is DELIVERED
   * 3. Product exists in the order
   * 4. No duplicate review exists for this product+order+user combination
   */
  async createReview(
    userId: string,
    createReviewDto: CreateReviewDto,
    userName?: string,
    userAvatar?: string,
  ): Promise<Review> {
    const { productId, orderId, variantSku, rating, comment, title, images } =
      createReviewDto;

    // Validate order exists and belongs to user
    const order = await this.orderModel
      .findOne({
        _id: orderId,
        customerId: userId,
      })
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found or does not belong to you');
    }

    // Validate order status is DELIVERED
    if (order.orderStatus !== ORDER_STATUS.DELIVERED) {
      throw new BadRequestException(
        `You can only review products from delivered orders. Current status: ${order.orderStatus}`,
      );
    }

    // Validate product exists in order items
    const productExistsInOrder = order.items.some(
      (item) =>
        item.productId.toString() === productId &&
        (!variantSku || item.variantSku === variantSku),
    );

    if (!productExistsInOrder) {
      throw new BadRequestException('Product not found in this order');
    }

    // Check for duplicate review
    const existingReviewQuery: ReviewQuery = {
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
      orderId: new Types.ObjectId(orderId),
    };
    if (variantSku) {
      existingReviewQuery.variantSku = variantSku;
    }
    const existingReview = await this.reviewModel.findOne(existingReviewQuery);

    if (existingReview) {
      throw new BadRequestException(
        'You have already reviewed this product for this order',
      );
    }

    // Create review
    const review = new this.reviewModel({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
      orderId: new Types.ObjectId(orderId),
      variantSku,
      rating,
      comment,
      title,
      images: images || [],
      isVerifiedPurchase: true,
      userName,
      userAvatar,
    });

    return review.save();
  }

  /**
   * Get reviews for a specific product
   */
  async getProductReviews(
    productId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: 'recent' | 'helpful' | 'rating-high' | 'rating-low' = 'recent',
  ): Promise<{ reviews: Review[]; total: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    // Build sort query
    let sortQuery: ReviewSort = {};
    switch (sortBy) {
      case 'helpful':
        sortQuery = { helpfulCount: -1, createdAt: -1 };
        break;
      case 'rating-high':
        sortQuery = { rating: -1, helpfulCount: -1 };
        break;
      case 'rating-low':
        sortQuery = { rating: 1, helpfulCount: -1 };
        break;
      case 'recent':
      default:
        sortQuery = { createdAt: -1 };
        break;
    }

    // Get total count
    const total = await this.reviewModel.countDocuments({
      productId: new Types.ObjectId(productId),
      isVisible: true,
    });

    // Get reviews with populated user info (select only name and avatar)
    const reviews = await this.reviewModel
      .find({
        productId: new Types.ObjectId(productId),
        isVisible: true,
      })
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .select('-__v')
      .lean()
      .exec();

    return {
      reviews,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get review statistics for a product
   */
  async getProductStats(productId: string): Promise<ReviewStatsDto> {
    const stats = await this.reviewModel.aggregate([
      {
        $match: {
          productId: new Types.ObjectId(productId),
          isVisible: true,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingCounts: {
            $push: '$rating',
          },
        },
      },
    ]);

    const result = stats[0] || {
      averageRating: 0,
      totalReviews: 0,
      ratingCounts: [],
    };

    // Calculate rating distribution
    const ratingDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    result.ratingCounts.forEach((rating: number) => {
      ratingDistribution[rating]++;
    });

    const fiveStarCount = ratingDistribution[5] || 0;
    const fiveStarPercentage =
      result.totalReviews > 0 ? (fiveStarCount / result.totalReviews) * 100 : 0;

    return {
      averageRating: Math.round(result.averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: result.totalReviews,
      ratingDistribution,
      fiveStarPercentage: Math.round(fiveStarPercentage * 10) / 10,
    };
  }

  /**
   * Get reviews by user
   */
  async getUserReviews(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ reviews: Review[]; total: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const total = await this.reviewModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });

    const reviews = await this.reviewModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    return {
      reviews,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single review by ID
   */
  async getReviewById(reviewId: string): Promise<Review> {
    const review = await this.reviewModel.findById(reviewId).lean().exec();

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  /**
   * Update a review (only by the review owner)
   */
  async updateReview(
    reviewId: string,
    userId: string,
    updateReviewDto: UpdateReviewDto,
  ): Promise<Review> {
    const review = await this.reviewModel.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if user owns the review
    if (review.userId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // Update review fields
    if (updateReviewDto.rating !== undefined) {
      review.rating = updateReviewDto.rating;
    }
    if (updateReviewDto.comment !== undefined) {
      review.comment = updateReviewDto.comment;
    }
    if (updateReviewDto.title !== undefined) {
      review.title = updateReviewDto.title;
    }
    if (updateReviewDto.images !== undefined) {
      review.images = updateReviewDto.images;
    }

    return review.save();
  }

  /**
   * Delete a review (only by the review owner)
   */
  async deleteReview(reviewId: string, userId: string): Promise<void> {
    const review = await this.reviewModel.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if user owns the review
    if (review.userId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.reviewModel.findByIdAndDelete(reviewId);
  }

  /**
   * Mark a review as helpful
   */
  async markAsHelpful(reviewId: string): Promise<Review> {
    const review = await this.reviewModel.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.helpfulCount += 1;
    return review.save();
  }

  /**
   * Add admin response to a review
   */
  async addReviewResponse(
    reviewId: string,
    addReviewResponseDto: AddReviewResponseDto,
  ): Promise<Review> {
    const review = await this.reviewModel.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.response = addReviewResponseDto.response;
    review.responseDate = new Date();

    return review.save();
  }

  /**
   * Toggle review visibility (admin only)
   */
  async toggleReviewVisibility(reviewId: string): Promise<Review> {
    const review = await this.reviewModel.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isVisible = !review.isVisible;
    return review.save();
  }

  /**
   * Check if a user can review a specific product from a specific order
   */
  async canUserReviewProduct(
    userId: string,
    productId: string,
    orderId: string,
    variantSku?: string,
  ): Promise<{ canReview: boolean; reason?: string }> {
    // Check if order exists and belongs to user
    const order = await this.orderModel.findOne({
      _id: orderId,
      customerId: new Types.ObjectId(userId),
    });

    if (!order) {
      return { canReview: false, reason: 'Order not found' };
    }

    // Check order status
    if (order.orderStatus !== ORDER_STATUS.DELIVERED) {
      return {
        canReview: false,
        reason: `Order must be delivered before reviewing. Current status: ${order.orderStatus}`,
      };
    }

    // Check if product exists in order
    const productExistsInOrder = order.items.some(
      (item) =>
        item.productId.toString() === productId &&
        (!variantSku || item.variantSku === variantSku),
    );

    if (!productExistsInOrder) {
      return { canReview: false, reason: 'Product not found in this order' };
    }

    // Check for existing review
    const existingReviewQuery: ReviewQuery = {
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
      orderId: new Types.ObjectId(orderId),
    };
    if (variantSku) {
      existingReviewQuery.variantSku = variantSku;
    }
    const existingReview = await this.reviewModel.findOne(existingReviewQuery);

    if (existingReview) {
      return {
        canReview: false,
        reason: 'You have already reviewed this product',
      };
    }

    return { canReview: true };
  }

  /**
   * Get products from delivered orders that the user hasn't reviewed yet
   */
  async getUnreviewedProducts(userId: string): Promise<
    Array<{
      productId: string;
      orderId: string;
      variantSku?: string;
      orderNumber: string;
      productName: string;
      productImage?: string;
      deliveredDate?: Date;
    }>
  > {
    // Get delivered orders for the user
    const deliveredOrders = await this.orderModel
      .find({
        customerId: new Types.ObjectId(userId),
        orderStatus: ORDER_STATUS.DELIVERED,
      })
      .lean()
      .exec();

    const unreviewedProducts: Array<{
      productId: string;
      orderId: string;
      variantSku?: string;
      orderNumber: string;
      productName: string;
      productImage?: string;
      deliveredDate?: Date;
    }> = [];

    // Check each order item
    for (const order of deliveredOrders) {
      if (!order.items || !Array.isArray(order.items)) continue;

      for (const item of order.items) {
        if (!item.productId) continue;

        // Check if review exists for this product+order combination
        const existingReviewQuery: ReviewQuery = {
          userId: new Types.ObjectId(userId),
          productId: new Types.ObjectId(item.productId.toString()),
          orderId: new Types.ObjectId(order._id.toString()),
        };
        if (item.variantSku) {
          existingReviewQuery.variantSku = item.variantSku;
        }
        const existingReview =
          await this.reviewModel.findOne(existingReviewQuery);

        if (!existingReview && item.productId) {
          // Find delivered date from order history
          const deliveredHistory = order.history?.find(
            (h) => h.status === ORDER_STATUS.DELIVERED,
          );

          unreviewedProducts.push({
            productId: item.productId.toString(),
            orderId: order._id.toString(),
            variantSku: item.variantSku,
            orderNumber: order.orderNumber,
            productName: '', // Will be populated by controller
            productImage: '', // Will be populated by controller
            deliveredDate: deliveredHistory?.timestamp,
          });
        }
      }
    }

    return unreviewedProducts;
  }
}
