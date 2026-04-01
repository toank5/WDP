import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  RefreshControl,
} from 'react-native'
import {
  Text,
  Card,
  IconButton,
  Button,
  Divider,
  ActivityIndicator,
  TextInput,
  Snackbar,
} from 'react-native-paper'
import { CartItemSkeleton } from '../../components/Loading'
import { useTheme } from 'react-native-paper'
import type { NavigationProp } from '@react-navigation/native'
import type { MainTabParamList, RootStackParamList } from '../../types'
import { useCartStore, useCart } from '../../store/cart-store'
import { validatePromotion } from '../../services/promotion-api'

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
  const itemId = item._id || item.id || `${item.productId || 'item'}-${item.variantSku || 'default'}`
  const isUpdating = updating.has(itemId)

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
                size={22}
                onPress={() => onUpdateQty(itemId, item.quantity - 1)}
                disabled={!itemId || isUpdating || item.quantity <= 1}
                style={styles.qtyButton}
              />
              <Text style={styles.quantityText}>{isUpdating ? '...' : item.quantity}</Text>
              <IconButton
                icon="plus"
                size={22}
                onPress={() => onUpdateQty(itemId, item.quantity + 1)}
                disabled={!itemId || isUpdating}
                style={styles.qtyButton}
              />
            </View>
          </View>
        </View>

        {/* Remove Button */}
        <IconButton
          icon="delete-outline"
          size={24}
          onPress={() => onRemove(itemId)}
          disabled={!itemId || isUpdating}
          iconColor={theme.colors.error}
        />
      </View>
    </Card>
  )
}

