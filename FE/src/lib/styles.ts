import { SxProps, Theme } from "@mui/material/styles"
import { CSSProperties } from "react"

/**
 * Centralized styling utility for Material UI components
 * Provides a consistent way to apply styles using the sx prop
 *
 * This utility replaces the need for clsx/tailwind-merge (cn utility)
 * when working with MUI components.
 */

/**
 * Type for valid sx values
 */
export type SxValue = SxProps<Theme>

/**
 * Merge multiple sx props into one
 * Later values override earlier values for conflicting properties
 *
 * @example
 * ```tsx
 * const mergedSx = mergeSx(
 *   { p: 2, color: 'primary.main' },
 *   { color: 'secondary.main', bgcolor: 'background.paper' }
 * )
 * // Result: { p: 2, color: 'secondary.main', bgcolor: 'background.paper' }
 * ```
 */
export function mergeSx(...sxProps: SxValue[]): SxProps<Theme> {
  return sxProps.reduce<SxProps<Theme>>((acc, sx) => {
    if (Array.isArray(sx)) {
      return mergeSx(acc, ...sx)
    }
    if (typeof sx === "function") {
      return { ...acc, ...sx }
    }
    return { ...acc, ...sx }
  }, {})
}

/**
 * Create conditional sx props based on conditions
 *
 * @example
 * ```tsx
 * const buttonSx = conditionalSx({
 *   base: { p: 2 },
 *   variants: {
 *     primary: { bgcolor: 'primary.main' },
 *     secondary: { bgcolor: 'secondary.main' }
 *   }
 * })
 *
 * <Button sx={buttonSx({ variant: 'primary' })} />
 * ```
 */
export interface ConditionalSxOptions<T extends string = string> {
  /**
   * Base styles that always apply
   */
  base?: SxProps<Theme>
  /**
   * Variant styles
   */
  variants?: Record<T, SxProps<Theme>>
  /**
   * Compound conditions (combinations of variants)
   */
  compounds?: Array<{
    when: Record<T, string>
    styles: SxProps<Theme>
  }>
}

export function conditionalSx<T extends string>(options: ConditionalSxOptions<T>) {
  return (props: Record<T, string>): SxProps<Theme> => {
    let result: SxProps<Theme> = { ...options.base }

    // Apply variant styles
    if (options.variants) {
      Object.entries(props).forEach(([key, value]) => {
        if (key in options.variants!) {
          const variantStyles = options.variants![key as T][value as T]
          if (variantStyles) {
            result = mergeSx(result, variantStyles)
          }
        }
      })
    }

    // Apply compound conditions
    if (options.compounds) {
      options.compounds.forEach(({ when, styles }) => {
        const matches = Object.entries(when).every(
          ([key, value]) => props[key as T] === value
        )
        if (matches) {
          result = mergeSx(result, styles)
        }
      })
    }

    return result
  }
}

/**
 * Create responsive sx props
 * Provides breakpoints-aware styles
 *
 * @example
 * ```tsx
 * const responsiveSx = responsive({
 *   xs: { fontSize: '0.75rem' },
 *   sm: { fontSize: '0.875rem' },
 *   md: { fontSize: '1rem' },
 * })
 * ```
 */
export interface ResponsiveOptions {
  xs?: SxProps<Theme>
  sm?: SxProps<Theme>
  md?: SxProps<Theme>
  lg?: SxProps<Theme>
  xl?: SxProps<Theme>
}

export function responsive(options: ResponsiveOptions): SxProps<Theme> {
  const result: SxProps<Theme> = {}

  Object.entries(options).forEach(([breakpoint, styles]) => {
    if (styles) {
      result[breakpoint as keyof typeof result] = styles
    }
  })

  return result
}

/**
 * Common style presets for quick styling
 */
