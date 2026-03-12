import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useTheme, IconButton } from 'react-native-paper'
import type { MainTabParamList } from './types'
import { StoreScreen } from '../screens/store/StoreScreen'

// Placeholder screens - will be implemented in later commits
const SearchScreen = () => null as any
const CartScreen = () => null as any
const AccountScreen = () => null as any

const Tab = createBottomTabNavigator<MainTabParamList>()

export const MainTabNavigator = () => {
  const theme = useTheme()

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
        component={StoreScreen}
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
        name="CartTab"
        component={CartScreen}
        options={{
          tabBarLabel: 'Giỏ hàng',
          tabBarIcon: ({ color, size }) => (
            <IconButton icon="cart" size={size} iconColor={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AccountTab"
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
