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

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const createdProduct = new this.productModel(createProductDto);
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
  ): Promise<Product | null> {
    return this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
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
