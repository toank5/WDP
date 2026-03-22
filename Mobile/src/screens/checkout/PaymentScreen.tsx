import React, { useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import {
  Text,
  Button,
  Surface,
  useTheme,
  IconButton,
  Card,
  Divider,
  RadioButton,
} from 'react-native-paper'
import { useCartStore } from '../../store/cart-store'
import type { Address } from '../../components/checkout/AddressForm'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

export type PaymentMethod = 'cod' | 'vnpay' | 'bank_transfer' | 'momo'

export interface PaymentOption {
  id: PaymentMethod
  name: string
  icon: string
  description: string
  available: boolean
  fee?: number
}

interface PaymentScreenProps {
  route: {
    params?: {
      address?: Address
    }
  }
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'cod',
    name: 'Thanh toán khi nhận hàng (COD)',
    icon: 'cash',
    description: 'Thanh toán bằng tiền mặt khi nhận hàng',
    available: true,
  },
  {
    id: 'vnpay',
    name: 'VNPay',
    icon: 'credit-card',
    description: 'Thanh toán qua ví VNPay',
    available: true,
    fee: 0, // VNPay thường không phí
  },
  {
    id: 'momo',
    name: 'MoMo',
    icon: 'wallet',
    description: 'Thanh toán qua ví MoMo',
    available: true,
    fee: 0, // MoMo thường không phí
  },
  {
    id: 'bank_transfer',
    name: 'Chuyển khoản ngân hàng',
    icon: 'bank',
    description: 'Chuyển khoản qua ngân hàng',
    available: true,
    fee: 0,
  },
]

/**
 * PaymentScreen - Chọn phương thức thanh toán
 *
 * Features:
 * - Display available payment methods
 * - Select payment method
 * - Show payment fee (nếu có)
 * - Payment method descriptions
 * - Continue to review screen
 */
