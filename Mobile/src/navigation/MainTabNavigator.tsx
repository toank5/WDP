import React from 'react'
import { View, StyleSheet } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useTheme, IconButton, Badge } from 'react-native-paper'
import type { MainTabParamList } from './types'
import { HomeScreen, SearchScreen, CartScreen, AccountScreen } from '../screens'
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
        component={HomeScreen}
        options={{
          tabBarLabel: 'Cửa hàng',
          tabBarIcon: ({ color, size }) => (
            <IconButton icon="store" size={size} iconColor={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Tìm kiếm',
          tabBarIcon: ({ color, size }) => (
            <IconButton icon="magnify" size={size} iconColor={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: 'Giỏ hàng',
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
        name="Account"
        component={AccountScreen}
        options={{
          tabBarLabel: 'Tài khoản',
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
