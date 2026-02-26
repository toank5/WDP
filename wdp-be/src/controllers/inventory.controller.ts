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
import { RbacGuard } from '../commons/guards/rbac.guard';

@Controller('manager/inventory')
@UseGuards(RbacGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * List all inventory items with optional filters
   * GET /manager/inventory
   * Query params: sku, lowStock, activeOnly, page, limit
   */
  @Get()
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
        data: result.items,
        metadata: {
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
  @HttpCode(HttpStatus.CREATED)
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
   * Adjust stock quantity
   * POST /manager/inventory/:sku/adjust
   */
  @Post(':sku/adjust')
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
}
