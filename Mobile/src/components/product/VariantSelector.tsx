import React, { useState, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { Text, Chip, useTheme } from 'react-native-paper'
import type { ProductVariant } from '../../types/product'

interface VariantSelectorProps {
  variants: ProductVariant[]
  selectedVariant: ProductVariant | null
  onVariantChange: (variant: ProductVariant) => void
  showStock?: boolean
}

/**
 * VariantSelector - Component for selecting product variants (color, size)
 *
 * Features:
 * - Color selection with availability
 * - Size selection with availability
 * - Stock display
 * - Visual feedback for selected/out of stock
 */
export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  selectedVariant,
  onVariantChange,
  showStock = true,
}) => {
  const theme = useTheme()

  // Extract unique colors and sizes
  const colors = Array.from(new Set(variants.map((v) => v.color)))
  const sizes = Array.from(new Set(variants.map((v) => v.size)))

  // Selected state
  const selectedColor = selectedVariant?.color || null
  const selectedSize = selectedVariant?.size || null

  // Handle color selection
  const handleColorSelect = useCallback(
    (color: string) => {
      // Find variant with same color and current size (if any)
      const variant = variants.find((v) => v.color === color && v.size === selectedSize)
      // Or find first available variant with this color
      const fallbackVariant = variants.find((v) => v.color === color && v.isAvailable)
      if (variant && variant.isAvailable) {
        onVariantChange(variant)
      } else if (fallbackVariant) {
        onVariantChange(fallbackVariant)
      }
    },
    [variants, selectedSize, onVariantChange]
  )

  // Handle size selection
  const handleSizeSelect = useCallback(
    (size: string) => {
      // Find variant with same size and current color
      const variant = variants.find((v) => v.size === size && v.color === selectedColor)
      // Or find first available variant with this size
      const fallbackVariant = variants.find((v) => v.size === size && v.isAvailable)
      if (variant && variant.isAvailable) {
        onVariantChange(variant)
      } else if (fallbackVariant) {
        onVariantChange(fallbackVariant)
      }
    },
    [variants, selectedColor, onVariantChange]
  )

  // Check if color/size combination is available
  const isVariantAvailable = useCallback(
    (color: string, size: string) => {
      return variants.some((v) => v.color === color && v.size === size && v.isAvailable)
    },
    [variants]
  )

  // Get stock for color/size combination
  const getVariantStock = useCallback(
    (color: string, size: string) => {
      const variant = variants.find((v) => v.color === color && v.size === size)
      return variant?.stock || 0
    },
    [variants]
  )

  return (
    <View style={styles.container}>
      {/* Color Selection */}
      <Text variant="bodyMedium" style={styles.label}>
        Màu sắc:
      </Text>
      <View style={styles.chipContainer}>
        {colors.map((color) => {
          const isSelected = selectedColor === color
          const isAvailable = colors.some((c) =>
            isVariantAvailable(c, selectedSize || sizes[0])
          )
          const isColorAvailable = variants.some((v) => v.color === color && v.isAvailable)

          return (
            <Chip
              key={color}
              selected={isSelected}
              onPress={() => handleColorSelect(color)}
              style={[
                styles.chip,
                isSelected && { backgroundColor: theme.colors.primary },
                !isColorAvailable && styles.outOfStock,
              ]}
              textStyle={isSelected ? { color: '#fff' } : undefined}
              disabled={!isColorAvailable}
            >
              {color}
            </Chip>
          )
        })}
      </View>

      {/* Size Selection */}
      <Text variant="bodyMedium" style={styles.label}>
        Kích thước:
      </Text>
      <View style={styles.chipContainer}>
        {sizes.map((size) => {
          const isSelected = selectedSize === size
          const isAvailable = variants.some((v) =>
            isVariantAvailable(selectedColor || colors[0], size)
          )
          const isSizeAvailable = variants.some((v) => v.size === size && v.isAvailable)

          return (
            <Chip
              key={size}
              selected={isSelected}
              onPress={() => handleSizeSelect(size)}
              style={[
                styles.chip,
                isSelected && { backgroundColor: theme.colors.primary },
                !isSizeAvailable && styles.outOfStock,
              ]}
              textStyle={isSelected ? { color: '#fff' } : undefined}
              disabled={!isSizeAvailable}
            >
              {size}
            </Chip>
          )
        })}
      </View>

      {/* Selected Variant Info */}
      {selectedVariant && (
        <View style={styles.variantInfo}>
          {showStock && (
            <Text variant="bodySmall" style={styles.stockText}>
              Còn {selectedVariant.stock} sản phẩm
            </Text>
          )}
          <Text variant="bodySmall" style={styles.skuText}>
            SKU: {selectedVariant.sku}
          </Text>
        </View>
      )}

      {/* Out of Stock Message */}
      {selectedVariant && !selectedVariant.isAvailable && (
        <View style={styles.outOfStockContainer}>
          <Text variant="bodyMedium" style={styles.outOfStockText}>
            Sản phẩm này đã hết hàng
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    borderColor: '#ddd',
  },
  outOfStock: {
    opacity: 0.5,
  },
  variantInfo: {
    gap: 4,
    marginTop: 4,
  },
  stockText: {
    opacity: 0.7,
  },
  skuText: {
    opacity: 0.5,
    fontSize: 12,
  },
  outOfStockContainer: {
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    marginTop: 8,
  },
  outOfStockText: {
    color: '#c62828',
    textAlign: 'center',
  },
})
