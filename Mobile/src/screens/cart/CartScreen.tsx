import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  RefreshControl,
  Animated,
  Easing,
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
  Chip,
} from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
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

/**
 * Improved CartItemCard with better visual hierarchy and interaction
 */
function CartItemCard({ item, onUpdateQty, onRemove, updating }: CartItemCardProps) {
  const theme = useTheme()
  const itemId = item._id || item.id || `${item.productId || 'item'}-${item.variantSku || 'default'}`
  const isUpdating = updating.has(itemId)

  return (
    <Card style={styles.itemCard}>
      <View style={styles.itemContent}>
        {/* Product Image - Larger and more prominent */}
        <View style={styles.imageContainer}>
          {item.productImage ? (
            <Image
              source={{ uri: item.productImage }}
              style={styles.productImage}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>👓</Text>
            </View>
          )}
        </View>

        {/* Product Info - Improved layout */}
        <View style={styles.productInfoSection}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.productName || 'Product'}
          </Text>

          {/* Variant Details - More refined */}
          <View style={styles.variantContainer}>
            {item.variantDetails?.color && (
              <Chip
                mode="outlined"
                compact
                icon="palette"
                style={styles.variantChip}
                textStyle={styles.variantChipText}
              >
                {item.variantDetails.color}
              </Chip>
            )}
            {item.variantDetails?.size && (
              <Chip
                mode="outlined"
                compact
                icon="ruler"
                style={styles.variantChip}
                textStyle={styles.variantChipText}
              >
                {item.variantDetails.size}
              </Chip>
            )}
          </View>

          {/* Price - Bold and accessible */}
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
        </View>

        {/* Quantity & Remove - Right-aligned controls */}
        <View style={styles.rightControls}>
          {/* Quantity Stepper */}
          <View style={styles.quantityControl}>
            <IconButton
              icon="minus-circle"
              size={28}
              onPress={() => onUpdateQty(itemId, item.quantity - 1)}
              disabled={!itemId || isUpdating || item.quantity <= 1}
              iconColor={theme.colors.primary}
            />
            <Text style={styles.quantityText}>{isUpdating ? '...' : item.quantity}</Text>
            <IconButton
              icon="plus-circle"
              size={28}
              onPress={() => onUpdateQty(itemId, item.quantity + 1)}
              disabled={!itemId || isUpdating}
              iconColor={theme.colors.primary}
            />
          </View>

          {/* Remove Button */}
          <IconButton
            icon="trash-can-outline"
            size={24}
            onPress={() => onRemove(itemId)}
            disabled={!itemId || isUpdating}
            iconColor={theme.colors.error}
          />
        </View>
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
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', action: null as (() => void) | null })
  const [removedItems, setRemovedItems] = useState<Map<string, any>>(new Map())

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
  }, [loadCart])

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
      Alert.alert('Error', 'Could not update quantity')
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
    // Find the item being removed for undo
    const itemToRemove = items.find(
      (i) => (i._id || `${i.productId || 'item'}-${i.variantSku || 'default'}`) === itemId
    )

    if (itemToRemove) {
      setRemovedItems((prev) => new Map(prev).set(itemId, itemToRemove))
    }

    setUpdating((prev) => new Set(prev).add(itemId))
    try {
      await removeItem(itemId)
      setSnackbar({
        visible: true,
        message: 'Item removed from cart',
        action: () => handleUndoRemove(itemId, itemToRemove),
      })
    } catch (error: any) {
      console.error('Failed to remove item:', error)
      Alert.alert('Error', 'Could not remove item')
      await loadCart()
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const handleUndoRemove = async (itemId: string, item: any) => {
    if (!item) return

    setSnackbar({ visible: false, message: '', action: null })
    setUpdating((prev) => new Set(prev).add(itemId))

    try {
      // Re-add the item with its previous quantity
      await updateQuantity(itemId, item.quantity)
      setRemovedItems((prev) => {
        const next = new Map(prev)
        next.delete(itemId)
        return next
      })
      setSnackbar({ visible: true, message: 'Item restored to cart', action: null })
    } catch (error: any) {
      console.error('Failed to restore item:', error)
      Alert.alert('Error', 'Could not restore item')
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const handleClearCart = async () => {
    Alert.alert(
      'Clear cart?',
      'Remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCart()
              await loadCart()
              setSnackbar({ visible: true, message: 'Cart cleared', action: null })
            } catch (error: any) {
              console.error('Failed to clear cart:', error)
              Alert.alert('Error', 'Could not clear cart')
            }
          },
        },
      ]
    )
  }

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      Alert.alert('Notice', 'Please enter a promo code')
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
        setSnackbar({
          visible: true,
          message: `Applied code ${result.promotion.code}`,
          action: null,
        })
      } else {
        Alert.alert('Invalid code', result.message || 'This code cannot be applied')
      }
    } catch (error: any) {
      console.error('Validate promotion error:', error)
      Alert.alert('Error', error?.message || 'Could not validate promo code')
    } finally {
      setValidatingPromo(false)
    }
  }

  const handleClearPromoCode = () => {
    clearPromotionCode()
    setPromoCode('')
    setSnackbar({ visible: true, message: 'Promo code removed', action: null })
  }

  const handleCheckout = () => {
    if (items.length === 0) return
    try {
      navigation.navigate('Checkout' as any)
    } catch (e) {
      const rootNav = navigation.getParent?.()?.getParent?.()
      if (rootNav) {
        rootNav.navigate('Checkout' as any)
      } else {
        Alert.alert('Error', 'Could not proceed to checkout')
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
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {Array.from({ length: 3 }).map((_, index) => (
            <CartItemSkeleton key={index} />
          ))}
        </ScrollView>
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
            <Divider style={styles.divider} />

            {/* Promo Code Section */}
            <View style={styles.promoSection}>
              <TextInput
                mode="outlined"
                label="Promo code (optional)"
                placeholder="SAVE20"
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
                style={styles.promoInput}
                disabled={!!appliedPromotion}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
              />
              {!appliedPromotion ? (
                <Button
                  mode="contained"
                  onPress={handleApplyPromoCode}
                  loading={validatingPromo}
                  disabled={validatingPromo || !promoCode.trim()}
                  style={styles.promoButton}
                >
                  Apply
                </Button>
              ) : (
                <Button
                  mode="outlined"
                  onPress={handleClearPromoCode}
                  style={styles.promoButton}
                >
                  Remove
                </Button>
              )}
            </View>

            {/* Free shipping info */}
            {totalAfterDiscount < 2000000 && (
              <View style={styles.freeShippingInfo}>
                <Text style={styles.freeShippingIcon}>🚚</Text>
                <Text style={styles.freeShippingText}>
                  {formatPrice(2000000 - totalAfterDiscount)} away from free shipping
                </Text>
              </View>
            )}

            {/* Order Summary */}
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
              </View>

              {appliedPromotion && discountAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Discount ({appliedPromotion.code})</Text>
                  <Text style={[styles.summaryValue, { color: '#10b981' }]}>
                    −{formatPrice(discountAmount)}
                  </Text>
                </View>
              )}

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping</Text>
                <Text style={[styles.summaryValue, shipping === 0 && styles.freeShippingLabel]}>
                  {shipping === 0 ? 'Free' : formatPrice(shipping)}
                </Text>
              </View>

              <Divider style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatPrice(total)}</Text>
              </View>

              <View style={styles.trustRow}>
                <MaterialCommunityIcons name="shield-check" size={14} color="#10b981" />
                <Text style={styles.trustText}>Free returns within 30 days</Text>
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
              Proceed to Checkout
            </Button>
          </View>
        </>
      ) : (
        /* Empty Cart */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyEmoji}>🛒</Text>
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>
            Start shopping to add items to your cart
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('HomeTab' as any)}
            style={styles.emptyButton}
          >
            Start Shopping
          </Button>

          {/* Trust & support section */}
          <View style={styles.trustSection}>
            <View style={styles.trustItem}>
              <Text style={styles.trustItemIcon}>📞</Text>
              <Text style={styles.trustItemText}>24/7 Support</Text>
            </View>
            <View style={styles.trustItem}>
              <Text style={styles.trustItemIcon}>✓</Text>
              <Text style={styles.trustItemText}>Secure Checkout</Text>
            </View>
            <View style={styles.trustItem}>
              <Text style={styles.trustItemIcon}>🔄</Text>
              <Text style={styles.trustItemText}>Easy Returns</Text>
            </View>
          </View>
        </View>
      )}

      {/* Undo Snackbar */}
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '', action: null })}
        duration={snackbar.action ? Snackbar.DURATION_LONG : Snackbar.DURATION_SHORT}
        action={
          snackbar.action
            ? {
                label: 'Undo',
                onPress: snackbar.action,
              }
            : undefined
        }
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
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  /* Card Items */
  itemCard: {
    marginHorizontal: 4,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  itemContent: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  imageContainer: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
  },
  productInfoSection: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 6,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 20,
  },
  variantContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  variantChip: {
    height: 28,
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
  },
  variantChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
    marginTop: 2,
  },
  rightControls: {
    gap: 8,
    alignItems: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 2,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    paddingHorizontal: 10,
    minWidth: 30,
    textAlign: 'center',
  },
  /* Footer */
  footer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  divider: {
    marginVertical: 12,
  },
  /* Promo Section */
  promoSection: {
    marginBottom: 12,
    gap: 10,
  },
  promoInput: {
    backgroundColor: '#f8fafc',
    fontSize: 14,
  },
  promoButton: {
    borderRadius: 10,
  },
  /* Free Shipping Info */
  freeShippingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  freeShippingIcon: {
    fontSize: 18,
  },
  freeShippingText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    fontWeight: '500',
  },
  freeShippingLabel: {
    color: '#10b981',
    fontWeight: '700',
  },
  /* Summary Section */
  summary: {
    padding: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  summaryDivider: {
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563eb',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  trustText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  /* Checkout Button */
  checkoutButton: {
    borderRadius: 12,
    marginBottom: 0,
  },
  checkoutButtonContent: {
    paddingVertical: 10,
  },
  checkoutButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  /* Empty State */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyEmoji: {
    fontSize: 80,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  emptyButton: {
    borderRadius: 12,
    marginBottom: 32,
    paddingHorizontal: 32,
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  trustItem: {
    alignItems: 'center',
    gap: 6,
  },
  trustItemIcon: {
    fontSize: 24,
  },
  trustItemText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  /* Error State */
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
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    color: '#0f172a',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    borderRadius: 12,
    paddingHorizontal: 32,
  },
})
