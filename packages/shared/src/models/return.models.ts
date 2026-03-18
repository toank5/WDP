/**
 * Return-related type definitions shared between frontend and backend
 */

import { RETURN_STATUS, RETURN_TYPE, RETURN_REASON, RETURN_ITEM_CONDITION, RETURN_ITEM_STATUS } from '../enums/return.enums';

/**
 * Return Line Item (individual item being returned)
 */
export interface ReturnLineItem {
  orderItemId: string;
  productId: string;
  variantId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  quantityReceived?: number;
  unitPrice: number;
  sku?: string;
  category?: string;
  isPrescription?: boolean;
  // Item condition (set by Sale Staff during inspection)
  condition?: RETURN_ITEM_CONDITION;
  inventoryProcessed?: boolean;
  inspectionNotes?: string;
  inspectedBy?: string;
  inspectedAt?: Date;
  // Legacy item status
  itemStatus?: RETURN_ITEM_STATUS;
  inventoryMovementId?: string;
  receivedAt?: Date;
  receivedBy?: string;
  warehouseNotes?: string;
}

/**
 * Staff Verification (filled when Operation Staff receives the returned item)
 */
export interface StaffVerification {
  receivedAt?: Date;
  receivedBy?: string;
  conditionRating?: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'UNACCEPTABLE';
  quantityVerified?: number;
  packagingIntact?: boolean;
  allAccessoriesPresent?: boolean;
  warehouseNotes?: string;
  itemDisposition?: RETURN_ITEM_STATUS;
  inventoryMovementId?: string;
}

/**
 * Refund Details (filled when Sale Staff processes refund)
 */
export interface RefundDetails {
  initiatedAt?: Date;
  initiatedBy?: string;
  refundAmount?: number;
  refundMethod?: string;
  refundTransactionId?: string;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  originalPaymentId?: string;
  originalPaymentMethod?: string;
}

/**
 * Exchange Details
 */
export interface ExchangeDetails {
  processedAt?: Date;
  processedBy?: string;
  exchangeOrderId?: string;
  notes?: string;
}

/**
 * Return Request Document
 */
export interface ReturnRequest {
  id: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  status: RETURN_STATUS;
  returnType: RETURN_TYPE;
  reason: RETURN_REASON;
  reasonDetails?: string;
  items: ReturnLineItem[];
  requestedRefundAmount: number;
  approvedRefundAmount?: number;
  restockingFee?: number;
  restockingFeePercent?: number;
  staffVerification?: StaffVerification;
  refundDetails?: RefundDetails;
  exchangeDetails?: ExchangeDetails;
  customerNotes?: string;
  customerEmail?: string;
  customerPhone?: string;
  rejectionReason?: string;
  returnTrackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  requiresManagerApproval: boolean;
  statusHistory?: {
    status: RETURN_STATUS;
    changedBy: string;
    changedAt: Date;
    notes?: string;
  }[];
  inventoryProcessed?: boolean;
  inventoryProcessedAt?: Date;
  inventoryProcessedBy?: string;
  revenueImpact?: {
    originalRevenue: number;
    refundAmount: number;
    netRevenue: number;
    recordedAt?: Date;
  };
}

/**
 * Create Return Request DTO (Customer)
 */
export interface CreateReturnRequestDto {
  orderId: string;
  returnType: RETURN_TYPE;
  reason: RETURN_REASON;
  reasonDetails?: string;
  items: ReturnLineItem[];
  customerNotes?: string;
  customerEmail?: string;
  customerPhone?: string;
}

/**
 * Update Return Status DTO (Staff/Manager)
 */
export interface UpdateReturnStatusDto {
  status: RETURN_STATUS;
  rejectionReason?: string;
  approvedRefundAmount?: number;
  restockingFee?: number;
  restockingFeePercent?: number;
}

/**
 * Verify Returned Item DTO (Staff)
 */
export interface VerifyReturnedItemDto {
  verification: {
    staffNotes?: string;
    conditionRating?: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'UNACCEPTABLE';
    quantityVerified: number;
    packagingIntact?: boolean;
    allAccessoriesPresent?: boolean;
  };
  notes?: string;
}

/**
 * Process Refund/Exchange DTO (Staff)
 */
export interface ProcessRefundExchangeDto {
  details: {
    refundAmount?: number;
    refundMethod?: string;
    refundTransactionId?: string;
    exchangeOrderId?: string;
    notes?: string;
  };
}

/**
 * Return Query DTO (Staff/Manager)
 */
export interface ReturnQueryDto {
  status?: RETURN_STATUS;
  userId?: string;
  orderId?: string;
  returnNumber?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Return Statistics
 */
export interface ReturnStats {
  totalReturns: number;
  pendingApproval: number;
  awaitingItem: number;
  verifiedPendingAction: number;
  totalRefundAmount: number;
  approvedReturns: number;
  rejectedReturns: number;
  avgProcessingTimeDays: number;
  returnsByReason: Record<string, number>;
}
