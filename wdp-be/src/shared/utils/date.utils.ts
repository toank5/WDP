/**
 * Date utility functions shared between frontend and backend
 */

/**
 * Format a date safely with locale options
 *
 * @param value - The date value to format (string, Date, or number)
 * @param format - Intl.DateTimeFormatOptions
 * @param locale - Locale string (default: 'vi-VN')
 * @param fallback - Fallback string if date is invalid (default: '--')
 * @returns Formatted date string or fallback
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
  const date = parseDate(value);
  try {
    return date.toLocaleString(locale, format);
  } catch {
    return fallback;
  }
}

/**
 * Format a date as a short date (day/month/year)
 *
 * @param dateInput - The date value to format
 * @param locale - Locale string (default: 'vi-VN')
 * @returns Formatted date string or '--'
 */
export function formatDateShort(
  dateInput?: string | Date,
  locale: string = 'vi-VN'
): string {
  if (!dateInput) {
    return '--';
  }

  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Safely parse a date from various input types
 *
 * @param value - The value to parse as a date
 * @param fallback - Fallback date if parsing fails (default: new Date())
 * @returns Parsed Date object or fallback
 */
export function parseDate(value: unknown, fallback: Date = new Date()): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'string' && value.length > 0) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }

  const timestamp = typeof value === 'number' ? value : Number(value);
  if (!Number.isNaN(timestamp)) {
    const date = new Date(timestamp);
    if (!Number.isNaN(date.getTime())) return date;
  }

  return fallback;
}

/**
 * Check if a value is a valid Date object
 *
 * @param value - The value to check
 * @returns True if value is a valid Date
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/**
 * Check if a value can be parsed into a valid Date
 *
 * @param value - The value to check
 * @returns True if value is a valid date string
 */
export function isDateString(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0) return false;

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 *
 * @param dateInput - The date value to compare
 * @returns Relative time string
 */
export function getRelativeTime(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
}
