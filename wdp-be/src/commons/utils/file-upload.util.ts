import * as path from 'path';
import * as multer from 'multer';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import { ICustomApiRequest } from '../interfaces/custom-api-request.interface';

export class FileUtils {
  static logger = new Logger(FileUtils.name);

  static fileFilter(
    req: Request,
    file: { fieldname: string; mimetype: string; originalname: string },
    cb: (arg0: Error | null, arg1: boolean) => void,
  ) {
    const allowedImageTypes = /jpeg|jpg|png|gif/;
    const allowedVideoTypes =
      /mp4|avi|flv|wmv|mp3|quicktime|mov|x-matroska|mkv/;

    let allowedTypes: RegExp, formatMessage: string;

    if (file.fieldname === 'video' || file.fieldname === 'videos') {
      allowedTypes = allowedVideoTypes;
      formatMessage = 'Allowed formats: mp3, mp4, avi, flv, wmv, mov, mkv';
    } else {
      // Default: image types cho avatar, icon, image, credential_image, video_thumbnail
      allowedTypes = allowedImageTypes;
      formatMessage = 'Allowed formats: jpeg, jpg, png, gif';
    }

    const isMimeTypeValid = allowedTypes.test(file.mimetype);
    const isExtensionValid = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );

    if (isMimeTypeValid && isExtensionValid) {
      return cb(null, true);
    }

    const errorMessage = `Invalid format. ${formatMessage}`;

    cb(new Error(errorMessage), false);
  }

  static fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const customReq = req as unknown as ICustomApiRequest;

      let destination = '/uploads';

      switch (file.fieldname) {
        case 'avatar':
          destination = `uploads/users/${customReq?._id}/avatar`;
          break;
        case 'video':
        case 'videos':
          destination = `uploads/videos`;
          break;
        case 'video_thumbnail':
          destination = `uploads/users/${customReq?._id}/videos/thumbnails`;
          break;
        case 'credential_image':
          destination = `uploads/credentials/images`;
          break;
        case 'credential_images':
          destination = `uploads/credentials/images`;
          break;
        case 'icon':
          destination = `uploads/icons`;
          break;
        case 'subject_image':
          destination = `uploads/subjects/images`;
          break;
        case 'course_image':
          destination = `uploads/courses/images`;
          break;
        case 'base_credential_image':
          destination = `uploads/base_credentials/images`;
          break;
      }

      // Use synchronous mkdir with recursive option to ensure directory exists
      try {
        fs.mkdirSync(destination, { recursive: true });
        cb(null, destination);
      } catch (err) {
        FileUtils.logger.error(
          `Failed to create directory ${destination}: ${(err as Error).message}`,
        );
        cb(err as NodeJS.ErrnoException, destination);
      }
    },

    filename: (req, file, cb) => {
      const baseName = req.headers['content-length'] + '_' + Date.now();
      const extension = path.extname(file.originalname);
      let fileName = '';

      switch (file.fieldname) {
        case 'avatar':
          fileName = `avatar_${baseName}${extension}`;
          break;
        case 'video':
        case 'videos':
          fileName = `video_${baseName}${extension}`;
          break;
        case 'video_thumbnail':
          fileName = `video_thumbnail_${baseName}${extension}`;
          break;
        case 'credential_image':
          fileName = `credential_image_${baseName}${extension}`;
          break;
        case 'credential_images':
          fileName = `credential_image_${baseName}${extension}`;
          break;
        case 'icon':
          fileName = `icon_${baseName}${extension}`;
          break;
        case 'subject_image':
          fileName = `subject_image_${baseName}${extension}`;
          break;
        case 'course_image':
          fileName = `course_image_${baseName}${extension}`;
          break;
        case 'base_credential_image':
          fileName = `base_credential_image_${baseName}${extension}`;
          break;
      }

      cb(null, fileName);
    },
  });

  static excludeFileFromPath(filePath: string): string {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return path.dirname(filePath);
  }

  static convertFilePathToExpressFilePath(
    filePath: string | Error,
  ): fs.PathOrFileDescriptor {
    if (filePath instanceof Error) {
      throw filePath;
    }
    return filePath;
  }

  static getFileFromFolder(folderPath: string): Express.Multer.File[] {
    if (!fs.existsSync(folderPath)) {
      throw new Error(`Folder not found: ${folderPath}`);
    }

    return fs.readdirSync(folderPath).map((file) => {
      const filePath = path.join(folderPath, file);
      return {
        buffer: fs.readFileSync(filePath),
        originalname: file,
        path: filePath,
      } as Express.Multer.File;
    });
  }

  static async deleteFile(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    await fs.promises.unlink(filePath);
  }

  static deleteFilesInFolder(folderPath: string) {
    if (!fs.existsSync(folderPath)) {
      throw new Error(`Folder not found: ${folderPath}`);
    }

    fs.readdirSync(folderPath).forEach((file) => {
      const filePath = path.join(folderPath, file);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      }
    });
  }

  static extractFilenameFromPath = async (filePath: string) => {
    try {
      // Use path.basename to get the filename from the given path
      const filename = path.basename(filePath);
      return filename;
    } catch (err) {
      console.error(`Error extracting filename from path: ${err.message}`);
      return null; // or handle error as needed
    }
  };
}
