import React from 'react'
import { Chip as RNPChip, useTheme, MD3Colors } from 'react-native-paper'
import { StyleSheet, View, Text } from 'react-native'
import { COLORS } from './Theme'

interface ChipProps {
  label: string
  selected?: boolean
  onPress?: () => void
  onClose?: () => void
  icon?: React.ReactNode
  style?: any
  size?: 'small' | 'medium'
  mode?: 'flat' | 'outlined'
  disabled?: boolean
}

export function CustomChip({
  label,
  selected = false,
  onPress,
  onClose,
  icon,
  style,
  size = 'medium',
  mode = 'flat',
  disabled = false,
}: ChipProps) {
  const theme = useTheme()
  const colors = theme.colors as MD3Colors

  const getSize = () => {
    switch (size) {
      case 'small':
        return { height: 28, fontSize: 12 }
      default:
        return { height: 32, fontSize: 14 }
    }
  }

  const { height, fontSize } = getSize()

  if (onPress) {
    return (
      <RNPChip
        mode={mode}
        selected={selected}
        onPress={onPress}
        icon={icon}
        onClose={onClose}
        textStyle={{ fontSize }}
        style={[
          styles.chip,
          selected && styles.selected,
          disabled && styles.disabled,
          { height },
          style,
        ]}
        disabled={disabled}
        theme={theme}
      >
        {label}
      </RNPChip>
    )
  }

  return (
    <View
      style={[
        styles.chip,
        selected && styles.selected,
        disabled && styles.disabled,
        { height },
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.label, { fontSize }]}>{label}</Text>
      {onClose && (
        <Text onPress={onClose} style={styles.closeIcon}>✕</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    marginRight: 8,
    marginBottom: 8,
  },
  selected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    color: '#666666',
    fontWeight: '500',
  },
  selected: {
    color: '#ffffff',
  },
  closeIcon: {
    marginLeft: 4,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
