import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { InventoryService } from '../services/inventory.service';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  StockAdjustmentDto,
  BulkStockUpdateDto,
  ReserveInventoryDto,
  ReleaseReservationDto,
} from '../commons/dtos/inventory.dto';
import {
  RbacGuard,
  UserRole,
  Roles,
  MANAGER_OR_ADMIN,
} from '../commons/guards/rbac.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ErrorResponseDto } from '../commons/dtos/error-response.dto';
import { MovementType } from '../commons/schemas/inventory-movement.schema';

// Roles that can access inventory endpoints (Operation, Manager, Admin)
export const INVENTORY_ACCESS_ROLES = [
  UserRole.OPERATION,
  UserRole.MANAGER,
  UserRole.ADMIN,
];

@ApiTags('Inventory')
@Controller('manager/inventory')
@UseGuards(JwtAuthGuard, RbacGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * List all inventory items with optional filters
   * GET /manager/inventory
   * Query params: sku, lowStock, activeOnly, page, limit
   */
  @Get()
  @Roles(...INVENTORY_ACCESS_ROLES)
  @ApiOperation({
    summary: 'List inventory items',
    description:
      'Get paginated list of inventory items with optional filtering by SKU, low stock, or active status.',
  })
  @ApiOkResponse({
    description: 'Inventory items retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Inventory items retrieved successfully',
        data: [],
        metadata: { total: 100, page: 1, limit: 50 },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async findAll(
    @Query('sku') sku?: string,
    @Query('lowStock') lowStock?: string,
    @Query('activeOnly') activeOnly?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const result = await this.inventoryService.findAll({
        sku,
        lowStock: lowStock === 'true',
        activeOnly: activeOnly === 'true',
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50,
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Inventory items retrieved successfully',
        metadata: {
          items: result.items,
          total: result.total,
          page: result.page,
          limit: result.limit,
        },
      };
    } catch (error) {
      console.error('Inventory list error:', error);
      throw error;
    }
  }

  /**
   * Get inventory item by SKU
   * GET /manager/inventory/:sku
   */
  @Get(':sku')
  @Roles(...INVENTORY_ACCESS_ROLES)
  @ApiOperation({
    summary: 'Get inventory item by SKU',
    description: 'Retrieve detailed inventory information for a specific SKU.',
  })
  @ApiOkResponse({
    description: 'Inventory item retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Inventory item retrieved successfully',
        data: {
          sku: 'FR-ROUND-52-BLK',
          stockQuantity: 120,
          reservedQuantity: 5,
          availableQuantity: 115,
          reorderLevel: 20,
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Inventory item not found',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async findOne(@Param('sku') sku: string) {
    try {
      const inventoryItem = await this.inventoryService.findBySku(sku);

      if (!inventoryItem) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: `Inventory item with SKU ${sku} not found`,
          data: null,
        };
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Inventory item retrieved successfully',
        data: inventoryItem,
      };
    } catch (error) {
      console.error('Inventory find error:', error);
      throw error;
    }
  }

  /**
   * Create a new inventory item
   * POST /manager/inventory
   */
  @Post()
  @Roles(...MANAGER_OR_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create inventory item',
    description: 'Create a new inventory item for a product variant SKU.',
  })
  @ApiCreatedResponse({
    description: 'Inventory item created successfully',
    schema: {
      example: {
        statusCode: 201,
        message: 'Inventory item created successfully',
        data: {
          sku: 'FR-ROUND-52-BLK',
          stockQuantity: 100,
          reservedQuantity: 0,
          availableQuantity: 100,
          reorderLevel: 20,
        },
      },
    },
  })
  @ApiConflictResponse({
    description: 'SKU already exists',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async create(
    @Body() createInventoryDto: CreateInventoryDto,
    @Res() res?: Response,
  ) {
    try {
      const inventoryItem =
        await this.inventoryService.create(createInventoryDto);

      return res?.status(HttpStatus.CREATED).json({
        statusCode: HttpStatus.CREATED,
        message: 'Inventory item created successfully',
        data: inventoryItem,
      });
    } catch (error) {
      if (error instanceof Error) {
        const message = error.message;

        if (message.includes('already exists')) {
          return res?.status(HttpStatus.CONFLICT).json({
            statusCode: HttpStatus.CONFLICT,
            message: message,
            error: 'SKU_CONFLICT',
          });
        }
      }

      console.error('Inventory creation error:', error);
      return res?.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to create inventory item',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update inventory item by SKU
   * PATCH /manager/inventory/:sku
   */
  @Patch(':sku')
  @Roles(...MANAGER_OR_ADMIN)
  @ApiOperation({
    summary: 'Update inventory item',
    description:
      'Update stock quantities, reorder level, or supplier info for a specific SKU.',
  })
  @ApiOkResponse({
    description: 'Inventory item updated successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Inventory item updated successfully',
        data: {
          sku: 'FR-ROUND-52-BLK',
          stockQuantity: 150,
          reservedQuantity: 5,
          availableQuantity: 145,
          reorderLevel: 25,
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Inventory item not found',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async updateBySku(
    @Param('sku') sku: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
    @Res() res?: Response,
  ) {
    try {
      const inventoryItem = await this.inventoryService.updateBySku(
        sku,
        updateInventoryDto,
      );

      if (!inventoryItem) {
        return res?.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: `Inventory item with SKU ${sku} not found`,
          data: null,
        });
      }

      return res?.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Inventory item updated successfully',
        data: inventoryItem,
      });
    } catch (error) {
      if (error instanceof Error) {
        const message = error.message;

        if (message.includes('not found')) {
          return res?.status(HttpStatus.NOT_FOUND).json({
            statusCode: HttpStatus.NOT_FOUND,
            message: message,
            error: 'NOT_FOUND',
          });
        }

        if (
          message.includes('cannot exceed') ||
          message.includes('cannot be negative')
        ) {
          return res?.status(HttpStatus.BAD_REQUEST).json({
            statusCode: HttpStatus.BAD_REQUEST,
            message: message,
            error: 'BAD_REQUEST',
          });
        }
      }

      console.error('Inventory update error:', error);
      return res?.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update inventory item',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Adjust stock quantity (used by Operation Staff to receive stock)
   * POST /manager/inventory/:sku/adjust
   */
  @Post(':sku/adjust')
  @Roles(...INVENTORY_ACCESS_ROLES)
  @ApiOperation({
    summary: 'Adjust stock quantity / Receive stock',
    description:
      'Increase or decrease stock quantity for a specific SKU. Use positive delta for receiving stock, negative for adjustments (damage, loss, etc.).',
  })
  @ApiOkResponse({
    description: 'Stock adjusted successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Stock adjusted successfully',
        data: {
          sku: 'FR-ROUND-52-BLK',
          stockQuantity: 130,
          reservedQuantity: 5,
          availableQuantity: 125,
          reorderLevel: 20,
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Inventory item not found',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid adjustment',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async adjustStock(
    @Param('sku') sku: string,
    @Body() adjustmentDto: StockAdjustmentDto,
    @Res() res?: Response,
  ) {
    try {
      const inventoryItem = await this.inventoryService.adjustStock(
        sku,
        adjustmentDto,
      );

      if (!inventoryItem) {
        return res?.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: `Inventory item with SKU ${sku} not found`,
          data: null,
        });
      }

      return res?.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Stock adjusted successfully',
        data: inventoryItem,
      });
    } catch (error) {
      if (error instanceof Error) {
        const message = error.message;

        if (message.includes('not found')) {
          return res?.status(HttpStatus.NOT_FOUND).json({
            statusCode: HttpStatus.NOT_FOUND,
            message: message,
            error: 'NOT_FOUND',
          });
        }

        if (
          message.includes('cannot be negative') ||
          message.includes('cannot be less')
        ) {
          return res?.status(HttpStatus.BAD_REQUEST).json({
            statusCode: HttpStatus.BAD_REQUEST,
            message: message,
            error: 'BAD_REQUEST',
          });
        }
      }

      console.error('Stock adjustment error:', error);
      return res?.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to adjust stock',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Bulk update stock
   * POST /manager/inventory/bulk-update
   */
  @Post('bulk-update')
  @Roles(...MANAGER_OR_ADMIN)
  @ApiOperation({
    summary: 'Bulk update stock levels',
    description:
      'Update stock quantities for multiple SKUs in a single request.',
  })
  @ApiOkResponse({
    description: 'Bulk stock update completed',
    schema: {
      example: {
        statusCode: 200,
        message: 'Bulk stock update completed',
        data: { updated: 3, failed: 0 },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid request',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async bulkUpdate(
    @Body() bulkUpdateDto: BulkStockUpdateDto,
    @Res() res?: Response,
  ) {
    try {
      const result = await this.inventoryService.bulkUpdateStock(bulkUpdateDto);

      return res?.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Bulk stock update completed',
        data: result,
      });
    } catch (error) {
      console.error('Bulk stock update error:', error);
      return res?.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to perform bulk stock update',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Reserve inventory
   * POST /manager/inventory/:sku/reserve
   */
  @Post(':sku/reserve')
  @Roles(...INVENTORY_ACCESS_ROLES)
  @ApiOperation({
    summary: 'Reserve inventory for an order',
    description:
      'Reserve a specific quantity of stock for an order (reduces available quantity).',
  })
  @ApiOkResponse({
    description: 'Inventory reserved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Inventory reserved successfully',
        data: {
          sku: 'FR-ROUND-52-BLK',
          stockQuantity: 120,
          reservedQuantity: 7,
          availableQuantity: 113,
          reorderLevel: 20,
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Inventory item not found',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Insufficient stock or invalid quantity',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async reserve(
    @Param('sku') sku: string,
    @Body() reserveDto: ReserveInventoryDto,
    @Res() res?: Response,
  ) {
    try {
      const inventoryItem = await this.inventoryService.reserve(
        sku,
        reserveDto,
      );

      if (!inventoryItem) {
        return res?.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: `Inventory item with SKU ${sku} not found`,
          data: null,
        });
      }

      return res?.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Inventory reserved successfully',
        data: inventoryItem,
      });
    } catch (error) {
      if (error instanceof Error) {
        const message = error.message;

        if (message.includes('not found')) {
          return res?.status(HttpStatus.NOT_FOUND).json({
            statusCode: HttpStatus.NOT_FOUND,
            message: message,
            error: 'NOT_FOUND',
          });
        }

        if (message.includes('Insufficient stock')) {
          return res?.status(HttpStatus.BAD_REQUEST).json({
            statusCode: HttpStatus.BAD_REQUEST,
            message: message,
            error: 'INSUFFICIENT_STOCK',
          });
        }
      }

      console.error('Inventory reserve error:', error);
      return res?.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to reserve inventory',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Release reservation
   * POST /manager/inventory/:sku/release
   */
  @Post(':sku/release')
  @Roles(...INVENTORY_ACCESS_ROLES)
  @ApiOperation({
    summary: 'Release reservation',
    description:
      'Release reserved inventory back to available stock (e.g., when order is cancelled).',
  })
  @ApiOkResponse({
    description: 'Reservation released successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Reservation released successfully',
        data: {
          sku: 'FR-ROUND-52-BLK',
          stockQuantity: 120,
          reservedQuantity: 3,
          availableQuantity: 117,
          reorderLevel: 20,
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Inventory item not found',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid release quantity (exceeds reserved amount)',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async releaseReservation(
    @Param('sku') sku: string,
    @Body() releaseDto: ReleaseReservationDto,
    @Res() res?: Response,
  ) {
    try {
      const inventoryItem = await this.inventoryService.releaseReservation(
        sku,
        releaseDto,
      );

      if (!inventoryItem) {
        return res?.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: `Inventory item with SKU ${sku} not found`,
          data: null,
        });
      }

      return res?.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Reservation released successfully',
        data: inventoryItem,
      });
    } catch (error) {
      if (error instanceof Error) {
        const message = error.message;

        if (message.includes('not found')) {
          return res?.status(HttpStatus.NOT_FOUND).json({
            statusCode: HttpStatus.NOT_FOUND,
            message: message,
            error: 'NOT_FOUND',
          });
        }

        if (message.includes('Cannot release more')) {
          return res?.status(HttpStatus.BAD_REQUEST).json({
            statusCode: HttpStatus.BAD_REQUEST,
            message: message,
            error: 'BAD_REQUEST',
          });
        }
      }

      console.error('Reservation release error:', error);
      return res?.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to release reservation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get low stock items
   * GET /manager/inventory/reports/low-stock
   */
  @Get('reports/low-stock')
  @Roles(...INVENTORY_ACCESS_ROLES)
  @ApiOperation({
    summary: 'Get low stock items',
    description:
      'Retrieve all inventory items where stock quantity is at or below the reorder level.',
  })
  @ApiOkResponse({
    description: 'Low stock items retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Low stock items retrieved successfully',
        data: [
          {
            sku: 'FR-ROUND-52-BLK',
            stockQuantity: 18,
            reservedQuantity: 2,
            availableQuantity: 16,
            reorderLevel: 20,
          },
        ],
        total: 1,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getLowStockItems() {
    try {
      const items = await this.inventoryService.getLowStockItems();

      return {
        statusCode: HttpStatus.OK,
        message: 'Low stock items retrieved successfully',
        data: items,
        total: items.length,
      };
    } catch (error) {
      console.error('Low stock report error:', error);
      throw error;
    }
  }

  /**
   * Get movement history for a specific SKU
   * GET /manager/inventory/:sku/movements
   */
  @Get(':sku/movements')
  @Roles(...INVENTORY_ACCESS_ROLES)
  @ApiOperation({
    summary: 'Get movement history for SKU',
    description:
      'Retrieve the movement history for a specific SKU including receipts, adjustments, reservations, etc.',
  })
  @ApiOkResponse({
    description: 'Movement history retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Movement history retrieved successfully',
        data: {
          movements: [
            {
              sku: 'FR-ROUND-52-BLK',
              movementType: 'receipt',
              quantity: 100,
              stockBefore: 50,
              stockAfter: 150,
              reason: 'Stock received',
              reference: 'PO-2024-12345',
              supplier: {
                supplierCode: 'ACME',
                supplierName: 'Acme Eyewear Supplies',
                supplierRef: 'INV-2024-001',
              },
              createdAt: '2024-01-15T10:30:00.000Z',
            },
          ],
          total: 1,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getMovements(
    @Param('sku') sku: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const result = await this.inventoryService.getMovements(sku, {
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Movement history retrieved successfully',
        data: result,
      };
    } catch (error) {
      console.error('Movement history error:', error);
      throw error;
    }
  }

  /**
   * Get all movements (with optional filtering)
   * GET /manager/inventory/movements/all
   */
  @Get('movements/all')
  @Roles(...INVENTORY_ACCESS_ROLES)
  @ApiOperation({
    summary: 'Get all inventory movements',
    description:
      'Retrieve all inventory movements with optional filtering by SKU, movement type, or supplier.',
  })
  @ApiOkResponse({
    description: 'Movements retrieved successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getAllMovements(
    @Query('sku') sku?: string,
    @Query('movementType') movementType?: string,
    @Query('supplierId') supplierId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const parsedMovementType = movementType
        ? Object.values(MovementType).includes(movementType as MovementType)
          ? (movementType as MovementType)
          : undefined
        : undefined;

      const result = await this.inventoryService.getAllMovements({
        sku,
        movementType: parsedMovementType,
        supplierId,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Movements retrieved successfully',
        data: result,
      };
    } catch (error) {
      console.error('All movements error:', error);
      throw error;
    }
  }
}
