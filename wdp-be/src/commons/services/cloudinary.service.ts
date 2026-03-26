import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'products',
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Determine resource type based on file extension
      const ext = `.${file.originalname.split('.').pop()?.toLowerCase() || ''}`;
      const is3DModel = ['.glb', '.gltf', '.obj', '.usdz'].includes(ext);

      // Get filename without extension for public_id
      const fileNameWithoutExt = file.originalname.replace(/\.[^/.]+$/, '');
      // Generate unique public_id with timestamp to avoid conflicts
      const timestamp = Date.now();
      const publicId = is3DModel
        ? `${fileNameWithoutExt}-${timestamp}`
        : undefined;

      // Build upload options
      // Note: 3D models (GLB/GLTF/OBJ/USDZ) use 'raw' resource type in Cloudinary
      const uploadOptions: Record<string, unknown> = {
        folder,
        resource_type: is3DModel ? 'raw' : 'auto', // 3D models use 'raw' resource type
        chunk_size: 6000000, // 6MB chunks for large files
        // For 3D models: use filename as public_id to preserve extension in URL
        public_id: publicId,
        // For 3D models: use original filename to get extension in URL
        use_filename: is3DModel,
        filename_override: is3DModel ? file.originalname : undefined,
      };

      // Only apply allowed_formats for 2D images (not for 3D models)
      if (!is3DModel) {
        uploadOptions.allowed_formats = ['jpg', 'jpeg', 'png', 'webp'];
      }

      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(new Error(error.message || 'Upload failed'));
          } else {
            resolve(result?.secure_url || '');
          }
        },
      );

      stream.end(file.buffer);
    });
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = 'products',
  ): Promise<string[]> {
    const uploads = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploads);
  }

  async deleteFile(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      void cloudinary.uploader.destroy(publicId, (error: unknown) => {
        if (error) {
          const errorMessage =
            error && typeof error === 'object' && 'message' in error
              ? String(error.message)
              : 'Delete failed';
          reject(new Error(errorMessage));
        } else {
          resolve();
        }
      });
    });
  }
}
