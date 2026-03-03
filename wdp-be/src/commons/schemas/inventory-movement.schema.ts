import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum MovementType {
  RECEIPT = 'receipt', // Stock received from supplier
  ADJUSTMENT = 'adjustment', // Manual adjustment (+/-)
  RESERVATION = 'reservation', // Stock reserved for order
  RELEASE = 'release', // Reserved stock released
  CONFIRMED = 'confirmed', // Reserved stock confirmed/shipped
  SALE = 'sale', // Direct sale (no reservation)
  RETURN = 'return', // Customer return
}

/**
 * Denormalized supplier info stored at movement time
 * This preserves supplier data even if supplier is later deleted/changed
 */
export interface MovementSupplierInfo {
  supplierId?: Types.ObjectId;
  supplierCode?: string;
  supplierName?: string;
  supplierRef?: string; // Reference number from supplier (invoice, DO, etc.)
}

@Schema({ timestamps: true })
export class InventoryMovement extends Document {
  _id?: string;

  @Prop({ required: true, index: true })
  sku!: string;

  @Prop({ required: true, enum: MovementType })
  movementType!: MovementType;

  @Prop({ required: true })
  quantity!: number; // Positive for additions, negative for reductions

  @Prop({ required: true })
  stockBefore!: number;

  @Prop({ required: true })
  stockAfter!: number;

  @Prop({ required: true })
  reason!: string;

  @Prop()
  reference?: string; // PO number, receipt number, order ID, etc.

  @Prop()
  note?: string;

  /**
   * Denormalized supplier information
   * Populated when movement is created if supplier is provided
   */
  @Prop({
    type: {
      supplierId: { type: Types.ObjectId },
      supplierCode: String,
      supplierName: String,
      supplierRef: String,
    },
  })
  supplier?: MovementSupplierInfo;

  /**
   * User who performed the action
   */
  @Prop({ type: Types.ObjectId })
  performedBy?: Types.ObjectId;

  /**
   * Associated entity IDs
   */
  @Prop({ type: Types.ObjectId })
  orderId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  productId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  reservationId?: Types.ObjectId;
}

export const InventoryMovementSchema =
  SchemaFactory.createForClass(InventoryMovement);

// Index for common queries
InventoryMovementSchema.index({ sku: 1, createdAt: -1 });
InventoryMovementSchema.index({ createdAt: -1 });
InventoryMovementSchema.index({ movementType: 1, createdAt: -1 });
InventoryMovementSchema.index({ 'supplier.supplierId': 1, createdAt: -1 });
