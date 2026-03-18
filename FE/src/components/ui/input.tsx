import * as React from "react"
import TextField, { TextFieldProps } from "@mui/material/TextField"
import { SxProps, Theme } from "@mui/material/styles"

/**
 * Props for the Input component
 * Extends MUI TextField props with simplified interface
 */
export interface InputProps
  extends Omit<TextFieldProps, "variant" | "size"> {
  /**
   * Input size variant
   * @default "default"
   */
  size?: "sm" | "md" | "lg"
  /**
   * Optional class name (for compatibility, uses sx prop instead)
   */
  className?: string
  /**
   * Additional MUI sx prop for custom styling
   */
  sx?: SxProps<Theme>
}

/**
 * Map custom size to MUI size
 */
const getMuiSize = (size: InputProps["size"]): TextFieldProps["size"] => {
  switch (size) {
    case "sm":
      return "small"
    case "lg":
      return "medium"
    default:
      return "small" // Default to small for consistency with original design
  }
}

/**
 * Input component built on top of MUI TextField
 * Provides consistent input styles across the application
 *
 * @example
 * ```tsx
 * <Input placeholder="Enter text" />
 * <Input type="email" label="Email" />
 * <Input size="lg" fullWidth />
 * <Input error helperText="This field is required" />
 * ```
 */
const Input = React.forwardRef<HTMLDivElement, InputProps>(
  (
    {
      size = "md",
      className,
      sx,
      variant = "outlined",
      placeholder,
      label,
      error,
      helperText,
      disabled,
      required,
      type = "text",
      multiline,
      rows,
      maxRows,
      minRows,
      fullWidth,
      defaultValue,
      value,
      onChange,
      onBlur,
      onFocus,
      InputProps,
      inputProps,
      ...props
    },
    ref
  ) => {
    const muiSize = getMuiSize(size)

    const inputSx: SxProps<Theme> = {
      "& .MuiInputBase-root": {
        minHeight: size === "lg" ? 48 : size === "sm" ? 32 : 40,
        fontSize: size === "lg" ? "1rem" : size === "sm" ? "0.75rem" : "0.875rem",
      },
      "& .MuiInputBase-input": {
        py: size === "lg" ? 1.5 : size === "sm" ? 0.75 : 1,
      },
      ...sx,
    }

    return (
      <TextField
        ref={ref}
        variant={variant}
        size={muiSize}
        placeholder={placeholder}
        label={label}
        error={error}
        helperText={helperText}
        disabled={disabled}
        required={required}
        type={type}
        multiline={multiline}
        rows={rows}
        maxRows={maxRows}
        minRows={minRows}
        fullWidth={fullWidth}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        InputProps={InputProps}
        inputProps={inputProps}
        sx={inputSx}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }

/**
 * Pre-configured input variants for convenience
 */
export const SmallInput: React.FC<Omit<InputProps, "size">> = (props) => (
  <Input size="sm" {...props} />
)

export const LargeInput: React.FC<Omit<InputProps, "size">> = (props) => (
  <Input size="lg" {...props} />
)

/**
 * Textarea component for multiline text input
 */
export const Textarea = React.forwardRef<HTMLDivElement, Omit<InputProps, "multiline">>(
  (props, ref) => <Input ref={ref} multiline {...props} />
)

Textarea.displayName = "Textarea"
