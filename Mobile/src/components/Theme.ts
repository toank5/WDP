import { MD3DarkTheme, MD3LightTheme, adaptNavigationTheme } from 'react-native-paper'
import { colors as designColors } from '../design/tokens'

// Define custom colors based on WDP FE colors - Blue-purple theme
export const COLORS = {
  primary: designColors.primary,
  primaryDark: '#1d4ed8',
  primaryLight: '#93c5fd',
  secondary: designColors.secondary,
  secondaryDark: '#6d28d9',
  secondaryLight: '#c4b5fd',
  success: designColors.success,
  error: designColors.error,
  warning: designColors.warning,
  info: designColors.info,
  surface: designColors.surface,
  onSurface: designColors.text,
  onSurfaceDisabled: designColors.textMuted,
  background: designColors.background,
  border: designColors.border,
  skeleton: '#f1f5f9',
}

// Light theme
const lightTheme = {
  ...MD3LightTheme,
  roundness: 12,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    primaryContainer: COLORS.primaryLight,
    secondary: COLORS.secondary,
    secondaryContainer: COLORS.secondaryLight,
    success: COLORS.success,
    error: COLORS.error,
    warning: COLORS.warning,
    info: COLORS.info,
    surface: COLORS.surface,
    onSurface: COLORS.onSurface,
    onSurfaceDisabled: COLORS.onSurfaceDisabled,
    background: COLORS.background,
    outline: COLORS.border,
    skeleton: COLORS.skeleton,
  },
  fonts: {
    ...MD3LightTheme.fonts,
    displayLarge: { ...MD3LightTheme.fonts.displayLarge, fontWeight: '700' },
    headlineLarge: { ...MD3LightTheme.fonts.headlineLarge, fontWeight: '700' },
    titleLarge: { ...MD3LightTheme.fonts.titleLarge, fontWeight: '700' },
    titleMedium: { ...MD3LightTheme.fonts.titleMedium, fontWeight: '600' },
    bodyLarge: { ...MD3LightTheme.fonts.bodyLarge, fontSize: 15, lineHeight: 22 },
    bodyMedium: { ...MD3LightTheme.fonts.bodyMedium, fontSize: 14, lineHeight: 20 },
    labelLarge: { ...MD3LightTheme.fonts.labelLarge, fontWeight: '600' },
  },
}

// Dark theme
const darkTheme = {
  ...MD3DarkTheme,
  roundness: 12,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.primaryLight,
    primaryContainer: COLORS.primary,
    secondary: COLORS.secondaryLight,
    secondaryContainer: COLORS.secondary,
    success: COLORS.success,
    error: COLORS.error,
    warning: COLORS.warning,
    info: COLORS.info,
    surface: '#1e1e1e',
    onSurface: '#ffffff',
    onSurfaceDisabled: '#757575',
    background: '#121212',
    outline: '#424242',
    skeleton: '#2d2d2d',
  },
  fonts: {
    ...MD3DarkTheme.fonts,
    displayLarge: { ...MD3DarkTheme.fonts.displayLarge, fontWeight: '700' },
    headlineLarge: { ...MD3DarkTheme.fonts.headlineLarge, fontWeight: '700' },
    titleLarge: { ...MD3DarkTheme.fonts.titleLarge, fontWeight: '700' },
    titleMedium: { ...MD3DarkTheme.fonts.titleMedium, fontWeight: '600' },
    bodyLarge: { ...MD3DarkTheme.fonts.bodyLarge, fontSize: 15, lineHeight: 22 },
    bodyMedium: { ...MD3DarkTheme.fonts.bodyMedium, fontSize: 14, lineHeight: 20 },
    labelLarge: { ...MD3DarkTheme.fonts.labelLarge, fontWeight: '600' },
  },
}

/**
 * Custom theme hook
 * Automatically switches between light and dark mode
 */
export function useAppTheme() {
  const isDark = false
  const theme = lightTheme

  // Adapt theme for navigation
  const navigationTheme = adaptNavigationTheme({
    ...theme,
  })

  return {
    theme,
    navigationTheme,
    isDark,
    colors: COLORS,
  }
}
