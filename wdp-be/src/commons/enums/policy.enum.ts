export enum POLICY_TYPES {
  RETURN = 'return',
  REFUND = 'refund',
  WARRANTY = 'warranty',
  SHIPPING = 'shipping',
  PRESCRIPTION = 'prescription',
  CANCELLATION = 'cancellation',
  PRIVACY = 'privacy',
  TERMS = 'terms',
}

export type PolicyType =
  | 'return'
  | 'refund'
  | 'warranty'
  | 'shipping'
  | 'prescription'
  | 'cancellation'
  | 'privacy'
  | 'terms';
