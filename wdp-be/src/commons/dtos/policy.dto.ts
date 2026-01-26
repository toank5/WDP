import { IsString, IsEnum, IsObject, IsOptional } from 'class-validator';
import { POLICY_TYPES } from '../enums/policy.enum';

export class CreatePolicyDto {
  @IsEnum(POLICY_TYPES)
  type: POLICY_TYPES;

  @IsObject()
  config: Record<string, any>;
}

export class UpdatePolicyDto {
  @IsOptional()
  @IsEnum(POLICY_TYPES)
  type?: POLICY_TYPES;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}
