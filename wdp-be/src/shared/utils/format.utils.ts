/**
 * Formatting utility functions shared between frontend and backend
 */

/**
 * Format currency for display
 *
 * @param value - The numeric value to format
 * @param currency - Currency code (default: 'VND')
 * @param locale - Locale for formatting (default: 'vi-VN')
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency: string = 'VND',
  locale: string = 'vi-VN'
): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return value.toString();
  }
}

/**
 * Format a number with thousand separators
 *
 * @param value - The numeric value to format
 * @param locale - Locale for formatting (default: 'vi-VN')
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  locale: string = 'vi-VN'
): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0';
  }

  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return value.toString();
  }
}

/**
 * Format a percentage
 *
 * @param value - The numeric value (0-100 or 0-1)
 * @param decimals - Number of decimal places (default: 0)
 * @param isDecimal - If true, value is 0-1, if false, value is 0-100 (default: false)
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  decimals: number = 0,
  isDecimal: boolean = false
): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0%';
  }

  const displayValue = isDecimal ? value * 100 : value;
  return `${displayValue.toFixed(decimals)}%`;
}

/**
 * Format a phone number for display (Vietnam format)
 *
 * @param phone - The phone number string
 * @returns Formatted phone number or original if invalid
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Check if it's a valid Vietnam phone number (10 or 11 digits)
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }

  return phone;
}

/**
 * Truncate text to a maximum length with ellipsis
 *
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns Truncated text or original if under limit
 */
export function truncateText(
  text: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalize the first letter of a string
 *
 * @param text - The text to capitalize
 * @returns Capitalized text
 */
export function capitalize(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convert a string to title case
 *
 * @param text - The text to convert
 * @returns Title cased text
 */
export function toTitleCase(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format a file size in bytes to human-readable format
 *
 * @param bytes - The file size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
