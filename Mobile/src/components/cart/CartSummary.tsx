import React, { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import {
  Text,
  Divider,
  Surface,
  useTheme,
} from 'react-native-paper'
import { APP_CONFIG } from '../../config'

export interface CartTotals {
  subtotal: number
  tax: number
  shipping: number
  total: number
  discount?: number
}

interface CartSummaryProps {
  totals: CartTotals
  itemCount: number
  showTax?: boolean
  showShipping?: boolean
  taxRate?: number
  shippingRate?: number
}

/**
 * CartSummary - Display cart totals breakdown
 *
 * Features:
 * - Subtotal calculation
 * - Tax calculation (configurable rate)
 * - Shipping calculation (configurable rate)
 * - Discount display
 * - Total calculation
 * - Formatted prices in VND
 */
export const CartSummary: React.FC<CartSummaryProps> = ({
  totals,
  itemCount,
  showTax = true,
  showShipping = true,
  taxRate = 0.1, // 10% VAT
  shippingRate = 30000, // 30k flat rate
}) => {
  const theme = useTheme()

  // Calculate totals if not provided
  const calculatedTotals = useMemo(() => {
    if (totals.total > 0) {
      return totals
    }

    // Calculate based on item count (mock for now)
    const subtotal = totals.subtotal
    const tax = showTax ? subtotal * taxRate : 0
    const shipping = showShipping && itemCount > 0 ? shippingRate : 0
    const total = subtotal + tax + shipping - (totals.discount || 0)

    return {
      subtotal,
      tax,
      shipping,
      total,
      discount: totals.discount,
    }
  }, [totals, itemCount, showTax, showShipping, taxRate, shippingRate])

  // Format price helper
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: APP_CONFIG.currency,
    }).format(price)
  }

  return (
    <Surface style={styles.container} elevation={2}>
      <Text variant="titleMedium" style={styles.title}>
        Tóm tắt
      </Text>

      {/* Subtotal */}
      <View style={styles.row}>
        <Text variant="bodyMedium">Tạm tính:</Text>
        <Text variant="bodyMedium" style={styles.value}>
          {formatPrice(calculatedTotals.subtotal)}
        </Text>
      </View>

      {/* Discount */}
      {calculatedTotals.discount && calculatedTotals.discount > 0 && (
        <View style={styles.row}>
          <Text variant="bodyMedium" style={styles.discountLabel}>
            Giảm giá:
          </Text>
          <Text variant="bodyMedium" style={styles.discountValue}>
            -{formatPrice(calculatedTotals.discount)}
          </Text>
        </View>
      )}

      {/* Tax */}
      {showTax && (
        <View style={styles.row}>
          <Text variant="bodyMedium">
            Thuế VAT ({(taxRate * 100).toFixed(0)}%):
          </Text>
          <Text variant="bodyMedium" style={styles.value}>
            {formatPrice(calculatedTotals.tax)}
          </Text>
        </View>
      )}

      {/* Shipping */}
      {showShipping && (
        <View style={styles.row}>
          <Text variant="bodyMedium">
            Phí vận chuyển:
          </Text>
          <Text variant="bodyMedium" style={styles.value}>
            {itemCount > 0
              ? formatPrice(calculatedTotals.shipping)
              : 'Miễn phí'}
          </Text>
        </View>
      )}

      <Divider style={styles.divider} />

      {/* Total */}
      <View style={styles.totalRow}>
        <Text variant="titleLarge" style={styles.totalLabel}>
          Tổng cộng:
        </Text>
        <Text variant="headlineLarge" style={styles.totalValue}>
          {formatPrice(calculatedTotals.total)}
        </Text>
      </View>

      {/* Tax Note */}
      {showTax && (
        <Text variant="bodySmall" style={styles.note}>
          * Đã bao gồm thuế VAT ({(taxRate * 100).toFixed(0)}%)
        </Text>
      )}

      {/* Shipping Note */}
      {showShipping && (
        <Text variant="bodySmall" style={styles.note}>
          * Phí vận chuyển cố định {formatPrice(shippingRate)}
        </Text>
      )}
    </Surface>
  )
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  value: {
    fontWeight: '500',
  },
  discountLabel: {
    color: '#2e7d32',
  },
  discountValue: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  divider: {
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
  note: {
    opacity: 0.6,
    marginTop: 8,
    fontStyle: 'italic',
  },
})
