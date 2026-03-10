/**
 * Type Guard Utilities
 *
 * This file contains type-safe guards for common runtime type checks.
 * Use these to validate data from API responses, user input, or any external source.
 */

// ============================================================================
// Primitive Type Guards
// ============================================================================

/**
 * Check if a value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Check if a value is a non-null object (including arrays)
 */
export function isObjectLike(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object'
}

/**
 * Check if a value is a string (and not empty)
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

/**
 * Check if a value is a valid number (not NaN)
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value)
}

/**
 * Check if a value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

/**
 * Check if a value is an array
 */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value)
}

// ============================================================================
// Date Type Guards
// ============================================================================

/**
 * Check if a value is a valid Date object
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime())
}

/**
 * Check if a value can be parsed into a valid Date
 */
export function isDateString(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0) return false

  const date = new Date(value)
  return !Number.isNaN(date.getTime())
}

/**
 * Safely parse a date from various input types
 */
export function parseDate(value: unknown, fallback: Date = new Date()): Date {
  if (isValidDate(value)) return value
  if (isDateString(value)) return new Date(value)

  const timestamp = isValidNumber(value) ? value : Number(value)
  if (!Number.isNaN(timestamp)) {
    const date = new Date(timestamp)
    if (isValidDate(date)) return date
  }

  return fallback
}

/**
 * Format a date safely, returning fallback string if invalid
 */
export function formatDateTime(
  value: unknown,
  format: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  },
  locale: string = 'vi-VN',
  fallback: string = '--'
): string {
  const date = parseDate(value)
  try {
    return date.toLocaleString(locale, format)
  } catch {
    return fallback
  }
}

// ============================================================================
// API Response Type Guards
// ============================================================================

/**
 * Standard API response structure
 */
interface ApiResponse<T = unknown> {
  statusCode?: number
  message?: string
  success?: boolean
  data?: T
  metadata?: T
  errors?: Array<{ path: string; message: string }> | Record<string, string>
}

/**
 * Check if response is a valid API response
 */
export function isApiResponse(value: unknown): value is ApiResponse {
  if (!isObject(value)) return false

  const response = value as Partial<ApiResponse>

  return (
    ('success' in response) ||
    ('data' in response) ||
    ('metadata' in response) ||
    ('statusCode' in response)
  )
}

/**
 * Check if API response was successful
 */
export function isSuccessfulResponse(value: unknown): value is ApiResponse {
  if (!isApiResponse(value)) return false
  return value.success === true || (value.statusCode !== undefined && value.statusCode >= 200 && value.statusCode < 300)
}

/**
 * Check if API response has data in the standard format
 */
export function hasData<T = unknown>(value: unknown, dataKey: 'data' | 'metadata' = 'data'): value is ApiResponse & { [K in 'data' | 'metadata']: T } {
  if (!isApiResponse(value)) return false
  return value[dataKey] !== undefined
}

/**
 * Safely unwrap API response payload
 */
export function unwrapApiPayload<T>(raw: unknown): T {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid API response: response is not an object')
  }

  const response = raw as Partial<ApiResponse<T>>

  // Check for success + data pattern
  if (response.success === true && response.data !== undefined) {
    return response.data as T
  }

  // Check for metadata pattern
  if (response.metadata !== undefined) {
    return response.metadata as T
  }

  // Check for data pattern
  if (response.data !== undefined) {
    return response.data as T
  }

  throw new Error('No valid data found in API response')
}

/**
 * Safely unwrap API response with fallback
 */
export function unwrapApiPayloadOrDefault<T>(raw: unknown, defaultValue: T): T {
  try {
    return unwrapApiPayload<T>(raw)
  } catch {
    return defaultValue
  }
}

// ============================================================================
// Object Property Guards
// ============================================================================

/**
 * Check if an object has a specific property
 */
export function hasProperty<K extends PropertyKey>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  if (!isObject(obj)) return false
  return key in obj
}

/**
 * Check if an object has all specified properties
 */
export function hasProperties<K extends PropertyKey>(
  obj: unknown,
  keys: readonly K[]
): obj is Record<K, unknown> {
  if (!isObject(obj)) return false
  return keys.every(key => key in obj)
}

/**
 * Safely get a nested property value
 */
