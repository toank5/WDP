import React, { memo } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  Dimensions,
} from 'react-native'
import { Card, Badge, useTheme, IconButton } from 'react-native-paper'

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  images?: string[]
  category: string
  inStock: boolean
  preOrder?: boolean
  discount?: number
}

interface ProductCardProps {
  product: Product
  onPress: () => void
  style?: any
}

const SCREEN_WIDTH = Dimensions.get('window').width

/**
 * ProductCard - Card component for displaying product in grid
 *
 * Features:
 * - Product image with placeholder
 * - Product name and price
 * - Discount badge
 * - Pre-order badge
 * - Heart icon for wishlist
 */
export const ProductCard: React.FC<ProductCardProps> = memo(
  ({ product, onPress, style }) => {
    const theme = useTheme()
    const [isLiked, setIsLiked] = React.useState(false)

    const discountPercentage = product.originalPrice
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) * 100
        )
      : 0

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(price)
    }

    const handleLike = () => {
      setIsLiked(!isLiked)
      // TODO: Add/remove from wishlist
    }

    const handlePress = () => {
      onPress()
    }

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[styles.container, style]}
      >
        <Card style={styles.card}>
          {/* Discount Badge */}
          {product.discount && (
            <Badge style={[styles.badge, { backgroundColor: '#ef4444' }]}>
              -{discountPercentage}%
            </Badge>
          )}

          {/* Pre-order Badge */}
          {product.preOrder && (
            <Badge style={[styles.badge, styles.preOrderBadge]}>
              Pre-order
            </Badge>
          )}

          {/* Product Image */}
          <Image
            source={{ uri: product.image }}
            style={styles.image}
            resizeMode="cover"
          />

          {/* Product Info */}
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={2}>
              {product.name}
            </Text>

            <View style={styles.priceContainer}>
              {product.originalPrice && (
                <Text style={styles.originalPrice}>
                  {formatPrice(product.originalPrice)}
                </Text>
              )}
              <Text style={[styles.price, { color: theme.colors.primary }]}>
                {formatPrice(product.price)}
              </Text>
            </View>

            {/* Stock Status */}
            {!product.inStock && (
              <Text style={styles.outOfStock}>Hết hàng</Text>
            )}
          </View>

          {/* Heart Icon */}
          <IconButton
            icon={isLiked ? 'heart' : 'heart-outline'}
            size={20}
            iconColor={isLiked ? '#ef4444' : theme.colors.placeholder}
            onPress={handleLike}
            style={styles.likeButton}
          />
        </Card>
      </TouchableOpacity>
    )
  }
)

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    overflow: 'hidden',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  image: {
    width: '100%',
    height: SCREEN_WIDTH / 2 - 32,
    backgroundColor: '#f8fafc',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 8,
  },
  preOrderBadge: {
    backgroundColor: '#f59e0b',
    top: 12,
    left: 12,
  },
  info: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    minHeight: 40,
    color: '#0f172a',
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
    opacity: 0.7,
    color: '#64748b',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
  },
  outOfStock: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    fontWeight: '500',
  },
  likeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ffffff',
    margin: 0,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
})
