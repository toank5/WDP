import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Prescription } from '../commons/schemas/prescription.schema';
import {
  CreatePrescriptionDto,
  UpdatePrescriptionDto,
  VerifyPrescriptionDto,
  PrescriptionResponseDto,
  PrescriptionListQueryDto,
  PrescriptionListResponseDto,
} from '../dtos/prescription.dto';

@Injectable()
export class PrescriptionService {
  constructor(
    @InjectModel(Prescription.name)
    private prescriptionModel: Model<Prescription>,
  ) {}

  /**
   * Create a new prescription for a user
   */
  async create(
    userId: string,
    createDto: CreatePrescriptionDto,
  ): Promise<PrescriptionResponseDto> {
    // Validate that at least some data is provided
    const hasEyeData =
      (createDto.rightEye &&
        (createDto.rightEye.sph !== undefined ||
          createDto.rightEye.cyl !== undefined ||
          createDto.rightEye.axis !== undefined ||
          createDto.rightEye.add !== undefined)) ||
      (createDto.leftEye &&
        (createDto.leftEye.sph !== undefined ||
          createDto.leftEye.cyl !== undefined ||
          createDto.leftEye.axis !== undefined ||
          createDto.leftEye.add !== undefined)) ||
      (createDto.pd &&
        (createDto.pd.left !== undefined ||
          createDto.pd.right !== undefined ||
          createDto.pd.total !== undefined));

    if (!hasEyeData && !createDto.imageUrl) {
      throw new BadRequestException(
        'Please provide at least some prescription data or upload a prescription image.',
      );
    }

    const prescription = new this.prescriptionModel({
      userId: new Types.ObjectId(userId),
      name: createDto.name,
      prescriptionDate: createDto.prescriptionDate,
      rightEye: createDto.rightEye,
      leftEye: createDto.leftEye,
      pd: createDto.pd,
      imageUrl: createDto.imageUrl,
      isVerified: false,
    });

    await prescription.save();
    return this.toResponseDto(prescription);
  }

  /**
   * Get all prescriptions for a user
   */
  async getUserPrescriptions(
    userId: string,
    query: PrescriptionListQueryDto,
  ): Promise<PrescriptionListResponseDto> {
    const {
      isVerified,
      search,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter: any = { userId: new Types.ObjectId(userId) };

    if (isVerified !== undefined) {
      filter.isVerified = isVerified === 'true';
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Count total
    const total = await this.prescriptionModel.countDocuments(filter);

    // Get prescriptions
    const prescriptions = await this.prescriptionModel
      .find(filter)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limitNum)
      .exec();

    return {
      prescriptions: prescriptions.map((p) => this.toResponseDto(p)),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Get a single prescription by ID
   */
  async getById(
    prescriptionId: string,
    userId: string,
  ): Promise<PrescriptionResponseDto> {
    const prescription = await this.prescriptionModel.findById(prescriptionId);

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Check if user owns this prescription
    if (prescription.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this prescription',
      );
    }

    return this.toResponseDto(prescription);
  }

  /**
   * Update a prescription
   */
  async update(
    prescriptionId: string,
    userId: string,
    updateDto: UpdatePrescriptionDto,
  ): Promise<PrescriptionResponseDto> {
    const prescription = await this.prescriptionModel.findById(prescriptionId);

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Check if user owns this prescription
    if (prescription.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this prescription',
      );
    }

    // Don't allow updating verified prescriptions
    if (prescription.isVerified) {
      throw new BadRequestException('Cannot update a verified prescription');
    }

    // Update fields
    if (updateDto.name !== undefined) {
      prescription.name = updateDto.name;
    }
    if (updateDto.prescriptionDate !== undefined) {
      prescription.prescriptionDate = updateDto.prescriptionDate;
    }
    if (updateDto.rightEye !== undefined) {
      prescription.rightEye = updateDto.rightEye;
    }
    if (updateDto.leftEye !== undefined) {
      prescription.leftEye = updateDto.leftEye;
    }
    if (updateDto.pd !== undefined) {
      prescription.pd = updateDto.pd;
    }
    if (updateDto.imageUrl !== undefined) {
      prescription.imageUrl = updateDto.imageUrl;
    }

    await prescription.save();
    return this.toResponseDto(prescription);
  }

  /**
   * Delete a prescription
   */
  async delete(prescriptionId: string, userId: string): Promise<void> {
    const prescription = await this.prescriptionModel.findById(prescriptionId);

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Check if user owns this prescription
    if (prescription.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this prescription',
      );
    }

    await this.prescriptionModel.deleteOne({ _id: prescriptionId });
  }

  /**
   * Verify a prescription (Staff only)
   */
  async verify(
    prescriptionId: string,
    verifierId: string,
    verifyDto: VerifyPrescriptionDto,
  ): Promise<PrescriptionResponseDto> {
    const prescription = await this.prescriptionModel.findById(prescriptionId);

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    prescription.isVerified = verifyDto.isVerified;

    if (verifyDto.isVerified) {
      prescription.verifiedAt = new Date();
      prescription.set('verifiedBy', new Types.ObjectId(verifierId));
    }

    if (verifyDto.verificationNotes !== undefined) {
      prescription.verificationNotes = verifyDto.verificationNotes;
    }

    await prescription.save();
    return this.toResponseDto(prescription);
  }

  /**
   * Get all prescriptions (Admin/Staff view)
   */
  async getAllPrescriptions(
    query: PrescriptionListQueryDto,
  ): Promise<PrescriptionListResponseDto> {
    const {
      isVerified,
      search,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter: any = {};

    if (isVerified !== undefined) {
      filter.isVerified = isVerified === 'true';
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Count total
    const total = await this.prescriptionModel.countDocuments(filter);

    // Get prescriptions with user population
    const prescriptions = await this.prescriptionModel
      .find(filter)
      .populate('userId', 'fullName email')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limitNum)
      .exec();

    return {
      prescriptions: prescriptions.map((p) => this.toResponseDto(p)),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Convert Prescription document to Response DTO
   */
  private toResponseDto(prescription: Prescription): PrescriptionResponseDto {
    return {
      _id: prescription._id.toString(),
      name: prescription.name,
      prescriptionDate: prescription.prescriptionDate,
      rightEye: prescription.rightEye
        ? {
            sph: prescription.rightEye.sph,
            cyl: prescription.rightEye.cyl,
            axis: prescription.rightEye.axis,
            add: prescription.rightEye.add,
          }
        : undefined,
      leftEye: prescription.leftEye
        ? {
            sph: prescription.leftEye.sph,
            cyl: prescription.leftEye.cyl,
            axis: prescription.leftEye.axis,
            add: prescription.leftEye.add,
          }
        : undefined,
      pd: prescription.pd
        ? {
            left: prescription.pd.left,
            right: prescription.pd.right,
            total: prescription.pd.total,
          }
        : undefined,
      imageUrl: prescription.imageUrl,
      isVerified: prescription.isVerified,
      verifiedAt: prescription.verifiedAt,
      verifiedBy: prescription.verifiedBy?.toString(),
      verificationNotes: prescription.verificationNotes,
      createdAt: prescription.createdAt,
      updatedAt: prescription.updatedAt,
    };
  }
}
