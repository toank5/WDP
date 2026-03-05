import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PreorderService } from '../services/preorder.service';
import {
  PreorderOverviewDto,
  PreorderDetailResponseDto,
  AllocatePreorderStockDto,
  PreorderAllocationResultDto,
} from '../commons/dtos/preorder.dto';
import { RbacGuard, Roles, UserRole } from '../commons/guards/rbac.guard';

@ApiTags('Preorders')
@Controller('preorders')
@UseGuards(RbacGuard)
@ApiBearerAuth()
export class PreorderController {
  constructor(private readonly preorderService: PreorderService) {}

  /**
   * Get pre-order overview for dashboard
   * GET /manager/preorders/overview
   */
  @Get('overview')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATION)
  @ApiOperation({ summary: 'Get pre-order overview dashboard data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns pre-order overview with statistics and per-SKU views',
    type: PreorderOverviewDto,
  })
  async getPreorderOverview(): Promise<PreorderOverviewDto> {
    return this.preorderService.getPreorderOverview();
  }

  /**
   * Get pre-order details for a specific SKU
   * GET /manager/preorders/:sku
   */
  @Get(':sku')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATION)
  @ApiOperation({ summary: 'Get pre-order details for a specific SKU' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns detailed pre-order information for a SKU',
    type: PreorderDetailResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'SKU not found' })
  async getPreorderDetailBySku(
    @Param('sku') sku: string,
  ): Promise<PreorderDetailResponseDto> {
    return this.preorderService.getPreorderDetailBySku(sku.toUpperCase());
  }

  /**
   * Allocate received stock to pre-orders
   * POST /manager/preorders/allocate
   */
  @Post('allocate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Allocate received stock to pending pre-orders (FIFO)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns allocation result with updated orders',
    type: PreorderAllocationResultDto,
  })
  async allocateStockToPreorders(
    @Body() dto: AllocatePreorderStockDto,
  ): Promise<PreorderAllocationResultDto> {
    return this.preorderService.allocateStockToPreorders(dto);
  }
}
