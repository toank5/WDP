import { IsBoolean, IsDate, IsNumber, IsOptional, Min } from 'class-validator';
import { PREORDER_STATUS } from '../enums/preorder.enum';

/**
 * DTO for updating variant pre-order configuration
 */
export class UpdateVariantPreorderDto {
  @IsBoolean()
  isPreorderEnabled: boolean;

  @IsOptional()
  @IsDate()
  preorderExpectedShipStart?: Date;

  @IsOptional()
  @IsDate()
  preorderExpectedShipEnd?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  preorderLimit?: number;
}

/**
 * Pre-order inventory view for a SKU
 */
export class PreorderInventoryViewDto {
  sku: string;
  productName: string;
  variantSize?: string;
  variantColor?: string;
  onHand: number;
  incoming: number;
  preordered: number;
  remainingPreorderCapacity?: number;
  preorderLimit?: number;
  nextIncomingDate?: Date;
  preorderStatus: 'OK' | 'TIGHT' | 'OVERSOLD';
}

/**
 * Pre-order line item info
 */
export class PreorderLineItemDto {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  productId: string;
  variantSku: string;
  productName: string;
  quantity: number;
  reservedQuantity: number;
  preorderStatus: PREORDER_STATUS;
  expectedShipDate?: Date;
  createdAt: Date;
  priceAtOrder: number;
}

/**
 * Pre-order overview statistics
 */
export class PreorderOverviewDto {
  totalOpenPreorders: number;
  totalUnitsOnPreorder: number;
  totalPreorderValue: number;
  preorderInventoryViews: PreorderInventoryViewDto[];
  recentPreorders: PreorderLineItemDto[];
}

/**
 * DTO for pre-order detail response
 */
export class PreorderDetailResponseDto {
  sku: string;
  productName: string;
  variantInfo: {
    size?: string;
    color?: string;
    images2D?: string[];
  };
  inventory: {
    onHand: number;
    incoming: number;
    preordered: number;
    remainingToFulfill: number;
  };
  preorderConfig: {
    isEnabled: boolean;
    expectedShipStart?: Date;
    expectedShipEnd?: Date;
    limit?: number;
  };
  preorderItems: PreorderLineItemDto[];
  upcomingDeliveries: Array<{
    expectedDate: Date;
    quantity: number;
  }>;
}

/**
 * DTO for allocating stock to pre-orders
 */
export class AllocatePreorderStockDto {
  sku: string;
  receivedQuantity: number;
  notes?: string;
}

/**
 * DTO for allocation result
 */
export class PreorderAllocationResultDto {
  totalReceived: number;
  totalAllocated: number;
  ordersUpdated: number;
  ordersUpdatedList: Array<{
    orderId: string;
    orderNumber: string;
    allocatedQuantity: number;
    newStatus: PREORDER_STATUS;
  }>;
  remainingUnallocated: number;
}
