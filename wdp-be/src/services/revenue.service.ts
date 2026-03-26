import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Order } from '../commons/schemas/order.schema';
import { ORDER_STATUS } from '../shared';
import { ReturnRequest, ReturnStatus } from '../commons/schemas/return.schema';

type RevenueOrderLike = Pick<Order, 'createdAt' | 'payment'>;
type MatchStage = PipelineStage.Match['$match'];
type DateRangeFilter = {
  $gte?: Date;
  $lte?: Date;
};
type RefundMatchStage = {
  status: {
    $in: ReturnStatus[];
  };
  createdAt?: DateRangeFilter;
};
type RevenueOverviewRow = {
  totalRevenue: number;
  totalOrders: number;
};
type RevenueTimeSeriesRow = {
  _id: string;
  revenue: number;
  orders: number;
};
type RevenueCategoryRow = {
  category?: string;
  revenue: number;
  orders: number;
  units: number;
};
type ProductRevenueRow = {
  productId: Types.ObjectId | string;
  name: string;
  revenue: number;
  orders: number;
  units: number;
  avgPrice: number;
};

// Orders that count as revenue (paid, processing, shipped, delivered)
const REVENUE_ORDER_STATUSES = [
  ORDER_STATUS.PAID,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.DELIVERED,
];

@Injectable()
export class RevenueService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(ReturnRequest.name) private returnModel: Model<ReturnRequest>,
  ) {}

  /**
   * Get the revenue date for an order (paidAt if available, otherwise createdAt)
   */
  private getRevenueDate(order: RevenueOrderLike): Date {
    return order.payment?.paidAt || order.createdAt;
  }

  /**
   * Build date filter for revenue queries
   */
  private buildDateFilter(from?: Date, to?: Date): MatchStage {
    const filter: MatchStage = {};

    if (from || to) {
      filter.$or = [];

      if (from) {
        filter.$or.push({
          'payment.paidAt': { $gte: from },
        });
      }

      if (to) {
        const toEndOfDay = new Date(to);
        toEndOfDay.setHours(23, 59, 59, 999);
        filter.$or.push({
          'payment.paidAt': { $lte: toEndOfDay },
        });
      }

      // If no paidAt, check createdAt
      if (from) {
        filter.$or.push({
          createdAt: { $gte: from },
          'payment.paidAt': { $exists: false },
        });
      }

      if (to) {
        const toEndOfDay = new Date(to);
        toEndOfDay.setHours(23, 59, 59, 999);
        filter.$or.push({
          createdAt: { $lte: toEndOfDay },
          'payment.paidAt': { $exists: false },
        });
      }
    }

    return filter;
  }

  /**
   * Get total refund amount for a date range (used for revenue calculations)
   */
  private async getTotalRefunds(from?: Date, to?: Date): Promise<number> {
    const matchStage: RefundMatchStage = {
      status: { $in: [ReturnStatus.APPROVED, ReturnStatus.COMPLETED] },
    };

    if (from || to) {
      matchStage.createdAt = {};
      if (from) {
        matchStage.createdAt.$gte = from;
      }
      if (to) {
        const toEndOfDay = new Date(to);
        toEndOfDay.setHours(23, 59, 59, 999);
        matchStage.createdAt.$lte = toEndOfDay;
      }
    }

    const refunds = await this.returnModel.aggregate<{
      totalRefundAmount?: number;
    }>([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRefundAmount: { $sum: '$approvedRefundAmount' },
        },
      },
    ]);

    const result = refunds[0];
    return result?.totalRefundAmount || 0;
  }

  /**
   * Get revenue overview metrics
   * Net Revenue = Total Order Revenue - Total Refunds
   */
  async getOverview(
    from?: Date,
    to?: Date,
  ): Promise<{
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    totalRefunds: number;
    netRevenue: number;
    from: string;
    to: string;
  }> {
    const statusFilter = {
      orderStatus: { $in: REVENUE_ORDER_STATUSES },
    };

    const dateFilter = this.buildDateFilter(from, to);

    const matchStage: MatchStage = { ...statusFilter };
    if (Object.keys(dateFilter).length > 0) {
      Object.assign(matchStage, dateFilter);
    }

    const result = await this.orderModel.aggregate<RevenueOverviewRow>([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const stats: RevenueOverviewRow = result[0] || {
      totalRevenue: 0,
      totalOrders: 0,
    };
    const avgOrderValue =
      stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;

    // Get total refunds for the period
    const totalRefunds = await this.getTotalRefunds(from, to);

    // Net revenue is order revenue minus refunds
    const netRevenue = stats.totalRevenue - totalRefunds;

    return {
      totalRevenue: stats.totalRevenue,
      totalOrders: stats.totalOrders,
      avgOrderValue,
      totalRefunds,
      netRevenue,
      from: from?.toISOString().split('T')[0] || '',
      to: to?.toISOString().split('T')[0] || '',
    };
  }

  /**
   * Get revenue time series data grouped by day/week/month
   */
  async getTimeSeries(
    from: Date,
    to: Date,
    groupBy: 'day' | 'week' | 'month',
    timezone?: string,
  ): Promise<{
    points: Array<{
      periodStart: string;
      revenue: number;
      orders: number;
    }>;
  }> {
    const statusFilter = {
      orderStatus: { $in: REVENUE_ORDER_STATUSES },
    };

    const toEndOfDay = new Date(to);
    toEndOfDay.setHours(23, 59, 59, 999);

    // Determine the date format based on groupBy
    let dateFormat: string;
    switch (groupBy) {
      case 'week':
        dateFormat = '%Y-W%V'; // Year-Week
        break;
      case 'month':
        dateFormat = '%Y-%m'; // Year-Month
        break;
      case 'day':
      default:
        dateFormat = '%Y-%m-%d'; // Year-Month-Day
        break;
    }

    // Use MongoDB's date operators with timezone support
    const timezoneOffset =
      timezone === 'Asia/Ho_Chi_Minh' ? '+07:00' : '+00:00';

    const result = await this.orderModel.aggregate<RevenueTimeSeriesRow>([
      {
        $match: {
          ...statusFilter,
          $or: [
            {
              'payment.paidAt': { $gte: from, $lte: toEndOfDay },
            },
            {
              createdAt: { $gte: from, $lte: toEndOfDay },
              'payment.paidAt': { $exists: false },
            },
          ],
        },
      },
      {
        $addFields: {
          revenueDate: {
            $ifNull: ['$payment.paidAt', '$createdAt'],
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat,
              date: '$revenueDate',
              timezone: timezoneOffset,
            },
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const points = result.map((item) => ({
      periodStart: item._id,
      revenue: item.revenue,
      orders: item.orders,
    }));

    return { points };
  }

  /**
   * Get revenue breakdown by category
   */
  async getByCategory(
    from?: Date,
    to?: Date,
  ): Promise<{
    items: Array<{
      category: string;
      revenue: number;
      orders: number;
      units: number;
    }>;
  }> {
    const statusFilter = {
      orderStatus: { $in: REVENUE_ORDER_STATUSES },
    };

    const dateFilter = this.buildDateFilter(from, to);

    const matchStage: MatchStage = { ...statusFilter };
    if (Object.keys(dateFilter).length > 0) {
      Object.assign(matchStage, dateFilter);
    }

    const result = await this.orderModel.aggregate<RevenueCategoryRow>([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          revenue: {
            $sum: {
              $multiply: ['$items.priceAtOrder', '$items.quantity'],
            },
          },
          orders: { $addToSet: '$_id' },
          units: { $sum: '$items.quantity' },
        },
      },
      {
        $project: {
          category: '$_id',
          revenue: 1,
          orders: { $size: '$orders' },
          units: 1,
          _id: 0,
        },
      },
      {
        $sort: { revenue: -1 },
      },
    ]);

    return {
      items: result.map((item) => ({
        category: item.category || 'Uncategorized',
        revenue: item.revenue,
        orders: item.orders,
        units: item.units,
      })),
    };
  }

  /**
   * Get revenue breakdown by product with pagination and search
   */
  async getByProduct(options: {
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    items: Array<{
      productId: string;
      name: string;
      revenue: number;
      orders: number;
      units: number;
      avgPrice: number;
    }>;
    total: number;
  }> {
    const { from, to, page = 1, limit = 20, search } = options;

    const statusFilter = {
      orderStatus: { $in: REVENUE_ORDER_STATUSES },
    };

    const dateFilter = this.buildDateFilter(from, to);

    const matchStage: MatchStage = { ...statusFilter };
    if (Object.keys(dateFilter).length > 0) {
      Object.assign(matchStage, dateFilter);
    }

    // Build search filter
    const productMatch: MatchStage = {};
    if (search) {
      productMatch.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const countPipeline: PipelineStage[] = [
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
    ];

    if (search) {
      countPipeline.push({ $match: productMatch });
    }

    countPipeline.push({
      $group: {
        _id: '$items.productId',
      },
    });

    const countResult = await this.orderModel.aggregate<{
      _id: Types.ObjectId;
    }>(countPipeline);
    const total = countResult.length;

    // Get paginated results
    const aggregationPipeline: PipelineStage[] = [
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
    ];

    if (search) {
      aggregationPipeline.push({ $match: productMatch });
    }

    aggregationPipeline.push(
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$product.name' },
          revenue: {
            $sum: {
              $multiply: ['$items.priceAtOrder', '$items.quantity'],
            },
          },
          orders: { $addToSet: '$_id' },
          units: { $sum: '$items.quantity' },
          totalAmount: {
            $sum: {
              $multiply: ['$items.priceAtOrder', '$items.quantity'],
            },
          },
        },
      },
      {
        $project: {
          productId: '$_id',
          name: 1,
          revenue: 1,
          orders: { $size: '$orders' },
          units: 1,
          avgPrice: { $divide: ['$totalAmount', '$units'] },
          _id: 0,
        },
      },
      {
        $sort: { revenue: -1 },
      },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    );

    const result =
      await this.orderModel.aggregate<ProductRevenueRow>(aggregationPipeline);

    return {
      items: result.map((item) => ({
        productId: item.productId.toString(),
        name: item.name,
        revenue: item.revenue,
        orders: item.orders,
        units: item.units,
        avgPrice: item.avgPrice,
      })),
      total,
    };
  }
}
