import { COLORS } from '../constants'

// Price formatter for VND
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

// Date formatter
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// Relative time formatter
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minutes ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hours ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} days ago`
  } else {
    return formatDate(dateString)
  }
}

// Get image URL from API response
export const getImageUrl = (url: string | undefined, apiBaseUrl: string): string | undefined => {
  if (!url) return undefined
  // If URL already starts with http://, https://, or data:, return as-is
  if (/^https?:\/\//.test(url) || url.startsWith('data:')) {
    return url
  }
  // Otherwise, prepend API base URL
  return `${apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate phone number (Vietnam)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/
  return phoneRegex.test(phone)
}

// Validate password
export const isValidPassword = (password: string): boolean => {
  // At least 6 characters, at least 1 letter and 1 number
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/
  return passwordRegex.test(password)
}

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// Capitalize first letter
export const capitalizeFirst = (text: string): string => {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Get status color
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    pending: COLORS.warning,
    processing: COLORS.info,
    shipping: COLORS.primary,
    delivered: COLORS.success,
    cancelled: COLORS.error,
    refunded: COLORS.grey[600],
  }
  return statusColors[status] || COLORS.grey[500]
}

// Get status label
export const getStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    shipping: 'Shipping',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  }
  return statusLabels[status] || status
}

// Generate random ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15)
}

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Sleep function for testing
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Safely parse JSON
export const safeJsonParse = <T = any>(json: string, defaultValue: T): T => {
  try {
    return JSON.parse(json)
  } catch {
    return defaultValue
  }
}

// Check if object is empty
export const isEmpty = (obj: object): boolean => {
  return Object.keys(obj).length === 0
}

// Check if value is null or undefined
export const isNil = (value: any): value is null | undefined => {
  return value === null || value === undefined
}
