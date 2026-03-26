import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Import enums from shared package
import {
  RETURN_STATUS as ReturnStatus,
  RETURN_ITEM_STATUS as ReturnItemStatus,
  RETURN_ITEM_CONDITION as ReturnItemCondition,
  RETURN_REASON as ReturnReason,
  RETURN_TYPE as ReturnType,
} from '../../shared';

// Re-export enums for backward compatibility
export {
  ReturnStatus,
  ReturnItemStatus,
  ReturnItemCondition,
  ReturnReason,
  ReturnType,
};

/**
 * Return Request Status Flow (Simplified)
 *
 * Customer submits → SUBMITTED → AWAITING_ITEMS (auto-transition)
 * Items arrive → AWAITING_ITEMS → IN_REVIEW (staff marks received)
 * Sale staff inspects → IN_REVIEW → APPROVED (sets condition + resolution)
 * Operation staff → APPROVED → COMPLETED (processes inventory)
 * Sale staff → APPROVED → COMPLETED (processes refund)
 *
 * REJECTED: Can be rejected at any point (policy, condition, etc.)
 * CANCELED: Customer can cancel their return
 */

/**
 * Return Line Item (individual item being returned)
 */
@Schema({ _id: false })
export class ReturnLineItem {
  @Prop({ required: true })
  orderItemId: string;

  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  variantId: string;

  @Prop({ required: true })
  productName: string;

  @Prop()
  productImage?: string;

  @Prop({ required: true })
  quantity: number;

  @Prop()
  quantityReceived?: number; // Actual quantity received by warehouse

  @Prop({ required: true })
  unitPrice: number;

  @Prop()
  sku?: string;

  @Prop()
  category?: string;

  @Prop()
  isPrescription?: boolean;

  // Item-level status for inventory tracking (legacy)
  @Prop({
    type: String,
    enum: ReturnItemStatus,
    default: ReturnItemStatus.AWAITING_RETURN,
  })
  itemStatus?: ReturnItemStatus;

  // Item condition (set by Sale Staff during inspection)
  @Prop({
    type: String,
    enum: ReturnItemCondition,
    default: ReturnItemCondition.PENDING,
  })
  condition?: ReturnItemCondition;

  // Inventory movement reference (when item is received back)
  @Prop()
  inventoryMovementId?: string; // ID of the inventory movement record

  // Inventory processed flag (item-level)
  @Prop({ default: false })
  inventoryProcessed?: boolean; // Whether inventory has been updated for this item

  // Warehouse verification
  @Prop()
  receivedAt?: Date;

  @Prop()
  receivedBy?: string; // Operation staff user ID

  @Prop()
  warehouseNotes?: string;

  // Sale Staff inspection notes
  @Prop()
  inspectionNotes?: string;

  @Prop()
  inspectedBy?: string; // Sale staff user ID

  @Prop()
  inspectedAt?: Date;
}

export const ReturnLineItemSchema =
  SchemaFactory.createForClass(ReturnLineItem);

/**
 * Staff Verification Notes (filled when Operation Staff receives the returned item)
 * This is for warehouse/inventory operations
 */
@Schema({ _id: false })
export class StaffVerification {
  @Prop()
  receivedAt?: Date;

  @Prop()
  receivedBy?: string; // Operation staff user ID

  @Prop({ enum: ['EXCELLENT', 'GOOD', 'ACCEPTABLE', 'POOR', 'UNACCEPTABLE'] })
  conditionRating?: string;

  @Prop()
  quantityReceived?: number; // actual quantity received

  @Prop({ default: false })
  packagingIntact?: boolean;

  @Prop({ default: false })
  allAccessoriesPresent?: boolean;

  @Prop()
  warehouseNotes?: string;

  // Decision on what to do with the item
  @Prop({ type: String, enum: ReturnItemStatus })
  itemDisposition?: ReturnItemStatus; // RESALEABLE, DAMAGED, SCRAPPED

  @Prop()
  inventoryMovementId?: string; // Reference to inventory adjustment
}

export const StaffVerificationSchema =
  SchemaFactory.createForClass(StaffVerification);

/**
 * Refund Details (filled when Sale Staff processes refund)
 * This is for payment/refund operations - separate from warehouse operations
 */
@Schema({ _id: false })
export class RefundDetails {
  @Prop()
  initiatedAt?: Date;

  @Prop()
  initiatedBy?: string; // Sale staff user ID

  @Prop()
  refundAmount?: number;

  @Prop()
  refundMethod?: string; // e.g., 'VNPAY', 'BANK_TRANSFER', 'STORE_CREDIT', 'CASH'

  @Prop()
  refundTransactionId?: string;

  @Prop()
  completedAt?: Date;

  @Prop()
  completedBy?: string; // Sale staff user ID

  @Prop()
  notes?: string;

  // Link to original payment for reversal
  @Prop()
  originalPaymentId?: string;

  @Prop()
  originalPaymentMethod?: string;
}

export const RefundDetailsSchema = SchemaFactory.createForClass(RefundDetails);

/**
 * Exchange Details
 */
