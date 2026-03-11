import React from 'react'
import { Card as RNPCard, useTheme, MD3Colors } from 'react-native-paper'
import { StyleSheet, View, Pressable } from 'react-native'
import { COLORS } from './Theme'

interface CardProps {
  children: React.ReactNode
  onPress?: () => void
  style?: any
  contentStyle?: any
  elevation?: number
  mode?: 'elevated' | 'outlined' | 'contained'
  disabled?: boolean
}

export function CustomCard({
  children,
  onPress,
  style,
  contentStyle,
  elevation = 2,
  mode = 'elevated',
  disabled = false,
}: CardProps) {
  const theme = useTheme()
  const colors = theme.colors as MD3Colors

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressed,
          disabled && styles.disabled,
          style,
        ]}
      >
        <RNPCard
          mode={mode}
          elevation={elevation}
          style={[styles.card, contentStyle]}
          theme={theme}
        >
          {children}
        </RNPCard>
      </Pressable>
    )
  }

  return (
    <RNPCard
      mode={mode}
      elevation={elevation}
      style={[styles.card, style]}
      contentStyle={[styles.cardContent, contentStyle]}
      theme={theme}
    >
      {children}
    </RNPCard>
  )
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 8,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  card: {
    borderRadius: 8,
  },
  cardContent: {
    padding: 16,
  },
})
