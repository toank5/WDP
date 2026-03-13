import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ROLES } from '@eyewear/shared';
import { Address, AddressSchema } from './address.schema';
import { userValidation } from 'src/commons/validations/user.validation';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  save() {
    throw new Error('Method not implemented.');
  }
  _id?: string;

  createdAt: Date;
  updatedAt: Date;

  @Prop({ default: false })
  isDeleted: boolean;

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

  @Prop()
  phone?: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop()
  preferredLanguage?: string;

  @Prop()
  preferredCurrency?: string;

  @Prop({ type: [AddressSchema], default: [] })
  addresses: Address[];

  // User preferences
  @Prop({
    type: {
      newsletterSubscribed: { type: Boolean, default: false },
      emailOffers: { type: Boolean, default: false },
      newCollectionAlerts: { type: Boolean, default: false },
    },
    default: {
      newsletterSubscribed: false,
      emailOffers: false,
      newCollectionAlerts: false,
    },
  })
  preferences?: {
    newsletterSubscribed: boolean;
    emailOffers: boolean;
    newCollectionAlerts: boolean;
  };

  // Email verification fields
  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  emailVerifyToken?: string;

  @Prop()
  emailVerifyTokenExpires?: Date;

  // Password reset fields
  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordTokenExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