export const presets = {
  /**
   * Center content both horizontally and vertically
   */
  center: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as SxProps<Theme>,

  /**
   * Flex row with gap
   */
  flexRow: (gap = 1) => ({
    display: "flex",
    flexDirection: "row" as const,
    gap,
  }),

  /**
   * Flex column with gap
   */
  flexCol: (gap = 1) => ({
    display: "flex",
    flexDirection: "column" as const,
    gap,
  }),

  /**
   * Full width and height
   */
  fullSize: {
    width: "100%",
    height: "100%",
  } as SxProps<Theme>,

  /**
   * Absolute positioning covering parent
   */
  cover: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  /**
   * Visually hidden but accessible
   */
  visuallyHidden: {
    position: "absolute" as const,
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap" as const,
    borderWidth: 0,
  },

  /**
   * No scrollbars
   */
  noScroll: {
    overflow: "hidden" as const,
    "-ms-overflow-style": "none" as CSSProperties["msOverflowStyle"],
    scrollbarWidth: "none" as CSSProperties["scrollbarWidth"],
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },

  /**
   * Text truncation with ellipsis
   */
  truncate: {
    overflow: "hidden" as const,
    textOverflow: "ellipsis" as const,
    whiteSpace: "nowrap" as const,
  },

  /**
   * Multi-line text truncation
   */
  lineClamp: (lines: number) => ({
    display: "-webkit-box" as CSSProperties["display"],
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical" as CSSProperties["WebkitBoxOrient"],
    overflow: "hidden" as const,
  }),

  /**
   * Reset button styles
   */
  resetButton: {
    background: "none" as const,
    border: "none",
    padding: 0,
    margin: 0,
    cursor: "pointer" as const,
    font: "inherit",
    color: "inherit",
    "&:focus": {
      outline: "none",
    },
  },

  /**
   * Card elevation
   */
  card: {
    borderRadius: 2,
    boxShadow: 1,
    p: 2,
  } as SxProps<Theme>,

  /**
   * Section container
   */
  section: {
    py: 4,
    px: 2,
  } as SxProps<Theme>,

  /**
   * Content container with max width
   */
  container: {
    maxWidth: "lg",
    mx: "auto",
    px: 2,
  } as SxProps<Theme>,
}

/**
 * Spacing utilities for consistent spacing
 */
export const spacing = {
  /**
   * Padding utilities
   */
  p: (value: number | string) => ({ p: value }),
  px: (value: number | string) => ({ px: value }),
  py: (value: number | string) => ({ py: value }),
  pt: (value: number | string) => ({ pt: value }),
  pr: (value: number | string) => ({ pr: value }),
  pb: (value: number | string) => ({ pb: value }),
  pl: (value: number | string) => ({ pl: value }),

  /**
   * Margin utilities
   */
  m: (value: number | string) => ({ m: value }),
  mx: (value: number | string) => ({ mx: value }),
  my: (value: number | string) => ({ my: value }),
  mt: (value: number | string) => ({ mt: value }),
  mr: (value: number | string) => ({ mr: value }),
  mb: (value: number | string) => ({ mb: value }),
  ml: (value: number | string) => ({ ml: value }),

  /**
   * Gap utilities
   */
  gap: (value: number | string) => ({ gap: value }),
}

/**
 * Color utilities for theme-aware colors
 */
export const colors = {
  /**
   * Background colors
   */
  bg: {
    paper: (theme: Theme) => theme.palette.background.paper,
    default: (theme: Theme) => theme.palette.background.default,
  },

  /**
   * Text colors
   */
  text: {
    primary: (theme: Theme) => theme.palette.text.primary,
    secondary: (theme: Theme) => theme.palette.text.secondary,
    disabled: (theme: Theme) => theme.palette.text.disabled,
  },

  /**
   * Primary colors
   */
  primary: {
    main: (theme: Theme) => theme.palette.primary.main,
    light: (theme: Theme) => theme.palette.primary.light,
    dark: (theme: Theme) => theme.palette.primary.dark,
    contrastText: (theme: Theme) => theme.palette.primary.contrastText,
  },

  /**
   * Secondary colors
   */
  secondary: {
    main: (theme: Theme) => theme.palette.secondary.main,
    light: (theme: Theme) => theme.palette.secondary.light,
    dark: (theme: Theme) => theme.palette.secondary.dark,
    contrastText: (theme: Theme) => theme.palette.secondary.contrastText,
  },

  /**
   * Error colors
   */
  error: {
    main: (theme: Theme) => theme.palette.error.main,
    light: (theme: Theme) => theme.palette.error.light,
    dark: (theme: Theme) => theme.palette.error.dark,
  },

  /**
   * Warning colors
   */
  warning: {
    main: (theme: Theme) => theme.palette.warning.main,
    light: (theme: Theme) => theme.palette.warning.light,
    dark: (theme: Theme) => theme.palette.warning.dark,
  },

  /**
   * Success colors
   */
  success: {
    main: (theme: Theme) => theme.palette.success.main,
    light: (theme: Theme) => theme.palette.success.light,
    dark: (theme: Theme) => theme.palette.success.dark,
  },

  /**
   * Info colors
   */
  info: {
    main: (theme: Theme) => theme.palette.info.main,
    light: (theme: Theme) => theme.palette.info.light,
    dark: (theme: Theme) => theme.palette.info.dark,
  },

  /**
   * Divider color
   */
  divider: (theme: Theme) => theme.palette.divider,
}

/**
 * Typography utilities
 */
