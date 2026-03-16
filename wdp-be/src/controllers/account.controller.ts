import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from '../services/user.service';
import * as bcrypt from 'bcrypt';
import { User } from '../commons/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomApiResponse } from '../commons/dtos/custom-api-response.dto';
import type { AuthenticatedRequest } from '../commons/types/express.types';
import {
  UserProfileResponseDto,
  UpdateProfileRequestDto,
  UserPreferencesResponseDto,
  UpdatePreferencesRequestDto,
  ChangePasswordRequestDto,
  ChangePasswordResponseDto,
  DeleteAccountResponseDto,
} from '../commons/dtos/account.dto';
import { ErrorResponseDto } from '../commons/dtos/error-response.dto';

@ApiTags('Account')
@UseGuards(JwtAuthGuard)
@Controller('account')
export class AccountController {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly userService: UserService,
  ) {}

  /**
   * Get current user's profile
   * GET /account/profile
   */
  @Get('profile')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieves the profile information of the authenticated user.',
  })
  @ApiOkResponse({
    description: 'Profile retrieved successfully',
    type: UserProfileResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
    type: ErrorResponseDto,
  })
  async getProfile(@Request() req: AuthenticatedRequest) {
    const user = await this.userModel.findById(req.user?._id || req.user?.id);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return new CustomApiResponse<UserProfileResponseDto>(
      HttpStatus.OK,
      'Profile retrieved successfully',
      {
        _id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        dateOfBirth: user.dateOfBirth
          ? user.dateOfBirth.toISOString().split('T')[0]
          : undefined,
        preferredLanguage: user.preferredLanguage,
        preferredCurrency: user.preferredCurrency,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    );
  }

  /**
   * Update current user's profile
   * PATCH /account/profile
   */
  @Patch('profile')
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Updates profile information of the authenticated user.',
  })
  @ApiOkResponse({
    description: 'Profile updated successfully',
    type: UserProfileResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
    type: ErrorResponseDto,
  })
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() updateData: UpdateProfileRequestDto,
  ) {
    const user = await this.userModel.findById(req.user?._id || req.user?.id);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Update allowed fields
    if (updateData.fullName !== undefined) {
      user.fullName = updateData.fullName;
    }
    if (updateData.phone !== undefined) {
      user.phone = updateData.phone;
    }
    if (updateData.avatar !== undefined) {
      user.avatar = updateData.avatar;
    }
    if (updateData.dateOfBirth !== undefined) {
      user.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    if (updateData.preferredLanguage !== undefined) {
      user.preferredLanguage = updateData.preferredLanguage;
    }
    if (updateData.preferredCurrency !== undefined) {
      user.preferredCurrency = updateData.preferredCurrency;
    }

    await user.save();

    return new CustomApiResponse<UserProfileResponseDto>(
      HttpStatus.OK,
      'Profile updated successfully',
      {
        _id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        dateOfBirth: user.dateOfBirth
          ? user.dateOfBirth.toISOString().split('T')[0]
          : undefined,
        preferredLanguage: user.preferredLanguage,
        preferredCurrency: user.preferredCurrency,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    );
  }

  /**
   * Get current user's preferences
   * GET /account/preferences
   */
  @Get('preferences')
  @ApiOperation({
    summary: 'Get user preferences',
    description:
      'Retrieves communication preferences of the authenticated user.',
  })
  @ApiOkResponse({
    description: 'Preferences retrieved successfully',
    type: UserPreferencesResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
    type: ErrorResponseDto,
  })
  async getPreferences(@Request() req: AuthenticatedRequest) {
    const user = await this.userModel.findById(req.user?._id || req.user?.id);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const preferences = user.preferences || {
      newsletterSubscribed: false,
      emailOffers: false,
      newCollectionAlerts: false,
    };

    return new CustomApiResponse<UserPreferencesResponseDto>(
      HttpStatus.OK,
      'Preferences retrieved successfully',
      preferences,
    );
  }

  /**
   * Update current user's preferences
   * PATCH /account/preferences
   */
  @Patch('preferences')
  @ApiOperation({
    summary: 'Update user preferences',
    description: 'Updates communication preferences of the authenticated user.',
  })
  @ApiOkResponse({
    description: 'Preferences updated successfully',
    type: UserPreferencesResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
    type: ErrorResponseDto,
  })
  async updatePreferences(
    @Request() req: AuthenticatedRequest,
    @Body() updateData: UpdatePreferencesRequestDto,
  ) {
    const user = await this.userModel.findById(req.user?._id || req.user?.id);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Initialize preferences if not exists
    if (!user.preferences) {
      user.preferences = {
        newsletterSubscribed: false,
        emailOffers: false,
        newCollectionAlerts: false,
      };
    }

    // Update provided fields
    if (updateData.newsletterSubscribed !== undefined) {
      user.preferences.newsletterSubscribed = updateData.newsletterSubscribed;
    }
    if (updateData.emailOffers !== undefined) {
      user.preferences.emailOffers = updateData.emailOffers;
    }
    if (updateData.newCollectionAlerts !== undefined) {
      user.preferences.newCollectionAlerts = updateData.newCollectionAlerts;
    }

    await user.save();

    return new CustomApiResponse<UserPreferencesResponseDto>(
      HttpStatus.OK,
      'Preferences updated successfully',
      user.preferences,
    );
  }

  /**
   * Change password
   * POST /account/change-password
   */
  @Post('change-password')
  @ApiOperation({
    summary: 'Change password',
    description: 'Changes the password of the authenticated user.',
  })
  @ApiOkResponse({
    description: 'Password changed successfully',
    type: ChangePasswordResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid current password or passwords do not match',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
    type: ErrorResponseDto,
  })
  async changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() passwordData: ChangePasswordRequestDto,
  ) {
    const user = await this.userModel.findById(req.user?._id || req.user?.id);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Validate new passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      throw new BadRequestException('New passwords do not match');
    }

    // Validate current password
    const isPasswordMatch = await bcrypt.compare(
      passwordData.currentPassword,
      user.passwordHash,
    );
    if (!isPasswordMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Validate new password is different from current
    const isSamePassword = await bcrypt.compare(
      passwordData.newPassword,
      user.passwordHash,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(passwordData.newPassword, 10);
    user.passwordHash = hashedPassword;
    await user.save();

    return new CustomApiResponse<ChangePasswordResponseDto>(
      HttpStatus.OK,
      'Password changed successfully',
      { message: 'Password changed successfully' },
    );
  }

  /**
   * Delete account
   * DELETE /account
   */
  @Delete('')
  @ApiOperation({
    summary: 'Delete account',
    description: 'Permanently deletes the authenticated user account.',
  })
  @ApiOkResponse({
    description: 'Account deleted successfully',
    type: DeleteAccountResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Unable to delete account',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
    type: ErrorResponseDto,
  })
  async deleteAccount(@Request() req: AuthenticatedRequest) {
    const user = await this.userModel.findById(req.user?._id || req.user?.id);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Soft delete the user
    await this.userService.remove(user._id.toString());

    return new CustomApiResponse<DeleteAccountResponseDto>(
      HttpStatus.OK,
      'Account deleted successfully',
      { message: 'Account deleted successfully' },
    );
  }
}
