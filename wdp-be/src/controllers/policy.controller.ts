import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { PolicyService } from '../services/policy.service';
import { POLICY_TYPES } from '../commons/enums/policy.enum';
import { RbacGuard, Roles, UserRole } from '../commons/guards/rbac.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreatePolicySchema,
  UpdatePolicySchema,
} from '../commons/validations/policy.validation';
import { ZodValidationPipe } from '../commons/pipes/zod-validation.pipe';
import type { AuthenticatedRequest } from '../commons/types/express.types';
import type {
  CreatePolicyInput,
  UpdatePolicyInput,
} from '../commons/validations/policy.validation';
import { ErrorResponseDto } from '../commons/dtos/error-response.dto';

@ApiTags('Policies')
@Controller('policies')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  // Public/Shared (read only)
  @Get('current')
  @ApiOperation({
    summary: 'Get all current active policies',
    description: 'Retrieves all currently active policies for public access.',
  })
  @ApiOkResponse({
    description: 'Current policies retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Current policies retrieved successfully',
        data: [
          {
            _id: 'policy-id',
            type: POLICY_TYPES.RETURN,
            config: { returnWindowDays: 30 },
            isActive: true,
          },
        ],
      },
    },
  })
  async getCurrentPolicies() {
    return this.policyService.getCurrentPolicies();
  }

  @Get(':type')
  @ApiOperation({
    summary: 'Get current policy by type',
    description:
      'Retrieves the currently active policy for a specific policy type.',
  })
  @ApiOkResponse({
    description: 'Policy retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Policy retrieved successfully',
        data: {
          _id: 'policy-id',
          type: POLICY_TYPES.RETURN,
          config: { returnWindowDays: 30 },
          isActive: true,
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Policy not found',
    type: ErrorResponseDto,
  })
  async getCurrentPolicyByType(@Param('type') type: POLICY_TYPES) {
    return this.policyService.getCurrentPolicyByType(type);
  }

  @Get(':type/history')
  @ApiOperation({
    summary: 'Get policy history by type',
    description: 'Retrieves the version history for a specific policy type.',
  })
  @ApiOkResponse({
    description: 'Policy history retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Policy history retrieved successfully',
        data: [
          {
            _id: 'policy-id',
            type: POLICY_TYPES.RETURN,
            config: { returnWindowDays: 30 },
            isActive: false,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    },
  })
  async getHistory(@Param('type') type: POLICY_TYPES) {
    return this.policyService.getHistory(type);
  }

  // Debug endpoint to check user authentication
  // Note: This route must come before the :type route to avoid conflict
  @Get('debug/me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Debug: Get current authenticated user',
    description:
      'Returns information about the currently authenticated user. For debugging purposes.',
  })
  @ApiOkResponse({
    description: 'User information retrieved',
    schema: {
      example: {
        user: { id: 'user-id', email: 'admin@example.com', role: 'admin' },
        role: 'admin',
        roleType: 'string',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  getMe(@Req() req: AuthenticatedRequest) {
    return {
      user: req.user,
      role: req.user?.role,
      roleType: typeof req.user?.role,
    };
  }

  // Management (requires privilege)
  @Get()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'List all policies (manager/admin)',
    description:
      'Get all policies with optional filtering by type and active status. Requires manager or admin role.',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: POLICY_TYPES,
    description: 'Filter by policy type',
  })
  @ApiQuery({
    name: 'active',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiOkResponse({
    description: 'Policies retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Policies retrieved successfully',
        data: [
          {
            _id: 'policy-id',
            type: POLICY_TYPES.RETURN,
            config: { returnWindowDays: 30 },
            isActive: true,
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - insufficient permissions',
    type: ErrorResponseDto,
  })
  async findAll(
    @Query('type') type?: POLICY_TYPES,
    @Query('active') active?: string,
  ) {
    const isActive = active !== undefined ? active === 'true' : undefined;
    return this.policyService.findAll({ type, isActive });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new policy (manager/admin)',
    description: 'Creates a new policy. Requires manager or admin role.',
  })
  @ApiCreatedResponse({
    description: 'Policy created successfully',
    schema: {
      example: {
        statusCode: 201,
        message: 'Policy created successfully',
        data: {
          _id: 'policy-id',
          type: POLICY_TYPES.RETURN,
          config: { returnWindowDays: 30 },
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - insufficient permissions',
    type: ErrorResponseDto,
  })
  async create(
    @Body(new ZodValidationPipe(CreatePolicySchema)) payload: CreatePolicyInput,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.policyService.create(payload, req.user!.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update a policy (manager/admin)',
    description: 'Updates an existing policy. Requires manager or admin role.',
  })
  @ApiOkResponse({
    description: 'Policy updated successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Policy updated successfully',
        data: {
          _id: 'policy-id',
          type: POLICY_TYPES.RETURN,
          config: { returnWindowDays: 45 },
          isActive: true,
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Policy not found',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - insufficient permissions',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePolicySchema)) payload: UpdatePolicyInput,
  ) {
    return this.policyService.update(id, payload);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Activate a policy (manager/admin)',
    description:
      'Activates a policy. Deactivates other policies of the same type. Requires manager or admin role.',
  })
  @ApiOkResponse({
    description: 'Policy activated successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Policy activated successfully',
        data: {
          _id: 'policy-id',
          type: POLICY_TYPES.RETURN,
          isActive: true,
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Policy not found',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - insufficient permissions',
    type: ErrorResponseDto,
  })
  async activate(@Param('id') id: string) {
    return this.policyService.activate(id);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Deactivate a policy (manager/admin)',
    description: 'Deactivates a policy. Requires manager or admin role.',
  })
  @ApiOkResponse({
    description: 'Policy deactivated successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Policy deactivated successfully',
        data: {
          _id: 'policy-id',
          type: POLICY_TYPES.RETURN,
          isActive: false,
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Policy not found',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - insufficient permissions',
    type: ErrorResponseDto,
  })
  async deactivate(@Param('id') id: string) {
    return this.policyService.deactivate(id);
  }
}
