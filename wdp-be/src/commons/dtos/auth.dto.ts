import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PickType } from '@nestjs/swagger';
import { User } from '../schemas/user.schema';
import { ROLES } from '../enums/role.enum';

export class LoginRequestDto extends PickType(User, ['email'] as const) {
  @ApiProperty({
    description: 'User password',
    example: 'MySecureP@ssw0rd!',
  })
  password: string;
}

export class UserResponseDto extends PickType(User, [
  'fullName',
  'email',
  'role',
  'avatar',
  'addresses',
] as const) {}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token for authenticated requests',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Authenticated user information',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}

export class RegisterRequestDto extends PickType(User, [
  'fullName',
  'email',
] as const) {
  @ApiProperty({
    description: 'User password for new account',
    example: 'MySecureP@ssw0rd!',
    minLength: 8,
  })
  password: string;

  @ApiPropertyOptional({
    description: 'User role (defaults to CUSTOMER if not provided)',
    enum: ROLES,
    example: ROLES.CUSTOMER,
  })
  role?: ROLES;
}

export class VerifyEmailRequestDto {
  @ApiProperty({
    description: 'Email verification token',
    example: 'a1b2c3d4e5f6...',
  })
  token: string;
}

export class VerifyEmailResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Email verified successfully',
  })
  message: string;
}

export class ForgotPasswordRequestDto {
  @ApiProperty({
    description: 'Email address for password reset',
    example: 'user@example.com',
  })
  email: string;
}

export class ForgotPasswordResponseDto {
  @ApiProperty({
    description: 'Success message',
    example:
      'If an account exists with this email, a password reset link has been sent',
  })
  message: string;
}

export class ResetPasswordRequestDto {
  @ApiProperty({
    description: 'Password reset token',
    example: 'x9y8z7w6v5u4...',
  })
  token: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewSecureP@ssw0rd!',
    minLength: 8,
  })
  newPassword: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Password reset successfully',
  })
  message: string;
}

export class ResendVerificationEmailDto {
  @ApiProperty({
    description: 'Email address to resend verification',
    example: 'user@example.com',
  })
  email: string;
}
