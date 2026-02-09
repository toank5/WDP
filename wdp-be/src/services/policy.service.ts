import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Policy, PolicyDocument } from '../commons/schemas/policy.schema';
import { POLICY_TYPES, PolicyType } from '../commons/enums/policy.enum';
import { PolicyConfig } from '../commons/types/policy.types';
import {
  validateConfigForType,
  type CreatePolicyInput,
  type UpdatePolicyInput,
} from '../commons/validations/policy.validation';

/**
 * Normalizes category list input to a clean string array.
 * Handles both comma-separated strings and arrays.
 * Trims values, removes empty strings, and removes duplicates.
 */
function normalizeCategoryList(input: unknown): string[] {
  if (Array.isArray(input)) {
    return [
      ...new Set(
        input.map((v) => String(v).trim()).filter((v) => v.length > 0),
      ),
    ];
  }
  if (typeof input === 'string') {
    return [
      ...new Set(
        input
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v.length > 0),
      ),
    ];
  }
  return [];
}

/**
 * Normalizes the policy config based on type.
 * Ensures nonReturnableCategories is properly handled for return policies.
 */
function normalizePolicyConfig(
  type: POLICY_TYPES,
  config: PolicyConfig | undefined,
): PolicyConfig | undefined {
  if (!config) {
    return undefined;
  }

  // For return policies, normalize nonReturnableCategories if present
  if (type === POLICY_TYPES.RETURN && 'nonReturnableCategories' in config) {
    const returnConfig = config as Extract<
      PolicyConfig,
      { nonReturnableCategories: unknown }
    >;
    return {
      ...config,
      nonReturnableCategories: normalizeCategoryList(
        returnConfig.nonReturnableCategories,
      ),
    } as PolicyConfig;
  }

  return config;
}

/**
 * Strict validation of policy config based on type
 * Throws detailed errors if config is invalid or missing required fields
 */
function validateConfigStrict(type: string, config: PolicyConfig): void {
  const parsed = validateConfigForType(type as PolicyType, config);

  if (!parsed.success) {
    const error = parsed.error; // ZodError - only accessible in error branch
    const errors: Record<string, string> = {};

    error.issues.forEach((err) => {
      const path = err.path.join('.');
      errors[path] = err.message;
    });

    throw new BadRequestException({
      message: `Invalid config for ${type} policy`,
      errors,
    });
  }
}

@Injectable()
export class PolicyService {
  constructor(
    @InjectModel(Policy.name) private policyModel: Model<PolicyDocument>,
  ) {}

  /**
   * Create a new policy with strict versioning and activation rules
   */
  async create(payload: CreatePolicyInput, userId: string): Promise<Policy> {
    const { type, config } = payload;

    // Validate config strictly based on type
    if (config) {
      validateConfigStrict(type, config as PolicyConfig);
    }

    // Get the latest version for this type
    const latestPolicy = await this.policyModel
      .findOne({ type })
      .sort({ version: -1 })
      .exec();

    const nextVersion = latestPolicy ? latestPolicy.version + 1 : 1;

    // Normalize config
    const normalizedConfig = normalizePolicyConfig(
      type as POLICY_TYPES,
      config as PolicyConfig | undefined,
    );

    // Check activation rules
    if ('isActive' in payload && payload.isActive) {
      await this.validateActivationRules(
        type as POLICY_TYPES,
        payload.effectiveFrom,
      );
    }

    const createdPolicy = new this.policyModel({
      ...payload,
      config: normalizedConfig,
      version: nextVersion,
      createdBy: new Types.ObjectId(userId),
      isActive: false, // Always start inactive, explicit activation required
    });

    const saved = await createdPolicy.save();

    // If isActive was requested, activate after creation
    if ('isActive' in payload && payload.isActive) {
      return this.activate(saved._id.toString());
    }

    return saved;
  }

