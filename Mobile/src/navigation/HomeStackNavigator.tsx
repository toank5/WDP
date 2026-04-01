import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTheme, IconButton } from 'react-native-paper'
import { HomeScreen } from '../screens/home/HomeScreen'
import { ProductDetailScreen } from '../screens/product/ProductDetailScreen'
import type { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

/**
 * HomeStackNavigator - Stack navigator for Home tab
 * Includes:
 * - Home screen (product listing)
 * - Product detail screen (when user clicks on a product)
 */
export const HomeStackNavigator = () => {
  const theme = useTheme()

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={({ navigation }) => ({
          headerShown: true,
          title: 'Chi tiết sản phẩm',
          headerBackTitle: 'Quay lại',
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.onSurface,
          headerLeft: () => (
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
            />
          ),
        })}
      />
    </Stack.Navigator>
  )
}
