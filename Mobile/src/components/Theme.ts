import { MD3DarkTheme, MD3LightTheme, adaptNavigationTheme } from 'react-native-paper'
import { useColorScheme } from 'react-native'

// Define custom colors based on WDP FE colors
export const COLORS = {
  primary: '#1976d2',
  primaryDark: '#115293',
  primaryLight: '#63a4ff',
  secondary: '#9c27b0',
  secondaryDark: '#6a0080',
  secondaryLight: '#d05ce3',
  success: '#4caf50',
  error: '#f44336',
  warning: '#ff9800',
  info: '#2196f3',
  surface: '#ffffff',
  onSurface: '#000000',
  onSurfaceDisabled: '#9e9e9e',
  background: '#f5f5f5',
  border: '#e0e0e0',
  skeleton: '#e0e0e0',
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
