/**
 * Type guard utilities shared between frontend and backend
 */

// ============================================================================
// Primitive Type Guards
// ============================================================================

/**
 * Check if a value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Check if a value is a non-null object (including arrays)
 */
export function isObjectLike(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object';
}

/**
 * Check if a value is a string (and not empty)
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Check if a value is a valid number (not NaN)
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

/**
 * Check if a value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Check if a value is an array
 */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

// ============================================================================
// Array Guards
// ============================================================================

/**
 * Check if value is a non-empty array
 */
export function isNonEmptyArray<T = unknown>(value: unknown): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0;
}

// ============================================================================
// Utility Type Guards
// ============================================================================

/**
 * Check if value is null or undefined
 */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Check if value is NOT null or undefined
 */
export function isNotNil<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

/**
 * Check if a promise is fulfilled
 */
export function isFulfilled<T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> {
  return result.status === 'fulfilled';
}

/**
 * Check if a promise is rejected
 */
export function isRejected<T>(
  result: PromiseSettledResult<T>
): result is PromiseRejectedResult {
  return result.status === 'rejected';
}

// ============================================================================
// Enum Guards
// ============================================================================

/**
 * Create a type guard for enum values
 */
export function createEnumGuard<T extends Record<string, string | number>>(enumObj: T) {
  const validValues = new Set(Object.values(enumObj));

  return (value: unknown): value is T[keyof T] => {
    return validValues.has(value as T[keyof T]);
  };
}

// ============================================================================
// Assertion Functions
// ============================================================================

/**
 * Assert that a value is not null/undefined (for type narrowing)
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message ?? 'Expected value to be defined, but received null/undefined');
  }
}

/**
 * Assert that a condition is true
 */
export function assert(
  condition: boolean,
  message?: string
): asserts condition {
  if (!condition) {
    throw new Error(message ?? 'Assertion failed');
  }
}

/**
 * Assert that a value is of a specific type
 */
export function assertIs<T>(
  value: unknown,
  guard: (v: unknown) => v is T,
  message?: string
): asserts value is T {
  if (!guard(value)) {
    throw new Error(message ?? `Type assertion failed: value does not match expected type`);
  }
}
