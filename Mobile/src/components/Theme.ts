import { MD3DarkTheme, MD3LightTheme, adaptNavigationTheme } from 'react-native-paper'
import { useColorScheme } from 'react-native'

// Define custom colors based on WDP FE colors - Blue-purple theme
export const COLORS = {
  primary: '#6366f1', // Indigo blue-purple
  primaryDark: '#4f46e5',
  primaryLight: '#818cf8',
  secondary: '#8b5cf6', // Violet purple
  secondaryDark: '#7c3aed',
  secondaryLight: '#a78bfa',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  surface: '#ffffff',
  onSurface: '#000000',
  onSurfaceDisabled: '#9e9e9e',
  background: '#f8fafc',
  border: '#e2e8f0',
  skeleton: '#f1f5f9',
}

// Light theme
const lightTheme = {
  ...MD3LightTheme,
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
}

// Dark theme
const darkTheme = {
  ...MD3DarkTheme,
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
}

/**
 * Custom theme hook
 * Automatically switches between light and dark mode
 */
export function useAppTheme() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = isDark ? darkTheme : lightTheme

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
