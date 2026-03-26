/**
 * Common type definitions shared across the application
 */

/**
 * API Validation Error
 */
export interface ValidationError {
  path: string;
  message: string;
}

/**
 * API Error Response
 */
export interface ApiError {
  message: string;
  errors?: Record<string, string>;
  statusCode?: number;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  statusCode?: number;
  message: string;
  data?: T;
  error?: string;
  metadata?: T;
}

/**
 * Pagination Options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}
