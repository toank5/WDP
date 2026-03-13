import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from '../commons/schemas/order.schema';
import { Product } from '../commons/schemas/product.schema';
import { InventoryMovement } from '../commons/schemas/inventory-movement.schema';
import { PREORDER_STATUS } from '@eyewear/shared';
import {
  PreorderOverviewDto,
  PreorderInventoryViewDto,
  PreorderLineItemDto,
  PreorderDetailResponseDto,
  AllocatePreorderStockDto,
  PreorderAllocationResultDto,
} from '../commons/dtos/preorder.dto';

@Injectable()
export class PreorderService {
  private readonly logger = new Logger(PreorderService.name);

  constructor(
    @InjectModel('Order') private orderModel: Model<Order>,
    @InjectModel('Product') private productModel: Model<Product>,
    @InjectModel('InventoryMovement')
    private inventoryModel: Model<InventoryMovement>,
  ) {}

  /**
   * Get pre-order overview for dashboard
   */
  async getPreorderOverview(): Promise<PreorderOverviewDto> {
    // Get all order items that are pre-orders and not canceled/fulfilled
    const openPreorderItems = await this.orderModel.aggregate([
      { $unwind: '$items' },
      {
        $match: {
          'items.isPreorder': true,
          'items.preorderStatus': {
            $in: [
              PREORDER_STATUS.PENDING_STOCK,
              PREORDER_STATUS.PARTIALLY_RESERVED,
              PREORDER_STATUS.READY_TO_FULFILL,
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
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
        $project: {
          orderNumber: 1,
          'items.productId': 1,
          'items.variantSku': 1,
          'items.quantity': 1,
          'items.reservedQuantity': 1,
          'items.priceAtOrder': 1,
          'items.preorderStatus': 1,
          'items.expectedShipDate': 1,
          'customer.fullName': 1,
          'customer.email': 1,
          'product.name': 1,
          createdAt: 1,
        },
      },
    ]);

    const totalOpenPreorders = openPreorderItems.length;

    // Type for MongoDB aggregation result
    type PreorderAggItem = {
      _id: Types.ObjectId;
      orderNumber: string;
      items: {
        productId: Types.ObjectId;
        variantSku: string;
        quantity: number;
        priceAtOrder: number;
        reservedQuantity: number;
        preorderStatus: PREORDER_STATUS;
        expectedShipDate: Date;
      };
      customer: {
        fullName: string;
        email: string;
      } | null;
      product: {
        name: string;
      } | null;
      createdAt: Date;
    };

    const typedPreorderItems = openPreorderItems as PreorderAggItem[];
    const totalUnitsOnPreorder = typedPreorderItems.reduce(
      (sum, item) => sum + (item.items?.quantity || 0),
      0,
    );
    const totalPreorderValue = typedPreorderItems.reduce(
      (sum, item) =>
        sum + (item.items?.quantity || 0) * (item.items?.priceAtOrder || 0),
      0,
    );

    // Get per-SKU summary
    const preorderInventoryViews = await this.getPreorderInventoryViews();

    // Get recent pre-orders
    const recentPreorders = openPreorderItems
      .slice(0, 10)
      .map((item): PreorderLineItemDto => {
        const aggItem = item as PreorderAggItem;
        return {
          orderId: aggItem._id?.toString() || '',
          orderNumber: aggItem.orderNumber || '',
          customerName: aggItem.customer?.fullName || 'Guest',
          customerEmail: aggItem.customer?.email,
          productId: aggItem.items?.productId?.toString() || '',
          variantSku: aggItem.items?.variantSku || '',
          productName: aggItem.product?.name || 'Unknown',
          quantity: aggItem.items?.quantity || 0,
          reservedQuantity: aggItem.items?.reservedQuantity || 0,
          preorderStatus: aggItem.items?.preorderStatus,
          expectedShipDate: aggItem.items?.expectedShipDate,
          createdAt: aggItem.createdAt,
          priceAtOrder: aggItem.items?.priceAtOrder || 0,
        };
      });

    return {
      totalOpenPreorders,
      totalUnitsOnPreorder,
      totalPreorderValue,
      preorderInventoryViews,
      recentPreorders,
    };
  }

  /**
   * Get pre-order inventory views (per SKU summary)
   */
  async getPreorderInventoryViews(): Promise<PreorderInventoryViewDto[]> {
    // Get all products with their variants
    const products = await this.productModel.find({ isActive: true }).lean();

    const skuViews: Map<string, PreorderInventoryViewDto> = new Map();

    // Initialize views from products
    for (const product of products) {
      if (product.variants) {
        for (const variant of product.variants) {
          skuViews.set(variant.sku, {
            sku: variant.sku,
            productName: product.name,
            variantSize: variant.size,
            variantColor: variant.color,
            onHand: 0,
            incoming: 0,
            preordered: 0,
            remainingPreorderCapacity: undefined,
            nextIncomingDate: undefined,
            preorderStatus: 'OK',
          });
        }
      }
    }

    // Get inventory data
    const inventoryAgg = await this.inventoryModel.aggregate([
      {
        $group: {
          _id: '$sku',
          onHand: {
            $sum: {
              $cond: [{ $eq: ['$status', 'AVAILABLE'] }, '$quantity', 0],
            },
          },
          incoming: {
            $sum: {
              $cond: [{ $eq: ['$status', 'INCOMING'] }, '$quantity', 0],
            },
          },
          nextIncomingDate: {
            $min: {
              $cond: [{ $eq: ['$status', 'INCOMING'] }, '$expectedDate', null],
            },
          },
        },
      },
    ]);

    type InventoryAggResult = {
      _id: string;
      onHand: number;
      incoming: number;
      nextIncomingDate: Date | null;
    };
    for (const inv of inventoryAgg as InventoryAggResult[]) {
      const view = skuViews.get(inv._id);
      if (view) {
        view.onHand = inv.onHand || 0;
        view.incoming = inv.incoming || 0;
        view.nextIncomingDate = inv.nextIncomingDate || undefined;
      }
    }

    // Get pre-order quantities
    const preorderAgg = await this.orderModel.aggregate([
      { $unwind: '$items' },
      {
        $match: {
          'items.isPreorder': true,
          'items.preorderStatus': {
            $in: [
              PREORDER_STATUS.PENDING_STOCK,
              PREORDER_STATUS.PARTIALLY_RESERVED,
              PREORDER_STATUS.READY_TO_FULFILL,
            ],
          },
        },
      },
      {
        $group: {
          _id: '$items.variantSku',
          preordered: { $sum: '$items.quantity' },
        },
      },
    ]);

    type PreorderAggResult = { _id: string; preordered: number };
    for (const po of preorderAgg as PreorderAggResult[]) {
      const view = skuViews.get(po._id);
      if (view) {
        view.preordered = po.preordered || 0;

        // Calculate status
        const totalAvailable = view.onHand + view.incoming;
        const remainingToFulfill = view.preordered - view.onHand;

        if (remainingToFulfill <= 0) {
          view.preorderStatus = 'OK';
        } else if (totalAvailable >= view.preordered) {
          view.preorderStatus = 'OK';
        } else if (view.incoming > 0) {
          view.preorderStatus = 'TIGHT';
        } else {
          view.preorderStatus = 'OVERSOLD';
        }

        if (view.preorderLimit) {
          view.remainingPreorderCapacity = Math.max(
            0,
            view.preorderLimit - view.preordered,
          );
        }
      }
    }

    return Array.from(skuViews.values()).filter((v) => v.preordered > 0);
  }

  /**
   * Get pre-order details for a specific SKU
   */
  async getPreorderDetailBySku(
    sku: string,
  ): Promise<PreorderDetailResponseDto> {
    // Find product with this variant
    const product = await this.productModel
      .findOne({ 'variants.sku': sku, isActive: true })
      .lean();

    if (!product) {
      throw new NotFoundException(`Product with variant SKU ${sku} not found`);
    }

    const variant = product.variants?.find((v) => v.sku === sku);
    if (!variant) {
      throw new NotFoundException(`Variant ${sku} not found`);
    }

    // Get inventory data for this SKU
    const inventoryData = await this.inventoryModel.aggregate([
      { $match: { sku } },
      {
        $group: {
          _id: '$sku',
          onHand: {
            $sum: {
              $cond: [{ $eq: ['$status', 'AVAILABLE'] }, '$quantity', 0],
            },
          },
          incoming: {
            $sum: {
              $cond: [{ $eq: ['$status', 'INCOMING'] }, '$quantity', 0],
            },
          },
        },
      },
    ]);

    type SkuInventoryAgg = { _id: string; onHand: number; incoming: number };
    const inv: SkuInventoryAgg = (inventoryData[0] as SkuInventoryAgg) || {
      onHand: 0,
      incoming: 0,
    };

    // Get pre-order items for this SKU
    const preorderItems = await this.orderModel.aggregate([
      { $unwind: '$items' },
      {
        $match: {
          'items.variantSku': sku,
          'items.isPreorder': true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          orderId: '$_id',
          orderNumber: 1,
          'items.productId': 1,
          'items.variantSku': 1,
          'items.quantity': 1,
          'items.reservedQuantity': 1,
          'items.preorderStatus': 1,
          'items.expectedShipDate': 1,
          'items.priceAtOrder': 1,
          'customer.fullName': 1,
          'customer.email': 1,
          createdAt: 1,
        },
      },
      { $sort: { createdAt: 1 } },
    ]);

    // Type for preorder items aggregation result
    type PreorderItemAgg = {
      orderId: Types.ObjectId;
      orderNumber: string;
      items: {
        productId: Types.ObjectId;
        variantSku: string;
        quantity: number;
        reservedQuantity: number;
        priceAtOrder: number;
        preorderStatus: PREORDER_STATUS;
        expectedShipDate: Date;
      };
      customer: {
        fullName: string;
        email: string;
      } | null;
      createdAt: Date;
    };

    const preordered = preorderItems.reduce(
      (sum: number, item) =>
        sum + ((item as PreorderItemAgg).items?.quantity || 0),
      0,
    );

    const preorderItemsDto: PreorderLineItemDto[] = preorderItems.map(
      (item): PreorderLineItemDto => {
        const aggItem = item as PreorderItemAgg;
        return {
          orderId: aggItem.orderId?.toString() || '',
          orderNumber: aggItem.orderNumber || '',
          customerName: aggItem.customer?.fullName || 'Guest',
          customerEmail: aggItem.customer?.email,
          productId: aggItem.items?.productId?.toString() || '',
          variantSku: aggItem.items?.variantSku || '',
          productName: product.name,
          quantity: aggItem.items?.quantity || 0,
          reservedQuantity: aggItem.items?.reservedQuantity || 0,
          preorderStatus: aggItem.items?.preorderStatus,
          expectedShipDate: aggItem.items?.expectedShipDate,
          createdAt: aggItem.createdAt,
          priceAtOrder: aggItem.items?.priceAtOrder || 0,
        };
      },
    );

    // Get upcoming deliveries
    const upcomingDeliveries = await this.inventoryModel.aggregate([
      {
        $match: {
          sku,
          status: 'INCOMING',
          expectedDate: { $gte: new Date() },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$expectedDate' },
          },
          expectedDate: { $first: '$expectedDate' },
          quantity: { $sum: '$quantity' },
        },
      },
      { $sort: { expectedDate: 1 } },
      {
        $project: {
          _id: 0,
          expectedDate: 1,
          quantity: 1,
        },
      },
    ]);

    return {
      sku,
      productName: product.name,
      variantInfo: {
        size: variant.size,
        color: variant.color,
        images2D: variant.images2D,
      },
      inventory: {
        onHand: inv.onHand || 0,
        incoming: inv.incoming || 0,
        preordered,
        remainingToFulfill: Math.max(0, preordered - inv.onHand),
      },
      preorderConfig: {
        isEnabled: product.isPreorderEnabled || false,
      },
      preorderItems: preorderItemsDto,
      upcomingDeliveries,
    };
  }

  /**
   * Allocate received stock to pre-orders (FIFO)
   */
  async allocateStockToPreorders(
    dto: AllocatePreorderStockDto,
  ): Promise<PreorderAllocationResultDto> {
    const { sku, receivedQuantity } = dto;

    this.logger.log(
      `Allocating ${receivedQuantity} units of ${sku} to pre-orders`,
    );

    // Get pending pre-orders for this SKU (oldest first)
    const pendingPreorders = await this.orderModel
      .find({
        'items.variantSku': sku,
        'items.isPreorder': true,
        'items.preorderStatus': {
          $in: [
            PREORDER_STATUS.PENDING_STOCK,
            PREORDER_STATUS.PARTIALLY_RESERVED,
          ],
        },
      })
      .lean();

    if (pendingPreorders.length === 0) {
      return {
        totalReceived: receivedQuantity,
        totalAllocated: 0,
        ordersUpdated: 0,
        ordersUpdatedList: [],
        remainingUnallocated: receivedQuantity,
      };
    }

    let remainingToAllocate = receivedQuantity;
    const ordersUpdatedList: Array<{
      orderId: string;
      orderNumber: string;
      allocatedQuantity: number;
      newStatus: PREORDER_STATUS;
    }> = [];

    // Process in FIFO order (sort by createdAt)
    const sortedOrders = pendingPreorders.sort(
      (a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0),
    );

    for (const order of sortedOrders) {
      if (remainingToAllocate <= 0) break;

      const orderItem = order.items.find(
        (item) => item.variantSku === sku && item.isPreorder,
      );

      if (!orderItem) continue;

      const quantityToFulfill =
        orderItem.quantity - (orderItem.reservedQuantity || 0);
      const toAllocate = Math.min(remainingToAllocate, quantityToFulfill);

      if (toAllocate > 0) {
        const newReservedQuantity =
          (orderItem.reservedQuantity || 0) + toAllocate;
        const newPreorderStatus =
          newReservedQuantity >= orderItem.quantity
            ? PREORDER_STATUS.READY_TO_FULFILL
            : PREORDER_STATUS.PARTIALLY_RESERVED;

        // Update the order item
        await this.orderModel.updateOne(
          { _id: order._id, 'items.variantSku': sku },
          {
            $set: {
              'items.$.reservedQuantity': newReservedQuantity,
              'items.$.preorderStatus': newPreorderStatus,
            },
          },
        );

        ordersUpdatedList.push({
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          allocatedQuantity: toAllocate,
          newStatus: newPreorderStatus,
        });

        remainingToAllocate -= toAllocate;
      }
    }

    const totalAllocated = receivedQuantity - remainingToAllocate;

    this.logger.log(
      `Allocated ${totalAllocated} of ${receivedQuantity} units to ${ordersUpdatedList.length} pre-orders`,
    );

    return {
      totalReceived: receivedQuantity,
      totalAllocated,
      ordersUpdated: ordersUpdatedList.length,
      ordersUpdatedList,
      remainingUnallocated: remainingToAllocate,
    };
  }
}
