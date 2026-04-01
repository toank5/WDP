import React from 'react'
import { SafeAreaView, StyleSheet, View } from 'react-native'
import { useTheme } from 'react-native-paper'

type Props = {
  children: React.ReactNode
}

export const ScreenContainer: React.FC<Props> = ({ children }) => {
  const theme = useTheme()

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
})
