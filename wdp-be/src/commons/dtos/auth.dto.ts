import { PickType } from '@nestjs/swagger';
import { User } from '../schemas/user.schema';

export class LoginRequestDto extends PickType(User, ['email'] as const) {
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
  accessToken: string;
  user: UserResponseDto;
}

export class RegisterRequestDto extends PickType(User, [
  'fullName',
  'email',
] as const) {
  password: string;
}
