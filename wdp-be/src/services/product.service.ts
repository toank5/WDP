import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../commons/schemas/product.schema';
import {
  CreateProductDto,
  UpdateProductDto,
} from '../commons/dtos/product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    imageUrls?: string[],
  ): Promise<Product> {
    // If images are provided, assign them to variants
    // If multiple variants exist, distribute images sequentially
    const dto = { ...createProductDto };

    if (imageUrls && imageUrls.length > 0) {
      if (dto.variants && dto.variants.length > 0) {
        // Distribute images to variants
        const imagesPerVariant = Math.ceil(
          imageUrls.length / dto.variants.length,
        );
        let imageIndex = 0;

        dto.variants.forEach((variant) => {
          const variantImages = imageUrls.slice(
            imageIndex,
            imageIndex + imagesPerVariant,
          );
          if (variantImages.length > 0) {
            variant.images = variantImages;
            imageIndex += variantImages.length;
          }
        });
      }
    }

    const createdProduct = new this.productModel(dto);
    return createdProduct.save();
  }

  async findAll(): Promise<Product[]> {
    return this.productModel.find({ isDeleted: false }).exec();
  }

  async findOne(id: string): Promise<Product | null> {
    return this.productModel.findOne({ _id: id, isDeleted: false }).exec();
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    imageUrls?: string[],
  ): Promise<Product | null> {
    // If images are provided, assign them to variants
    const dto = { ...updateProductDto };

    if (imageUrls && imageUrls.length > 0) {
      if (dto.variants && dto.variants.length > 0) {
        // Distribute images to variants
        const imagesPerVariant = Math.ceil(
          imageUrls.length / dto.variants.length,
        );
        let imageIndex = 0;

        dto.variants.forEach((variant) => {
          const variantImages = imageUrls.slice(
            imageIndex,
            imageIndex + imagesPerVariant,
          );
          if (variantImages.length > 0) {
            variant.images = variantImages;
            imageIndex += variantImages.length;
          }
        });
      }
    }

    return this.productModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Product | null> {
    return this.productModel
      .findByIdAndUpdate(id, { isDeleted: true }, { new: true })
      .exec();
  }

  async restore(id: string): Promise<Product | null> {
    return this.productModel
      .findByIdAndUpdate(id, { isDeleted: false }, { new: true })
      .exec();
  }
}
