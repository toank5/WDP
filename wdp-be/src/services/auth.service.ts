import {
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
} from 'src/commons/dtos/auth.dto';
import { CustomApiResponse } from 'src/commons/dtos/custom-api-response.dto';
import * as customApiRequestInterface from 'src/commons/interfaces/custom-api-request.interface';
import { User } from 'src/commons/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../mail/email.service';

@Injectable({ scope: Scope.REQUEST })
export class AuthService {
  constructor(
    @Inject(REQUEST)
    private readonly request: customApiRequestInterface.ICustomApiRequest,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async login(
    data: LoginRequestDto,
  ): Promise<CustomApiResponse<LoginResponseDto>> {
    const user = (await this.userModel.findOne({
      email: data.email,
    })) as User;
    if (!user) throw new BadRequestException('User not found');

    const isPasswordMatch = await bcrypt.compare(
      data.password,
      user.passwordHash,
    );
    if (!isPasswordMatch) throw new BadRequestException('Invalid password');

    const accessToken = await this.jwtService.signAsync(
      { id: user._id },
      {
        expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION'),
        secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      },
    );

    return new CustomApiResponse(HttpStatus.OK, 'Login successful', {
      accessToken,
      user,
    });
  }

  async register(data: RegisterRequestDto) {
    const user = (await this.userModel.findOne({
      email: data.email,
    })) as User;
    if (user) throw new BadRequestException('User already exists');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Generate email verification token
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newUser = new this.userModel({
      ...data,
      passwordHash: hashedPassword,
      emailVerified: false,
      emailVerifyToken,
      emailVerifyTokenExpires,
    });

    await newUser.save();

    // Send verification email
    const frontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/verify-email?token=${emailVerifyToken}`;

    try {
      await sendVerificationEmail(newUser.email, newUser.fullName, verifyUrl);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Continue with registration even if email fails
    }

    const accessToken = await this.jwtService.signAsync(
      { id: newUser._id },
      {
        expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION'),
        secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      },
    );

    return new CustomApiResponse(
      HttpStatus.OK,
      'Register successful. Please check your email to verify your account.',
      {
        accessToken,
        user: newUser,
      },
    );
  }

  async verifyEmail(token: string) {
    const user = await this.userModel.findOne({
      emailVerifyToken: token,
      emailVerifyTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyTokenExpires = undefined;
    await user.save();

    return { message: 'Email verified successfully. You can now log in.' };
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        message:
          'If an account exists with this email, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const resetPasswordToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordTokenExpires = resetPasswordTokenExpires;
    await user.save();

    // Send reset email
    const frontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetPasswordToken}`;

    try {
      await sendPasswordResetEmail(user.email, user.fullName, resetUrl);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }

    return {
      message:
        'If an account exists with this email, a password reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userModel.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.passwordHash = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpires = undefined;
    await user.save();

    return {
      message:
        'Password reset successfully. You can now log in with your new password.',
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.userModel.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        message:
          'If an account exists with this email and it is not verified, a new verification email has been sent.',
      };
    }

    if (user.emailVerified) {
      return { message: 'Email is already verified.' };
    }

    // Generate new verification token
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerifyToken = emailVerifyToken;
    user.emailVerifyTokenExpires = emailVerifyTokenExpires;
    await user.save();

    // Send verification email
    const frontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/verify-email?token=${emailVerifyToken}`;

    try {
      await sendVerificationEmail(user.email, user.fullName, verifyUrl);
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }

    return {
      message:
        'If an account exists with this email and it is not verified, a new verification email has been sent.',
    };
  }
}
