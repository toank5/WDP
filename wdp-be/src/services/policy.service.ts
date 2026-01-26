import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Policy } from '../commons/schemas/policy.schema';
import { CreatePolicyDto, UpdatePolicyDto } from 'src/commons/dtos/policy.dto';

@Injectable()
export class PolicyService {
  constructor(@InjectModel(Policy.name) private policyModel: Model<Policy>) {}

  async create(createPolicyDto: CreatePolicyDto): Promise<Policy> {
    const createdPolicy = new this.policyModel(createPolicyDto);
    return createdPolicy.save();
  }

  async findAll(): Promise<Policy[]> {
    return this.policyModel.find().exec();
  }

  async findOne(id: string): Promise<Policy | null> {
    return this.policyModel.findById(id).exec();
  }

  async update(id: string, updatePolicyDto: UpdatePolicyDto): Promise<Policy | null> {
    return this.policyModel
      .findByIdAndUpdate(id, updatePolicyDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Policy | null> {
    return this.policyModel.findByIdAndDelete(id).exec();
  }
}
