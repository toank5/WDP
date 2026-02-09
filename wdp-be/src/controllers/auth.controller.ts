import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from 'src/services/auth.service';
import {
  LoginSchema,
  RegisterUserSchema,
} from 'src/commons/validations/user.validation.zod';
import { ZodValidationPipe } from 'src/commons/pipes/zod-validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body(new ZodValidationPipe(LoginSchema))
    credentials: {
      email: string;
      password: string;
    },
  ) {
    return this.authService.login(credentials);
  }

  @Post('register')
  async register(
    @Body(new ZodValidationPipe(RegisterUserSchema))
    userData: {
      email: string;
      password: string;
      fullName: string;
      role?: string;
    },
  ) {
    return this.authService.register(userData);
  }
}
