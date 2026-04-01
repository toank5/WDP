import React, { useEffect, useState } from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuthStore, initializeAuthStore } from '../store/auth-store'
import { AuthNavigator } from './AuthNavigator'
import { MainTabNavigator } from './MainTabNavigator'
import { CheckoutStackNavigator } from './CheckoutStackNavigator'
import { ReturnRequestScreen } from '../screens/account/ReturnRequestScreen'
import { SettingsScreen } from '../screens/account/SettingsScreen'
import { PolicyDetailScreen } from '../screens/info/PolicyDetailScreen'
import { ReviewListScreen } from '../screens/product/ReviewListScreen'
import { OrderHistoryScreen } from '../screens/account/OrderHistoryScreen'
import { OrderDetailScreen } from '../screens/account/OrderDetailScreen'
import { FavoritesScreen } from '../screens/favorites/FavoritesScreen'
import { ProfileScreen } from '../screens/account/ProfileScreen'
import { SecurityScreen } from '../screens/account/SecurityScreen'
import { AddressManagementScreen } from '../screens/account/AddressManagementScreen'
import { AboutScreen } from '../screens/info/AboutScreen'
import { ContactScreen } from '../screens/info/ContactScreen'
import type { RootStackParamList } from './types'

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

        {/* Additional screens accessible from anywhere */}
        <Stack.Screen
          name="ReturnRequest"
          component={ReturnRequestScreen}
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="PolicyDetail"
          component={PolicyDetailScreen}
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="ReviewList"
          component={ReviewListScreen}
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="OrderHistory"
          component={OrderHistoryScreen}
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="OrderDetail"
          component={OrderDetailScreen}
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="Favorites"
          component={FavoritesScreen}
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="ProfileSettings"
          component={ProfileScreen}
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="SecuritySettings"
          component={SecurityScreen}
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="AddressManagement"
          component={AddressManagementScreen}
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="Contact"
          component={ContactScreen}
          options={{ headerShown: false, presentation: 'card' }}
        />

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
