import { Body, Controller, Post, Get, Query } from '@nestjs/common';
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
import {
  VerifyEmailResponseDto,
  ForgotPasswordResponseDto,
  ResetPasswordResponseDto,
} from 'src/commons/dtos/auth.dto';

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

  @Post('verify-email')
  @ApiOperation({
    summary: 'Verify email address',
    description:
      'Verifies a user email using the token sent to their email address.',
  })
  @ApiOkResponse({
    description: 'Email verified successfully',
    type: VerifyEmailResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired token',
    type: ErrorResponseDto,
  })
  async verifyEmail(
    @Body() body: { token: string },
  ): Promise<VerifyEmailResponseDto> {
    return this.authService.verifyEmail(body.token);
  }

  @Get('verify-email')
  @ApiOperation({
    summary: 'Verify email address (GET)',
    description: 'Verifies a user email using the token from query params.',
  })
  @ApiOkResponse({
    description: 'Email verified successfully',
    type: VerifyEmailResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired token',
    type: ErrorResponseDto,
  })
  async verifyEmailGet(
    @Query('token') token: string,
  ): Promise<VerifyEmailResponseDto> {
    return this.authService.verifyEmail(token);
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Sends a password reset email to the user if the account exists.',
  })
  @ApiOkResponse({
    description: 'If an account exists, a password reset email will be sent',
    type: ForgotPasswordResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  async forgotPassword(
    @Body() body: { email: string },
  ): Promise<ForgotPasswordResponseDto> {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password',
    description: 'Resets user password using the token sent to their email.',
  })
  @ApiOkResponse({
    description: 'Password reset successfully',
    type: ResetPasswordResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired token',
    type: ErrorResponseDto,
  })
  async resetPassword(
    @Body() body: { token: string; newPassword: string },
  ): Promise<ResetPasswordResponseDto> {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Post('resend-verification')
  @ApiOperation({
    summary: 'Resend verification email',
    description: 'Resends the email verification link to the user.',
  })
  @ApiOkResponse({
    description:
      'If account exists and email is not verified, a new verification email will be sent',
    type: ForgotPasswordResponseDto,
  })
  async resendVerificationEmail(
    @Body() body: { email: string },
  ): Promise<ForgotPasswordResponseDto> {
    return this.authService.resendVerificationEmail(body.email);
  }
}
