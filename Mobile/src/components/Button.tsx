import React from 'react'
import { Button as RNPButton, useTheme } from 'react-native-paper'
import { StyleSheet, View } from 'react-native'
import type { COLORS } from './Theme'

interface ButtonProps {
  children: React.ReactNode
  onPress?: () => void
  mode?: 'text' | 'outlined' | 'contained' | 'contained-tonal'
  loading?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  color?: string
  buttonColor?: string
  textColor?: string
  style?: any
  contentStyle?: any
  fullWidth?: boolean
  size?: 'small' | 'medium' | 'large'
}

export function CustomButton({
  children,
  onPress,
  mode = 'contained',
  loading = false,
  disabled = false,
  icon,
  color,
  buttonColor,
  textColor,
  style,
  contentStyle,
  fullWidth = false,
  size = 'medium',
}: ButtonProps) {
  const theme = useTheme()
  const { colors } = theme

  const getButtonHeight = () => {
    switch (size) {
      case 'small':
        return 32
      case 'large':
        return 56
      default:
        return 44
    }
  }

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 14
      case 'large':
        return 18
      default:
        return 16
    }
  }

  return (
    <View style={[styles.container, fullWidth && styles.fullWidth, style]}>
      <RNPButton
        mode={mode}
        onPress={onPress}
        loading={loading}
        disabled={disabled || loading}
        icon={icon}
        color={buttonColor || colors.primary}
        textColor={textColor}
        style={[styles.button, { height: getButtonHeight() }]}
        contentStyle={[
          styles.content,
          { fontSize: getFontSize() },
          contentStyle,
        ]}
      >
        {children}
      </RNPButton>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
  },
  fullWidth: {
    marginHorizontal: 0,
    width: '100%',
  },
  button: {
    borderRadius: 8,
    justifyContent: 'center',
  },
  content: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
})
