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
import { RbacGuard } from '../commons/guards/rbac.guard';
import { ErrorResponseDto } from '../commons/dtos/error-response.dto';

@ApiTags('Media')
@Controller('manager/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * Upload 2D images for products
   * POST /manager/media/images2d
   */
  @Post('images2d')
  @UseGuards(RbacGuard)
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
        fileSize: 10 * 1024 * 1024, // 10MB limit
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
  @UseGuards(RbacGuard)
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        const ext = `.${file.originalname.split('.').pop()?.toLowerCase() || ''}`;
        const allowedExt = ['.glb', '.gltf', '.usdz'];

        // Check file extension for 3D models
        if (!allowedExt.includes(ext)) {
          return cb(
            new BadRequestException(
              'Only 3D model files are allowed (.glb, .gltf, .usdz)',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
      },
    }),
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upload 3D product models',
    description:
      'Upload up to 5 3D model files (.glb, .gltf, .usdz) and get their Cloudinary URLs.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Up to 5 3D model files (.glb, .gltf, .usdz, max 50MB each)',
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
