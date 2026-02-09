import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import type { ZodSchema, ZodError } from 'zod';

/**
 * Format Zod errors for API response
 * Matches the pattern used in policy.validation.ts
 */
export function formatZodError(error: ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};

  error.issues.forEach((err) => {
    const path = err.path.join('.');
    formatted[path] = err.message;
  });

  return formatted;
}

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    const parsed = this.schema.safeParse(value);

    if (!parsed.success) {
      const error = parsed.error; // ZodError - only accessible in error branch
      const formattedErrors = formatZodError(error);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    // After the success check, parsed is narrowed to SafeParseSuccess
    return parsed.data;
  }
}
