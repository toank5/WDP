import React from 'react'
import { Text as RNPText, useTheme, MD3Colors } from 'react-native-paper'
import { StyleSheet } from 'react-native'

interface TypographyProps {
  children: React.ReactNode
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption' | 'small'
  color?: string
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  style?: any
  numberOfLines?: number
}

export function CustomTypography({
  children,
  variant = 'body',
  color,
  align = 'auto',
  weight = 'normal',
  style,
  numberOfLines,
}: TypographyProps) {
  const theme = useTheme()
  const colors = theme.colors as MD3Colors

  const getVariantStyle = () => {
    switch (variant) {
      case 'h1':
        return { fontSize: 32, lineHeight: 40 }
      case 'h2':
        return { fontSize: 28, lineHeight: 36 }
      case 'h3':
        return { fontSize: 24, lineHeight: 32 }
      case 'h4':
        return { fontSize: 20, lineHeight: 28 }
      case 'h5':
        return { fontSize: 18, lineHeight: 24 }
      case 'h6':
        return { fontSize: 16, lineHeight: 20 }
      case 'caption':
        return { fontSize: 12, lineHeight: 16 }
      case 'small':
        return { fontSize: 11, lineHeight: 14 }
      default:
        return { fontSize: 14, lineHeight: 20 }
    }
  }

  const getWeightStyle = () => {
    switch (weight) {
      case 'medium':
        return { fontWeight: '500' }
      case 'semibold':
        return { fontWeight: '600' }
      case 'bold':
        return { fontWeight: '700' }
      default:
        return { fontWeight: '400' }
    }
  }

  const variantStyle = getVariantStyle()
  const weightStyle = getWeightStyle()

  return (
    <RNPText
      variant={variant === 'body' ? 'bodyLarge' : 'titleLarge'}
      style={[
        styles.text,
        variantStyle,
        weightStyle,
        { color: color || colors.onSurface, textAlign: align },
        style,
      ]}
      numberOfLines={numberOfLines}
      theme={theme}
    >
      {children}
    </RNPText>
  )
}

const styles = StyleSheet.create({
  text: {
    color: '#000000',
  },
})

// Convenience components
export function H1(props: Omit<TypographyProps, 'variant'>) {
  return <CustomTypography {...props} variant="h1" />
}

export function H2(props: Omit<TypographyProps, 'variant'>) {
  return <CustomTypography {...props} variant="h2" />
}

export function H3(props: Omit<TypographyProps, 'variant'>) {
  return <CustomTypography {...props} variant="h3" />
}

export function H4(props: Omit<TypographyProps, 'variant'>) {
  return <CustomTypography {...props} variant="h4" />
}

export function H5(props: Omit<TypographyProps, 'variant'>) {
  return <CustomTypography {...props} variant="h5" />
}

export function H6(props: Omit<TypographyProps, 'variant'>) {
  return <CustomTypography {...props} variant="h6" />
}

export function Body(props: Omit<TypographyProps, 'variant'>) {
  return <CustomTypography {...props} variant="body" />
}

export function Caption(props: Omit<TypographyProps, 'variant'>) {
  return <CustomTypography {...props} variant="caption" />
}

export function Small(props: Omit<TypographyProps, 'variant'>) {
  return <CustomTypography {...props} variant="small" />
}
