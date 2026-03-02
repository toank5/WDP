import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { POLICY_TYPES } from '../enums/policy.enum';
import type { PolicyConfig } from '../types/policy.types';

export class CreatePolicyDto {
  @ApiProperty({
    description: 'Policy type',
    enum: POLICY_TYPES,
    example: POLICY_TYPES.RETURN,
  })
  @IsEnum(POLICY_TYPES)
  type!: POLICY_TYPES;

  @ApiProperty({
    description: 'Policy configuration based on policy type',
    example: {
      returnWindowDays: {
        framesOnly: 30,
        prescriptionGlasses: 14,
        contactLenses: 30,
      },
      restockingFeePercent: 15,
      customerPaysReturnShipping: true,
      nonReturnableCategories: ['clearance', 'sale'],
    },
  })
  @IsObject()
  config!: PolicyConfig;
}

export class UpdatePolicyDto {
  @ApiPropertyOptional({
    description: 'Policy type',
    enum: POLICY_TYPES,
    example: POLICY_TYPES.RETURN,
  })
  @IsOptional()
  @IsEnum(POLICY_TYPES)
  type?: POLICY_TYPES;

  @ApiPropertyOptional({
    description: 'Partial policy configuration updates',
    example: {
      restockingFeePercent: 20,
    },
  })
  @IsOptional()
  @IsObject()
  config?: Partial<PolicyConfig>;
}
