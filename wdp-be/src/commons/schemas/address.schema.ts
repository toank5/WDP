import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { addressValidation } from 'src/commons/validations/address.validation';
import { ADDRESS_TYPES } from 'src/commons/enums/address.enum';

@Schema({ _id: false })
export class Address {
  @Prop({
    type: String,
    enum: ADDRESS_TYPES,
    required: addressValidation.type.presence,
  })
  type: ADDRESS_TYPES;

  @Prop({ required: addressValidation.street.presence })
  street: string;

  @Prop({ required: addressValidation.city.presence })
  city: string;

  @Prop({ required: addressValidation.zipCode.presence })
  zipCode: string;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
