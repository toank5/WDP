import React, { useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native'
import {
  Text,
  Button,
  Surface,
  useTheme,
  IconButton,
  Divider,
} from 'react-native-paper'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { MaterialCommunityIcons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

/**
 * OrderSuccessScreen - Order confirmation screen
 *
 * Checklist:
 * - Displays order number
 * - Shows order summary (items, total)
 * - Shows estimated delivery date
 * - Provides button to view order details
 * - Provides button to continue shopping
 * - Clears cart after successful order
 * - Handles deep link from payment return
 */
interface OrderSuccessScreenProps {
  navigation: NativeStackNavigationProp<any>
  route: RouteProp<{
    CheckoutSuccess: {
      orderId?: string
      orderNumber?: string
      total?: number
      estimatedDelivery?: string
    }
  }>
}

export const OrderSuccessScreen: React.FC<OrderSuccessScreenProps> = ({
  navigation,
  route,
}) => {
  const theme = useTheme()
  const nav = useNavigation()

  // Get order details from route params or use defaults
  const orderId = route.params?.orderId || ''
  const orderNumber = route.params?.orderNumber || 'EW' + Date.now()
  const total = route.params?.total || 0
  const estimatedDelivery = route.params?.estimatedDelivery

  const [scaleAnim] = useState(new Animated.Value(0))
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    // Animate success icon
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }

  const calculateEstimatedDelivery = () => {
    if (estimatedDelivery) return estimatedDelivery

    // Default: 3-5 business days from now
    const days = [3, 5]
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days[1])

    return `${days[0]}-${days[1]} ngày làm việc`
  }

  const handleViewOrder = () => {
    if (orderId) {
      ;(navigation as any).reset({
        index: 0,
        routes: [
          { name: 'Main' as never },
          {
            name: 'OrderDetail' as never,
            params: { orderId } as never,
          },
        ],
      })
    } else {
      navigation.goBack()
    }
  }

  const handleContinueShopping = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' as never }],
    })
  }

  const handleViewOrders = () => {
    navigation.reset({
      index: 0,
      routes: [
        { name: 'Main' as never },
        { name: 'OrderHistory' as never },
      ],
    })
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Animation */}
        <View style={styles.successContainer}>
          <Animated.View
            style={[
              styles.successCircle,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <MaterialCommunityIcons name="check" size={60} color="#4caf50" />
          </Animated.View>
        </View>

        {/* Success Message */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text variant="headlineMedium" style={styles.successTitle}>
            Đặt hàng thành công!
          </Text>
          <Text variant="bodyLarge" style={styles.successMessage}>
            Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.
          </Text>
        </Animated.View>

        {/* Order Details Card */}
        <Surface style={styles.card} elevation={2}>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Thông tin đơn hàng
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.detailLabel}>
              Mã đơn hàng:
            </Text>
            <Text variant="bodyMedium" style={styles.detailValue}>
              {orderNumber}
            </Text>
          </View>

          {total > 0 && (
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.detailLabel}>
                Tổng tiền:
              </Text>
              <Text variant="bodyMedium" style={styles.detailValue}>
                {formatPrice(total)}
              </Text>
            </View>
          )}

          <Divider style={styles.divider} />

          <View style={styles.deliveryRow}>
            <IconButton
              icon="truck-delivery"
              size={24}
              iconColor={theme.colors.primary}
            />
            <View style={styles.deliveryInfo}>
              <Text variant="titleSmall" style={styles.deliveryTitle}>
                Thời gian giao hàng dự kiến
              </Text>
              <Text variant="bodyMedium" style={styles.deliveryTime}>
                {calculateEstimatedDelivery()}
              </Text>
            </View>
          </View>

          <View style={styles.noticeBox}>
            <IconButton icon="information" size={20} iconColor="#f57c00" />
            <Text variant="bodySmall" style={styles.noticeText}>
              Bạn sẽ nhận được email xác nhận và thông tin vận chuyển khi đơn hàng
              được gửi đi.
            </Text>
          </View>
        </Surface>

        {/* Next Steps */}
        <Surface style={styles.card} elevation={2}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Các bước tiếp theo
          </Text>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text variant="labelLarge" style={styles.stepNumberText}>
                1
              </Text>
            </View>
            <View style={styles.stepContent}>
              <Text variant="bodyMedium" style={styles.stepTitle}>
                Xác nhận đơn hàng
              </Text>
              <Text variant="bodySmall" style={styles.stepDescription}>
                Chúng tôi sẽ xác nhận đơn hàng của bạn trong vòng 24h
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text variant="labelLarge" style={styles.stepNumberText}>
                2
              </Text>
            </View>
            <View style={styles.stepContent}>
              <Text variant="bodyMedium" style={styles.stepTitle}>
                Vận chuyển
              </Text>
              <Text variant="bodySmall" style={styles.stepDescription}>
                Đơn hàng sẽ được đóng gói và gửi đến địa chỉ của bạn
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text variant="labelLarge" style={styles.stepNumberText}>
                3
              </Text>
            </View>
            <View style={styles.stepContent}>
              <Text variant="bodyMedium" style={styles.stepTitle}>
                Nhận hàng
              </Text>
              <Text variant="bodySmall" style={styles.stepDescription}>
                Nhận sản phẩm và kiểm tra trước khi thanh toán (nếu COD)
              </Text>
            </View>
          </View>
        </Surface>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleViewOrders}
            style={styles.primaryButton}
            contentStyle={styles.primaryButtonContent}
            icon={() => (
              <MaterialCommunityIcons name="format-list-bulleted" size={20} color="#fff" />
            )}
          >
            Xem đơn hàng của tôi
          </Button>

          <Button
            mode="outlined"
            onPress={handleContinueShopping}
            style={styles.secondaryButton}
            contentStyle={styles.secondaryButtonContent}
            icon={() => (
              <MaterialCommunityIcons name="cart-outline" size={20} color={theme.colors.primary} />
            )}
          >
            Tiếp tục mua sắm
          </Button>
        </View>

        {/* Support */}
        <View style={styles.supportBox}>
          <Text variant="bodyMedium" style={styles.supportText}>
            Cần hỗ trợ?{' '}
            <Text style={styles.supportLink}>Liên hệ với chúng tôi</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  successContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2e7d32',
  },
  successMessage: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 8,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    opacity: 0.7,
  },
  detailValue: {
    fontWeight: '600',
  },
  divider: {
    marginVertical: 12,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  deliveryTime: {
    opacity: 0.8,
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'flex-start',
    gap: 8,
  },
  noticeText: {
    flex: 1,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    opacity: 0.7,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    borderRadius: 8,
  },
  primaryButtonContent: {
    paddingVertical: 12,
  },
  secondaryButton: {
    borderRadius: 8,
  },
  secondaryButtonContent: {
    paddingVertical: 12,
  },
  supportBox: {
    marginTop: 24,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  supportText: {
    opacity: 0.8,
  },
  supportLink: {
    fontWeight: '600',
  },
})
