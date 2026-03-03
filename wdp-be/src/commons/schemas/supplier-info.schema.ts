import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class SupplierInfo {
  @Prop({
    required: false,
    type: String,
  })
  name?: string;

  @Prop({
    required: false,
    type: String,
  })
  contactEmail?: string;

  @Prop({
    required: false,
    type: String,
  })
  contactPhone?: string;

  @Prop({
    required: false,
    type: String,
  })
  code?: string;

  @Prop({
    required: false,
    type: String,
  })
  notes?: string;

  @Prop({
    required: false,
    type: Date,
  })
  expectedArrival?: Date;
}

export const SupplierInfoSchema = SchemaFactory.createForClass(SupplierInfo);
