import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../commons/schemas/user.schema';
import type { CreateUserInput } from '../commons/validations/user.validation.zod';
import type { UpdateUserInput } from '../commons/validations/user.validation.zod';
import type { AddAddressInput } from '../commons/validations/user.validation.zod';
import { Address } from '../commons/schemas/address.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(userData: CreateUserInput): Promise<User> {
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = new this.userModel({
      fullName: userData.fullName,
      email: userData.email,
      role: userData.role,
      passwordHash: hashedPassword,
    });
    return newUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find({ isDeleted: false }).exec();
  }

  async findOne(id: string): Promise<User | null> {
    return this.userModel.findOne({ _id: id, isDeleted: false }).exec();
  }

  async update(id: string, updateData: UpdateUserInput): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async addAddress(
    id: string,
    addressData: AddAddressInput,
  ): Promise<User | null> {
    const user = await this.userModel.findById(id);
    if (!user) {
      return null;
    }

    user.addresses.push(addressData as Address);
    return user.save();
  }

  async remove(id: string): Promise<User | null> {
    // Soft delete by setting isDeleted to true
    return this.userModel
      .findByIdAndUpdate(id, { isDeleted: true }, { new: true })
      .exec();
  }
}