export const PaymentScreen: React.FC<PaymentScreenProps> = ({ route }) => {
  const theme = useTheme()
  const navigation = useNavigation() as NativeStackNavigationProp<any>
  const { subtotal, items } = useCartStore()

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cod')
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  const selectedAddress = route.params?.address

  // Calculate totals
  const totals = React.useMemo(() => {
    const subtotalValue = subtotal
    const taxValue = subtotalValue * 0.1 // 10% VAT
    const shippingValue = items.length > 0 ? 30000 : 0 // 30k shipping
    const paymentOption = PAYMENT_OPTIONS.find((opt) => opt.id === selectedPayment)
    const paymentFee = paymentOption?.fee || 0
    const totalValue = subtotalValue + taxValue + shippingValue + paymentFee

    return {
      subtotal: subtotalValue,
      tax: taxValue,
      shipping: shippingValue,
      paymentFee,
      total: totalValue,
    }
  }, [subtotal, items.length, selectedPayment])

  const formatPrice = React.useCallback((price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }, [])

  const handlePaymentSelect = useCallback((method: PaymentMethod) => {
    setSelectedPayment(method)
  }, [])

  const handleContinue = useCallback(() => {
    if (!selectedAddress) {
      // Should not happen as address is selected in previous step
      return
    }

    // Navigate to review screen
    navigation.navigate('CheckoutReview' as never, {
      address: selectedAddress,
      paymentMethod: selectedPayment,
      totals,
    })
  }, [selectedAddress, selectedPayment, totals, navigation])

  const handleBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const handleVNPay = useCallback(async () => {
    try {
      setProcessing(true)

      // TODO: Call VNPay API to get payment URL
      // For now, mock the flow
      console.log('Initiating VNPay payment...')

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // TODO: Open VNPay payment page in WebView or external browser
      console.log('VNPay payment initiated')
    } catch (error) {
      console.error('VNPay error:', error)
    } finally {
      setProcessing(false)
    }
  }, [])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  const selectedPaymentOption = PAYMENT_OPTIONS.find((opt) => opt.id === selectedPayment)

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerRow}>
          <IconButton icon="arrow-left" size={24} onPress={handleBack} />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Phương thức thanh toán
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </Surface>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Order Summary */}
        <Surface style={styles.summaryCard} elevation={1}>
          <Text variant="titleMedium" style={styles.summaryTitle}>
            Tóm tắt đơn hàng
          </Text>

          <View style={styles.summaryRow}>
            <Text variant="bodyMedium">Sản phẩm ({items.length}):</Text>
            <Text variant="bodyMedium">{formatPrice(totals.subtotal)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text variant="bodyMedium">Phí vận chuyển:</Text>
            <Text variant="bodyMedium">{formatPrice(totals.shipping)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text variant="bodyMedium">Thuế VAT (10%):</Text>
            <Text variant="bodyMedium">{formatPrice(totals.tax)}</Text>
          </View>

          {totals.paymentFee > 0 && (
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium">Phí thanh toán:</Text>
              <Text variant="bodyMedium">{formatPrice(totals.paymentFee)}</Text>
            </View>
          )}

          <Divider style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text variant="titleLarge" style={styles.totalLabel}>
              Tổng cộng:
            </Text>
            <Text variant="headlineMedium" style={styles.totalValue}>
              {formatPrice(totals.total)}
            </Text>
          </View>
        </Surface>

        {/* Payment Methods */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Chọn phương thức thanh toán
        </Text>

        <View style={styles.paymentList}>
          {PAYMENT_OPTIONS.map((option) => (
            <Card
              key={option.id}
              style={[
                styles.paymentCard,
                selectedPayment === option.id && styles.selectedCard,
              ]}
              onPress={() => handlePaymentSelect(option.id)}
              disabled={!option.available}
            >
              <View style={styles.paymentCardHeader}>
                <View style={styles.paymentInfo}>
                  <RadioButton
                    value={option.id}
                    status={selectedPayment === option.id ? 'checked' : 'unchecked'}
                    onPress={() => handlePaymentSelect(option.id)}
                  />
                  <View style={styles.paymentDetails}>
                    <View style={styles.paymentNameRow}>
                      <Text variant="titleMedium" style={styles.paymentName}>
                        {option.name}
                      </Text>
                      {option.fee && option.fee > 0 && (
                        <Text variant="bodySmall" style={styles.feeText}>
                          +{formatPrice(option.fee)}
                        </Text>
                      )}
                    </View>
                    <Text variant="bodySmall" style={styles.description}>
                      {option.description}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Payment Method Info */}
        {selectedPaymentOption && (
          <Surface style={styles.infoCard} elevation={1}>
            <View style={styles.infoRow}>
              <IconButton
                icon="information"
                size={20}
                iconColor={theme.colors.primary}
              />
              <View style={styles.infoContent}>
                <Text variant="bodyMedium" style={styles.infoTitle}>
                  {selectedPaymentOption.name}
                </Text>
                <Text variant="bodySmall" style={styles.infoText}>
                  {selectedPaymentOption.description}
                </Text>
                {selectedPayment === 'cod' && (
                  <Text variant="bodySmall" style={styles.infoText}>
                    • Thanh toán bằng tiền mặt khi nhận hàng
                  </Text>
                )}
                {selectedPayment === 'vnpay' && (
                  <>
                    <Text variant="bodySmall" style={styles.infoText}>
                      • Thanh toán an toàn qua VNPay
                    </Text>
                    <Text variant="bodySmall" style={styles.infoText}>
                      • Hỗ trợ nhiều ngân hàng
                    </Text>
                  </>
                )}
                {selectedPayment === 'momo' && (
                  <>
                    <Text variant="bodySmall" style={styles.infoText}>
                      • Thanh toán nhanh qua ví MoMo
                    </Text>
                    <Text variant="bodySmall" style={styles.infoText}>
                      • Hỗ trợ QR code và App
                    </Text>
                  </>
                )}
                {selectedPayment === 'bank_transfer' && (
                  <>
                    <Text variant="bodySmall" style={styles.infoText}>
                      • Chuyển khoản trực tiếp qua ngân hàng
                    </Text>
                    <Text variant="bodySmall" style={styles.infoText}>
                      • Xác nhận trong 1-2 ngày làm việc
                    </Text>
                  </>
                )}
              </View>
            </View>
          </Surface>
        )}

        {/* VNPay Button (when VNPay selected) */}
        {selectedPayment === 'vnpay' && (
          <Button
            mode="contained"
            onPress={handleVNPay}
            loading={processing}
            disabled={processing}
            style={styles.vnpayButton}
            contentStyle={styles.vnpayButtonContent}
            icon="qrcode"
          >
            Thanh toán qua VNPay
          </Button>
        )}
      </ScrollView>

      {/* Continue Button */}
      <Surface style={styles.footer} elevation={3}>
        <Button
          mode="contained"
          onPress={handleContinue}
          disabled={!selectedPayment || processing}
          style={styles.continueButton}
          contentStyle={styles.continueButtonContent}
        >
          Tiếp tục
        </Button>
      </Surface>
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
  summaryCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
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
  divider: {
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
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  paymentList: {
    gap: 12,
  },
  paymentCard: {
    borderRadius: 8,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#1e88e5',
  },
  paymentCardHeader: {
    padding: 12,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  paymentName: {
    fontWeight: 'bold',
  },
  feeText: {
    color: '#e53935',
  },
  description: {
    opacity: 0.7,
  },
  infoCard: {
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoText: {
    opacity: 0.8,
    marginBottom: 2,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
  },
  continueButton: {
    borderRadius: 8,
  },
  continueButtonContent: {
    paddingVertical: 12,
  },
  vnpayButton: {
    borderRadius: 8,
    marginTop: 16,
  },
  vnpayButtonContent: {
    paddingVertical: 12,
  },
})
