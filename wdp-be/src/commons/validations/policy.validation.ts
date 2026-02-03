import { z } from 'zod';
import { POLICY_TYPES } from '../enums/policy.enum';

const ReturnPolicyConfigSchema = z.object({
  returnWindowDays: z.object({
    framesOnly: z.number().positive(),
    prescriptionGlasses: z.number().positive(),
    contactLenses: z.number().positive(),
  }),
  restockingFeePercent: z.number().min(0).max(100),
  customerPaysReturnShipping: z.boolean(),
  nonReturnableCategories: z.array(z.string()),
});

const WarrantyPolicyConfigSchema = z.object({
  framesMonths: z.number().positive(),
  lensesMonths: z.number().positive(),
  coversManufacturingDefects: z.boolean(),
  excludesScratchesFromWear: z.boolean(),
});

const ShippingPolicyConfigSchema = z.object({
  defaultCarrier: z.string(),
  standardDaysMin: z.number().positive(),
  standardDaysMax: z.number().positive(),
  expressDaysMin: z.number().positive(),
  expressDaysMax: z.number().positive(),
  freeShippingMinAmount: z.number().min(0),
});

const PrescriptionPolicyConfigSchema = z.object({
  maxPrescriptionAgeMonths: z.number().positive(),
  requirePD: z.boolean(),
  allowHighPowerRange: z.boolean(),
});

const CancellationPolicyConfigSchema = z.object({
  allowCancelReadyBeforeShip: z.boolean(),
  allowCancelPrescriptionBeforeProduction: z.boolean(),
  allowCancelPreorderBeforeSupplierConfirm: z.boolean(),
});

const RefundPolicyConfigSchema = z.object({
  refundToOriginalMethodOnly: z.boolean(),
  expectedProcessingDaysMin: z.number().positive(),
  expectedProcessingDaysMax: z.number().positive(),
});

const LegalPolicyConfigSchema = z.object({
  lastReviewedDate: z.string().optional(),
});

const BasePolicySchema = z.object({
  type: z.nativeEnum(POLICY_TYPES),
  title: z.string().min(1),
  summary: z.string().min(1).max(300),
  bodyPlainText: z.string().min(1),
  bodyRichTextJson: z.any().optional(),
  effectiveFrom: z.string().transform((str) => new Date(str)),
  config: z.record(z.string(), z.any()).optional().default({}),
});

export const CreatePolicySchema = BasePolicySchema.refine(
  (data: any) => {
    // Skip config validation if config is empty or not provided
    if (!data.config || Object.keys(data.config).length === 0) {
      return true;
    }

    // Config validation based on type
    if (data.type === 'return') {
      return ReturnPolicyConfigSchema.safeParse(data.config).success;
    }
    if (data.type === 'warranty') {
      return WarrantyPolicyConfigSchema.safeParse(data.config).success;
    }
    if (data.type === 'shipping') {
      return ShippingPolicyConfigSchema.safeParse(data.config).success;
    }
    if (data.type === 'prescription') {
      return PrescriptionPolicyConfigSchema.safeParse(data.config).success;
    }
    if (data.type === 'cancellation') {
      return CancellationPolicyConfigSchema.safeParse(data.config).success;
    }
    if (data.type === 'refund') {
      return RefundPolicyConfigSchema.safeParse(data.config).success;
    }
    return true;
  },
  {
    message: 'Invalid config for the specified policy type',
    path: ['config'],
  },
);

export const UpdatePolicySchema = BasePolicySchema.partial()
  .omit({
    type: true,
  })
  .refine(
    (data: any) => {
      // NOTE: We cannot validate config during update without the 'type' field
      // since the type is omitted in UpdatePolicySchema.
      // If validation is needed, the type would need to be passed or fetched.
      return true;
    },
    {
      message: 'Invalid config for the specified policy type',
      path: ['config'],
    },
  );
