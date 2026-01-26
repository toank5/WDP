import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../commons/schemas/user.schema';
import { CreateUserDto } from 'src/commons/dtos/user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Hash the password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const userData = {
      fullName: createUserDto.name,
      email: createUserDto.email,
      role: createUserDto.role,
      passwordHash: hashedPassword,
    };
    const createdUser = new this.userModel(userData);
    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find({ isDeleted: false }).exec();
  }

  async findOne(id: string): Promise<User | null> {
    return this.userModel.findOne({ _id: id, isDeleted: false }).exec();
  }
}
