import { z } from 'zod';
import { PolicyType } from '../types/policy.types';

/**
 * Strict Return Policy Config Schema
 * - All fields required
 * - No extra fields allowed (strict mode)
 * - Numeric ranges validated
 */
export const ReturnPolicyConfigSchema = z
  .object({
    returnWindowDays: z
      .object({
        framesOnly: z
          .number()
          .positive('Frames return window must be greater than 0'),
        prescriptionGlasses: z
          .number()
          .positive(
            'Prescription glasses return window must be greater than 0',
          ),
        contactLenses: z
          .number()
          .positive('Contact lenses return window must be greater than 0'),
      })
      .strict(),
    restockingFeePercent: z
      .number()
      .min(0, 'Restocking fee must be at least 0%')
      .max(100, 'Restocking fee must be at most 100%'),
    customerPaysReturnShipping: z.boolean(),
    nonReturnableCategories: z
      .array(z.string().min(1, 'Category cannot be empty'))
      .transform((categories) => {
        // Trim and deduplicate
        return [
          ...new Set(
            categories.map((c) => c.trim()).filter((c) => c.length > 0),
          ),
        ];
      })
      .refine(
        (categories) =>
          categories.length === 0 || categories.every((c) => c.length > 0),
        {
          message: 'All categories must be non-empty strings',
        },
      ),
  })
  .strict();

/**
 * Strict Warranty Policy Config Schema
 */
export const WarrantyPolicyConfigSchema = z
  .object({
    framesMonths: z
      .number()
      .positive('Frames warranty must be greater than 0 months'),
    lensesMonths: z
      .number()
      .positive('Lenses warranty must be greater than 0 months'),
    coversManufacturingDefects: z.boolean(),
    excludesScratchesFromWear: z.boolean(),
  })
  .strict();

/**
 * Strict Shipping Policy Config Schema
 */
export const ShippingPolicyConfigSchema = z
  .object({
    defaultCarrier: z.string().min(1, 'Default carrier is required'),
    standardDaysMin: z
      .number()
      .positive('Standard shipping minimum days must be greater than 0'),
    standardDaysMax: z
      .number()
      .positive('Standard shipping maximum days must be greater than 0'),
    expressDaysMin: z
      .number()
      .positive('Express shipping minimum days must be greater than 0'),
    expressDaysMax: z
      .number()
      .positive('Express shipping maximum days must be greater than 0'),
    freeShippingMinAmount: z
      .number()
      .min(0, 'Free shipping minimum amount must be at least 0'),
  })
  .refine(
    (data) => data.standardDaysMin <= data.standardDaysMax,
    'Standard shipping minimum days cannot be greater than maximum days',
  )
  .refine(
    (data) => data.expressDaysMin <= data.expressDaysMax,
    'Express shipping minimum days cannot be greater than maximum days',
  )
  .strict();

/**
 * Strict Prescription Policy Config Schema
 */
export const PrescriptionPolicyConfigSchema = z
  .object({
    maxPrescriptionAgeMonths: z
      .number()
      .positive('Max prescription age must be greater than 0 months'),
    requirePD: z.boolean(),
    allowHighPowerRange: z.boolean(),
  })
  .strict();

/**
 * Strict Cancellation Policy Config Schema
 */
export const CancellationPolicyConfigSchema = z
  .object({
    allowCancelReadyBeforeShip: z.boolean(),
    allowCancelPrescriptionBeforeProduction: z.boolean(),
    allowCancelPreorderBeforeSupplierConfirm: z.boolean(),
  })
  .strict();

/**
 * Strict Refund Policy Config Schema
 */
export const RefundPolicyConfigSchema = z
  .object({
    refundToOriginalMethodOnly: z.boolean(),
    expectedProcessingDaysMin: z
      .number()
      .positive('Expected processing minimum days must be greater than 0'),
    expectedProcessingDaysMax: z
      .number()
      .positive('Expected processing maximum days must be greater than 0'),
  })
  .refine(
    (data) => data.expectedProcessingDaysMin <= data.expectedProcessingDaysMax,
    'Expected processing minimum days cannot be greater than maximum days',
  )
  .strict();

/**
 * Strict Legal (Privacy/Terms) Policy Config Schema
 * Empty object but still validated
 */
