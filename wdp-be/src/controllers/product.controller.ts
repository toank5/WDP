import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Patch,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  HttpStatus,
  HttpCode,
  Res,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ProductService } from '../services/product.service';
import { FileUploadService } from '../commons/services/file-upload.service';
import {
  CreateProductDto,
  UpdateProductDto,
} from '../commons/dtos/product.dto';
import { RbacGuard } from '../commons/guards/rbac.guard';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  /**
   * Create a new product (manager/admin only)
   * POST /products
   * Delegates all business logic to service
   */
  @Post()
  @UseGuards(RbacGuard)
  @UseInterceptors(
    FilesInterceptor('images', 20, new FileUploadService().getMulterOptions()),
  )
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
    @Res() res?: Response,
  ) {
    try {
      // Parse variants if it's a JSON string (from FormData)
      let dto = createProductDto;
      if (typeof dto.variants === 'string') {
        try {
          dto = { ...dto, variants: JSON.parse(dto.variants) };
        } catch {
          throw new BadRequestException('Invalid variants format');
        }
      }

      // Service handles: Zod validation, image uploads, business logic
      const product = await this.productService.createWithFiles(dto, files);

      return res?.status(HttpStatus.CREATED).json({
        statusCode: HttpStatus.CREATED,
        message: 'Product created successfully',
        data: {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          category: product.category,
          basePrice: product.basePrice,
          variantsCount: product.variants?.length || 0,
          isActive: product.isActive,
          createdAt: product.createdAt,
        },
      });
    } catch (error) {
      // Return error from service with proper status codes
      if (error instanceof Error) {
        const message = error.message;

        // Conflict errors (409) - SKU already exists
        if (message.includes('already exist')) {
          return res?.status(HttpStatus.CONFLICT).json({
            statusCode: HttpStatus.CONFLICT,
            message: message,
            error: 'SKU_CONFLICT',
          });
        }

        // Bad request errors (400) - validation failures
        if (
          message.includes('Validation failed') ||
          message.includes('Category validation') ||
          message.includes('Invalid variants format')
        ) {
          return res?.status(HttpStatus.BAD_REQUEST).json({
            statusCode: HttpStatus.BAD_REQUEST,
            message: message,
            error: 'BAD_REQUEST',
          });
        }
      }

      // Generic error handler
      console.error('Product creation error:', error);
      return res?.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to create product',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get all active products (public)
   */
  @Get()
  async findAll() {
    return this.productService.findAll();
  }

  /**
   * Get product by ID (public)
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  /**
   * Update product (manager/admin only)
   */
  @Put(':id')
  @UseGuards(RbacGuard)
  @UseInterceptors(
    FilesInterceptor('images', 20, new FileUploadService().getMulterOptions()),
  )
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    try {
      // Parse variants if it's a JSON string (from FormData)
      let dto = updateProductDto;
      if (typeof dto.variants === 'string') {
        try {
          dto = { ...dto, variants: JSON.parse(dto.variants) };
        } catch {
          throw new BadRequestException('Invalid variants format');
        }
      }

      // Service handles: validation, uploads, business logic
      const product = await this.productService.updateWithFiles(id, dto, files);

      return {
        statusCode: HttpStatus.OK,
        message: 'Product updated successfully',
        data: product,
      };
    } catch (error) {
      console.error('Product update error:', error);
      throw error;
    }
  }

  /**
   * Delete product (manager/admin only)
   */
  @Delete(':id')
  @UseGuards(RbacGuard)
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  /**
   * Restore soft-deleted product (manager/admin only)
   */
  @Patch(':id/restore')
  @UseGuards(RbacGuard)
  async restore(@Param('id') id: string) {
    return this.productService.restore(id);
  }
}