export const typography = {
  /**
   * Font size utilities
   */
  fontSize: {
    xs: (theme: Theme) => theme.typography.pxToRem(12),
    sm: (theme: Theme) => theme.typography.pxToRem(14),
    base: (theme: Theme) => theme.typography.pxToRem(16),
    lg: (theme: Theme) => theme.typography.pxToRem(18),
    xl: (theme: Theme) => theme.typography.pxToRem(20),
    "2xl": (theme: Theme) => theme.typography.pxToRem(24),
    "3xl": (theme: Theme) => theme.typography.pxToRem(30),
    "4xl": (theme: Theme) => theme.typography.pxToRem(36),
  },

  /**
   * Font weight utilities
   */
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  /**
   * Line height utilities
   */
  lineHeight: {
    none: 1,
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
}

/**
 * Border radius utilities
 */
export const borderRadius = {
  none: 0,
  sm: (theme: Theme) => theme.shape.borderRadius / 2,
  md: (theme: Theme) => theme.shape.borderRadius,
  lg: (theme: Theme) => theme.shape.borderRadius * 1.5,
  xl: (theme: Theme) => theme.shape.borderRadius * 2,
  full: 9999,
}

/**
 * Transition utilities
 */
export const transitions = {
  /**
   * Standard transition
   */
  default: {
    transition: (theme: Theme) =>
      theme.transitions.create(["all"], {
        duration: theme.transitions.duration.standard,
      }),
  },

  /**
   * Fast transition
   */
  fast: {
    transition: (theme: Theme) =>
      theme.transitions.create(["all"], {
        duration: theme.transitions.duration.shorter,
      }),
  },

  /**
   * Slow transition
   */
  slow: {
    transition: (theme: Theme) =>
      theme.transitions.create(["all"], {
        duration: theme.transitions.duration.complex,
      }),
  },

  /**
   * Create custom transition
   */
  create: (
    props: string[] = ["all"],
    options?: { duration?: number; easing?: string }
  ) => ({
    transition: (theme: Theme) =>
      theme.transitions.create(props, {
        duration: options?.duration ?? theme.transitions.duration.standard,
        easing: options?.easing ?? theme.transitions.easing.easeInOut,
      }),
  }),
}

/**
 * Z-index utilities
 */
export const zIndex = {
  mobileStepper: 0,
  appBar: 1100,
  drawer: 1200,
  modal: 1300,
  snackbar: 1400,
  tooltip: 1500,
}

/**
 * Display utilities
 */
export const display = {
  none: { display: "none" as const },
  block: { display: "block" as const },
  inline: { display: "inline" as const },
  inlineBlock: { display: "inline-block" as const },
  flex: { display: "flex" as const },
  inlineFlex: { display: "inline-flex" as const },
  grid: { display: "grid" as const },
  hidden: {
    display: "none" as const,
  },
}

/**
 * Position utilities
 */
export const position = {
  static: { position: "static" as const },
  relative: { position: "relative" as const },
  absolute: { position: "absolute" as const },
  fixed: { position: "fixed" as const },
  sticky: { position: "sticky" as const },
}

/**
 * Overflow utilities
 */
export const overflow = {
  auto: { overflow: "auto" as const },
  hidden: { overflow: "hidden" as const },
  visible: { overflow: "visible" as const },
  scroll: { overflow: "scroll" as const },
  xAuto: { overflowX: "auto" as const },
  xHidden: { overflowX: "hidden" as const },
  yAuto: { overflowY: "auto" as const },
  yHidden: { overflowY: "hidden" as const },
}

/**
 * Helper to create sx prop from conditional values
 * Useful for conditional styling without ternary operators
 *
 * @example
 * ```tsx
 * <Box sx={sxWhen(isActive, { bgcolor: 'primary.main' })} />
 * ```
 */
export function sxWhen(condition: unknown, sx: SxProps<Theme>): SxProps<Theme> {
  return condition ? sx : {}
}

/**
 * Helper to create sx prop from multiple conditions
 * First matching condition's styles are applied
 *
 * @example
 * ```tsx
 * <Box sx={sxSwitch(
 *   isActive && { bgcolor: 'primary.main' },
 *   isDisabled && { bgcolor: 'action.disabled' },
 *   { bgcolor: 'background.paper' }
 * )} />
 * ```
 */
type SwitchCase = [unknown] | [unknown, SxProps<Theme>];

export function sxSwitch(...cases: SwitchCase[]): SxProps<Theme> {
  for (const item of cases) {
    if (Array.isArray(item) && item.length > 1) {
      if (item[0]) return item[1]
    }
  }
  return {}
}

/**
 * Export all utilities as a single object for convenience
 */
export const sx = {
  merge: mergeSx,
  conditional: conditionalSx,
  responsive,
  when: sxWhen,
  switch: sxSwitch,
  presets,
  spacing,
  colors,
  typography,
  borderRadius,
  transitions,
  zIndex,
  display,
  position,
  overflow,
}

/**
 * Default export for convenience
 */
export default sx
