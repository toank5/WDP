import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTheme, IconButton } from 'react-native-paper'
import type { RootStackParamList, RootStackNavigation } from './types'
import { AboutScreen } from '../screens'
import { ContactScreen } from '../screens'
import { FavoritesScreen } from '../screens'
import { ProfileScreen } from '../screens'
import { SecurityScreen } from '../screens'

const Stack = createNativeStackNavigator<RootStackParamList>()

/**
 * AppStackNavigator - Handles app-wide pages
 * - About
 * - Contact
 * - Favorites
 * - Profile Settings
 * - Security Settings
 */
export const AppStackNavigator = ({ navigation }: RootStackNavigation) => {
  const theme = useTheme()

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: 'Về chúng tôi',
          headerLeft: ({ canGoBack }) =>
            canGoBack ? (
              <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
            ) : null,
        }}
      />
      <Stack.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          title: 'Liên hệ',
        }}
      />
      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: 'Danh sách yêu thích',
        }}
      />
      <Stack.Screen
        name="ProfileSettings"
        component={ProfileScreen}
        options={{
          title: 'Thông tin cá nhân',
        }}
      />
      <Stack.Screen
        name="SecuritySettings"
        component={SecurityScreen}
        options={{
          title: 'Bảo mật',
        }}
      />
    </Stack.Navigator>
  )
}