  /**
   * Update an existing policy with strict validation
   */
  async update(id: string, payload: UpdatePolicyInput): Promise<Policy | null> {
    // Get the existing policy to determine its type
    const existingPolicy = await this.policyModel.findById(id);
    if (!existingPolicy) {
      throw new NotFoundException('Policy not found');
    }

    // Validate config if it's being updated
    if (payload.config) {
      validateConfigStrict(existingPolicy.type, payload.config as PolicyConfig);
      payload.config = normalizePolicyConfig(
        existingPolicy.type,
        payload.config as PolicyConfig,
      );
    }

    // Check activation rules if isActive is being set to true
    if (
      'isActive' in payload &&
      payload.isActive === true &&
      !existingPolicy.isActive
    ) {
      const effectiveFrom = payload.effectiveFrom
        ? new Date(payload.effectiveFrom)
        : existingPolicy.effectiveFrom;
      await this.validateActivationRules(
        existingPolicy.type,
        effectiveFrom,
        id,
      );
    }

    return this.policyModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
  }

  /**
   * Validate activation rules:
   * - Only one active policy per type where effectiveFrom <= now
   * - Cannot activate policies with overlapping effective dates
   */
  private async validateActivationRules(
    type: POLICY_TYPES,
    effectiveFrom: Date,
    excludeId?: string,
  ): Promise<void> {
    const now = new Date();

    // Check for existing active policies of the same type
    const existingActiveQuery: Record<string, unknown> = {
      type,
      isActive: true,
      effectiveFrom: { $lte: now },
    };

    if (excludeId) {
      existingActiveQuery._id = { $ne: new Types.ObjectId(excludeId) };
    }

    const existingActive = await this.policyModel
      .findOne(existingActiveQuery)
      .exec();

    if (existingActive) {
      throw new ConflictException(
        `Cannot activate: There is already an active ${type} policy (version ${existingActive.version}, effective from ${existingActive.effectiveFrom.toISOString().split('T')[0]}). Deactivate it first.`,
      );
    }

    // Check for future-dated active policies of the same type
    const futureActiveQuery: Record<string, unknown> = {
      type,
      isActive: true,
      effectiveFrom: { $gt: now },
    };

    if (excludeId) {
      futureActiveQuery._id = { $ne: new Types.ObjectId(excludeId) };
    }

    const futureActive = await this.policyModel
      .findOne(futureActiveQuery)
      .exec();

    if (futureActive) {
      throw new ConflictException(
        `Cannot activate: There is a future-dated active ${type} policy (version ${futureActive.version}, effective from ${futureActive.effectiveFrom.toISOString().split('T')[0]}). Deactivate it first.`,
      );
    }
  }

  /**
   * Activate a policy (deactivates all other policies of the same type)
   */
  async activate(id: string): Promise<Policy> {
    const policy = await this.policyModel.findById(id);
    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    // Validate activation rules
    await this.validateActivationRules(policy.type, policy.effectiveFrom, id);

    // Deactivate all other policies of the same type
    await this.policyModel.updateMany(
      { type: policy.type, _id: { $ne: policy._id } },
      { $set: { isActive: false } },
    );

    // Activate this policy
    policy.isActive = true;
    return policy.save();
  }

  /**
   * Deactivate a policy
   */
  async deactivate(id: string): Promise<Policy> {
    const policy = await this.policyModel.findById(id);
    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    policy.isActive = false;
    return policy.save();
  }

  /**
   * Find all policies with optional filters
   */
  async findAll(filters: {
    type?: POLICY_TYPES;
    isActive?: boolean;
  }): Promise<Policy[]> {
    const query: Record<string, unknown> = {};
    if (filters.type) query.type = filters.type;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    return this.policyModel.find(query).sort({ createdAt: -1 }).exec();
  }

  /**
   * Find a single policy by ID
   */
  async findOne(id: string): Promise<Policy | null> {
    return this.policyModel.findById(id).exec();
  }

  /**
   * Get all currently active policies (as of now)
   * Returns a map of policy type to the active policy
   */
  async getCurrentPolicies(): Promise<Record<string, Policy>> {
    const now = new Date();
    const policies = await this.policyModel.aggregate<{
      _id: string;
      policy: PolicyDocument;
    }>([
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

    return policies.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.policy;
        return acc;
      },
      {} as Record<string, Policy>,
    );
  }

  /**
   * Get the current active policy for a specific type
   * Returns null if no active policy exists for the type
   */
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

  /**
   * Get the history (all versions) of a policy type
   */
  async getHistory(type: POLICY_TYPES): Promise<Policy[]> {
    return this.policyModel.find({ type }).sort({ version: -1 }).exec();
  }
}
