import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
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
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PrescriptionService } from '../services/prescription.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard, Roles, UserRole } from '../commons/guards/rbac.guard';
import {
  CreatePrescriptionDto,
  UpdatePrescriptionDto,
  VerifyPrescriptionDto,
  PrescriptionResponseDto,
  PrescriptionListQueryDto,
  PrescriptionListResponseDto,
} from '../dtos/prescription.dto';
import { ErrorResponseDto } from '../commons/dtos/error-response.dto';
import type { AuthenticatedRequest } from '../commons/types/express.types';

@ApiTags('Prescriptions')
@ApiBearerAuth()
@Controller('prescriptions')
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  /**
   * Create a new prescription
   * POST /prescriptions
   * Only customers can create prescriptions for themselves
   * Admin/Manager can create for testing purposes
   */
  @Post()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new prescription',
    description: 'Creates a new prescription for the authenticated user. Only customers can create prescriptions.',
  })
  @ApiCreatedResponse({
    description: 'Prescription created successfully',
    type: PrescriptionResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden - Only customers can create prescriptions', type: ErrorResponseDto })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createDto: CreatePrescriptionDto,
  ): Promise<PrescriptionResponseDto> {
    const userId = req.user?._id?.toString();
    const role = Number(req.user?.role);

    // Only customers (and admin/manager for support) can create prescriptions
    if (
      role !== UserRole.CUSTOMER &&
      role !== UserRole.ADMIN &&
      role !== UserRole.MANAGER
    ) {
      throw new ForbiddenException('Only customers can create prescriptions');
    }

    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    return this.prescriptionService.create(userId, createDto);
  }

  /**
   * Get user's prescriptions
   * GET /prescriptions
   */
  @Get()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SALE, UserRole.OPERATION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user prescriptions',
    description:
      'Returns a paginated list of prescriptions for the authenticated user. Admin/Staff can view all prescriptions.',
  })
  @ApiOkResponse({
    description: 'Prescriptions retrieved successfully',
    type: PrescriptionListResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ErrorResponseDto })
  async getPrescriptions(
    @Req() req: AuthenticatedRequest,
    @Query() query: PrescriptionListQueryDto,
  ): Promise<PrescriptionListResponseDto> {
    const userId = req.user?._id?.toString();
    const role = Number(req.user?.role);

    // Admin/Staff can view all prescriptions
    if (
      role === UserRole.ADMIN ||
      role === UserRole.MANAGER ||
      role === UserRole.SALE ||
      role === UserRole.OPERATION
    ) {
      return this.prescriptionService.getAllPrescriptions(query);
    }

    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    return this.prescriptionService.getUserPrescriptions(userId, query);
  }

  /**
   * Get prescription by ID
   * GET /prescriptions/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SALE, UserRole.OPERATION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get prescription details',
    description: 'Returns detailed information about a specific prescription.',
  })
  @ApiOkResponse({
    description: 'Prescription retrieved successfully',
    type: PrescriptionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Prescription not found', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ErrorResponseDto })
  async getPrescriptionById(
    @Req() req: AuthenticatedRequest,
    @Param('id') prescriptionId: string,
  ): Promise<PrescriptionResponseDto> {
    const userId = req.user?._id?.toString();
    const role = Number(req.user?.role);

    // Admin/Staff can view any prescription
    if (
      role === UserRole.ADMIN ||
      role === UserRole.MANAGER ||
      role === UserRole.SALE ||
      role === UserRole.OPERATION
    ) {
      const prescriptions = await this.prescriptionService.getAllPrescriptions({});
      const prescription = prescriptions.prescriptions.find((p) => p._id === prescriptionId);
      if (!prescription) {
        throw new NotFoundException('Prescription not found');
      }
      return prescription;
    }

    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    return this.prescriptionService.getById(prescriptionId, userId);
  }

  /**
   * Update prescription
   * PUT /prescriptions/:id
   * Only customers can update their own prescriptions
   * Admin/Manager can update for testing purposes
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update prescription',
    description: 'Updates a prescription. Only customers can update their own prescriptions.',
  })
  @ApiOkResponse({
    description: 'Prescription updated successfully',
    type: PrescriptionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Prescription not found', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden - Only customers can update their prescriptions', type: ErrorResponseDto })
  @ApiBadRequestResponse({ description: 'Bad request', type: ErrorResponseDto })
  async updatePrescription(
    @Req() req: AuthenticatedRequest,
    @Param('id') prescriptionId: string,
    @Body() updateDto: UpdatePrescriptionDto,
  ): Promise<PrescriptionResponseDto> {
    const userId = req.user?._id?.toString();
    const role = Number(req.user?.role);

    // Only customers (and admin/manager for support) can update prescriptions
    if (
      role !== UserRole.CUSTOMER &&
      role !== UserRole.ADMIN &&
      role !== UserRole.MANAGER
    ) {
      throw new ForbiddenException('Only customers can update prescriptions');
    }

    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    return this.prescriptionService.update(prescriptionId, userId, updateDto);
  }

  /**
   * Delete prescription
   * DELETE /prescriptions/:id
   * Only customers can delete their own prescriptions
   * Admin/Manager can delete for testing purposes
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete prescription',
    description: 'Deletes a prescription. Only customers can delete their own prescriptions.',
  })
  @ApiOkResponse({ description: 'Prescription deleted successfully' })
  @ApiNotFoundResponse({ description: 'Prescription not found', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden - Only customers can delete their prescriptions', type: ErrorResponseDto })
  async deletePrescription(
    @Req() req: AuthenticatedRequest,
    @Param('id') prescriptionId: string,
  ): Promise<void> {
    const userId = req.user?._id?.toString();
    const role = Number(req.user?.role);

    // Only customers (and admin/manager for support) can delete prescriptions
    if (
      role !== UserRole.CUSTOMER &&
      role !== UserRole.ADMIN &&
      role !== UserRole.MANAGER
    ) {
      throw new ForbiddenException('Only customers can delete prescriptions');
    }

    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    return this.prescriptionService.delete(prescriptionId, userId);
  }

  /**
   * Verify prescription (Staff only)
   * POST /prescriptions/:id/verify
   */
  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify prescription',
    description: 'Staff can verify a prescription as accurate. Verified prescriptions can be used for orders.',
  })
  @ApiOkResponse({
    description: 'Prescription verified successfully',
    type: PrescriptionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Prescription not found', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ErrorResponseDto })
  async verifyPrescription(
    @Req() req: AuthenticatedRequest,
    @Param('id') prescriptionId: string,
    @Body() verifyDto: VerifyPrescriptionDto,
  ): Promise<PrescriptionResponseDto> {
    const verifierId = req.user?._id?.toString();
    if (!verifierId) {
      throw new BadRequestException('User ID not found in request');
    }

    return this.prescriptionService.verify(prescriptionId, verifierId, verifyDto);
  }
}