@Schema({ _id: false })
export class ExchangeDetails {
  @Prop()
  processedAt?: Date;

  @Prop()
  processedBy?: string; // Sale staff user ID

  @Prop()
  exchangeOrderId?: string; // ID of new order created for exchange

  @Prop()
  notes?: string;
}

export const ExchangeDetailsSchema =
  SchemaFactory.createForClass(ExchangeDetails);

/**
 * Return Shipping Address
 */
@Schema({ _id: false })
export class ReturnShippingAddress {
  @Prop()
  recipientName?: string;

  @Prop()
  street?: string;

  @Prop()
  ward?: string;

  @Prop()
  district?: string;

  @Prop()
  province?: string;

  @Prop()
  phone?: string;
}

export const ReturnShippingAddressSchema = SchemaFactory.createForClass(
  ReturnShippingAddress,
);

/**
 * Return Request Document
 *
 * Main schema for customer return requests with full audit trail
 */
@Schema({ timestamps: true })
export class ReturnRequest extends Document {
  @Prop({ required: true, unique: true, index: true })
  returnNumber: string; // e.g., "RET-2024-000123"

  @Prop({ required: true, index: true })
  orderId: string;

  @Prop({ required: true })
  orderNumber: string; // e.g., "ORD-2024-000456"

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, type: String, enum: ReturnStatus })
  status: ReturnStatus;

  @Prop({ required: true, type: String, enum: ReturnType })
  returnType: ReturnType;

  @Prop({ required: true, type: String, enum: ReturnReason })
  reason: ReturnReason;

  @Prop()
  reasonDetails?: string; // additional explanation

  @Prop({ type: [ReturnLineItemSchema], required: true })
  items: ReturnLineItem[];

  @Prop({ required: true })
  requestedRefundAmount: number; // total refund customer expects

  @Prop()
  approvedRefundAmount?: number; // actual approved amount (may have fees)

  @Prop()
  restockingFee?: number; // restocking fee amount

  @Prop()
  restockingFeePercent?: number; // percentage applied

  @Prop({ type: StaffVerificationSchema })
  staffVerification?: StaffVerification;

  @Prop({ type: RefundDetailsSchema })
  refundDetails?: RefundDetails;

  @Prop({ type: ExchangeDetailsSchema })
  exchangeDetails?: ExchangeDetails;

  // Resolution type (set during approval)
  @Prop({ type: String, enum: ReturnType })
  resolutionType?: ReturnType;

  // Customer submission details
  @Prop()
  customerNotes?: string;

  @Prop()
  customerEmail?: string;

  @Prop()
  customerPhone?: string;

  // Policy info
  @Prop()
  policyVersion?: number;

  @Prop()
  policyEffectiveDate?: Date;

  // Rejection reason (if rejected)
  @Prop()
  rejectionReason?: string;

  // Shipping info for returning item
  @Prop({ type: ReturnShippingAddressSchema })
  returnShippingAddress?: ReturnShippingAddress;

  @Prop()
  returnShippingMethod?: string; // e.g., 'CUSTOMER_SEND', 'PICKUP_SERVICE'

  @Prop()
  returnTrackingNumber?: string;

  @Prop()
  estimatedDeliveryDate?: Date;

  // Audit trail
  @Prop({
    type: [
      { status: String, changedBy: String, changedAt: Date, notes: String },
    ],
  })
  statusHistory?: {
    status: ReturnStatus;
    changedBy: string; // user ID (or system for auto-approval)
    changedAt: Date;
    notes?: string;
  }[];

  @Prop({ default: false })
  requiresManagerApproval: boolean; // flag for edge cases needing manager review

  @Prop()
  escalatedToManagerAt?: Date;

  @Prop()
  managerReviewedAt?: Date;

  @Prop()
  managerReviewedBy?: string; // manager user ID

  // Financial impact tracking
  @Prop()
  orderFinancialStatus?: string; // PAID → PARTIALLY_REFUNDED or REFUNDED

  // Inventory processing flag
  @Prop({ default: false })
  inventoryProcessed: boolean; // Whether Operation Staff has updated inventory

  @Prop()
  inventoryProcessedAt?: Date; // When inventory was updated

  @Prop()
  inventoryProcessedBy?: string; // Operation staff user ID

  @Prop({
    type: {
      originalRevenue: { type: Number },
      refundAmount: { type: Number },
      netRevenue: { type: Number },
      recordedAt: { type: Date },
    },
  })
  revenueImpact?: {
    originalRevenue: number; // Original order revenue
    refundAmount: number; // Amount refunded
    netRevenue: number; // Original - Refund
    recordedAt?: Date; // When this was recorded in revenue
  };

  // Timestamp fields (added automatically by @Schema({ timestamps: true }))
  createdAt!: Date;
  updatedAt!: Date;
}

export const ReturnRequestSchema = SchemaFactory.createForClass(ReturnRequest);

// Index for efficient queries
ReturnRequestSchema.index({ userId: 1, createdAt: -1 });
ReturnRequestSchema.index({ status: 1, createdAt: -1 });
