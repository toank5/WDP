import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { POLICY_TYPES } from '../enums/policy.enum';
import type { PolicyConfig } from '../types/policy.types';

export class CreatePolicyDto {
  @IsEnum(POLICY_TYPES)
  type: POLICY_TYPES;

  @IsObject()
  config: PolicyConfig;
}

export class UpdatePolicyDto {
  @IsOptional()
  @IsEnum(POLICY_TYPES)
  type?: POLICY_TYPES;

  @IsOptional()
  @IsObject()
  config?: Partial<PolicyConfig>;
}
