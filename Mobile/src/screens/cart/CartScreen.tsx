import React, { useCallback } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import {
  Text,
  Button,
  Divider,
  Surface,
  useTheme,
  Checkbox,
  IconButton,
} from 'react-native-paper'
import { useCartStore } from '../../store/cart-store'
import { useAuthStore } from '../../store/auth-store'
import { APP_CONFIG } from '../../config'
import { CartItem } from '../../components/cart/CartItem'
import { EmptyCart } from '../../components/cart/EmptyCart'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

interface CartItemData {
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
}

const SCREEN_PADDING = 32

/**
 * CartScreen - Display shopping cart items and totals
 *
 * Features:
 * - List cart items
 * - Select all/individual items
 * - Quantity adjustment
 * - Remove items
 * - Calculate totals
 * - Checkout button
 * - Empty cart state
 */
export const CartScreen = () => {
  const theme = useTheme()
  const navigation = useNavigation() as NativeStackNavigationProp<any>
  const { isAuthenticated } = useAuthStore()

  const {
    items,
    total,
    subtotal,
    clearCart,
    refreshCart,
    loading,
  } = useCartStore()

  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = React.useState(false)

  // Mock cart items (replace with actual cart data)
  const cartItems: CartItemData[] = React.useMemo(() => {
    if (items.length === 0) {
      return []
    }

    // Transform cart items to display format
    return items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      name: `Sản phẩm ${item.productId}`, // Will be updated with API
      image: 'https://via.placeholder.com/100x100',
      variantColor: 'Đen',
      variantSize: 'M',
      price: item.price || 150000,
      available: true,
    }))
  }, [items])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await refreshCart()
  }, [refreshCart])

  // Handle select all
  const handleSelectAll = useCallback(() => {
    const newSelectAll = !selectAll
    setSelectAll(newSelectAll)
    setSelectedItems(newSelectAll ? new Set(items.map((i) => i.id)) : new Set())
  }, [selectAll, items])

  // Handle item select
  const handleItemSelect = useCallback((itemId: string) => {
    setSelectedItems((prev) => {
      const newSelected = new Set(prev)
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId)
      } else {
        newSelected.add(itemId)
      }
      return newSelected
    })
  }, [])

  // Handle remove selected
  const handleRemoveSelected = useCallback(() => {
    selectedItems.forEach((itemId) => {
      const item = items.find((i) => i.id === itemId)
      if (item) {
        // Remove from cart
        console.log('Remove item:', itemId)
      }
    })
    setSelectedItems(new Set())
    setSelectAll(false)
  }, [selectedItems, items])

  // Handle checkout
  const handleCheckout = useCallback(() => {
    if (!isAuthenticated) {
      // Navigate to login
      console.log('Need to login first')
      return
    }

    // Navigate to checkout
    navigation.navigate('CheckoutAddress' as never)
  }, [isAuthenticated, navigation])

  // Calculate totals
  const { subtotal: calculatedSubtotal, tax, shipping, total: calculatedTotal } = React.useMemo(() => {
    const subtotalValue = subtotal
    const taxValue = subtotalValue * 0.1 // 10% VAT
    const shippingValue = items.length > 0 ? 30000 : 0 // 30k shipping
    const totalValue = subtotalValue + taxValue + shippingValue

    return {
      subtotal: subtotalValue,
      tax: taxValue,
      shipping: shippingValue,
      total: totalValue,
    }
  }, [subtotal, items.length])

  const formatPrice = React.useCallback((price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: APP_CONFIG.currency,
    }).format(price)
  }, [])

  const selectedCount = selectedItems.size
  const allSelected = selectedCount === items.length && items.length > 0

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  // Empty cart
  if (items.length === 0) {
    return <EmptyCart onShopNow={() => navigation.navigate('Store' as never)} />
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerRow}>
          <Text variant="titleLarge" style={styles.headerTitle}>
            Giỏ hàng ({items.length})
          </Text>
          <IconButton icon="delete-sweep" size={20} onPress={clearCart} />
        </View>
      </Surface>

      {/* Select All */}
      <View style={styles.selectAllRow}>
        <Checkbox
          status={allSelected ? 'checked' : 'unchecked'}
          onPress={handleSelectAll}
        />
        <Text variant="bodyMedium" onPress={handleSelectAll}>
          Chọn tất cả ({selectedCount}/{items.length})
        </Text>
        {selectedCount > 0 && (
          <Button
            mode="text"
            onPress={handleRemoveSelected}
            textColor={theme.colors.error}
            style={styles.removeSelectedButton}
          >
            Xóa đã chọn
          </Button>
        )}
      </View>

      {/* Cart Items */}
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CartItem
            {...item}
            selected={selectedItems.has(item.id)}
            onSelect={handleItemSelect}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />

      {/* Summary */}
      <Surface style={styles.summary} elevation={2}>
        <Text variant="titleMedium" style={styles.summaryTitle}>
          Tóm tắt
        </Text>

        <View style={styles.summaryRow}>
          <Text variant="bodyMedium">Tạm tính:</Text>
          <Text variant="bodyMedium" style={styles.summaryValue}>
            {formatPrice(calculatedSubtotal)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text variant="bodyMedium">Thuế VAT (10%):</Text>
          <Text variant="bodyMedium" style={styles.summaryValue}>
            {formatPrice(tax)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text variant="bodyMedium">Phí vận chuyển:</Text>
          <Text variant="bodyMedium" style={styles.summaryValue}>
            {formatPrice(shipping)}
          </Text>
        </View>

        <Divider style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Text variant="titleMedium" style={styles.totalLabel}>
            Tổng cộng:
          </Text>
          <Text variant="headlineMedium" style={styles.totalValue}>
            {formatPrice(calculatedTotal)}
          </Text>
        </View>
      </Surface>

      {/* Checkout Button */}
      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleCheckout}
          style={styles.checkoutButton}
          contentStyle={styles.checkoutButtonContent}
          disabled={items.length === 0}
        >
          Tiến hành thanh toán
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#fff',
  },
  removeSelectedButton: {
    marginLeft: 'auto',
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: SCREEN_PADDING,
  },
  summary: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  summaryTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryValue: {
    fontWeight: '500',
  },
  summaryDivider: {
    marginVertical: 12,
  },
  totalLabel: {
    color: '#e53935',
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#e53935',
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    paddingBottom: SCREEN_PADDING,
    backgroundColor: '#fff',
  },
  checkoutButton: {
    borderRadius: 8,
  },
  checkoutButtonContent: {
    paddingVertical: 8,
  },
})
