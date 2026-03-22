import React from 'react'
import { View, StyleSheet, Image } from 'react-native'
import {
  Text,
  IconButton,
  Surface,
  useTheme,
  TouchableRipple,
  Checkbox,
} from 'react-native-paper'
import { useCartStore } from '../../store/cart-store'
import { APP_CONFIG } from '../../config'

interface CartItemProps {
  id: string
  productId: string
  productVariantId: string
  quantity: number
  name: string
  image: string
  variantColor?: string
  variantSize?: string
  price: number
  available: boolean
  selected?: boolean
  onSelect?: () => void
}

/**
 * CartItem - Display single cart item with quantity controls
 *
 * Features:
 * - Product image, name, variant info
 * - Quantity +/- buttons
 * - Remove button
 * - Price display
 * - Availability indicator
 */
export const CartItem: React.FC<CartItemProps> = ({
  id,
  productId,
  productVariantId,
  quantity,
  name,
  image,
  variantColor,
  variantSize,
  price,
  available,
  selected = false,
  onSelect,
}) => {
  const theme = useTheme()
  const { updateQuantity, removeFromCart, isInCart } = useCartStore()

  // Check if item is still in cart
  const itemInCart = isInCart(productId, productVariantId)

  const formatPrice = React.useMemo(() => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: APP_CONFIG.currency,
    }).format(price)
  }, [price])

  const handleIncrease = () => {
    updateQuantity(productId, productVariantId, quantity + 1)
  }

  const handleDecrease = () => {
    if (quantity > 1) {
      updateQuantity(productId, productVariantId, quantity - 1)
    }
  }

  const handleRemove = () => {
    removeFromCart(productId, productVariantId)
  }

  const handlePress = () => {
    if (onSelect) {
      onSelect()
    }
  }

  return (
    <Surface style={styles.container} elevation={1}>
      <View style={styles.content}>
        {/* Checkbox for selection */}
        {onSelect && (
          <Checkbox
            status={selected ? 'checked' : 'unchecked'}
            onPress={handlePress}
            style={styles.checkbox}
          />
        )}
        {/* Product Info */}
        <View style={styles.productInfo}>
          <Image source={{ uri: image }} style={styles.image} />
          <View style={styles.details}>
            <Text variant="titleMedium" style={styles.name}>
              {name}
            </Text>
            {(variantColor || variantSize) && (
              <Text variant="bodySmall" style={styles.variant}>
                {variantColor && `Màu: ${variantColor}`}
                {variantColor && variantSize && ' | '}
                {variantSize && `Size: ${variantSize}`}
              </Text>
            )}
            <Text variant="titleMedium" style={styles.price}>
              {formatPrice(price)}
            </Text>
          </View>
        </View>

        {/* Quantity Controls */}
        <View style={styles.quantitySection}>
          <View style={styles.quantityControls}>
            <IconButton
              icon="minus"
              size={20}
              onPress={handleDecrease}
              mode="contained"
              disabled={!itemInCart || quantity <= 1 || !available}
              style={styles.qtyButton}
            />
            <Text variant="titleMedium" style={styles.quantity}>
              {quantity}
            </Text>
            <IconButton
              icon="plus"
              size={20}
              onPress={handleIncrease}
              mode="contained"
              disabled={!itemInCart || !available}
              style={styles.qtyButton}
            />
          </View>

          {/* Remove Button */}
          <TouchableRipple
            onPress={handleRemove}
            rippleColor={theme.colors.error}
            style={styles.removeButton}
          >
            <Text variant="bodySmall" style={styles.removeText}>
              Xóa
            </Text>
          </TouchableRipple>
        </View>
      </View>

      {/* Not Available Badge */}
      {!available && (
        <View style={styles.unavailableBadge}>
          <Text variant="bodySmall" style={styles.unavailableText}>
            Hết hàng
          </Text>
        </View>
      )}
    </Surface>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  checkbox: {
    marginRight: 4,
  },
  productInfo: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  details: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontWeight: '500',
  },
  variant: {
    opacity: 0.7,
  },
  price: {
    color: '#e53935',
    fontWeight: 'bold',
  },
  quantitySection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qtyButton: {
    margin: 0,
  },
  quantity: {
    minWidth: 32,
    textAlign: 'center',
  },
  removeButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  removeText: {
    color: '#c62828',
  },
  unavailableBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(198, 40, 40, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  unavailableText: {
    color: '#c62828',
  },
})
