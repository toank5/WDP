import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PRODUCT_CATEGORIES } from '@eyewear/shared';

interface CreateProductDtoShape {
  category?: PRODUCT_CATEGORIES;
  frameType?: unknown;
  shape?: unknown;
  material?: unknown;
  variants?: unknown;
  lensType?: unknown;
  index?: unknown;
  serviceType?: unknown;
  durationMinutes?: unknown;
}

@ValidatorConstraint({ name: 'categoryRequiredFields', async: false })
export class CategoryRequiredFieldsConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments) {
    const object = args.object as CreateProductDtoShape;
    const category = object.category;

    if (!category) {
      return false;
    }

    switch (category) {
      case PRODUCT_CATEGORIES.FRAMES:
        return (
          object.frameType !== undefined &&
          object.shape !== undefined &&
          object.material !== undefined &&
          object.variants !== undefined &&
          Array.isArray(object.variants) &&
          object.variants.length > 0
        );

      case PRODUCT_CATEGORIES.LENSES:
        return object.lensType !== undefined && object.index !== undefined;

      case PRODUCT_CATEGORIES.SERVICES:
        return (
          object.serviceType !== undefined &&
          object.durationMinutes !== undefined
        );

      default:
        return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as CreateProductDtoShape;
    const category = object.category;

    switch (category) {
      case PRODUCT_CATEGORIES.FRAMES:
        return 'Frame products require: frameType, shape, material, and at least one variant';
      case PRODUCT_CATEGORIES.LENSES:
        return 'Lens products require: lensType and index';
      case PRODUCT_CATEGORIES.SERVICES:
        return 'Service products require: serviceType and durationMinutes';
      default:
        return 'Invalid category or missing required fields';
    }
  }
}

export function CategoryRequiredFields(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: CategoryRequiredFieldsConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'images2DNotEmpty', async: false })
export class Images2DNotEmptyConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    if (!Array.isArray(value)) return false;
    return (
      value.length > 0 &&
      value.every((url) => typeof url === 'string' && url.trim().length > 0)
    );
  }

  defaultMessage() {
    return 'images2D must be a non-empty array of valid URLs';
  }
}

export function Images2DNotEmpty(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: Images2DNotEmptyConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'valid3DUrls', async: false })
export class Valid3DUrlsConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    if (value === undefined || value === null) return true;
    if (!Array.isArray(value)) return false;
    return value.every((url) => {
      if (typeof url !== 'string' || url.trim().length === 0) return false;
      // Optional: check for .glb or .gltf extension
      const trimmedUrl = url.trim().toLowerCase();
      return (
        trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')
      );
    });
  }

  defaultMessage() {
    return 'images3D must be an array of valid URLs (optionally .glb or .gltf files)';
  }
}

export function Valid3DUrls(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: Valid3DUrlsConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'uniqueSkusInArray', async: false })
export class UniqueSkusInArrayConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    if (!Array.isArray(value)) return true;

    const skus = value
      .map((v) => {
        if (v && typeof v === 'object' && 'sku' in v) {
          return (v as { sku?: string }).sku;
        }
        return undefined;
      })
      .filter(
        (sku): sku is string => sku !== undefined && typeof sku === 'string',
      );

    const uniqueSkus = new Set(skus);
    return skus.length === uniqueSkus.size;
  }

  defaultMessage() {
    return 'All variant SKUs must be unique within the same product';
  }
}

export function UniqueSkusInArray(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: UniqueSkusInArrayConstraint,
    });
  };
}
