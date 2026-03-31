import React, { useEffect, useState } from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuthStore, initializeAuthStore } from '../store/auth-store'
import { AuthNavigator } from './AuthNavigator'
import { MainTabNavigator } from './MainTabNavigator'
import { CheckoutStackNavigator } from './CheckoutStackNavigator'

const Stack = createNativeStackNavigator()

/**
 * RootNavigator - Main navigation container
 *
 * Navigation flow:
 * - Check if user is authenticated (has valid token)
 * - If authenticated → Show MainNavigator with tabs
 * - If not authenticated → Show AuthNavigator
 *
 * Auto-redirect logic:
 * - Login successful → Navigate to MainNavigator
 * - Logout → Navigate to AuthNavigator (Login screen)
 * - Token expired → Navigate to AuthNavigator (Login screen)
 */
export const RootNavigator = () => {
  const { isAuthenticated, _hydrated } = useAuthStore()
  const [isInitializing, setIsInitializing] = useState(true)

  // Initialize auth store from AsyncStorage on app start
  useEffect(() => {
    initializeAuthStore().then(() => {
      setIsInitializing(false)
    })
  }, [])

  // Auto-redirect based on auth state
  useEffect(() => {
    if (_hydrated) {
      // Navigation will automatically switch between Auth and Main stacks
    }
  }, [isAuthenticated, _hydrated])

  // Show loading spinner while initializing
  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      >
        {/* Always show Main Navigator (Store first) */}
        <Stack.Screen
          name="Main"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />

        {/* Checkout Stack - Accessible from Cart */}
        <Stack.Group
          screenOptions={{
            presentation: 'containedModal',
            animationEnabled: true,
            animation: 'slide_from_bottom',
          }}
        >
          <Stack.Screen
            name="Checkout"
            component={CheckoutStackNavigator}
            options={{ headerShown: false }}
          />
        </Stack.Group>

        {/* Auth Navigator - shown only when needed */}
        {isAuthenticated ? null : (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ headerShown: false, presentation: 'card' }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
})
