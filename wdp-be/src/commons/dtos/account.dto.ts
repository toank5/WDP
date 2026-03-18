import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  MinLength,
  IsBoolean,
} from 'class-validator';

/**
 * User Profile Response DTO
 */
export class UserProfileResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  fullName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john@example.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+84 123 456 789',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  avatar?: string;

  @ApiPropertyOptional({
    description: 'User date of birth',
    example: '1990-01-01',
  })
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Preferred language',
    example: 'en',
    enum: ['en', 'vi'],
  })
  preferredLanguage?: string;

  @ApiPropertyOptional({
    description: 'Preferred currency',
    example: 'VND',
    enum: ['VND', 'USD', 'EUR'],
  })
  preferredCurrency?: string;

  @ApiProperty({
    description: 'Account creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: string;
}

/**
 * Update Profile Request DTO
 */
export class UpdateProfileRequestDto {
  @ApiPropertyOptional({
    description: 'User full name',
    example: 'John Smith',
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+84 123 456 789',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/new-avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'User date of birth (ISO 8601 format)',
    example: '1990-01-01',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Preferred language',
    example: 'vi',
    enum: ['en', 'vi'],
  })
  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @ApiPropertyOptional({
    description: 'Preferred currency',
    example: 'USD',
    enum: ['VND', 'USD', 'EUR'],
  })
  @IsOptional()
  @IsString()
  preferredCurrency?: string;
}

/**
 * User Preferences Response DTO
 */
export class UserPreferencesResponseDto {
  @ApiProperty({
    description: 'Newsletter subscription status',
    example: false,
  })
  newsletterSubscribed: boolean;

  @ApiProperty({
    description: 'Email offers subscription status',
    example: true,
  })
  emailOffers: boolean;

  @ApiProperty({
    description: 'New collection alerts status',
    example: true,
  })
  newCollectionAlerts: boolean;
}

/**
 * Update Preferences Request DTO
 */
export class UpdatePreferencesRequestDto {
  @ApiPropertyOptional({
    description: 'Newsletter subscription status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  newsletterSubscribed?: boolean;

  @ApiPropertyOptional({
    description: 'Email offers subscription status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  emailOffers?: boolean;

  @ApiPropertyOptional({
    description: 'New collection alerts status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  newCollectionAlerts?: boolean;
}

/**
 * Change Password Request DTO
 */
export class ChangePasswordRequestDto {
  @ApiProperty({
    description: 'Current password',
    example: 'OldPassword123!',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'New password (min 8 chars, uppercase, lowercase, number)',
    example: 'NewPassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({
    description: 'Confirm new password',
    example: 'NewPassword123!',
  })
  @IsString()
  confirmPassword: string;
}

/**
 * Change Password Response DTO
 */
export class ChangePasswordResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Password changed successfully',
  })
  message: string;
}

/**
 * Delete Account Response DTO
 */
export class DeleteAccountResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Account deleted successfully',
  })
  message: string;
}