export function CartScreen({ navigation }: Props) {
  const theme = useTheme()
  const {
    items,
    subtotal,
    loading,
    error,
    loadCart,
    updateQuantity,
    removeItem,
    clearCart,
    setPromotionCode,
    clearPromotionCode,
  } = useCartStore()
  const { discountAmount, totalAfterDiscount, appliedPromotion } = useCart()

  const [refreshing, setRefreshing] = useState(false)
  const [updating, setUpdating] = useState<Set<string>>(new Set())
  const [promoCode, setPromoCode] = useState('')
  const [validatingPromo, setValidatingPromo] = useState(false)
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
      return
    }
    navigation.navigate('HomeTab' as any)
  }, [navigation])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await loadCart()
    } finally {
      setRefreshing(false)
    }
  }, [])

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
      await updateQuantity(itemId, newQty)
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
              await removeItem(itemId)
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

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã khuyến mãi')
      return
    }

    try {
      setValidatingPromo(true)
      const result = await validatePromotion({
        code: promoCode.trim().toUpperCase(),
        cartTotal: subtotal,
        productIds: items.map((item) => item.productId),
      })

      if (result.isValid && result.promotion) {
        setPromotionCode({
          code: result.promotion.code,
          name: result.promotion.name,
          type: result.promotion.type,
          value: result.promotion.value,
          description: result.promotion.description,
          minOrderValue: result.promotion.minOrderValue,
          discountAmount: result.discountAmount || 0,
        })
        setPromoCode(result.promotion.code)
        setSnackbar({ visible: true, message: `Đã áp dụng mã ${result.promotion.code}` })
      } else {
        Alert.alert('Mã không hợp lệ', result.message || 'Không thể áp dụng mã giảm giá')
      }
    } catch (error: any) {
      console.error('Validate promotion error:', error)
      Alert.alert('Lỗi', error?.message || 'Không thể kiểm tra mã giảm giá')
    } finally {
      setValidatingPromo(false)
    }
  }

  const handleClearPromoCode = () => {
    clearPromotionCode()
    setPromoCode('')
    setSnackbar({ visible: true, message: 'Đã bỏ mã khuyến mãi' })
  }

  const handleCheckout = () => {
    if (items.length === 0) return
    // Navigate to Checkout (root level navigation)
    // Try both root and nested navigation approaches
    try {
      navigation.navigate('Checkout' as any)
    } catch (e) {
      // If root navigation fails, try via root navigator
      const rootNav = navigation.getParent?.()?.getParent?.()
      if (rootNav) {
        rootNav.navigate('Checkout' as any)
      } else {
        Alert.alert('Lỗi', 'Không thể chuyển tới thanh toán')
      }
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <IconButton icon="arrow-left" size={22} onPress={handleBack} />
            <Text style={styles.headerTitle}>Cart</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Loading your cart...
          </Text>
        </View>
        <View style={styles.content}>
          {Array.from({ length: 3 }).map((_, index) => (
            <CartItemSkeleton key={index} />
          ))}
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <IconButton icon="arrow-left" size={22} onPress={handleBack} />
            <Text style={styles.headerTitle}>Cart</Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🛒</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Button
            mode="contained"
            onPress={loadCart}
            style={styles.retryButton}
            icon="refresh"
          >
            Retry
          </Button>
        </View>
      </View>
    )
  }

  const hasItems = items.length > 0
  const shipping = hasItems && totalAfterDiscount < 2000000 ? 30000 : 0
  const total = totalAfterDiscount + shipping

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton icon="arrow-left" size={22} onPress={handleBack} />
          <Text style={styles.headerTitle}>Cart</Text>
        </View>
        {hasItems && (
          <Button onPress={handleClearCart} mode="text" textColor={theme.colors.error}>
            Clear all
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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
          >
            {items.map((item: any) => (
              <CartItemCard
                key={item._id || item.id || `${item.productId || 'item'}-${item.variantSku || 'default'}`}
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

            <View style={styles.promoSection}>
              <TextInput
                mode="outlined"
                label="Mã khuyến mãi"
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
                style={styles.promoInput}
                disabled={!!appliedPromotion}
              />
              {!appliedPromotion ? (
                <Button
                  mode="contained"
                  onPress={handleApplyPromoCode}
                  loading={validatingPromo}
                  disabled={validatingPromo || !promoCode.trim()}
                >
                  Áp dụng
                </Button>
              ) : (
                <Button mode="outlined" onPress={handleClearPromoCode}>
                  Bỏ mã
                </Button>
              )}
            </View>

            {/* Free shipping info */}
            {totalAfterDiscount < 2000000 && (
              <View style={styles.freeShippingInfo}>
                <Text style={styles.freeShippingText}>
                  Mua thêm {formatPrice(2000000 - totalAfterDiscount)} để được miễn phí giao hàng
                </Text>
              </View>
            )}

            {/* Order Summary */}
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tạm tính</Text>
                <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
              </View>

              {appliedPromotion && discountAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Giảm giá ({appliedPromotion.code})</Text>
                  <Text style={[styles.summaryValue, { color: '#2e7d32' }]}>-{formatPrice(discountAmount)}</Text>
                </View>
              )}

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

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={2200}
      >
        {snackbar.message}
      </Snackbar>
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
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  content: {
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  itemCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
    backgroundColor: '#f8fafc',
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
    color: '#0f172a',
    marginBottom: 4,
    lineHeight: 22,
  },
  variantText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  qtyButton: {
    margin: 0,
    width: 36,
    height: 36,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    paddingHorizontal: 8,
    minWidth: 24,
    textAlign: 'center',
  },
  promoSection: {
    marginTop: 12,
    marginBottom: 12,
    gap: 8,
  },
  promoInput: {
    backgroundColor: '#fff',
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
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 12,
  },
  freeShippingText: {
    fontSize: 12,
    color: '#2563eb',
    textAlign: 'center',
    fontWeight: '500',
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
    color: '#0f172a',
  },
  summaryDivider: {
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2563eb',
  },
  shippingText: {
    color: '#10b981',
  },
  checkoutButton: {
    marginBottom: 16,
    borderRadius: 16,
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
    fontWeight: '700',
    color: '#0f172a',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000000',
  },
  errorMessage: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 32,
  },
})
