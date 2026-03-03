import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard, UserRole, Roles } from '../commons/guards/rbac.guard';
import { SupplierService } from '../services/supplier.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  ListSuppliersQueryDto,
} from '../commons/dtos/supplier.dto';
import { Supplier, SupplierStatus } from '../commons/schemas/supplier.schema';
import { ErrorResponseDto } from '../commons/dtos/error-response.dto';

// Roles that can manage suppliers (Manager, Admin)
const SUPPLIER_MANAGE_ROLES = [UserRole.MANAGER, UserRole.ADMIN];

// Roles that can view suppliers (Operation, Manager, Admin)
const SUPPLIER_VIEW_ROLES = [
  UserRole.OPERATION,
  UserRole.MANAGER,
  UserRole.ADMIN,
];

@ApiTags('suppliers')
@Controller('manager/suppliers')
@UseGuards(JwtAuthGuard, RbacGuard)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  /**
   * Create a new supplier (admin/manager only)
   */
  @Post()
  @Roles(...SUPPLIER_MANAGE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create supplier',
    description: 'Create a new supplier. Requires MANAGER or ADMIN role.',
  })
  @ApiResponse({
    status: 201,
    description: 'Supplier created successfully',
    schema: {
      example: {
        statusCode: 201,
        message: 'Supplier created successfully',
        data: {
          _id: '507f1f77bcf86cd799439011',
          code: 'ACME',
          name: 'Acme Eyewear Supplies',
          email: 'contact@acme.com',
          phone: '+1-555-123-4567',
          isActive: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Supplier code already exists',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async create(@Body() createDto: CreateSupplierDto, @Res() res?: Response) {
    try {
      const supplier = await this.supplierService.create(createDto);
      return res?.status(HttpStatus.CREATED).json({
        statusCode: HttpStatus.CREATED,
        message: 'Supplier created successfully',
        data: supplier,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        return res?.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: error.message,
          error: 'SUPPLIER_CODE_EXISTS',
        });
      }
      throw error;
    }
  }

  /**
   * Get all suppliers with filtering (manager view with full details)
   */
  @Get()
  @Roles(...SUPPLIER_MANAGE_ROLES)
  @ApiOperation({
    summary: 'Get suppliers list',
    description:
      'Get paginated list of suppliers with optional search and status filter',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or code',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: SupplierStatus,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiResponse({ status: 200, description: 'Suppliers retrieved' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: SupplierStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const params: ListSuppliersQueryDto = {
      search,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };
    const result = await this.supplierService.findAll(params);
    return {
      statusCode: HttpStatus.OK,
      message: 'Suppliers retrieved successfully',
      data: result,
    };
  }

  /**
   * Get supplier by ID
   */
  @Get(':id')
  @Roles(...SUPPLIER_VIEW_ROLES)
  @ApiOperation({
    summary: 'Get supplier by ID',
    description: 'Get a single supplier by ID',
  })
  @ApiResponse({ status: 200, description: 'Supplier found', type: Supplier })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async findById(@Param('id') id: string, @Res() res?: Response) {
    try {
      const supplier = await this.supplierService.findById(id);
      return res?.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Supplier retrieved successfully',
        data: supplier,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res?.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: error.message,
          error: 'SUPPLIER_NOT_FOUND',
        });
      }
      throw error;
    }
  }

  /**
   * Get supplier by code
   */
  @Get('code/:code')
  @Roles(...SUPPLIER_VIEW_ROLES)
  @ApiOperation({
    summary: 'Get supplier by code',
    description: 'Get a single supplier by code',
  })
  @ApiResponse({ status: 200, description: 'Supplier found', type: Supplier })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async findByCode(@Param('code') code: string, @Res() res?: Response) {
    try {
      const supplier = await this.supplierService.findByCode(code);
      return res?.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Supplier retrieved successfully',
        data: supplier,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res?.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: error.message,
          error: 'SUPPLIER_NOT_FOUND',
        });
      }
      throw error;
    }
  }

  /**
   * Update supplier
   */
  @Patch(':id')
  @Roles(...SUPPLIER_MANAGE_ROLES)
  @ApiOperation({
    summary: 'Update supplier',
    description: 'Update supplier information',
  })
  @ApiResponse({ status: 200, description: 'Supplier updated', type: Supplier })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Supplier code already exists',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSupplierDto,
    @Res() res?: Response,
  ) {
    try {
      const supplier = await this.supplierService.update(id, updateDto);
      return res?.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Supplier updated successfully',
        data: supplier,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res?.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: error.message,
          error: 'SUPPLIER_NOT_FOUND',
        });
      }
      if (error instanceof Error && error.message.includes('already exists')) {
        return res?.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: error.message,
          error: 'SUPPLIER_CODE_EXISTS',
        });
      }
      throw error;
    }
  }

  /**
   * Update supplier status
   */
  @Patch(':id/status')
  @Roles(...SUPPLIER_MANAGE_ROLES)
  @ApiOperation({
    summary: 'Update supplier status',
    description: 'Update supplier status (ACTIVE or INACTIVE)',
  })
  @ApiResponse({
    status: 200,
    description: 'Supplier status updated',
    type: Supplier,
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status value',
    type: ErrorResponseDto,
  })
  async setStatus(
    @Param('id') id: string,
    @Body('status') status: SupplierStatus,
    @Res() res?: Response,
  ) {
    try {
      if (!status || !Object.values(SupplierStatus).includes(status)) {
        return res?.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Invalid status. Must be one of: ${Object.values(SupplierStatus).join(', ')}`,
          error: 'INVALID_STATUS',
        });
      }
      const supplier = await this.supplierService.setStatus(id, status);
      return res?.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: `Supplier ${status.toLowerCase()} successfully`,
        data: supplier,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res?.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: error.message,
          error: 'SUPPLIER_NOT_FOUND',
        });
      }
      throw error;
    }
  }

  /**
   * Delete supplier (hard delete - admin only)
   */
  @Delete(':id')

  /**
   * Delete supplier (hard delete - admin only)
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete supplier',
    description: 'Permanently delete a supplier. ADMIN only.',
  })
  @ApiResponse({ status: 200, description: 'Supplier deleted' })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin only',
    type: ErrorResponseDto,
  })
  async delete(@Param('id') id: string, @Res() res?: Response) {
    try {
      const supplier = await this.supplierService.delete(id);
      return res?.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Supplier deleted successfully',
        data: supplier,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res?.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: error.message,
          error: 'SUPPLIER_NOT_FOUND',
        });
      }
      throw error;
    }
  }
}

/**
 * Public supplier controller for Operation Staff (read-only autocomplete)
 */
@ApiTags('suppliers')
@Controller('suppliers')
@UseGuards(JwtAuthGuard, RbacGuard)
export class PublicSupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  /**
   * Get active suppliers for dropdown/autocomplete (lightweight, read-only)
   * Accessible by Operation Staff, Manager, Admin
   */
  @Get('public')
  @Roles(...SUPPLIER_VIEW_ROLES)
  @ApiOperation({
    summary: 'Get active suppliers (public)',
    description:
      'Get active suppliers for dropdown/autocomplete. Returns minimal fields (id, code, name).',
  })
  @ApiResponse({
    status: 200,
    description: 'Active suppliers retrieved',
    schema: {
      example: {
        statusCode: 200,
        message: 'Suppliers retrieved successfully',
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            code: 'ACME',
            name: 'Acme Eyewear Supplies',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async publicList(@Query('search') search?: string, @Res() res?: Response) {
    const suppliers = await this.supplierService.findActive(search);
    // Return only minimal fields for autocomplete
    const lightSuppliers = suppliers.map((s) => ({
      _id: s._id,
      code: s.code,
      name: s.name,
    }));
    return res?.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Suppliers retrieved successfully',
      data: lightSuppliers,
    });
  }
}
