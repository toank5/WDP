import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ROLES } from 'src/commons/enums/role.enum';
import { Address, AddressSchema } from './address.schema';
import { userValidation } from 'src/commons/validations/user.validation';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: userValidation.fullName.presence,
    minLength: userValidation.fullName.length.min,
    maxLength: userValidation.fullName.length.max,
  })
  fullName: string;

  @Prop({
    required: [userValidation.email.presence, 'Email is required'],
    unique: userValidation.email.unique,
    validate: {
      validator: userValidation.email.validator,
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
      validator: userValidation.avatar.validator,
      message: 'Avatar url is invalid',
    },
  })
  avatar: string;

  @Prop({ type: [AddressSchema], default: [] })
  addresses: Address[];
}

export const UserSchema = SchemaFactory.createForClass(User);
