import React, { useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert, Linking, Image } from 'react-native'
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
import { useCart } from '../../store/cart-store'
import type { Address } from '../../components/checkout/AddressForm'
import type { PaymentMethod, ShippingMethod } from './PaymentScreen'
import { createCheckoutPayment } from '../../services/order-api'
import { CheckoutStepper, ScreenContainer } from '../../components'

export interface OrderTotals {
  subtotal: number
  discount?: number
  discountedSubtotal?: number
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
      shippingMethod?: ShippingMethod
      totals?: OrderTotals
    }
  }
}

/**
 * ReviewScreen - Xem lại đơn hàng trước khi đặt
 *
 * Features:
 * - Display shipping address
 * - Display payment method
 * - Display order items list
 * - Display order totals
 * - Confirm order
 */
export const ReviewScreen: React.FC<ReviewScreenProps> = ({ route }) => {
  const theme = useTheme()
  const navigation = useNavigation() as NativeStackNavigationProp<any>
  const { items, subtotal, discountAmount, totalAfterDiscount, appliedPromotion } = useCart()

  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePolicy, setAgreePolicy] = useState(false)

  const address = route.params?.address
  const shippingAddress = route.params?.shippingAddress || address
  const paymentMethod = route.params?.paymentMethod
  const shippingMethod = route.params?.shippingMethod || 'standard'
  const totals = route.params?.totals

  // Calculate totals if not provided
  const calculatedTotals = React.useMemo(() => {
    if (totals && totals.total > 0) {
      return totals
    }

    // Calculate based on cart items (mock for now)
    const subtotalValue = subtotal || items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const discountedSubtotal = totalAfterDiscount
    const shippingValue = items.length > 0 && discountedSubtotal >= 2000000 ? 0 : items.length > 0 ? 30000 : 0
    const paymentFee = 0 // No fee for now
    const totalValue = discountedSubtotal + shippingValue + paymentFee

    return {
      subtotal: subtotalValue,
      discount: discountAmount,
      discountedSubtotal,
      shipping: shippingValue,
      paymentFee,
      total: totalValue,
    }
  }, [totals, items, subtotal, discountAmount, totalAfterDiscount])

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

  const getShippingMethodName = React.useCallback((method: ShippingMethod) => {
    return method === 'express' ? 'Giao hàng nhanh (1-2 ngày)' : 'Giao hàng tiêu chuẩn (3-5 ngày)'
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

      if (!shippingAddress || !paymentMethod) {
        Alert.alert('Lỗi', 'Thiếu thông tin địa chỉ hoặc phương thức thanh toán')
        return
      }

      if (paymentMethod !== 'vnpay') {
        Alert.alert('Thông báo', 'Hiện tại ứng dụng chỉ hỗ trợ thanh toán VNPay.')
        return
      }

      const checkout = await createCheckoutPayment({
        shippingAddress: {
          fullName: shippingAddress.fullName,
          phone: shippingAddress.phone,
          address: shippingAddress.address,
          city: shippingAddress.city,
          district: shippingAddress.district,
          ward: shippingAddress.ward,
          zipCode: shippingAddress.postalCode,
        },
        shippingMethod: shippingMethod === 'express' ? 'EXPRESS' : 'STANDARD',
        promotionCode: appliedPromotion?.code,
      })

      if (checkout.paymentUrl) {
        const canOpen = await Linking.canOpenURL(checkout.paymentUrl)

        if (!canOpen) {
          throw new Error('Không thể mở liên kết thanh toán VNPay')
        }

        await Linking.openURL(checkout.paymentUrl)
      }

      navigation.reset({
        index: 0,
        routes: [
          { name: 'Main' as never },
          {
            name: 'Checkout' as never,
            params: {
              screen: 'CheckoutSuccess',
              params: {
                orderId: checkout.orderId,
                orderNumber: checkout.orderNumber,
                total: checkout.amount,
              },
            } as never,
          },
        ],
      })
    } catch (error) {
      console.error('Create order error:', error)
      ;(navigation as any).navigate('CheckoutFailed', {
        errorCode: 'ORDER_CREATE_FAILED',
        errorMessage: error instanceof Error ? error.message : 'Không thể đặt hàng. Vui lòng thử lại sau.',
        cartItemCount: items.length,
      })
    } finally {
      setProcessing(false)
    }
  }, [
    agreeTerms,
    agreePolicy,
    shippingAddress,
    paymentMethod,
    shippingMethod,
    appliedPromotion,
    items.length,
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
    <ScreenContainer>
      <CheckoutStepper currentStep={4} />
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
                {shippingAddress.fullName}
              </Text>
              <Text variant="bodyMedium" style={styles.addressPhone}>
                {shippingAddress.phone}
              </Text>
              <Text variant="bodyMedium" style={styles.addressDetail}>
                {shippingAddress.address}, {shippingAddress.ward ? `${shippingAddress.ward}, ` : ''}
                {shippingAddress.district}, {shippingAddress.city}
              </Text>
            </>
          ) : (
            <Text variant="bodyMedium" style={styles.emptyText}>
              Chưa có địa chỉ giao hàng
            </Text>
          )}
        </Surface>

        {/* Shipping Method */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Phương thức giao hàng
          </Text>
          <View style={styles.paymentMethodInfo}>
            <Text variant="bodyLarge" style={styles.paymentMethodName}>
              {getShippingMethodName(shippingMethod)}
            </Text>
          </View>
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

        {/* Order Items */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Sản phẩm ({items.length})
          </Text>

          <View style={styles.itemsList}>
            {items.map((item) => (
              <View key={item._id} style={styles.itemRow}>
                {item.productImage && (
                  <Image
                    source={{ uri: item.productImage }}
                    style={styles.itemImage}
                  />
                )}
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

          {appliedPromotion && (calculatedTotals.discount || 0) > 0 && (
            <View style={styles.totalsRow}>
              <Text variant="bodyMedium">Giảm giá ({appliedPromotion.code}):</Text>
              <Text variant="bodyMedium" style={{ color: '#2e7d32' }}>
                -{formatPrice(calculatedTotals.discount || 0)}
              </Text>
            </View>
          )}

          <View style={styles.totalsRow}>
            <Text variant="bodyMedium">Phí vận chuyển:</Text>
            <Text variant="bodyMedium">
              {calculatedTotals.shipping === 0 ? 'Miễn phí' : formatPrice(calculatedTotals.shipping)}
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
              <Text style={styles.link} onPress={() => (navigation as any).navigate('PolicyDetail', { type: 'terms' })}>
                Điều khoản dịch vụ
              </Text>
            </Text>
          </View>

          <View style={styles.checkboxRow}>
            <Checkbox.Android
              status={agreePolicy ? 'checked' : 'unchecked'}
              onPress={() => setAgreePolicy(!agreePolicy)}
            />
            <Text variant="bodyMedium" style={styles.checkboxLabel}>
              Tôi đồng ý với{' '}
              <Text style={styles.link} onPress={() => (navigation as any).navigate('PolicyDetail', { type: 'privacy' })}>
                Chính sách bảo mật
              </Text>
            </Text>
          </View>

          <Button
            mode="text"
            icon="truck-delivery-outline"
            onPress={() => (navigation as any).navigate('PolicyDetail', { type: 'shipping' })}
            contentStyle={{ justifyContent: 'flex-start' }}
          >
            Xem chính sách vận chuyển
          </Button>
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
    </ScreenContainer>
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
    borderRadius: 12,
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
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
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
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  confirmButton: {
    borderRadius: 12,
  },
  confirmButtonContent: {
    paddingVertical: 12,
  },
})
