import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Patch,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductService } from '../services/product.service';
import { CloudinaryService } from '../commons/services/cloudinary.service';
import { FileUploadService } from '../commons/services/file-upload.service';
import {
  CreateProductDto,
  UpdateProductDto,
} from '../commons/dtos/product.dto';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 10, new FileUploadService().getMulterOptions()),
  )
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    // Parse variants if it's a JSON string (from FormData)
    let dto = createProductDto;
    if (typeof dto.variants === 'string') {
      try {
        dto = { ...dto, variants: JSON.parse(dto.variants) };
      } catch (e) {
        throw new BadRequestException('Invalid variants format');
      }
    }

    // Upload images to Cloudinary if provided
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      imageUrls = await this.cloudinaryService.uploadMultipleFiles(
        files,
        'wdp/products',
      );
    }

    return this.productService.create(dto, imageUrls);
  }

  @Get()
  async findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(
    FilesInterceptor('images', 10, new FileUploadService().getMulterOptions()),
  )
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    // Parse variants if it's a JSON string (from FormData)
    let dto = updateProductDto;
    if (typeof dto.variants === 'string') {
      try {
        dto = { ...dto, variants: JSON.parse(dto.variants) };
      } catch (e) {
        throw new BadRequestException('Invalid variants format');
      }
    }

    // Upload new images to Cloudinary if provided
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      imageUrls = await this.cloudinaryService.uploadMultipleFiles(
        files,
        'wdp/products',
      );
    }

    return this.productService.update(id, dto, imageUrls);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  @Patch(':id/restore')
  async restore(@Param('id') id: string) {
    return this.productService.restore(id);
  }
}
