import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ROLES } from '../../shared';

export class CreateUserDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    minLength: 5,
    maxLength: 100,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'User email address (must be unique)',
    example: 'john.doe@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User role',
    enum: ROLES,
    example: ROLES.CUSTOMER,
  })
  @IsEnum(ROLES)
  role: ROLES;

  @ApiProperty({
    description: 'User password (min 6 characters)',
    example: 'SecurePass123',
    minLength: 6,
    format: 'password',
  })
  @IsString()
  @MinLength(6)
  password: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User full name',
    example: 'John Smith',
    minLength: 5,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'john.smith@example.com',
    format: 'email',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: ROLES,
    example: ROLES.MANAGER,
  })
  @IsOptional()
  @IsEnum(ROLES)
  role?: ROLES;
}
