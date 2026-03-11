import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { AuthStackParamList } from './types'

// Placeholder screens - will be implemented in later commits
const LoginScreen = () => null as any
const RegisterScreen = () => null as any
const ForgotPasswordScreen = () => null as any
const ResetPasswordScreen = () => null as any
const VerifyEmailScreen = () => null as any

const Stack = createNativeStackNavigator<AuthStackParamList>()

export const AuthNavigator = () => {
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
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    </Stack.Navigator>
  )
}
