import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ADDRESS_TYPES } from 'src/enums/address.enum';

@Schema({ _id: false })
export class Address {
  @Prop({
    type: String,
    enum: ADDRESS_TYPES,
    required: true,
  })
  type: ADDRESS_TYPES;

  @Prop({ required: true })
  street: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  zipCode: string;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
