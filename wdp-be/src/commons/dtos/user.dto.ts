import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';

import { ROLES } from '../enums/role.enum';
export class CreateUserDto {
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(ROLES)
  role: ROLES;

  @IsString()
  @MinLength(6)
  password: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(ROLES)
  role?: ROLES;
}
