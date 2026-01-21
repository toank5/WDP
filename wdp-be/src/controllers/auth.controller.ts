import { Body, Controller, Post } from '@nestjs/common';
import { LoginRequestDto, RegisterRequestDto } from 'src/commons/dtos/auth.dto';
import { AuthService } from 'src/services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() data: LoginRequestDto) {
    return this.authService.login(data);
  }

  @Post('register')
  async register(@Body() data: RegisterRequestDto) {
    return this.authService.register(data);
  }
}
