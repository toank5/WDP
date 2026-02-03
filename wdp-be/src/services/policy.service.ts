import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Policy, PolicyDocument } from '../commons/schemas/policy.schema';
import { POLICY_TYPES, PolicyType } from '../commons/enums/policy.enum';

@Injectable()
export class PolicyService {
  constructor(
    @InjectModel(Policy.name) private policyModel: Model<PolicyDocument>,
  ) {}

  async create(payload: any, userId: string): Promise<Policy> {
    const { type } = payload;

    // Get latest version for this type
    const latestPolicy = await this.policyModel
      .findOne({ type })
      .sort({ version: -1 })
      .exec();

    const nextVersion = latestPolicy ? latestPolicy.version + 1 : 1;

    const createdPolicy = new this.policyModel({
      ...payload,
      version: nextVersion,
      createdBy: new Types.ObjectId(userId),
      isActive: false, // Default to inactive until explicit activation
    });

    return createdPolicy.save();
  }

  async findAll(filters: {
    type?: POLICY_TYPES;
    isActive?: boolean;
  }): Promise<Policy[]> {
    const query: any = {};
    if (filters.type) query.type = filters.type;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    return this.policyModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Policy | null> {
    return this.policyModel.findById(id).exec();
  }

  async update(id: string, payload: any): Promise<Policy | null> {
    return this.policyModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
  }

  async activate(id: string): Promise<Policy> {
    const policy = await this.policyModel.findById(id);
    if (!policy) throw new NotFoundException('Policy not found');

    // Deactivate all other policies of the same type
    await this.policyModel.updateMany(
      { type: policy.type, _id: { $ne: policy._id } },
      { $set: { isActive: false } },
    );

    policy.isActive = true;
    return policy.save();
  }

  async deactivate(id: string): Promise<Policy> {
    const policy = await this.policyModel.findById(id);
    if (!policy) throw new NotFoundException('Policy not found');

    policy.isActive = false;
    return policy.save();
  }

  async getCurrentPolicies(): Promise<Record<string, Policy>> {
    const now = new Date();
    const policies = await this.policyModel.aggregate([
      {
        $match: {
          isActive: true,
          effectiveFrom: { $lte: now },
        },
      },
      { $sort: { effectiveFrom: -1 } },
      {
        $group: {
          _id: '$type',
          policy: { $first: '$$ROOT' },
        },
      },
    ]);

    return policies.reduce((acc, curr) => {
      acc[curr._id] = curr.policy;
      return acc;
    }, {});
  }

  async getCurrentPolicyByType(type: POLICY_TYPES): Promise<Policy | null> {
    const now = new Date();
    return this.policyModel
      .findOne({
        type,
        isActive: true,
        effectiveFrom: { $lte: now },
      })
      .sort({ effectiveFrom: -1 })
      .exec();
  }

  async getHistory(type: POLICY_TYPES): Promise<Policy[]> {
    return this.policyModel.find({ type }).sort({ version: -1 }).exec();
  }
}
