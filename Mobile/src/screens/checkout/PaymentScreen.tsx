import React, { useState, useCallback, useMemo } from 'react'
import { View, StyleSheet, ScrollView, Alert } from 'react-native'
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
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { CheckoutStepper, ScreenContainer } from '../../components'
import { useCart } from '../../store/cart-store'
import type { Address } from '../../components/checkout/AddressForm'

export type PaymentMethod = 'cod' | 'vnpay' | 'bank_transfer' | 'momo'
export type ShippingMethod = 'standard' | 'express'

export interface PaymentOption {
  id: PaymentMethod
  name: string
  icon: string
  description: string
  available: boolean
  details: string[]
}

interface PaymentScreenProps {
  route: {
    params?: {
      address?: Address
      shippingMethod?: ShippingMethod
      shippingPrice?: number
    }
  }
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'vnpay',
    name: 'VNPay',
    icon: 'credit-card',
    description: 'Secure online payment',
    available: true,
    details: ['Supports all major banks', 'Instant confirmation', '0% transaction fee'],
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    icon: 'cash',
    description: 'Pay when you receive',
    available: true,
    details: ['No prepayment needed', 'Flexible payment', 'Easy & safe'],
  },
  {
    id: 'momo',
    name: 'MoMo Wallet',
    icon: 'wallet-plus',
    description: 'Pay with digital wallet',
    available: true,
    details: ['Fast & secure', 'Cashback rewards', 'QR code support'],
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    icon: 'bank',
    description: 'Direct bank transfer',
    available: false,
    details: ['Coming soon', 'Multiple banks', 'Low fees'],
  },
]

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ route }) => {
  const theme = useTheme()
  const navigation = useNavigation() as NativeStackNavigationProp<any>
  const { subtotal, totalAfterDiscount, discountAmount, appliedPromotion, items } = useCart()

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('vnpay')
  const [loading, setLoading] = useState(false)

  const address = route.params?.address
  const shippingMethod = route.params?.shippingMethod || 'standard'
  const shippingPrice = route.params?.shippingPrice || 0

  const totals = useMemo(() => {
    const total = totalAfterDiscount + shippingPrice
    return {
      subtotal,
      discount: discountAmount,
      discountedSubtotal: totalAfterDiscount,
      shipping: shippingPrice,
      total,
    }
  }, [subtotal, totalAfterDiscount, discountAmount, shippingPrice])

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price)
  }, [])

  const handleContinue = useCallback(() => {
    if (!address) {
      Alert.alert('Error', 'Address is missing')
      return
    }

    setLoading(true)
    try {
      const selectedPaymentOption = PAYMENT_OPTIONS.find((opt) => opt.id === selectedPayment)
      if (!selectedPaymentOption?.available) {
        Alert.alert('Notice', 'This payment method is not available yet')
        setLoading(false)
        return
      }

      navigation.navigate('CheckoutReview', {
        address,
        paymentMethod: selectedPayment,
        shippingMethod,
        totals,
      })
    } catch (error) {
      console.error('Navigation error:', error)
      Alert.alert('Error', 'Failed to proceed')
    } finally {
      setLoading(false)
    }
  }, [address, selectedPayment, shippingMethod, totals, navigation])

  const handleBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const selectedPaymentOption = PAYMENT_OPTIONS.find((opt) => opt.id === selectedPayment)

  return (
    <ScreenContainer>
      <CheckoutStepper currentStep={3} />

      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerRow}>
          <IconButton icon="arrow-left" size={24} onPress={handleBack} />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Payment Method
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </Surface>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Delivery Summary */}
        <Surface style={styles.summaryCard} elevation={1}>
          <View style={styles.summaryHeader}>
            <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.primary} />
            <Text style={styles.summaryTitle}>Deliver to</Text>
          </View>
          {address && (
            <>
              <Text style={styles.summaryText}>{address.fullName}</Text>
              <Text style={styles.summaryDetailText}>
                {address.address}
                {address.ward && `, ${address.ward}`}
                {address.district && `, ${address.district}`}
              </Text>
            </>
          )}
        </Surface>

        {/* Payment Options */}
        <View style={styles.optionsSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Select Payment Method
          </Text>

          <RadioButton.Group value={selectedPayment} onValueChange={(value) => setSelectedPayment(value as PaymentMethod)}>
            {PAYMENT_OPTIONS.map((option) => (
              <Card
                key={option.id}
                style={[
                  styles.paymentCard,
                  selectedPayment === option.id && styles.paymentCardSelected,
                  !option.available && styles.paymentCardDisabled,
                ]}
                onPress={() => option.available && setSelectedPayment(option.id)}
              >
                <View style={styles.paymentCardContent}>
                  <View style={styles.paymentLeft}>
                    <RadioButton value={option.id} disabled={!option.available} />

                    <View style={styles.paymentIcon}>
                      <MaterialCommunityIcons
                        name={option.icon as any}
                        size={32}
                        color={option.available ? theme.colors.primary : '#cbd5e1'}
                      />
                    </View>

                    <View style={styles.paymentInfo}>
                      <Text style={[styles.paymentName, !option.available && styles.paymentNameDisabled]}>
                        {option.name}
                      </Text>
                      <Text style={[styles.paymentDescription, !option.available && styles.paymentDescriptionDisabled]}>
                        {option.description}
                      </Text>
                    </View>
                  </View>

                  {!option.available && (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>Coming Soon</Text>
                    </View>
                  )}
                </View>
              </Card>
            ))}
          </RadioButton.Group>
        </View>

        {/* Payment Details */}
        {selectedPaymentOption && selectedPaymentOption.available && (
          <Surface style={styles.detailsCard} elevation={1}>
            <View style={styles.detailsHeader}>
              <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.detailsTitle}>{selectedPaymentOption.name}</Text>
            </View>
            <Text style={styles.detailsDescription}>{selectedPaymentOption.description}</Text>

            <View style={styles.detailsList}>
              {selectedPaymentOption.details.map((detail, index) => (
                <View key={index} style={styles.detailsItem}>
                  <MaterialCommunityIcons name="check-circle-outline" size={16} color="#10b981" />
                  <Text style={styles.detailsItemText}>{detail}</Text>
                </View>
              ))}
            </View>
          </Surface>
        )}

        {/* Order Summary */}
        <Surface style={styles.summaryCard} elevation={1}>
          <Text style={styles.sectionTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({items.length} items)</Text>
            <Text style={styles.summaryValue}>{formatPrice(totals.subtotal)}</Text>
          </View>

          {appliedPromotion && totals.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount ({appliedPromotion.code})</Text>
              <Text style={styles.discountValue}>−{formatPrice(totals.discount)}</Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={totals.shipping === 0 ? styles.freeLabel : styles.summaryValue}>
              {totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping)}
            </Text>
          </View>

          <Divider style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(totals.total)}</Text>
          </View>
        </Surface>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <MaterialCommunityIcons name="shield-check" size={18} color="#10b981" />
          <Text style={styles.securityText}>Your payment information is secure and encrypted</Text>
        </View>
      </ScrollView>

      {/* Sticky Continue Button */}
      <Surface style={styles.footer} elevation={8}>
        <Button
          mode="contained"
          onPress={handleContinue}
          loading={loading}
          disabled={loading || !selectedPaymentOption?.available}
          style={styles.continueButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          Review Order
        </Button>
      </Surface>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 100,
  },
  /* Summary Cards */
  summaryCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  summaryDetailText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  discountValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  freeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
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
  /* Options Section */
  optionsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4,
  },
  paymentCard: {
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  paymentCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  paymentCardDisabled: {
    opacity: 0.5,
  },
  paymentCardContent: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentInfo: {
    flex: 1,
    gap: 2,
  },
  paymentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  paymentNameDisabled: {
    color: '#cbd5e1',
  },
  paymentDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  paymentDescriptionDisabled: {
    color: '#cbd5e1',
  },
  comingSoonBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  /* Details Card */
  detailsCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  detailsDescription: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 10,
  },
  detailsList: {
    gap: 6,
  },
  detailsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsItemText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '500',
  },
  /* Security Notice */
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  securityText: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '500',
    flex: 1,
  },
  /* Footer */
  footer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 16,
  },
  continueButton: {
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 10,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
})
