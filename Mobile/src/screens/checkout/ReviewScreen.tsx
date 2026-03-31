import React, { useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native'
import {
  Text,
  Button,
  Surface,
  useTheme,
  IconButton,
  Card,
  Divider,
  Checkbox,
} from 'react-native-paper'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useCartStore } from '../../store/cart-store'
import type { Address } from '../../components/checkout/AddressForm'
import type { PaymentMethod } from './PaymentScreen'

export interface OrderTotals {
  subtotal: number
  tax: number
  shipping: number
  paymentFee: number
  total: number
}

interface ReviewScreenProps {
  route: {
    params?: {
      address?: Address
      shippingAddress?: Address
      paymentMethod?: PaymentMethod
      totals?: OrderTotals
    }
  }
}

const ORDER_TYPES = [
  {
    id: 'in_stock',
    name: 'Cửa hàng có sẵn',
    description: 'Sản phẩm có sẵn, giao ngay',
  },
  {
    id: 'preorder',
    name: 'Đặt trước',
    description: 'Sản phẩm sẽ có trong thời gian tới',
  },
  {
    id: 'prescription',
    name: 'Làm kính theo đơn kính',
    description: 'Làm tròng theo số đo của bạn',
  },
]

/**
 * ReviewScreen - Xem lại đơn hàng trước khi đặt
 *
 * Features:
 * - Display shipping address
 * - Display payment method
 * - Display order items list
 * - Display order totals
 * - Select order type
 * - Confirm order
 */