export function getNestedProperty<T = unknown>(
  obj: unknown,
  path: string[],
  defaultValue?: T
): T | undefined {
  if (!isObject(obj)) return defaultValue

  let current: unknown = obj
  for (const key of path) {
    if (isObject(current) && key in current) {
      current = current[key]
    } else {
      return defaultValue
    }
  }

  return current as T | undefined
}

// ============================================================================
// String/Number Conversion Guards
// ============================================================================

/**
 * Safely convert a value to a number
 */
export function toNumber(value: unknown, defaultValue: number = 0): number {
  if (isValidNumber(value)) return value

  if (isNonEmptyString(value)) {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) return parsed
  }

  return defaultValue
}

/**
 * Safely convert a value to a string
 */
export function toString(value: unknown, defaultValue: string = ''): string {
  if (value === null || value === undefined) return defaultValue
  return String(value)
}

/**
 * Safely convert a string to a boolean
 */
export function toBoolean(value: unknown, defaultValue: boolean = false): boolean {
  if (isBoolean(value)) return value

  if (isNonEmptyString(value)) {
    const lower = value.toLowerCase()
    if (lower === 'true' || lower === '1' || lower === 'yes') return true
    if (lower === 'false' || lower === '0' || lower === 'no') return false
  }

  if (isValidNumber(value)) {
    return value !== 0
  }

  return defaultValue
}

// ============================================================================
// Array Guards
// ============================================================================

/**
 * Check if value is a non-empty array
 */
export function isNonEmptyArray<T = unknown>(value: unknown): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0
}

/**
 * Check if all items in array pass a predicate
 */
export function allPass<T>(
  arr: readonly T[],
  predicate: (item: T) => boolean
): arr is readonly [T, ...T[]] & { readonly __brand: 'all-pass' } {
  return arr.length > 0 && arr.every(predicate)
}

/**
 * Check if any items in array pass a predicate
 */
export function somePass<T>(
  arr: readonly T[],
  predicate: (item: T) => boolean
): boolean {
  return arr.some(predicate)
}

// ============================================================================
// Enum Guards
// ============================================================================

/**
 * Create a type guard for enum values
 */
export function createEnumGuard<T extends Record<string, string | number>>(enumObj: T) {
  const validValues = new Set(Object.values(enumObj))

  return (value: unknown): value is T[keyof T] => {
    return validValues.has(value as T[keyof T])
  }
}

// ============================================================================
// Utility Type Guards
// ============================================================================

/**
 * Check if value is null or undefined
 */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

/**
 * Check if value is NOT null or undefined
 */
export function isNotNil<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}

/**
 * Check if a promise is fulfilled
 */
export function isFulfilled<T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> {
  return result.status === 'fulfilled'
}

/**
 * Check if a promise is rejected
 */
export function isRejected<T>(
  result: PromiseSettledResult<T>
): result is PromiseRejectedResult {
  return result.status === 'rejected'
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
    throw new Error(message ?? 'Expected value to be defined, but received null/undefined')
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
    throw new Error(message ?? 'Assertion failed')
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
    throw new Error(message ?? `Type assertion failed: value does not match expected type`)
  }
}

// ============================================================================
// Brand Types for Runtime Validation
// ============================================================================

/**
 * Create a branded type for validated values
 */
export type Validated<T, B extends string> = T & { __validated: B }

/**
 * Type guard for branded validated types
 */
export function isValidated<T, B extends string>(
  value: T,
  brand: B
): value is Validated<T, B> {
  return typeof value === 'object' && value !== null && '__validated' in (value as object) && (value as any).__validated === brand
}

// ============================================================================
// Export all type guards
// ============================================================================

export const TypeGuards = {
  isObject,
  isObjectLike,
  isNonEmptyString,
  isValidNumber,
  isBoolean,
  isArray,
  isValidDate,
  isDateString,
  parseDate,
  formatDateTime,
  isApiResponse,
  isSuccessfulResponse,
  hasData,
  unwrapApiPayload,
  unwrapApiPayloadOrDefault,
  hasProperty,
  hasProperties,
  getNestedProperty,
  toNumber,
  toString,
  toBoolean,
  isNonEmptyArray,
  allPass,
  somePass,
  createEnumGuard,
  isNil,
  isNotNil,
  isFulfilled,
  isRejected,
  assertDefined,
  assert,
  assertIs,
  isValidated,
}
