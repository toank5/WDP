import React, { useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native'
import {
  Text,
  Card,
  IconButton,
  Button,
  Divider,
  ActivityIndicator,
} from 'react-native-paper'
import { useTheme } from 'react-native-paper'
import type { NavigationProp } from '@react-navigation/native'
import type { MainTabParamList, RootStackParamList } from '../../types'
import {
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../../services/cart-api'

type Props = {
  navigation: NavigationProp<MainTabParamList & RootStackParamList>
}

// Price formatter
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

interface CartItemCardProps {
  item: any
  onUpdateQty: (itemId: string, qty: number) => void
  onRemove: (itemId: string) => void
  updating: Set<string>
}

function CartItemCard({ item, onUpdateQty, onRemove, updating }: CartItemCardProps) {
  const theme = useTheme()
  const isUpdating = updating.has(item._id)

  return (
    <Card style={styles.itemCard}>
      <View style={styles.itemContent}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {item.productImage ? (
            <Image
              source={{ uri: item.productImage }}
              style={styles.productImage}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>📦</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.productName || 'Sản phẩm'}
          </Text>

          {/* Variant Details */}
          {item.variantDetails && (
            <Text style={styles.variantText}>
              {item.variantDetails.size && `Size: ${item.variantDetails.size}`}
              {item.variantDetails.size && item.variantDetails.color && ' | '}
              {item.variantDetails.color && `Color: ${item.variantDetails.color}`}
            </Text>
          )}

          {/* Price and Quantity */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(item.price)}</Text>

            <View style={styles.quantityControl}>
              <IconButton
                icon="minus"
                size={18}
                onPress={() => onUpdateQty(item._id, item.quantity - 1)}
                disabled={isUpdating || item.quantity <= 1}
                style={styles.qtyButton}
              />
              <Text style={styles.quantityText}>{isUpdating ? '...' : item.quantity}</Text>
              <IconButton
                icon="plus"
                size={18}
                onPress={() => onUpdateQty(item._id, item.quantity + 1)}
                disabled={isUpdating}
                style={styles.qtyButton}
              />
            </View>
          </View>
        </View>

        {/* Remove Button */}
        <IconButton
          icon="delete-outline"
          size={20}
          onPress={() => onRemove(item._id)}
          disabled={isUpdating}
          iconColor={theme.colors.error}
        />
      </View>
    </Card>
  )
}

export function CartScreen({ navigation }: Props) {
  const theme = useTheme()

  const [cart, setCart] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<Set<string>>(new Set())

  const loadCart = async () => {
    try {
      setLoading(true)
      const data = await getCart()
      setCart(data)
    } catch (error: any) {
      console.error('Failed to load cart:', error)
      Alert.alert('Lỗi', 'Không thể tải giỏ hàng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCart()
  }, [])

  const handleUpdateQty = async (itemId: string, newQty: number) => {
    if (newQty < 1) {
      handleRemove(itemId)
      return
    }

    setUpdating((prev) => new Set(prev).add(itemId))
    try {
      await updateCartItem(itemId, { quantity: newQty })
      await loadCart()
    } catch (error: any) {
      console.error('Failed to update quantity:', error)
      Alert.alert('Lỗi', 'Không thể cập nhật số lượng')
      await loadCart()
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const handleRemove = async (itemId: string) => {
    Alert.alert(
      'Xóa sản phẩm',
      'Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setUpdating((prev) => new Set(prev).add(itemId))
            try {
              await removeFromCart(itemId)
              await loadCart()
            } catch (error: any) {
              console.error('Failed to remove item:', error)
              Alert.alert('Lỗi', 'Không thể xóa sản phẩm')
              await loadCart()
            } finally {
              setUpdating((prev) => {
                const next = new Set(prev)
                next.delete(itemId)
                return next
              })
            }
          },
        },
      ]
    )
  }

  const handleClearCart = async () => {
    Alert.alert(
      'Xóa giỏ hàng',
      'Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCart()
              await loadCart()
            } catch (error: any) {
              console.error('Failed to clear cart:', error)
              Alert.alert('Lỗi', 'Không thể xóa giỏ hàng')
            }
          },
        },
      ]
    )
  }

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) return
    navigation.navigate('Checkout' as any)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  const hasItems = cart && cart.items.length > 0
  const subtotal = cart?.subtotal || 0
  const shipping = cart?.shipping || 0
  const total = cart?.total || (subtotal + shipping)

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
        {hasItems && (
          <Button onPress={handleClearCart} mode="text" textColor={theme.colors.error}>
            Xóa tất cả
          </Button>
        )}
      </View>

      {/* Cart Items */}
      {hasItems ? (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {cart!.items.map((item: any) => (
              <CartItemCard
                key={item._id}
                item={item}
                onUpdateQty={handleUpdateQty}
                onRemove={handleRemove}
                updating={updating}
              />
            ))}
          </ScrollView>

          {/* Footer with Summary */}
          <View style={styles.footer}>
            <Divider />

            {/* Free shipping info */}
            {subtotal < 2000000 && (
              <View style={styles.freeShippingInfo}>
                <Text style={styles.freeShippingText}>
                  Mua thêm {formatPrice(2000000 - subtotal)} để được miễn phí giao hàng
                </Text>
              </View>
            )}

            {/* Order Summary */}
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tạm tính</Text>
                <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
                <Text style={[styles.summaryValue, styles.shippingText]}>
                  {shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}
                </Text>
              </View>

              <Divider style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Tổng cộng</Text>
                <Text style={styles.totalValue}>{formatPrice(total)}</Text>
              </View>
            </View>

            {/* Checkout Button */}
            <Button
              mode="contained"
              onPress={handleCheckout}
              style={styles.checkoutButton}
              contentStyle={styles.checkoutButtonContent}
              labelStyle={styles.checkoutButtonLabel}
            >
              Thanh toán
            </Button>
          </View>
        </>
      ) : (
        /* Empty Cart */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyEmoji}>🛒</Text>
          </View>
          <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
          <Text style={styles.emptyText}>
            Bạn chưa có sản phẩm nào trong giỏ hàng
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('HomeTab' as any)}
            style={styles.emptyButton}
          >
            Mua sắm ngay
          </Button>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  itemCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemContent: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  imageContainer: {
    width: 80,
    height: 80,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  productInfo: {
    flex: 1,
    gap: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  variantText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  qtyButton: {
    margin: 0,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 8,
    minWidth: 24,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  freeShippingInfo: {
    padding: 12,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 12,
  },
  freeShippingText: {
    fontSize: 12,
    color: '#1e40af',
    textAlign: 'center',
  },
  summary: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  summaryDivider: {
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  shippingText: {
    color: '#10b981',
  },
  checkoutButton: {
    marginBottom: 16,
    borderRadius: 12,
  },
  checkoutButtonContent: {
    paddingVertical: 12,
  },
  checkoutButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyEmoji: {
    fontSize: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 32,
  },
})
