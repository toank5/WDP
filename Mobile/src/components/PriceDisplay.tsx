import React from 'react'
import { Text, StyleSheet, View } from 'react-native'
import { COLORS } from './Theme'
import { formatPrice } from '../utils'

interface PriceDisplayProps {
  price: number
  originalPrice?: number
  size?: 'small' | 'medium' | 'large'
  showCurrency?: boolean
  discount?: number
}

export function PriceDisplay({
  price,
  originalPrice,
  size = 'medium',
  showCurrency = true,
  discount,
}: PriceDisplayProps) {
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { fontSize: 14 }
      case 'large':
        return { fontSize: 24 }
      default:
        return { fontSize: 18 }
    }
  }

  const { fontSize } = getSizeStyle()

  const hasDiscount = discount !== undefined && discount > 0
  const displayPrice = hasDiscount ? price * (1 - discount / 100) : price

  return (
    <View style={styles.container}>
      {originalPrice && (
        <Text style={[styles.originalPrice, { fontSize }]}>
          {formatPrice(originalPrice)}
        </Text>
      )}
      <Text style={[styles.price, { fontSize }]}>
        {formatPrice(displayPrice)}
      </Text>
      {hasDiscount && (
        <Text style={styles.discountBadge}>-{Math.round(discount)}%</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  originalPrice: {
    fontWeight: '400',
    color: '#9e9e9e',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: COLORS.error,
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
})
