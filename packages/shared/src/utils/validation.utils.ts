/**
 * Validation utility functions shared between frontend and backend
 */

/**
 * Check if a string is a valid email address
 *
 * @param email - The email string to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if a string is a valid phone number (Vietnam)
 *
 * @param phone - The phone string to validate
 * @returns True if valid phone format
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const phoneRegex = /^(\+84|0)[1-9]\d{8,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Check if a string meets minimum length requirement
 *
 * @param value - The string to check
 * @param minLength - Minimum required length
 * @returns True if meets minimum length
 */
export function hasMinLength(value: string, minLength: number): boolean {
  return typeof value === 'string' && value.length >= minLength;
}

/**
 * Check if a string meets maximum length requirement
 *
 * @param value - The string to check
 * @param maxLength - Maximum allowed length
 * @returns True if under maximum length
 */
export function hasMaxLength(value: string, maxLength: number): boolean {
  return typeof value === 'string' && value.length <= maxLength;
}

/**
 * Check if a value is within a numeric range
 *
 * @param value - The number to check
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns True if within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return typeof value === 'number' && value >= min && value <= max;
}

/**
 * Check if a string contains only letters and spaces
 *
 * @param value - The string to check
 * @returns True if only letters and spaces
 */
export function isAlphaOnly(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const alphaRegex = /^[a-zA-Z\s'-]+$/;
  return alphaRegex.test(value);
}

/**
 * Check if a string is a valid URL
 *
 * @param url - The URL string to validate
 * @returns True if valid URL format
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    // Use a simple URL regex pattern that works in both Node.js and browser
    const urlPattern = /^https?:\/\/.+/i;
    return urlPattern.test(url);
  } catch {
    return false;
  }
}

/**
 * Sanitize a string to prevent XSS attacks
 *
 * @param str - The string to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(str: string): string {
  if (!str || typeof str !== 'string') return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
  };
  return str.replace(/[&<>"'/]/g, char => map[char]);
}