export const ReviewScreen: React.FC<ReviewScreenProps> = ({ route }) => {
  const theme = useTheme()
  const navigation = useNavigation() as NativeStackNavigationProp<any>
  const { items, clearCart } = useCartStore()

  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [selectedOrderType, setSelectedOrderType] = useState('in_stock')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePolicy, setAgreePolicy] = useState(false)

  const address = route.params?.address
  const shippingAddress = route.params?.shippingAddress || address
  const paymentMethod = route.params?.paymentMethod
  const totals = route.params?.totals

  // Calculate totals if not provided
  const calculatedTotals = React.useMemo(() => {
    if (totals && totals.total > 0) {
      return totals
    }

    // Calculate based on cart items (mock for now)
    const subtotalValue = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity)
    }, 0)
    const taxValue = subtotalValue * 0.1 // 10% VAT
    const shippingValue = items.length > 0 ? 30000 : 0 // 30k shipping
    const paymentFee = 0 // No fee for now
    const totalValue = subtotalValue + taxValue + shippingValue + paymentFee

    return {
      subtotal: subtotalValue,
      tax: taxValue,
      shipping: shippingValue,
      paymentFee,
      total: totalValue,
    }
  }, [totals, items])

  const formatPrice = React.useCallback((price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }, [])

  const getPaymentMethodName = React.useCallback((method: PaymentMethod) => {
    const paymentNames: Record<PaymentMethod, string> = {
      cod: 'Thanh toán khi nhận hàng (COD)',
      vnpay: 'VNPay',
      momo: 'MoMo',
      bank_transfer: 'Chuyển khoản ngân hàng',
    }
    return paymentNames[method] || method
  }, [])

  const handleOrderTypeSelect = useCallback((type: string) => {
    setSelectedOrderType(type)
  }, [])

  const handleConfirmOrder = useCallback(async () => {
    if (!agreeTerms || !agreePolicy) {
      Alert.alert(
        'Vui lòng đồng ý',
        'Bạn cần đồng ý với điều khoản và chính sách để tiếp tục.',
        [{ text: 'Đồng ý', style: 'default' }]
      )
      return
    }

    try {
      setProcessing(true)

      // TODO: Call checkout API to create order
      // For now, mock the order creation
      console.log('Creating order with:', {
        shippingAddress,
        paymentMethod,
        orderType: selectedOrderType,
        items,
        totals: calculatedTotals,
      })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Clear cart after successful order
      clearCart()

      // Navigate to success screen (will be implemented later)
      // For now, navigate back to Store
      navigation.navigate('HomeTab' as never)

      Alert.alert(
        'Đặt hàng thành công!',
        'Đơn hàng của bạn đã được đặt thành công. Chúng tôi sẽ liên hệ sớm nhất.',
        [
          { text: 'OK', onPress: () => navigation.navigate('StoreScreen' as never) }
        ]
      )
    } catch (error) {
      console.error('Create order error:', error)
      Alert.alert(
        'Lỗi',
        'Không thể đặt hàng. Vui lòng thử lại sau.',
        [{ text: 'OK', style: 'default' }]
      )
    } finally {
      setProcessing(false)
    }
  }, [
    agreeTerms,
    agreePolicy,
    shippingAddress,
    paymentMethod,
    selectedOrderType,
    items,
    calculatedTotals,
    clearCart,
    navigation,
  ])

  const handleBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const handleEditAddress = useCallback(() => {
    navigation.goBack()
    setTimeout(() => {
      navigation.navigate('CheckoutAddress' as any)
    }, 300)
  }, [navigation])

  const handleEditPayment = useCallback(() => {
    navigation.goBack()
    setTimeout(() => {
      navigation.navigate('CheckoutPayment' as any)
    }, 300)
  }, [navigation])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerRow}>
          <IconButton icon="arrow-left" size={24} onPress={handleBack} />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Xem lại đơn hàng
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </Surface>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Shipping Address */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Địa chỉ giao hàng
            </Text>
            <IconButton
              icon="pencil"
              size={20}
              onPress={handleEditAddress}
            />
          </View>

          {shippingAddress ? (
            <>
              <Text variant="titleSmall" style={styles.addressName}>
                {shippingAddress.recipientName}
              </Text>
              <Text variant="bodyMedium" style={styles.addressPhone}>
                {shippingAddress.recipientPhone}
              </Text>
              <Text variant="bodyMedium" style={styles.addressDetail}>
                {shippingAddress.address}, {shippingAddress.ward},{' '}
                {shippingAddress.district}, {shippingAddress.province}
              </Text>
              {shippingAddress.isDefault && (
                <Text variant="bodySmall" style={styles.defaultBadge}>
                  Mặc định
                </Text>
              )}
            </>
          ) : (
            <Text variant="bodyMedium" style={styles.emptyText}>
              Chưa có địa chỉ giao hàng
            </Text>
          )}
        </Surface>

        {/* Payment Method */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Phương thức thanh toán
            </Text>
            <IconButton
              icon="pencil"
              size={20}
              onPress={handleEditPayment}
            />
          </View>

          {paymentMethod ? (
            <View style={styles.paymentMethodInfo}>
              <Text variant="bodyLarge" style={styles.paymentMethodName}>
                {getPaymentMethodName(paymentMethod)}
              </Text>
            </View>
          ) : (
            <Text variant="bodyMedium" style={styles.emptyText}>
              Chưa chọn phương thức thanh toán
            </Text>
          )}
        </Surface>

        {/* Order Type */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Loại đơn hàng
          </Text>

          <View style={styles.orderTypeList}>
            {ORDER_TYPES.map((type) => (
              <Card
                key={type.id}
                style={[
                  styles.orderTypeCard,
                  selectedOrderType === type.id && styles.selectedOrderType,
                ]}
                onPress={() => handleOrderTypeSelect(type.id)}
              >
                <View style={styles.orderTypeContent}>
                  <Checkbox.Android
                    status={selectedOrderType === type.id ? 'checked' : 'unchecked'}
                    onPress={() => handleOrderTypeSelect(type.id)}
                  />
                  <View style={styles.orderTypeInfo}>
                    <Text variant="titleMedium" style={styles.orderTypeName}>
                      {type.name}
                    </Text>
                    <Text variant="bodySmall" style={styles.orderTypeDesc}>
                      {type.description}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </Surface>

        {/* Order Items */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Sản phẩm ({items.length})
          </Text>

          <View style={styles.itemsList}>
            {items.map((item) => (
              <View key={item._id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text variant="titleSmall" style={styles.itemName}>
                    {item.productName}
                  </Text>
                  {item.variantDetails && (
                    <>
                      {item.variantDetails.size && (
                        <Text variant="bodySmall" style={styles.itemVariant}>
                          Size: {item.variantDetails.size}
                        </Text>
                      )}
                      {item.variantDetails.color && (
                        <Text variant="bodySmall" style={styles.itemVariant}>
                          Màu: {item.variantDetails.color}
                        </Text>
                      )}
                    </>
                  )}
                  <Text variant="bodySmall" style={styles.itemQuantity}>
                    x{item.quantity}
                  </Text>
                </View>
                <Text variant="bodyMedium" style={styles.itemPrice}>
                  {formatPrice(item.price * item.quantity)}
                </Text>
              </View>
            ))}
          </View>
        </Surface>

        {/* Order Totals */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Chi tiết thanh toán
          </Text>

          <View style={styles.totalsRow}>
            <Text variant="bodyMedium">Tạm tính:</Text>
            <Text variant="bodyMedium">
              {formatPrice(calculatedTotals.subtotal)}
            </Text>
          </View>

          <View style={styles.totalsRow}>
            <Text variant="bodyMedium">Phí vận chuyển:</Text>
            <Text variant="bodyMedium">
              {formatPrice(calculatedTotals.shipping)}
            </Text>
          </View>

          <View style={styles.totalsRow}>
            <Text variant="bodyMedium">Thuế VAT (10%):</Text>
            <Text variant="bodyMedium">
              {formatPrice(calculatedTotals.tax)}
            </Text>
          </View>

          {calculatedTotals.paymentFee > 0 && (
            <View style={styles.totalsRow}>
              <Text variant="bodyMedium">Phí thanh toán:</Text>
              <Text variant="bodyMedium">
                {formatPrice(calculatedTotals.paymentFee)}
              </Text>
            </View>
          )}

          <Divider style={styles.totalsDivider} />

          <View style={styles.totalRow}>
            <Text variant="titleLarge" style={styles.totalLabel}>
              Tổng cộng:
            </Text>
            <Text variant="headlineMedium" style={styles.totalValue}>
              {formatPrice(calculatedTotals.total)}
            </Text>
          </View>
        </Surface>

        {/* Terms & Conditions */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.checkboxRow}>
            <Checkbox.Android
              status={agreeTerms ? 'checked' : 'unchecked'}
              onPress={() => setAgreeTerms(!agreeTerms)}
            />
            <Text variant="bodyMedium" style={styles.checkboxLabel}>
              Tôi đồng ý với{' '}
              <Text style={styles.link}>Điều khoản dịch vụ</Text>
            </Text>
          </View>

          <View style={styles.checkboxRow}>
            <Checkbox.Android
              status={agreePolicy ? 'checked' : 'unchecked'}
              onPress={() => setAgreePolicy(!agreePolicy)}
            />
            <Text variant="bodyMedium" style={styles.checkboxLabel}>
              Tôi đồng ý với{' '}
              <Text style={styles.link}>Chính sách bảo mật</Text>
            </Text>
          </View>
        </Surface>
      </ScrollView>

      {/* Confirm Button */}
      <Surface style={styles.footer} elevation={3}>
        <Button
          mode="contained"
          onPress={handleConfirmOrder}
          disabled={
            processing ||
            !agreeTerms ||
            !agreePolicy ||
            !shippingAddress ||
            !paymentMethod
          }
          loading={processing}
          style={styles.confirmButton}
          contentStyle={styles.confirmButtonContent}
        >
          {processing ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
        </Button>
      </Surface>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d1fae5',
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
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  headerSpacer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontWeight: 'bold',
  },
  addressName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addressPhone: {
    marginBottom: 4,
    opacity: 0.8,
  },
  addressDetail: {
    opacity: 0.8,
  },
  defaultBadge: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginTop: 8,
  },
  emptyText: {
    opacity: 0.6,
    fontStyle: 'italic',
  },
  paymentMethodInfo: {
    paddingVertical: 4,
  },
  paymentMethodName: {
    fontWeight: 'bold',
  },
  orderTypeList: {
    gap: 12,
  },
  orderTypeCard: {
    borderRadius: 8,
  },
  selectedOrderType: {
    borderWidth: 2,
    borderColor: '#1e88e5',
  },
  orderTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
  },
  orderTypeInfo: {
    flex: 1,
  },
  orderTypeName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderTypeDesc: {
    opacity: 0.7,
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemVariant: {
    opacity: 0.7,
    marginBottom: 2,
  },
  itemQuantity: {
    opacity: 0.6,
  },
  itemPrice: {
    fontWeight: 'bold',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalsDivider: {
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#e53935',
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#e53935',
    fontWeight: 'bold',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  checkboxLabel: {
    flex: 1,
  },
  link: {
    color: '#1e88e5',
    textDecorationLine: 'underline',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#d1fae5',
  },
  confirmButton: {
    borderRadius: 8,
  },
  confirmButtonContent: {
    paddingVertical: 12,
  },
})
