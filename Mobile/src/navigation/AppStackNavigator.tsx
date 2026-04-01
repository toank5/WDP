import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTheme, IconButton } from 'react-native-paper'
import type { RootStackParamList, RootStackNavigation } from './types'
import { AboutScreen } from '../screens'
import { ContactScreen } from '../screens'
import { FavoritesScreen } from '../screens'
import { ProfileScreen } from '../screens'
import { SecurityScreen } from '../screens'
import { AddressManagementScreen } from '../screens'

const Stack = createNativeStackNavigator<RootStackParamList>()

/**
 * AppStackNavigator - Handles app-wide pages
 * - About
 * - Contact
 * - Favorites
 * - Profile Settings
 * - Security Settings
 * - Address Management
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
          title: 'About Us',
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
          title: 'Contact',
        }}
      />
      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: 'Favorites',
        }}
      />
      <Stack.Screen
        name="ProfileSettings"
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
      <Stack.Screen
        name="ProfileEdit"
        component={ProfileScreen}
        options={{
          title: 'Edit Profile',
        }}
      />
      <Stack.Screen
        name="SecuritySettings"
        component={SecurityScreen}
        options={{
          title: 'Security',
        }}
      />
      <Stack.Screen
        name="AddressManagement"
        component={AddressManagementScreen}
        options={{
          title: 'Address Book',
        }}
      />
    </Stack.Navigator>
  )
}
