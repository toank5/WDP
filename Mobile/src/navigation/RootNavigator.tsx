import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuthStore } from '../store'
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
const PrescriptionDetailScreen = () => null as any
const PrescriptionListScreen = () => null as any
const AddressManagementScreen = () => null as any
const AddressFormScreen = () => null as any
const ProfileSettingsScreen = () => null as any
const AboutScreen = () => null as any
const ContactScreen = () => null as any
const FavoritesScreen = () => null as any
const VirtualTryOnScreen = () => null as any

const Stack = createNativeStackNavigator<RootStackParamList>()

export const RootNavigator = () => {
  const { isAuthenticated } = useAuthStore()
  const [isReady, setIsReady] = useState(false)

  // Wait for auth state to be loaded
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  if (!isReady) {
    return null // Show splash screen instead
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
            <Stack.Screen name="PrescriptionDetail" component={PrescriptionDetailScreen} />
            <Stack.Screen name="PrescriptionList" component={PrescriptionListScreen} />
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
