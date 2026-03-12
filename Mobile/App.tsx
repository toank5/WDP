import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { PaperProvider } from 'react-native-paper'
import { RootNavigator } from './src/navigation/RootNavigator'

/**
 * App - Main entry point
 *
 * App structure:
 * - PaperProvider: React Native Paper theme provider
 * - RootNavigator: Main navigation container
 *
 * Navigation flow:
 * - App start → Check auth state from AsyncStorage
 * - If authenticated → Show MainNavigator (Store, Cart, Account)
 * - If not authenticated → Show AuthNavigator (Login, Register, Forgot, Reset)
 */
export default function App() {
  return (
    <>
      <PaperProvider>
        <RootNavigator />
      </PaperProvider>
      <StatusBar style="auto" />
    </>
  )
}
