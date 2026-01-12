import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ROLES } from 'src/enums/role.enum';
import validator from 'validator';
import { Address, AddressSchema } from './address.schema';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true })
  fullName: string;

  @Prop({
    required: [true, 'Email is required'],
    unique: true,
    validate: {
      validator: (str: string) => validator.isEmail(str),
      message: 'Email is invalid',
    },
  })
  email: string;

  @Prop()
  passwordHash: string;

  @Prop({
    type: String,
    enum: ROLES,
    default: ROLES.CUSTOMER,
    required: true,
  })
  role: string;

  @Prop({
    validate: {
      validator: (str: string) => validator.isURL(str),
      message: 'Avatar url is invalid',
    },
  })
  avatar: string;

  @Prop({ type: [AddressSchema], default: [] })
  addresses: Address[];
}

export const UserSchema = SchemaFactory.createForClass(User);
