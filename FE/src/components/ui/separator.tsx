import * as React from "react"
import Divider, { DividerProps } from "@mui/material/Divider"
import { SxProps, Theme } from "@mui/material/styles"

/**
 * Orientation of the separator
 */
export type SeparatorOrientation = "horizontal" | "vertical"

/**
 * Props for the Separator component
 * Extends MUI Divider props with simplified interface
 */
export interface SeparatorProps extends Omit<DividerProps, "orientation"> {
  /**
   * Orientation of the separator
   * @default "horizontal"
   */
  orientation?: SeparatorOrientation
  /**
   * Whether the separator is decorative (screen reader only)
   * @default true
   */
  decorative?: boolean
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
 * Separator component built on top of MUI Divider
 * Provides a consistent visual separator across the application
 *
 * @example
 * ```tsx
 * <Separator /> // Horizontal separator
 * <Separator orientation="vertical" sx={{ height: 24 }} /> // Vertical separator
 * ```
 */
const Separator = React.forwardRef<HTMLHRElement, SeparatorProps>(
  (
    {
      orientation = "horizontal",
      decorative = true,
      className,
      sx,
      role = decorative ? "none" : "separator",
      ...props
    },
    ref
  ) => {
    const separatorSx: SxProps<Theme> = {
      borderColor: "divider",
      ...sx,
    }

    return (
      <Divider
        ref={ref}
        orientation={orientation}
        role={role}
        sx={separatorSx}
        {...props}
      />
    )
  }
)

Separator.displayName = "Separator"

export { Separator }

/**
 * Pre-configured separator variants for convenience
 */
export const HorizontalSeparator: React.FC<Omit<SeparatorProps, "orientation">> = (props) => (
  <Separator orientation="horizontal" {...props} />
)

export const VerticalSeparator: React.FC<Omit<SeparatorProps, "orientation">> = (props) => (
  <Separator orientation="vertical" {...props} />
)
