import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SupplierInfo, SupplierInfoSchema } from './supplier-info.schema';
import { inventoryValidation } from '../validations/inventory.validation';

@Schema({ timestamps: true })
export class Inventory {
  @Prop({
    type: String,
    required: inventoryValidation.sku.presence,
  })
  sku: string;

  @Prop({
    type: Number,
    required: inventoryValidation.stockQuantity.presence,
    min: inventoryValidation.stockQuantity.min,
  })
  stockQuantity: number;

  @Prop({
    type: Number,
    required: inventoryValidation.reservedQuantity.presence,
    min: 0,
    validate: {
      validator: inventoryValidation.reservedQuantity.validator,
      message: inventoryValidation.reservedQuantity.errorMsg,
    },
  })
  reservedQuantity: number;

  @Prop({
    type: Number,
    required: inventoryValidation.availableQuantity.presence,
    min: inventoryValidation.availableQuantity.min,
    validate: {
      validator: inventoryValidation.availableQuantity.validator,
      message: inventoryValidation.availableQuantity.errorMsg,
    },
  })
  availableQuantity: number;

  @Prop({
    type: Number,
    required: inventoryValidation.reorderLevel.presence,
    min: inventoryValidation.reorderLevel.min,
  })
  reorderLevel: number;

  @Prop({
    type: SupplierInfoSchema,
    required: inventoryValidation.supplier.presence,
  })
  supplierInfo: SupplierInfo;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);
