import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Supplier, SupplierStatus } from '../commons/schemas/supplier.schema';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierQueryParams,
  ListSuppliersQueryDto,
} from '../commons/dtos/supplier.dto';

@Injectable()
export class SupplierService {
  constructor(
    @InjectModel(Supplier.name) private supplierModel: Model<Supplier>,
  ) {}

  /**
   * Create a new supplier
   */
  async create(createDto: CreateSupplierDto): Promise<Supplier> {
    // Check if code already exists
    const existing = await this.supplierModel.findOne({
      code: createDto.code.toUpperCase(),
    });
    if (existing) {
      throw new ConflictException(
        `Supplier with code "${createDto.code}" already exists`,
      );
    }

    const supplier = new this.supplierModel({
      ...createDto,
      code: createDto.code.toUpperCase(),
    });

    return await supplier.save();
  }

  /**
   * Get all suppliers with filtering (uses ListSuppliersQueryDto)
   */
  async findAll(params: ListSuppliersQueryDto = {}): Promise<{
    items: Supplier[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      status,
      page = 1,
      limit = 20,
    } = params;

    const query: Record<string, unknown> = {};

    // Search by name or code (case-insensitive)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.supplierModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ name: 1 })
        .lean()
        .exec(),
      this.supplierModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * Get all suppliers with filtering (deprecated - uses SupplierQueryParams for backward compatibility)
   */
  async findAllLegacy(params: SupplierQueryParams = {}): Promise<{
    items: Supplier[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      activeOnly = false,
      page = 1,
      limit = 50,
    } = params;

    const query: Record<string, unknown> = {};

    // Search by name or code (case-insensitive)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by active status (convert to status filter)
    if (activeOnly) {
      query.status = SupplierStatus.ACTIVE;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.supplierModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ name: 1 })
        .lean()
        .exec(),
      this.supplierModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * Get supplier by ID
   */
  async findById(id: string): Promise<Supplier> {
    const supplier = await this.supplierModel.findById(id);
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID "${id}" not found`);
    }
    return supplier;
  }

  /**
   * Get supplier by code
   */
  async findByCode(code: string): Promise<Supplier> {
    const supplier = await this.supplierModel.findOne({
      code: code.toUpperCase(),
    });
    if (!supplier) {
      throw new NotFoundException(
        `Supplier with code "${code}" not found`,
      );
    }
    return supplier;
  }

  /**
   * Get active suppliers for dropdown/autocomplete
   */
  async findActive(search?: string): Promise<Supplier[]> {
    const query: Record<string, unknown> = {
      status: SupplierStatus.ACTIVE,
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    return this.supplierModel
      .find(query)
      .sort({ name: 1 })
      .select('code name status email phone currency')
      .lean()
      .exec();
  }

  /**
   * Update supplier
   */
  async update(
    id: string,
    updateDto: UpdateSupplierDto,
  ): Promise<Supplier> {
    const supplier = await this.findById(id);

    // Apply updates (code cannot be changed)
    Object.assign(supplier, updateDto);

    return await supplier.save();
  }

  /**
   * Update supplier status
   */
  async setStatus(id: string, status: SupplierStatus): Promise<Supplier> {
    const supplier = await this.findById(id);
    supplier.status = status;
    return await supplier.save();
  }

  /**
   * Activate/deactivate supplier (deprecated - use setStatus instead)
   */
  async setActive(id: string, isActive: boolean): Promise<Supplier> {
    const supplier = await this.findById(id);
    supplier.status = isActive ? SupplierStatus.ACTIVE : SupplierStatus.INACTIVE;
    return await supplier.save();
  }

  /**
   * Delete supplier (hard delete)
   */
  async delete(id: string): Promise<Supplier> {
    const supplier = await this.findById(id);
    await this.supplierModel.deleteOne({ _id: id });
    return supplier;
  }
}
