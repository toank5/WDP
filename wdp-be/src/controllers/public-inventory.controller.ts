import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { InventoryService } from '../services/inventory.service';

/**
 * Public Inventory Controller
 * Customer-facing endpoints for checking inventory without authentication
 */
@ApiTags('Public Inventory')
@Controller('inventory')
export class PublicInventoryController {
  private readonly logger = new Logger(PublicInventoryController.name);

  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * Get inventory availability by SKU (public endpoint)
   * GET /inventory/:sku
   *
   * This endpoint is accessible without authentication for customers to check stock
   */
  @Get(':sku')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check inventory availability (public)',
    description: `
    Check inventory availability for a specific SKU without authentication.
    Returns stock quantities and availability status for customer display.

    Returns null/404 if SKU does not exist.
    `,
  })
  @ApiOkResponse({
    description: 'Inventory data retrieved successfully',
    schema: {
      example: {
        sku: 'FR-ROUND-52-BLK',
        stockQuantity: 120,
        reservedQuantity: 5,
        availableQuantity: 115,
        isInStock: true,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'SKU not found',
  })
  async checkAvailability(@Param('sku') sku: string) {
    try {
      this.logger.log(`Checking inventory for SKU: ${sku}`);

      const inventoryItem = await this.inventoryService.findBySku(sku);

      // If SKU not found or no inventory record, return empty stock data
      // This allows pre-order to work correctly when inventory is 0
      if (!inventoryItem) {
        this.logger.warn(`SKU not found: ${sku}, returning empty inventory`);
        return {
          sku,
          stockQuantity: 0,
          reservedQuantity: 0,
          availableQuantity: 0,
          isInStock: false,
        };
      }

      // Return simplified inventory data for customer display
      return {
        sku: inventoryItem.sku,
        stockQuantity: inventoryItem.stockQuantity,
        reservedQuantity: inventoryItem.reservedQuantity,
        availableQuantity: inventoryItem.availableQuantity,
        isInStock: inventoryItem.availableQuantity > 0,
      };
    } catch (error) {
      this.logger.error(
        `Error checking inventory for SKU ${sku}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
