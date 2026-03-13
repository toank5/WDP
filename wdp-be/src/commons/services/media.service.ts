import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';

/**
 * Media upload response
 */
export interface UploadMediaResponse {
  urls: string[];
  count: number;
}

/**
 * Media service for handling 2D images and 3D models
 * Encapsulates file validation and upload logic
 */
@Injectable()
export class MediaService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Allowed MIME types for 2D images
   */
  private readonly ALLOWED_2D_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

  /**
   * Allowed file extensions for 3D models
   */
  private readonly ALLOWED_3D_EXTENSIONS = ['.glb', '.gltf', '.usdz'];

  /**
   * Maximum file size for 2D images (default: 10MB)
   * Can be overridden via UPLOAD_MAX_SIZE_2D env var (in MB)
   */
  private get MAX_2D_SIZE(): number {
    const maxSizeMB = this.configService.get<number>('UPLOAD_MAX_SIZE_2D', 10);
    return maxSizeMB * 1024 * 1024;
  }

  /**
   * Maximum file size for 3D models (default: 10MB - Cloudinary free tier limit)
   * Can be overridden via UPLOAD_MAX_SIZE_3D env var (in MB)
   */
  private get MAX_3D_SIZE(): number {
    const maxSizeMB = this.configService.get<number>('UPLOAD_MAX_SIZE_3D', 10);
    return maxSizeMB * 1024 * 1024;
  }

  /**
   * Get human-readable size limit for error messages
   */
  private getSizeLimitMB(sizeInBytes: number): string {
    return `${sizeInBytes / 1024 / 1024}MB`;
  }

  /**
   * Validate 2D image files
   */
  private validate2DImages(files: Express.Multer.File[]): void {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > 10) {
      throw new BadRequestException('Maximum 10 images allowed per upload');
    }

    const maxSize = this.MAX_2D_SIZE;
    const maxSizeMB = this.getSizeLimitMB(maxSize);

    for (const file of files) {
      // Check MIME type
      if (!this.ALLOWED_2D_MIMES.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid file type for "${file.originalname}". Allowed types: JPEG, PNG, WebP`,
        );
      }

      // Check file size
      if (file.size > maxSize) {
        throw new BadRequestException(
          `File "${file.originalname}" exceeds maximum size of ${maxSizeMB}`,
        );
      }
    }
  }

  /**
   * Validate 3D model files
   */
  private validate3DModels(files: Express.Multer.File[]): void {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > 5) {
      throw new BadRequestException('Maximum 5 models allowed per upload');
    }

    const maxSize = this.MAX_3D_SIZE;
    const maxSizeMB = this.getSizeLimitMB(maxSize);

    for (const file of files) {
      // Check file extension
      const ext = `.${file.originalname.split('.').pop()?.toLowerCase() || ''}`;
      if (!this.ALLOWED_3D_EXTENSIONS.includes(ext)) {
        throw new BadRequestException(
          `Invalid file type for "${file.originalname}". Allowed types: GLB, GLTF, USDZ`,
        );
      }

      // Check file size
      if (file.size > maxSize) {
        throw new BadRequestException(
          `File "${file.originalname}" exceeds maximum size of ${maxSizeMB}`,
        );
      }
    }
  }

  /**
   * Upload 2D images
   */
  async upload2DImages(
    files: Express.Multer.File[],
  ): Promise<UploadMediaResponse> {
    // Validate files
    this.validate2DImages(files);

    try {
      // Upload to Cloudinary
      const urls = await this.cloudinaryService.uploadMultipleFiles(
        files,
        'wdp/products/2d',
      );

      return {
        urls,
        count: urls.length,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to upload 2D images';
      throw new BadRequestException(`Upload failed: ${message}`);
    }
  }

  /**
   * Upload 3D models
   */
  async upload3DModels(
    files: Express.Multer.File[],
  ): Promise<UploadMediaResponse> {
    // Validate files
    this.validate3DModels(files);

    try {
      // Upload to Cloudinary
      const urls = await this.cloudinaryService.uploadMultipleFiles(
        files,
        'wdp/products/3d',
      );

      return {
        urls,
        count: urls.length,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to upload 3D models';
      throw new BadRequestException(`Upload failed: ${message}`);
    }
  }
}
