import { z } from 'zod';
import { ROLES } from '@eyewear/shared';
import { ADDRESS_TYPES } from '@eyewear/shared';

const FullNameField = z
  .string()
  .min(5, 'Full name must be at least 5 characters')
  .max(100, 'Full name must not exceed 100 characters')
  .trim();

/**
 * Strict Address Schema
 * - All fields required
 * - No extra fields allowed (strict mode)
 * - Type must be valid enum
 */
export const AddressSchema = z
  .object({
    type: z.nativeEnum(ADDRESS_TYPES),
    street: z
      .string()
      .min(1, 'Street is required')
      .max(200, 'Street must not exceed 200 characters'),
    city: z
      .string()
      .min(1, 'City is required')
      .max(100, 'City must not exceed 100 characters'),
    zipCode: z
      .string()
      .min(1, 'Zip code is required')
      .max(20, 'Zip code must not exceed 20 characters'),
  })
  .strict();

/**
 * Strict Register User Schema
 * - All fields required
 * - No extra fields allowed (strict mode)
 * - Email format validated
 * - Password minimum length enforced
 * - Role must be valid enum
 */
export const RegisterUserSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password must not exceed 100 characters'),
    fullName: FullNameField.optional(),
    // Backward-compatible alias for clients still sending `name`.
    name: FullNameField.optional(),
    role: z.nativeEnum(ROLES).optional().default(ROLES.CUSTOMER),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (!data.fullName && !data.name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fullName'],
        message: 'Full name is required',
      });
    }
  })
  .transform(({ name, fullName, ...rest }) => ({
    ...rest,
    fullName: fullName ?? name!,
  }))
  .refine((data) => data.password.length >= 6, {
    message: 'Password must be at least 6 characters',
    path: ['password'],
  });

/**
 * Strict Login Schema
 * - Email and password required
 * - No extra fields allowed
 */
export const LoginSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

/**
 * Strict Create User Schema (for admin/staff creating users)
 * - Same as register but role is required
 */
export const CreateUserSchema = RegisterUserSchema;

/**
 * Strict Update User Schema
 * - All fields optional
 * - No extra fields allowed
 * - Same validations as create
 */
export const UpdateUserSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email format')
      .toLowerCase()
      .trim()
      .optional(),
    fullName: FullNameField.optional(),
    // Backward-compatible alias for clients still sending `name`.
    name: FullNameField.optional(),
    avatar: z.string().url('Avatar must be a valid URL').optional(),
    role: z.nativeEnum(ROLES).optional(),
    addresses: z.array(AddressSchema).optional(),
  })
  .strict()
  .refine(
    (data) => {
      // At least one field must be provided
      return Object.keys(data).length > 0;
    },
    {
      message: 'At least one field must be provided for update',
    },
  )
  .transform(({ name, fullName, ...rest }) => ({
    ...rest,
    ...(fullName || name ? { fullName: fullName ?? name } : {}),
  }));

/**
 * Strict Add Address Schema
 * - For adding a new address to a user
 */
export const AddAddressSchema = AddressSchema;

/**
 * Validation error response format
 */
export interface ValidationError {
  path: string[];
  message: string;
  received?: unknown;
}

/**
 * Format Zod errors for API response
 */
export function formatZodError(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};

  error.issues.forEach((err) => {
    const path = err.path.join('.');
    formatted[path] = err.message;
  });

  return formatted;
}

/**
 * TypeScript types inferred from schemas
 */
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type AddressInput = z.infer<typeof AddressSchema>;
export type AddAddressInput = z.infer<typeof AddAddressSchema>;
