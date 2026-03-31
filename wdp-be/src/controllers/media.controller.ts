import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiConsumes,
  ApiBody,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MediaService } from '../commons/services/media.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard, Roles, UserRole } from '../commons/guards/rbac.guard';
import { ErrorResponseDto } from '../commons/dtos/error-response.dto';

// Upload size limits (hardcoded for webpack compatibility)
// 2D images: 10MB, 3D models: 10MB (Cloudinary free tier limit)
const MAX_SIZE_2D = 10 * 1024 * 1024; // 10MB
const MAX_SIZE_3D = 10 * 1024 * 1024; // 10MB (Cloudinary limit)

console.log('[Media Controller] Upload limits initialized:', {
  MAX_SIZE_2D: `${MAX_SIZE_2D} bytes (10MB)`,
  MAX_SIZE_3D: `${MAX_SIZE_3D} bytes (10MB)`,
});

@ApiTags('Media')
@Controller('manager/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * Upload 2D images for products
   * POST /manager/media/images2d
   */
  @Post('images2d')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        // Accept only image files
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException(
              'Only image files are allowed (JPEG, PNG, WebP)',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: MAX_SIZE_2D,
      },
    }),
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upload 2D product images',
    description:
      'Upload up to 10 2D images (JPEG, PNG, WebP) and get their Cloudinary URLs.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Up to 10 image files (JPEG, PNG, WebP, max 10MB each)',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Images uploaded successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Successfully uploaded 2 image(s)',
        data: {
          count: 2,
          urls: [
            'https://cdn.example.com/img1.jpg',
            'https://cdn.example.com/img2.jpg',
          ],
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid files or upload failed',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - manager/admin access required',
    type: ErrorResponseDto,
  })
  async upload2DImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const result = await this.mediaService.upload2DImages(files);

    return {
      statusCode: HttpStatus.OK,
      message: `Successfully uploaded ${result.count} image(s)`,
      data: result,
    };
  }

  /**
   * Upload 3D models for products
   * POST /manager/media/images3d
   */
  @Post('images3d')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        const ext = `.${file.originalname.split('.').pop()?.toLowerCase() || ''}`;
        const allowedExt = ['.glb', '.gltf', '.obj', '.usdz'];

        // Check file extension for 3D models
        if (!allowedExt.includes(ext)) {
          return cb(
            new BadRequestException(
              'Only 3D model files are allowed (.glb recommended, .gltf, .obj, .usdz)',
            ),
            false,
          );
        }

        // Warn if using GLTF (not self-contained)
        if (ext === '.gltf') {
          console.warn(`[Media Controller] GLTF file detected: ${file.originalname}. GLTF format may not work properly - please use GLB format instead.`);
        } else if (ext === '.obj') {
          console.log(`[Media Controller] OBJ file detected: ${file.originalname}. Note: Materials/textures may not load without MTL files.`);
        }

        cb(null, true);
      },
      limits: {
        fileSize: MAX_SIZE_3D,
      },
    }),
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upload 3D product models',
    description:
      'Upload up to 5 3D model files (.glb recommended, .obj, .gltf, .usdz) and get their Cloudinary URLs. Note: GLB format is strongly recommended as it is a single self-contained file with materials and textures. OBJ files are supported but may load without materials/textures. GLTF files may not render properly because they reference external resources (.bin, textures) that cannot be loaded from Cloudinary.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Up to 5 3D model files (.glb recommended, .obj supported, max 10MB each)',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiOkResponse({
    description: '3D models uploaded successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Successfully uploaded 1 model(s)',
        data: { count: 1, urls: ['https://cdn.example.com/model.glb'] },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid files or upload failed',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - manager/admin access required',
    type: ErrorResponseDto,
  })
  async upload3DModels(@UploadedFiles() files: Express.Multer.File[]) {
    console.log('[Media Controller] upload3DModels called');
    console.log('[Media Controller] Files received:', files?.length);
    if (files) {
      files.forEach((f, i) => {
        console.log(`[Media Controller] File ${i + 1}:`, {
          name: f.originalname,
          size: f.size,
          mimetype: f.mimetype,
        });
      });
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const result = await this.mediaService.upload3DModels(files);

    return {
      statusCode: HttpStatus.OK,
      message: `Successfully uploaded ${result.count} model(s)`,
      data: result,
    };
  }
}
