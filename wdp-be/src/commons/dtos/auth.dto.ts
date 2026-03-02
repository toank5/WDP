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
