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
  Query,
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
  ApiConflictResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ProductService } from '../services/product.service';
import { FileUploadService } from '../commons/services/file-upload.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductVariantDto,
  ListProductsQueryDto,
} from '../commons/dtos/product.dto';
import { RbacGuard, Roles, UserRole } from '../commons/guards/rbac.guard';
import { PRODUCT_CATEGORIES } from '../commons/enums/product.enum';
import { ErrorResponseDto } from '../commons/dtos/error-response.dto';

@ApiTags('Products')
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
  @ApiOperation({
    summary: 'Create a new product',
    description:
      'Creates a new product with images. Supports frames, lenses, and services. Requires manager or admin role.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Product data with optional image files',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Designer Eyeglasses' },
        category: {
          enum: Object.values(PRODUCT_CATEGORIES),
          example: PRODUCT_CATEGORIES.FRAMES,
        },
        description: { type: 'string', example: 'Premium designer frames' },
        basePrice: { type: 'number', example: 199.99 },
        images2D: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of existing image URLs',
        },
        variants: {
          type: 'string',
          description: 'JSON string of variants array',
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Image files to upload',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Product created successfully',
    schema: {
      example: {
        statusCode: 201,
        message: 'Product created successfully',
        data: {
          _id: 'product-id',
          name: 'Designer Eyeglasses',
          slug: 'designer-eyeglasses',
          category: PRODUCT_CATEGORIES.FRAMES,
          basePrice: 199.99,
          variantsCount: 5,
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
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
  @ApiForbiddenResponse({
    description: 'Forbidden - insufficient permissions',
    type: ErrorResponseDto,
  })
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
  @ApiOperation({
    summary: 'List all active products',
    description: 'Retrieves all active products for public viewing.',
  })
  @ApiOkResponse({
    description: 'Products retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Products retrieved successfully',
        data: [
          {
            _id: 'product-id',
            name: 'Designer Eyeglasses',
            category: 'frame',
            basePrice: 199.99,
            isActive: true,
          },
        ],
      },
    },
  })
  async findAll() {
    return this.productService.findAll();
  }

  /**
   * Get products catalog with filtering and pagination (admin/manager/operation)
   * GET /products/catalog
   */
  @Get('catalog')
  @UseGuards(RbacGuard)
  @Roles(UserRole.OPERATION, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'List products with filters (catalog view)',
    description:
      'Retrieves products with filtering, sorting, and pagination. Used for admin/manager catalog view.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name, SKU, or variant SKU',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: PRODUCT_CATEGORIES,
    description: 'Filter by category',
  })
  @ApiQuery({
    name: 'shape',
    required: false,
    type: String,
    description: 'Filter by frame shape',
  })
  @ApiQuery({
    name: 'material',
    required: false,
    type: String,
    description: 'Filter by frame material',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'INACTIVE'],
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'has3D',
    required: false,
    enum: ['true', 'false'],
    description: 'Filter products with 3D media',
  })
  @ApiQuery({
    name: 'hasVariants',
    required: false,
    enum: ['true', 'false'],
    description: 'Filter products with multiple variants',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'name', 'price', 'updatedAt'],
    description: 'Sort by field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiOkResponse({
    description: 'Products retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Products retrieved successfully',
        data: {
          items: [
            {
              id: 'product-id',
              name: 'Designer Eyeglasses',
              category: 'frame',
              isActive: true,
              has3D: true,
              variantCount: 5,
            },
          ],
          total: 100,
          page: 1,
          limit: 20,
          totalPages: 5,
        },
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
  async listCatalog(
    @Query() query: ListProductsQueryDto,
    @Res() res?: Response,
  ) {
    const result = await this.productService.list(query);
    return res?.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Products retrieved successfully',
      data: result,
    });
  }

  /**
   * Get product by ID (public)
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get product by ID',
    description: 'Retrieves detailed information about a specific product.',
  })
  @ApiOkResponse({
    description: 'Product retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Product retrieved successfully',
        data: {
          _id: 'product-id',
          name: 'Designer Eyeglasses',
          category: 'frame',
          basePrice: 199.99,
          variants: [],
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
    type: ErrorResponseDto,
  })
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
  @ApiOperation({
    summary: 'Update a product',
    description:
      'Updates an existing product. Supports partial updates and image uploads. Requires manager or admin role.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Partial product data with optional image files',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        basePrice: { type: 'number' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Product updated successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Product updated successfully',
        data: {
          _id: 'product-id',
          name: 'Updated Designer Eyeglasses',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
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
  @ApiOperation({
    summary: 'Delete a product',
    description: 'Soft deletes a product. Requires manager or admin role.',
  })
  @ApiOkResponse({
    description: 'Product deleted successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Product deleted successfully',
        data: { _id: 'product-id', deletedAt: '2024-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
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
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  /**
   * Restore soft-deleted product (manager/admin only)
   */
  @Patch(':id/restore')
  @UseGuards(RbacGuard)
  @ApiOperation({
    summary: 'Restore a deleted product',
    description:
      'Restores a soft-deleted product. Requires manager or admin role.',
  })
  @ApiOkResponse({
    description: 'Product restored successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Product restored successfully',
        data: { _id: 'product-id', isActive: true },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
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
  async restore(@Param('id') id: string) {
    return this.productService.restore(id);
  }

  /**
   * Variant management endpoints
   */

  /**
   * Add variant to product (manager/admin only)
   * POST /products/:id/variants
   */
  @Post(':id/variants')
  @UseGuards(RbacGuard)
  @ApiOperation({
    summary: 'Add variant to product',
    description:
      'Adds a new variant to an existing product. Requires manager or admin role.',
  })
  @ApiCreatedResponse({
    description: 'Variant added successfully',
    schema: {
      example: {
        statusCode: 201,
        message: 'Variant added successfully',
        data: {
          sku: 'FR-ROUND-52-BLK',
          size: '52',
          color: 'Black',
          price: 199.99,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error or duplicate SKU',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
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
  async addVariant(
    @Param('id') id: string,
    @Body() variantData: ProductVariantDto,
  ) {
    return this.productService.addVariant(id, variantData);
  }

  /**
   * Update variant in product (manager/admin only)
   * PATCH /products/:id/variants/:variantId
   */
  @Patch(':id/variants/:variantId')
  @UseGuards(RbacGuard)
  @ApiOperation({
    summary: 'Update product variant',
    description:
      'Updates a specific variant of a product. Requires manager or admin role.',
  })
  @ApiOkResponse({
    description: 'Variant updated successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Variant updated successfully',
        data: {
          sku: 'FR-ROUND-52-BLK',
          price: 219.99,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Product or variant not found',
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
  async updateVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() variantData: Partial<ProductVariantDto>,
  ) {
    return this.productService.updateVariant(id, variantId, variantData);
  }

  /**
   * Delete variant from product (manager/admin only)
   * DELETE /products/:id/variants/:variantId
   */
  @Delete(':id/variants/:variantId')
  @UseGuards(RbacGuard)
  @ApiOperation({
    summary: 'Delete product variant',
    description:
      'Removes a variant from a product. Requires manager or admin role.',
  })
  @ApiOkResponse({
    description: 'Variant deleted successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Variant deleted successfully',
        data: { variantId: 'variant-id' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Product or variant not found',
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
  async removeVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
  ) {
    return this.productService.removeVariant(id, variantId);
  }

  /**
   * Get manager products with filters (manager/admin only)
   * GET /manager/products
   */
  @Get('manager/list')
  @UseGuards(RbacGuard)
  @ApiOperation({
    summary: 'List products with filters (manager/admin)',
    description:
      'Retrieves products with optional filtering by category and active status. Requires manager or admin role.',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: PRODUCT_CATEGORIES,
    description: 'Filter by product category',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiOkResponse({
    description: 'Products retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Products retrieved successfully',
        data: [
          {
            _id: 'product-id',
            name: 'Designer Eyeglasses',
            category: 'frame',
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
  async getManagerProducts(
    @Query('category') category?: PRODUCT_CATEGORIES,
    @Query('isActive') isActive?: string,
  ) {
    return this.productService.findWithFilters({
      category,
      isActive:
        isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }
}
