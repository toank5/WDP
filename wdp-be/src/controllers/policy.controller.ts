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
} from '@nestjs/common';
import { PolicyService } from '../services/policy.service';
import { POLICY_TYPES, PolicyType } from '../commons/enums/policy.enum';
import { RbacGuard, Roles, UserRole } from '../commons/guards/rbac.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreatePolicySchema,
  UpdatePolicySchema,
} from '../commons/validations/policy.validation';
import { ZodValidationPipe } from '../commons/pipes/zod-validation.pipe';

@Controller('policies')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  // Public/Shared (read only)
  @Get('current')
  async getCurrentPolicies() {
    return this.policyService.getCurrentPolicies();
  }

  @Get(':type')
  async getCurrentPolicyByType(@Param('type') type: POLICY_TYPES) {
    return this.policyService.getCurrentPolicyByType(type);
  }

  @Get(':type/history')
  async getHistory(@Param('type') type: POLICY_TYPES) {
    return this.policyService.getHistory(type);
  }

  // Debug endpoint to check user authentication
  @Get('debug/me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: any) {
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
  async create(
    @Body(new ZodValidationPipe(CreatePolicySchema)) payload: any,
    @Req() req: any,
  ) {
    return this.policyService.create(payload, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePolicySchema)) payload: any,
  ) {
    return this.policyService.update(id, payload);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async activate(@Param('id') id: string) {
    return this.policyService.activate(id);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async deactivate(@Param('id') id: string) {
    return this.policyService.deactivate(id);
  }
}
