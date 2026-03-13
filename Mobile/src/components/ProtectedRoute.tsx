import React, { useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../store/auth-store'
import { ActivityIndicator, View, StyleSheet } from 'react-native'

interface ProtectedRouteProps {
  children: React.ReactNode
  /**
   * If true, redirect to login screen if not authenticated
   * If false, show children regardless of auth state
   */
  requireAuth?: boolean
  /**
   * If true, redirect to main screen if already authenticated
   * Useful for screens like Login/Register that shouldn't be shown to logged-in users
   */
  redirectIfAuthenticated?: boolean
}

/**
 * ProtectedRoute - Route wrapper for authentication
 *
 * Behavior:
 * - If requireAuth=true and not authenticated → Redirect to Login
 * - If redirectIfAuthenticated=true and authenticated → Redirect to Main
 * - Otherwise → Show children
 *
 * Usage:
 * ```tsx
 * <ProtectedRoute requireAuth>
 *   <OrderHistoryScreen />
 * </ProtectedRoute>
 *
 * <ProtectedRoute redirectIfAuthenticated>
 *   <LoginScreen />
 * </ProtectedRoute>
 * ```
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = false,
  redirectIfAuthenticated = false,
}) => {
  const navigation = useNavigation()
  const { isAuthenticated, _hydrated, isLoading } = useAuthStore()

  useEffect(() => {
    // Only check after auth state is loaded from storage
    if (!_hydrated || isLoading) {
      return
    }

    if (requireAuth && !isAuthenticated) {
      // User is not authenticated but requires auth → redirect to Login
      navigation.navigate('Auth' as never, { screen: 'Login' })
    }

    if (redirectIfAuthenticated && isAuthenticated) {
      // User is authenticated but screen is for non-auth users → redirect to Main
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      })
    }
  }, [isAuthenticated, _hydrated, isLoading, navigation, requireAuth, redirectIfAuthenticated])

  // Show loading while checking auth state
  if (!_hydrated || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  // Check if should show children or redirect
  if (requireAuth && !isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (redirectIfAuthenticated && isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return <>{children}</>
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
})
