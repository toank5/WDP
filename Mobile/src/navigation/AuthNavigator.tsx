import React, { useEffect } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuthStore } from '../store/auth-store'
import type { AuthStackParamList } from './types'
import { LoginScreen } from '../screens/auth/LoginScreen'
import { RegisterScreen } from '../screens/auth/RegisterScreen'
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen'
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen'

const Stack = createNativeStackNavigator<AuthStackParamList>()

/**
 * AuthNavigator - Navigation for authentication flow
 * This navigator handles all authentication-related screens
 *
 * Navigation logic:
 * - Login → Register (register button on login screen)
 * - Login → ForgotPassword (forgot password link)
 * - ForgotPassword → ResetPassword (after sending reset email)
 * - After successful login, RootNavigator will auto-redirect to MainNavigator
 */
export const AuthNavigator = () => {
  const { isAuthenticated, _hydrated } = useAuthStore()

  // Auto-redirect to MainNavigator when user is authenticated
  useEffect(() => {
    if (_hydrated && isAuthenticated) {
      // Navigation will be handled by RootNavigator
    }
  }, [isAuthenticated, _hydrated])

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 300,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  )
}
