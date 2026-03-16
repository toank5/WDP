import React, { useEffect, useState } from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuthStore, initializeAuthStore } from '../store/auth-store'
import { AuthNavigator } from './AuthNavigator'
import { MainTabNavigator } from './MainTabNavigator'
import type { RootStackParamList } from './types'

// Placeholder screens - will be implemented in later commits
const ProductDetailScreen = () => null as any
const ProductListScreen = () => null as any
const CheckoutScreen = () => null as any
const CheckoutAddressScreen = () => null as any
const CheckoutPaymentScreen = () => null as any
const CheckoutReviewScreen = () => null as any
const OrderDetailScreen = () => null as any
const OrderHistoryScreen = () => null as any
const AddressManagementScreen = () => null as any
const AddressFormScreen = () => null as any
const ProfileSettingsScreen = () => null as any
const AboutScreen = () => null as any
const ContactScreen = () => null as any
const FavoritesScreen = () => null as any
const VirtualTryOnScreen = () => null as any

const Stack = createNativeStackNavigator<RootStackParamList>()

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
        {!isAuthenticated ? (
          // Not logged in - show Auth Stack
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          // Logged in - show Main Stack with tabs
          <>
            <Stack.Screen
              name="Main"
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="ProductList" component={ProductListScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="CheckoutAddress" component={CheckoutAddressScreen} />
            <Stack.Screen name="CheckoutPayment" component={CheckoutPaymentScreen} />
            <Stack.Screen name="CheckoutReview" component={CheckoutReviewScreen} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
            <Stack.Screen name="AddressManagement" component={AddressManagementScreen} />
            <Stack.Screen name="AddressForm" component={AddressFormScreen} />
            <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="Contact" component={ContactScreen} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} />
            <Stack.Screen name="VirtualTryOn" component={VirtualTryOnScreen} />
          </>
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
