import React from 'react'
import { View, StyleSheet } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useTheme, IconButton, Badge } from 'react-native-paper'
import type { MainTabParamList } from './types'
import { SearchScreen, CartScreen, AccountScreen, OrderHistoryScreen } from '../screens'
import { HomeStackNavigator } from './HomeStackNavigator'
import { useCartStore } from '../store/cart-store'

const Tab = createBottomTabNavigator<MainTabParamList>()

export const MainTabNavigator = () => {
  const theme = useTheme()
  const cart = useCartStore()
  const cartCount = cart.totalItems || 0

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceDisabled,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Shop',
          tabBarIcon: ({ color, size }) => (
            <IconButton icon="store" size={size} iconColor={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => (
            <IconButton icon="magnify" size={size} iconColor={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          tabBarLabel: 'Cart',
          tabBarIcon: ({ color, size }) => (
            <View>
              <IconButton icon="cart" size={size} iconColor={color} />
              {cartCount > 0 && (
                <Badge
                  style={styles.cartBadge}
                  size={20}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </Badge>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrderHistoryScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <IconButton icon="clipboard-text" size={size} iconColor={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AccountTab"
        component={AccountScreen}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color, size }) => (
            <IconButton icon="account" size={size} iconColor={color} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
})
