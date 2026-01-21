import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { inventoryValidation } from '../validations/inventory.validation';

@Schema({ _id: false })
export class SupplierInfo {
  @Prop({
    required: inventoryValidation.supplier.name.presence,
    length: inventoryValidation.supplier.name.length,
  })
  name: string;

  @Prop({
    required: inventoryValidation.supplier.expectedArrival.presence,
    type: Date,
  })
  expectedArrival: Date;
}

export const SupplierInfoSchema = SchemaFactory.createForClass(SupplierInfo);