export const LegalPolicyConfigSchema = z.object({}).strict();

/**
 * Map of policy type to its config schema
 */
const PolicyConfigSchemas = {
  return: ReturnPolicyConfigSchema,
  refund: RefundPolicyConfigSchema,
  warranty: WarrantyPolicyConfigSchema,
  shipping: ShippingPolicyConfigSchema,
  prescription: PrescriptionPolicyConfigSchema,
  cancellation: CancellationPolicyConfigSchema,
  privacy: LegalPolicyConfigSchema,
  terms: LegalPolicyConfigSchema,
};

/**
 * Get the config schema for a specific policy type
 */
export function getConfigSchema(type: PolicyType) {
  return PolicyConfigSchemas[type];
}

/**
 * Validate config based on policy type
 */
export function validateConfigForType(type: PolicyType, config: unknown) {
  const schema = getConfigSchema(type);
  return schema.safeParse(config);
}

/**
 * Base Policy Schema for common fields
 */
const BasePolicySchema = z.object({
  type: z.nativeEnum({
    return: 'return',
    refund: 'refund',
    warranty: 'warranty',
    shipping: 'shipping',
    prescription: 'prescription',
    cancellation: 'cancellation',
    privacy: 'privacy',
    terms: 'terms',
  }),
  title: z.string().min(1, 'Title is required'),
  summary: z
    .string()
    .min(1, 'Summary is required')
    .max(300, 'Summary must be at most 300 characters'),
  bodyPlainText: z.string().min(1, 'Body text is required'),
  bodyRichTextJson: z.unknown().optional(), // Rich text editor JSON output (truly dynamic)
  effectiveFrom: z.string().transform((str) => new Date(str)),
  config: z.unknown().optional(), // Will be validated based on type
});

/**
 * Schema for creating a policy
 * Validates config based on type
 */
export const CreatePolicySchema = BasePolicySchema.refine(
  (data: z.infer<typeof BasePolicySchema>) => {
    // Skip config validation if config is empty or not provided
    if (
      !data.config ||
      typeof data.config !== 'object' ||
      Object.keys(data.config).length === 0
    ) {
      return true;
    }

    // Config validation based on type
    const parsed = validateConfigForType(data.type as PolicyType, data.config);
    if (!parsed.success) {
      const error = parsed.error; // ZodError - only accessible in error branch
      // Store error details for later use (using a non-enumerable property)
      Object.defineProperty(data, 'configError', {
        value: error.format(),
        enumerable: false,
      });
      return false;
    }
    // After success check, parsed.data is accessible
    return true;
  },
  {
    message: 'Invalid config for the specified policy type',
    path: ['config'],
  },
);

/**
 * Schema for updating a policy
 * Similar to create but type is immutable
 */
export const UpdatePolicySchema = BasePolicySchema.partial().omit({
  type: true,
});

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
 * Validate a complete policy payload
 * Returns the validated data or throws formatted errors
 */
export function validatePolicyPayload(
  payload: unknown,
  type?: PolicyType,
): z.infer<typeof CreatePolicySchema> {
  // First, parse with base schema
  let baseData: z.infer<typeof CreatePolicySchema>;
  try {
    baseData = CreatePolicySchema.parse(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error('Validation failed');
      (validationError as unknown as Record<string, unknown>).errors =
        formatZodError(error);
      throw validationError;
    }
    throw error;
  }

  // Then validate config based on type
  if (baseData.config) {
    const policyType = (type || baseData.type) as PolicyType;
    const configParsed = validateConfigForType(policyType, baseData.config);

    if (!configParsed.success) {
      const error = configParsed.error; // ZodError - only accessible in error branch
      const validationError = new Error(
        `Invalid config for ${policyType} policy`,
      );
      (validationError as unknown as Record<string, unknown>).errors =
        formatZodError(error);
      throw validationError;
    }

    // Replace config with validated and transformed data
    // After the success check, configParsed is narrowed to SafeParseSuccess
    (baseData as Record<string, unknown>).config = configParsed.data;
  }

  return baseData;
}

// Type exports for TypeScript
export type CreatePolicyInput = z.infer<typeof CreatePolicySchema>;
export type UpdatePolicyInput = z.infer<typeof UpdatePolicySchema>;
