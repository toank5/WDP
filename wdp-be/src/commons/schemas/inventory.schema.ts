import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { inventoryValidation } from '../validations/inventory.validation';

@Schema({ timestamps: true })
export class Inventory {
  _id?: string;

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
      validator: function (this: void, value: number) {
        return inventoryValidation.reservedQuantity.validator(value);
      },
      message: inventoryValidation.reservedQuantity.errorMsg,
    },
  })
  reservedQuantity: number;

  @Prop({
    type: Number,
    required: inventoryValidation.availableQuantity.presence,
    min: inventoryValidation.availableQuantity.min,
    validate: {
      validator: function (this: void, value: number) {
        return inventoryValidation.availableQuantity.validator(value);
      },
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
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);

// Index for efficient queries
InventorySchema.index({ sku: 1 }, { unique: true });
InventorySchema.index({ stockQuantity: 1 });
InventorySchema.index({ availableQuantity: 1 });
