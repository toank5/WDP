import * as React from "react"
import Button from "@mui/material/Button"
import { SxProps, Theme } from "@mui/material/styles"

/**
 * Button variants available in the design system
 */
export type ButtonVariant =
  | "default"
  | "primary"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost"
  | "link"

/**
 * Button sizes available
 */
export type ButtonSize = "default" | "sm" | "lg" | "icon"

/**
 * Props for the Button component
 * Extends MUI Button props with custom variants
 */
export interface ButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "variant" | "size"> {
  /**
   * Button variant style
   * @default "default"
   */
  variant?: ButtonVariant
  /**
   * Button size
   * @default "default"
   */
  size?: ButtonSize
  /**
   * Optional class name (for compatibility, uses sx prop instead)
   */
  className?: string
  /**
   * If true, render as a child component (for Link compatibility)
   */
  asChild?: boolean
  /**
   * Additional MUI sx prop for custom styling
   */
  sx?: SxProps<Theme>
}

/**
 * Map custom variant to MUI variant
 */
const getMuiVariant = (variant: ButtonVariant): React.ComponentProps<typeof Button>["variant"] => {
  switch (variant) {
    case "primary":
    case "secondary":
    case "destructive":
      return "contained"
    case "outline":
      return "outlined"
    case "ghost":
    case "link":
      return "text"
    default:
      return "contained"
  }
}

/**
 * Map custom variant to MUI color
 */
const getMuiColor = (variant: ButtonVariant): React.ComponentProps<typeof Button>["color"] => {
  switch (variant) {
    case "primary":
    case "default":
      return "primary"
    case "secondary":
      return "secondary"
    case "destructive":
      return "error"
    default:
      return "inherit"
  }
}

/**
 * Map custom size to MUI size
 */
const getMuiSize = (size: ButtonSize): React.ComponentProps<typeof Button>["size"] => {
  switch (size) {
    case "sm":
      return "small"
    case "lg":
      return "large"
    case "icon":
      return "medium"
    default:
      return "medium"
  }
}

/**
 * Custom Button component built on top of MUI Button
 * Provides consistent button styles across the application
 *
 * @example
 * ```tsx
 * <Button variant="primary">Click me</Button>
 * <Button variant="outline" size="sm">Small button</Button>
 * <Button variant="destructive">Delete</Button>
 * <Button variant="link">Learn more</Button>
 * ```
 */
const CustomButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      size = "default",
      className,
      sx,
      children,
      asChild = false,
      startIcon,
      endIcon,
      ...props
    },
    ref
  ) => {
    const muiVariant = getMuiVariant(variant)
    const muiColor = getMuiColor(variant)
    const muiSize = getMuiSize(size)

    // Build sx prop with custom styles for specific variants
    const buttonSx: SxProps<Theme> = {
      ...(variant === "destructive" && {
        backgroundColor: "error.main",
        color: "error.contrastText",
        "&:hover": {
          backgroundColor: "error.dark",
        },
      }),
      ...(variant === "ghost" && {
        color: "text.primary",
        "&:hover": {
          backgroundColor: "action.hover",
        },
      }),
      ...(variant === "link" && {
        color: "primary.main",
        textDecoration: "underline",
        textDecorationOffset: 4,
        padding: 0,
        minWidth: "auto",
        "&:hover": {
          textDecoration: "underline",
          backgroundColor: "transparent",
        },
      }),
      ...(size === "icon" && {
        minWidth: 36,
        width: 36,
        height: 36,
        padding: 0,
      }),
      ...sx,
    }

    return (
      <Button
        ref={ref}
        variant={muiVariant}
        color={muiColor}
        size={muiSize}
        startIcon={startIcon}
        endIcon={endIcon}
        sx={buttonSx}
        {...props}
      >
        {children}
      </Button>
    )
  }
)

CustomButton.displayName = "Button"

export { CustomButton as Button }

/**
 * Pre-configured button variants for convenience
 */
export const PrimaryButton: React.FC<Omit<ButtonProps, "variant">> = (props) => (
  <Button variant="primary" {...props} />
)

export const SecondaryButton: React.FC<Omit<ButtonProps, "variant">> = (props) => (
  <Button variant="secondary" {...props} />
)

export const DestructiveButton: React.FC<Omit<ButtonProps, "variant">> = (props) => (
  <Button variant="destructive" {...props} />
)

export const OutlineButton: React.FC<Omit<ButtonProps, "variant">> = (props) => (
  <Button variant="outline" {...props} />
)

export const GhostButton: React.FC<Omit<ButtonProps, "variant">> = (props) => (
  <Button variant="ghost" {...props} />
)

export const LinkButton: React.FC<Omit<ButtonProps, "variant">> = (props) => (
  <Button variant="link" {...props} />
)

/**
 * Icon button component for icon-only buttons
 * Named ButtonIcon to avoid conflict with MUI's IconButton
 */
export const ButtonIcon = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, "size">
>((props, ref) => <Button ref={ref} size="icon" {...props} />)

ButtonIcon.displayName = "ButtonIcon"

/**
 * Export as IconButton for backward compatibility
 * Note: This may conflict with MUI's IconButton, so prefer using ButtonIcon
 * or import IconButton directly from @mui/material
 */
export { ButtonIcon as IconButton }
