import * as React from "react"
import Skeleton, { SkeletonProps } from "@mui/material/Skeleton"
import { SxProps, Theme } from "@mui/material/styles"
import { Box, BoxProps } from "@mui/material"

/**
 * Props for the Skeleton component
 * Extends MUI Skeleton props with simplified interface
 */
export interface CustomSkeletonProps extends Omit<SkeletonProps, "variant"> {
  /**
   * Variant of the skeleton
   * @default "rectangular"
   */
  variant?: "rectangular" | "circular" | "text" | "rounded"
  /**
   * Optional class name (uses sx prop instead)
   */
  className?: string
  /**
   * Additional MUI sx prop for custom styling
   */
  sx?: SxProps<Theme>
}

/**
 * Map custom variant to MUI variant
 */
const getMuiVariant = (variant: CustomSkeletonProps["variant"]): SkeletonProps["variant"] => {
  switch (variant) {
    case "rounded":
      return "rounded"
    case "circular":
      return "circular"
    case "text":
      return "text"
    default:
      return "rectangular"
  }
}

/**
 * Skeleton component built on top of MUI Skeleton
 * Provides consistent loading placeholder styles across the application
 *
 * @example
 * ```tsx
 * <Skeleton />
 * <Skeleton variant="circular" width={40} height={40} />
 * <Skeleton variant="text" />
 * <Skeleton variant="rounded" width="100%" height={60} />
 * ```
 */
const CustomSkeleton = React.forwardRef<HTMLSpanElement, CustomSkeletonProps>(
  ({ variant = "rectangular", className, sx, animation = "pulse", width, height, ...props }, ref) => {
    const muiVariant = getMuiVariant(variant)

    const skeletonSx: SxProps<Theme> = {
      bgcolor: "grey.200",
      ...sx,
    }

    return (
      <Skeleton
        ref={ref}
        variant={muiVariant}
        animation={animation}
        width={width}
        height={height}
        sx={skeletonSx}
        {...props}
      />
    )
  }
)

CustomSkeleton.displayName = "Skeleton"

export { CustomSkeleton as Skeleton }

/**
 * Pre-configured skeleton variants for convenience
 */
export const RectangularSkeleton: React.FC<Omit<CustomSkeletonProps, "variant">> = (props) => (
  <Skeleton variant="rectangular" {...props} />
)

export const CircularSkeleton: React.FC<Omit<CustomSkeletonProps, "variant">> = (props) => (
  <Skeleton variant="circular" {...props} />
)

export const TextSkeleton: React.FC<Omit<CustomSkeletonProps, "variant">> = (props) => (
  <Skeleton variant="text" {...props} />
)

export const RoundedSkeleton: React.FC<Omit<CustomSkeletonProps, "variant">> = (props) => (
  <Skeleton variant="rounded" {...props} />
)

/**
 * Card skeleton component for loading card placeholders
 */
export interface CardSkeletonProps extends BoxProps {
  /**
   * Whether to show the avatar
   */
  showAvatar?: boolean
  /**
   * Number of text lines to show
   */
  lines?: number
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ showAvatar = false, lines = 3, sx, ...props }) => {
  return (
    <Box sx={{ p: 2, ...sx }} {...props}>
      {showAvatar && (
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" />
          </Box>
        </Box>
      )}
      <Skeleton variant="rectangular" width="100%" height={120} sx={{ mb: 1 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" width={i === lines - 1 ? "80%" : "100%"} sx={{ mb: 0.5 }} />
      ))}
    </Box>
  )
}

/**
 * List skeleton component for loading list placeholders
 */
export interface ListSkeletonProps extends BoxProps {
  /**
   * Number of items to show
   */
  items?: number
  /**
   * Whether to show avatar for each item
   */
  showAvatar?: boolean
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ items = 5, showAvatar = false, sx, ...props }) => {
  // Generate deterministic widths based on index
  const getWidths = () => {
    const widths: string[] = []
    for (let i = 0; i < items; i++) {
      widths.push(i % 3 === 0 ? "70%" : "90%")
    }
    return widths
  }

  const widths = React.useMemo(() => getWidths(), [items])

  return (
    <Box sx={sx} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "center", py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
          {showAvatar && <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />}
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={widths[i]} />
          </Box>
        </Box>
      ))}
    </Box>
  )
}

/**
 * Table skeleton component for loading table placeholders
 */
export interface TableSkeletonProps extends BoxProps {
  /**
   * Number of rows to show
   */
  rows?: number
  /**
   * Number of columns to show
   */
  columns?: number
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 4, sx, ...props }) => {
  // Generate deterministic widths for table cells
  const getCellWidths = () => {
    const widths: number[][] = []
    for (let i = 0; i < rows; i++) {
      const row: number[] = []
      for (let j = 0; j < columns; j++) {
        // Use (i + j) to create deterministic but varied widths
        row.push(40 + ((i + j) % 5) * 10)
      }
      widths.push(row)
    }
    return widths
  }

  const cellWidths = React.useMemo(() => getCellWidths(), [rows, columns])

  return (
    <Box sx={sx} {...props}>
      {/* Header */}
      <Box sx={{ display: "flex", borderBottom: "2px solid", borderColor: "divider", pb: 1, mb: 1 }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" width={80} sx={{ mr: 2 }} />
        ))}
      </Box>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <Box key={i} sx={{ display: "flex", py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} variant="text" width={cellWidths[i][j]} sx={{ mr: 2 }} />
          ))}
        </Box>
      ))}
    </Box>
  )
}

/**
 * Avatar skeleton component
 */
export const AvatarSkeleton: React.FC<Omit<SkeletonProps, "variant">> = (props) => (
  <Skeleton variant="circular" width={40} height={40} {...props} />
)

/**
 * Button skeleton component
 */
export const ButtonSkeleton: React.FC<Omit<SkeletonProps, "variant">> = ({ sx, ...props }) => (
  <Skeleton
    variant="rectangular"
    sx={{ width: 80, height: 36, borderRadius: 2, ...sx }}
    {...props}
  />
)

/**
 * Input skeleton component
 */
export const InputSkeleton: React.FC<Omit<SkeletonProps, "variant">> = (props) => (
  <Skeleton variant="rectangular" width="100%" height={40} {...props} />
)

/**
 * Typography skeleton components
 */
export const HeadingSkeleton: React.FC<Omit<SkeletonProps, "variant">> = (props) => (
  <Skeleton variant="text" width="40%" height={32} {...props} />
)

export const TitleSkeleton: React.FC<Omit<SkeletonProps, "variant">> = (props) => (
  <Skeleton variant="text" width="60%" height={28} {...props} />
)

export const ParagraphSkeleton: React.FC<Omit<SkeletonProps, "variant">> = ({ lines = 3, sx, ...props }) => (
  <Box sx={sx} {...props}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === lines - 1 ? "80%" : "100%"}
        sx={{ mb: 0.5 }}
      />
    ))}
  </Box>
)
