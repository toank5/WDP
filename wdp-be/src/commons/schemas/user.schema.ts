import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ROLES } from 'src/commons/enums/role.enum';
import { Address, AddressSchema } from './address.schema';
import { userValidation } from 'src/commons/validations/user.validation';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  _id: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;

  @Prop({
    required: userValidation.fullName.presence,
    minLength: userValidation.fullName.length.min,
    maxLength: userValidation.fullName.length.max,
  })
  fullName: string;

  @Prop({
    required: [userValidation.email.presence, userValidation.email.errorMsg],
    unique: userValidation.email.unique,
    validate: {
      validator: userValidation.email.validator,
      message: userValidation.email.errorMsg,
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
  role: ROLES;

  @Prop({
    validate: {
      validator: userValidation.avatar.validator,
      message: userValidation.avatar.errorMsg,
    },
  })
  avatar: string;

  @Prop({ type: [AddressSchema], default: [] })
  addresses: Address[];
}

export const UserSchema = SchemaFactory.createForClass(User);
