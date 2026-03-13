import React from 'react'
import { ActivityIndicator, useTheme, MD3Colors } from 'react-native-paper'
import { StyleSheet, View, Text } from 'react-native'

interface LoadingProps {
  size?: 'small' | 'large'
  color?: string
  text?: string
  overlay?: boolean
}

export function Loading({
  size = 'large',
  color,
  text,
  overlay = false,
}: LoadingProps) {
  const theme = useTheme()
  const colors = theme.colors as MD3Colors

  const getSize = () => {
    switch (size) {
      case 'small':
        return 24
      default:
        return 48
    }
  }

  const loaderSize = getSize()

  const content = (
    <View style={styles.container}>
      <ActivityIndicator
        animating={true}
        size={loaderSize}
        color={color || colors.primary}
        theme={theme}
      />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  )

  if (overlay) {
    return (
      <View style={styles.overlay}>
        {content}
      </View>
    )
  }

  return content
}

export function Skeleton({ width, height, style }: { width?: number; height?: number; style?: any }) {
  return (
    <View
      style={[
        styles.skeleton,
        width ? { width } : { width: '100%' },
        height ? { height } : { height: 48 },
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  skeleton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
})
