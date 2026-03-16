import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility for merging Tailwind CSS classes
 * NOTE: For MUI components, prefer using the `sx` prop instead
 * Import styles utilities from @/lib/styles for consistent MUI styling
 *
 * @example
 * ```tsx
 * // For MUI components (recommended)
 * import { sx } from '@/lib/styles'
 * <Box sx={sx.merge({ p: 2, color: 'primary.main' })} />
 *
 * // For HTML elements with Tailwind
 * <div className={cn('px-4 py-2', 'bg-blue-500')} />
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(dateInput?: string | Date): string {
  if (!dateInput) {
    return '--'
  }

  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Re-export MUI styling utilities for convenience
 * Use these for consistent Material UI component styling
 */
export { sx as muiSx, mergeSx, conditionalSx, responsive, presets } from './styles'

/**
 * Type for MUI sx prop
 */
export type { SxProps, SxValue } from './styles'
