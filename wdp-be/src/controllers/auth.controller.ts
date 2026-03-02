import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { AuthService } from 'src/services/auth.service';
import {
  LoginSchema,
  RegisterUserSchema,
} from 'src/commons/validations/user.validation.zod';
import { ZodValidationPipe } from 'src/commons/pipes/zod-validation.pipe';
import { LoginResponseDto } from 'src/commons/dtos/auth.dto';
import { ErrorResponseDto } from 'src/commons/dtos/error-response.dto';
import { ROLES } from 'src/commons/enums/role.enum';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Login with email and password',
    description: 'Authenticates a user and returns a JWT access token.',
  })
  @ApiOkResponse({
    description: 'User logged in successfully',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    type: ErrorResponseDto,
  })
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
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account and returns authentication token.',
  })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    type: LoginResponseDto,
  })
  @ApiConflictResponse({
    description: 'User with this email already exists',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  async register(
    @Body(new ZodValidationPipe(RegisterUserSchema))
    userData: {
      email: string;
      password: string;
      fullName: string;
      role?: ROLES;
    },
  ) {
    return this.authService.register(userData);
  }
}
