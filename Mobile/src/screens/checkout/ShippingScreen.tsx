import React, { useState, useCallback, useMemo } from 'react'
import { View, StyleSheet, ScrollView, Animated, Easing } from 'react-native'
import {
  Text,
  Button,
  Surface,
  useTheme,
  IconButton,
  Card,
  RadioButton,
  Divider,
} from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useCart } from '../../store/cart-store'
import type { Address } from '../../components/checkout/AddressForm'
import type { ShippingMethod } from './PaymentScreen'
import { CheckoutStepper, ScreenContainer } from '../../components'

interface ShippingScreenProps {
  route: {
    params?: {
      address?: Address
    }
  }
}

interface ShippingOption {
  id: ShippingMethod
  name: string
  description: string
  icon: string
  deliveryDays: string
  price: number
  freeAbove?: number
}

const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    description: 'Reliable delivery',
    icon: 'truck',
    deliveryDays: '3-5 business days',
    price: 30000,
    freeAbove: 2000000,
  },
  {
    id: 'express',
    name: 'Express Shipping',
    description: 'Fast delivery',
    icon: 'truck-fast',
    deliveryDays: '1-2 business days',
    price: 50000,
  },
]

export const ShippingScreen: React.FC<ShippingScreenProps> = ({ route }) => {
  const theme = useTheme()
  const navigation = useNavigation() as NativeStackNavigationProp<any>
  const { totalAfterDiscount } = useCart()

  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod>('standard')
  const [loading, setLoading] = useState(false)

  const selectedAddress = route.params?.address

  // Calculate shipping price based on cart value
  const shippingPrice = useMemo(() => {
    const selected = SHIPPING_OPTIONS.find((opt) => opt.id === selectedShipping)
    if (!selected) return 0

    // Apply free shipping if applicable
    if (selected.freeAbove && totalAfterDiscount >= selected.freeAbove) {
      return 0
    }

    return selected.price
  }, [selectedShipping, totalAfterDiscount])

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price)
  }, [])

  const handleContinue = useCallback(() => {
    setLoading(true)
    try {
      navigation.navigate('CheckoutPayment', {
        address: selectedAddress,
        shippingMethod: selectedShipping,
        shippingPrice,
      })
    } catch (error) {
      console.error('Navigation error:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedAddress, selectedShipping, shippingPrice, navigation])

  const handleBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  return (
    <ScreenContainer>
      <CheckoutStepper currentStep={2} />

      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerRow}>
          <IconButton icon="arrow-left" size={24} onPress={handleBack} />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Shipping Method
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </Surface>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Delivery To Section */}
        {selectedAddress && (
          <Surface style={styles.deliveryCard} elevation={1}>
            <View style={styles.deliveryHeader}>
              <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.primary} />
              <Text variant="titleSmall" style={styles.deliveryLabel}>
                Deliver to
              </Text>
            </View>

            <Text variant="bodyMedium" style={styles.deliveryAddress}>
              {selectedAddress.fullName}
            </Text>
            <Text variant="bodySmall" style={styles.deliveryDetails}>
              {selectedAddress.address}
              {selectedAddress.ward && `, ${selectedAddress.ward}`}
              {selectedAddress.district && `, ${selectedAddress.district}`}
            </Text>
          </Surface>
        )}

        {/* Shipping Options */}
        <View style={styles.optionsSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Choose your delivery option
          </Text>

          <RadioButton.Group value={selectedShipping} onValueChange={(value) => setSelectedShipping(value as ShippingMethod)}>
            {SHIPPING_OPTIONS.map((option) => {
              const isFree = option.freeAbove && totalAfterDiscount >= option.freeAbove
              const price = isFree ? 0 : option.price

              return (
                <Card
                  key={option.id}
                  style={[styles.optionCard, selectedShipping === option.id && styles.optionCardSelected]}
                  onPress={() => setSelectedShipping(option.id)}
                >
                  <View style={styles.optionContent}>
                    <RadioButton value={option.id} />

                    <View style={styles.optionIcon}>
                      <MaterialCommunityIcons name={option.icon as any} size={28} color={theme.colors.primary} />
                    </View>

                    <View style={styles.optionInfo}>
                      <Text variant="titleSmall" style={styles.optionName}>
                        {option.name}
                      </Text>
                      <Text variant="bodySmall" style={styles.optionDescription}>
                        {option.description}
                      </Text>
                      <Text variant="labelSmall" style={styles.optionDelivery}>
                        📅 {option.deliveryDays}
                      </Text>
                    </View>

                    <View style={styles.optionPrice}>
                      {isFree ? (
                        <Text style={styles.freeLabel}>Free</Text>
                      ) : (
                        <Text style={styles.priceLabel}>{formatPrice(price)}</Text>
                      )}
                    </View>
                  </View>
                </Card>
              )
            })}
          </RadioButton.Group>

          {/* Free Shipping Notice */}
          {totalAfterDiscount >= 2000000 && (
            <View style={styles.freeShippingNotice}>
              <MaterialCommunityIcons name="gift" size={18} color="#10b981" />
              <Text style={styles.freeShippingText}>
                ✓ You've unlocked free standard shipping
              </Text>
            </View>
          )}
        </View>

        {/* Summary Card */}
        <Surface style={styles.summaryCard} elevation={1}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(totalAfterDiscount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            {shippingPrice === 0 ? (
              <Text style={styles.freeLabel}>Free</Text>
            ) : (
              <Text style={styles.summaryValue}>{formatPrice(shippingPrice)}</Text>
            )}
          </View>

          <Divider style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(totalAfterDiscount + shippingPrice)}</Text>
          </View>
        </Surface>

        {/* Trust Elements */}
        <View style={styles.trustSection}>
          <View style={styles.trustItem}>
            <MaterialCommunityIcons name="package-variant-closed" size={20} color={theme.colors.primary} />
            <Text style={styles.trustText}>Tracked delivery</Text>
          </View>
          <View style={styles.trustItem}>
            <MaterialCommunityIcons name="lock" size={20} color={theme.colors.primary} />
            <Text style={styles.trustText}>Secure packaging</Text>
          </View>
          <View style={styles.trustItem}>
            <MaterialCommunityIcons name="undo" size={20} color={theme.colors.primary} />
            <Text style={styles.trustText}>Free returns</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky continue button */}
      <Surface style={styles.footer} elevation={8}>
        <Button
          mode="contained"
          onPress={handleContinue}
          loading={loading}
          disabled={loading || !selectedAddress}
          style={styles.continueButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          Continue to Payment
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
  /* Delivery Card */
  deliveryCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  deliveryLabel: {
    fontWeight: '600',
    color: '#0f172a',
  },
  deliveryAddress: {
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  deliveryDetails: {
    color: '#64748b',
    lineHeight: 18,
  },
  /* Shipping Options */
  optionsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4,
  },
  optionCard: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  optionCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInfo: {
    flex: 1,
    gap: 4,
  },
  optionName: {
    fontWeight: '600',
    color: '#0f172a',
  },
  optionDescription: {
    color: '#64748b',
  },
  optionDelivery: {
    color: '#2563eb',
    fontWeight: '500',
  },
  optionPrice: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  freeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
  freeShippingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  freeShippingText: {
    fontSize: 13,
    color: '#15803d',
    fontWeight: '500',
    flex: 1,
  },
  /* Summary Card */
  summaryCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginTop: 12,
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
  /* Trust Section */
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 8,
  },
  trustItem: {
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
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
