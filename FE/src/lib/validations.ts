/**
 * Validation Rules for Frontend Forms
 * Derived from backend DTOs in wdp-be/src/commons/dtos/user.dto.ts
 *
 * DTO Constraints:
 * CreateUserDto:
 *   - name: @IsString(), @MinLength(5), @MaxLength(100)
 *   - email: @IsEmail()
 *   - role: @IsEnum(ROLES)
 *   - password: @IsString(), @MinLength(6)
 *
 * UpdateUserDto:
 *   - name: @IsOptional(), @IsString(), @MinLength(5), @MaxLength(100)
 *   - email: @IsOptional(), @IsEmail()
 *   - role: @IsOptional(), @IsEnum(ROLES)
 *   - password: NOT in UpdateUserDto (use separate password change endpoint)
 */

// Mirror of backend ROLES enum (wdp-be/src/commons/enums/role.enum.ts)
export const ROLES = {
  ADMIN: 0,
  MANAGER: 1,
  OPERATION: 2,
  SALE: 3,
  CUSTOMER: 4,
} as const

export type RoleType = (typeof ROLES)[keyof typeof ROLES]

export const userFormValidation = {
  fullName: {
    required: true,
    minLength: 5, // @MinLength(5)
    maxLength: 100, // @MaxLength(100)
    pattern: /^[a-zA-Z\s'-]+$/,
    errorMsg: {
      required: 'Full name is required',
      minLength: 'Full name must be at least 5 characters',
      maxLength: 'Full name must not exceed 100 characters',
      pattern: 'Full name can only contain letters, spaces, hyphens, and apostrophes',
    },
  },
  email: {
    required: true,
    // @IsEmail() - RFC 5322 compliant
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    errorMsg: {
      required: 'Email is required',
      pattern: 'Please enter a valid email address',
    },
  },
  password: {
    required: true,
    minLength: 6, // @MinLength(6)
    // Note: Complex pattern (uppercase, lowercase, numbers) only enforced during registration
    // Admin user creation only requires minimum 6 characters per backend DTO
    errorMsg: {
      required: 'Password is required',
      minLength: 'Password must be at least 6 characters',
    },
  },
  role: {
    required: true,
    // @IsEnum(ROLES)
    validValues: Object.values(ROLES),
    errorMsg: {
      required: 'Role is required',
      invalid: 'Invalid role selected',
    },
  },
} as const

export const validateField = (
  fieldName: keyof typeof userFormValidation,
  value: string | number
): string | null => {
  const field = userFormValidation[fieldName]
  if (!field) return null

  // Check required
  if (field.required && !value) {
    return field.errorMsg.required || 'This field is required'
  }

  // Skip validation if empty and not required
  if (!value && !field.required) {
    return null
  }

  const strValue = String(value)

  // Check minLength
  if ('minLength' in field && strValue.length < field.minLength) {
    return field.errorMsg.minLength || `Minimum ${field.minLength} characters required`
  }

  // Check maxLength
  if ('maxLength' in field && strValue.length > field.maxLength) {
    return field.errorMsg.maxLength || `Maximum ${field.maxLength} characters allowed`
  }

  // Check pattern
  if ('pattern' in field && !field.pattern.test(strValue)) {
    return field.errorMsg.pattern || 'Invalid format'
  }

  // Check validValues (for enums)
  if ('validValues' in field && !field.validValues.includes(value as RoleType)) {
    return field.errorMsg.invalid || 'Invalid value'
  }

  return null
}
