import React, { useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, ActivityIndicator, Linking } from 'react-native'
import {
  Text,
  Button,
  Surface,
  useTheme,
  IconButton,
  Chip,
  Card,
  Divider,
  Dialog,
  Portal,
} from 'react-native-paper'
import { APP_CONFIG } from '../../config'
import type { OrderStatus, OrderItem } from './OrderHistoryScreen'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

interface OrderDetailScreenProps {
  route: {
    params?: {
      orderId?: string
    }
  }
}

const ORDER_STEPS = [
  { status: 'pending', label: 'Chờ xử lý', icon: 'clock-outline' },
  { status: 'confirmed', label: 'Đã xác nhận', icon: 'check-circle-outline' },
  { status: 'processing', label: 'Đang xử lý', icon: 'cog-outline' },
  { status: 'shipped', label: 'Đã gửi', icon: 'truck-outline' },
  { status: 'delivered', label: 'Đã giao', icon: 'check-circle' },
  { status: 'cancelled', label: 'Đã hủy', icon: 'close-circle-outline' },
  { status: 'refunded', label: 'Đã hoàn', icon: 'cash-refund' },
]

/**
 * OrderDetailScreen - Display full order details
 *
 * Features:
 * - Display order information
 * - Show order items with quantities
 * - Display shipping address
 * - Display payment information
 * - Show order status timeline
 * - Support for re-order
 * - Contact support option
 */
export const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({ route }) => {
  const theme = useTheme()
  const navigation = useNavigation() as NativeStackNavigationProp<any>

  const orderId = route.params?.orderId
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<OrderItem | null>(null)
  const [reorderDialogVisible, setReorderDialogVisible] = useState(false)

  // Mock order data (replace with API call)
  const mockOrder: OrderItem = React.useMemo(() => {
    return {
      id: '1',
      orderNumber: 'ORD-2024-001',
      createdAt: new Date(2024, 2, 15, 10, 30, 0).toISOString(),
      status: 'delivered',
      total: 1500000,
      itemCount: 2,
      items: [
        {
          name: 'Gọng kính thời trang 01',
          quantity: 1,
          price: 800000,
          image: 'https://via.placeholder.com/200x200',
        },
        {
          name: 'Tròng chống tia UV',
          quantity: 1,
          price: 700000,
          image: 'https://via.placeholder.com/200x200',
        },
      ],
      shippingAddress: {
        name: 'Nguyễn Văn A',
        phone: '0123456789',
        address: '123 Đường ABC, Phường XYZ',
        city: 'Hồ Chí Minh',
      },
    }
  }, [])

  // Fetch order details
  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true)
      // TODO: Call API to get order details
      setOrder(mockOrder)
    } catch (error) {
      console.error('Fetch order error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle re-order
  const handleReorder = useCallback(() => {
    if (!order) return

    // TODO: Add all items to cart
    console.log('Re-order items:', order.items)

    // Navigate to cart
    navigation.navigate('Cart' as never)
    setReorderDialogVisible(false)
  }, [order, navigation])

  // Handle contact support
  const handleContactSupport = useCallback(() => {
    const phoneNumber = '1900xxxx'
    Linking.openURL(`tel:${phoneNumber}`)
  }, [])

  // Handle track order
  const handleTrackOrder = useCallback(() => {
    // TODO: Open tracking page
    console.log('Track order:', order?.orderNumber)
  }, [order])

  // Get status info
  const getStatusInfo = useCallback((status: OrderStatus) => {
    const statusMap: Record<OrderStatus, { label: string; color: string }> = {
      pending: { label: 'Chờ xử lý', color: '#ffa726' },
      confirmed: { label: 'Đã xác nhận', color: '#42a5f5' },
      processing: { label: 'Đang xử lý', color: '#ffa726' },
      shipped: { label: 'Đã gửi', color: '#29b6f6' },
      delivered: { label: 'Đã giao', color: '#2e7d32' },
      cancelled: { label: 'Đã hủy', color: '#e53935' },
      refunded: { label: 'Đã hoàn', color: '#757575' },
    }
    return statusMap[status]
  }, [])

  // Get active steps
  const getActiveSteps = useCallback((status: OrderStatus) => {
    const statusOrder: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
    const currentIndex = statusOrder.indexOf(status)
    return statusOrder.slice(0, currentIndex + 1)
  }, [])

  // Format price
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: APP_CONFIG.currency,
    }).format(price)
  }, [])

  // Format date time
  const formatDateTime = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [])

  // Load order on mount
  React.useEffect(() => {
    fetchOrderDetails()
  }, [fetchOrderDetails])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  if (!order) {
    return (
      <View style={styles.emptyContainer}>
        <IconButton
          icon="package-variant"
          size={64}
          iconColor={theme.colors.onSurfaceDisabled}
          style={styles.emptyIcon}
        />
        <Text variant="titleMedium" style={styles.emptyTitle}>
          Không tìm thấy đơn hàng
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('OrderHistory' as never)}
          style={styles.backButton}
        >
          Quay lại
        </Button>
      </View>
    )
  }

  const statusInfo = getStatusInfo(order.status)
  const activeSteps = getActiveSteps(order.status)

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerRow}>
          <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Chi tiết đơn hàng
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </Surface>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Order Info Card */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Thông tin đơn hàng
          </Text>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.infoLabel}>
              Mã đơn hàng:
            </Text>
            <Text variant="bodyMedium" style={styles.infoValue}>
              {order.orderNumber}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.infoLabel}>
              Ngày đặt:
            </Text>
            <Text variant="bodyMedium" style={styles.infoValue}>
              {formatDateTime(order.createdAt)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.infoLabel}>
              Trạng thái:
            </Text>
            <Chip
              mode="flat"
              style={[styles.statusChip, { backgroundColor: statusInfo.color }]}
              textStyle={styles.statusChipText}
            >
              {statusInfo.label}
            </Chip>
          </View>
        </Surface>

        {/* Order Status Timeline */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Trạng thái đơn hàng
          </Text>

          <View style={styles.timeline}>
            {ORDER_STEPS.map((step, index) => {
              const isActive = activeSteps.includes(step.status as OrderStatus)
              const isLast = index === ORDER_STEPS.length - 1

              return (
                <View key={step.status} style={styles.timelineItem}>
                  <View style={styles.timelineDot}>
                    <View
                      style={[
                        styles.timelineDotInner,
                        isActive && styles.timelineDotActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.timelineStepNumber,
                          isActive && styles.timelineStepNumberActive,
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text
                      variant="bodyMedium"
                      style={[
                        styles.timelineLabel,
                        isActive && styles.timelineLabelActive,
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.timelineLine,
                        isActive && styles.timelineLineActive,
                      ]}
                    />
                  )}
                </View>
              )
            })}
          </View>
        </Surface>

        {/* Order Items */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Sản phẩm ({order.itemCount})
          </Text>

          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemImageContainer}>
                <Text variant="bodyLarge" style={styles.itemImagePlaceholder}>
                  📦
                </Text>
              </View>
              <View style={styles.itemInfo}>
                <Text variant="titleSmall" style={styles.itemName}>
                  {item.name}
                </Text>
                <Text variant="bodySmall" style={styles.itemQuantity}>
                  Số lượng: {item.quantity}
                </Text>
                <Text variant="titleMedium" style={styles.itemPrice}>
                  {formatPrice(item.price * item.quantity)}
                </Text>
              </View>
            </View>
          ))}
        </Surface>

        {/* Shipping Address */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Địa chỉ giao hàng
          </Text>

          {order.shippingAddress ? (
            <>
              <Text variant="titleSmall" style={styles.addressName}>
                {order.shippingAddress.name}
              </Text>
              <Text variant="bodyMedium" style={styles.addressPhone}>
                {order.shippingAddress.phone}
              </Text>
              <Text variant="bodyMedium" style={styles.addressDetail}>
                {order.shippingAddress.address}, {order.shippingAddress.city}
              </Text>
            </>
          ) : (
            <Text variant="bodyMedium" style={styles.noAddress}>
              Chưa có địa chỉ giao hàng
            </Text>
          )}
        </Surface>

        {/* Order Summary */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Chi tiết thanh toán
          </Text>

          <View style={styles.summaryRow}>
            <Text variant="bodyMedium">Tạm tính:</Text>
            <Text variant="bodyMedium">{formatPrice(order.total * 0.8)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text variant="bodyMedium">Phí vận chuyển:</Text>
            <Text variant="bodyMedium">{formatPrice(30000)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text variant="bodyMedium">Thuế VAT (10%):</Text>
            <Text variant="bodyMedium">{formatPrice(order.total * 0.1)}</Text>
          </View>

          <Divider style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text variant="titleLarge" style={styles.totalLabel}>
              Tổng cộng:
            </Text>
            <Text variant="headlineMedium" style={styles.totalValue}>
              {formatPrice(order.total)}
            </Text>
          </View>
        </Surface>

        {/* Actions */}
        <Surface style={styles.actionsCard} elevation={1}>
          <Button
            mode="contained"
            onPress={() => setReorderDialogVisible(true)}
            style={styles.actionButton}
            icon="cart-plus"
          >
            Đặt lại đơn hàng này
          </Button>

          <Button
            mode="outlined"
            onPress={handleTrackOrder}
            style={styles.actionButton}
            icon="truck"
          >
            Theo dõi đơn hàng
          </Button>

          <Button
            mode="outlined"
            onPress={handleContactSupport}
            style={styles.actionButton}
            icon="phone"
          >
            Liên hệ hỗ trợ
          </Button>
        </Surface>
      </ScrollView>

      {/* Reorder Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={reorderDialogVisible}
          onDismiss={() => setReorderDialogVisible(false)}
        >
          <Dialog.Title>Đặt lại đơn hàng?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Bạn có chắc chắn muốn đặt lại tất cả sản phẩm trong đơn hàng này?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setReorderDialogVisible(false)}>
              Hủy
            </Button>
            <Button onPress={handleReorder}>Đồng ý</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: 24,
  },
  backButton: {
    borderRadius: 8,
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
    paddingBottom: 32,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    opacity: 0.7,
  },
  infoValue: {
    fontWeight: '500',
  },
  statusChip: {
    borderRadius: 16,
  },
  statusChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  timeline: {
    paddingVertical: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDot: {
    marginRight: 16,
  },
  timelineDotInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotActive: {
    backgroundColor: '#2e7d32',
  },
  timelineStepNumber: {
    color: '#9e9e9e',
    fontWeight: 'bold',
  },
  timelineStepNumberActive: {
    color: '#fff',
  },
  timelineContent: {
    flex: 1,
    paddingVertical: 4,
  },
  timelineLabel: {
    opacity: 0.6,
  },
  timelineLabelActive: {
    opacity: 1,
    fontWeight: 'bold',
  },
  timelineLine: {
    width: 2,
    height: 32,
    backgroundColor: '#e0e0e0',
    marginLeft: 15,
    marginTop: -16,
  },
  timelineLineActive: {
    backgroundColor: '#2e7d32',
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemImagePlaceholder: {
    fontSize: 32,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemQuantity: {
    opacity: 0.7,
    marginBottom: 4,
  },
  itemPrice: {
    color: '#e53935',
    fontWeight: 'bold',
  },
  addressName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addressPhone: {
    opacity: 0.8,
    marginBottom: 4,
  },
  addressDetail: {
    opacity: 0.8,
  },
  noAddress: {
    opacity: 0.6,
    fontStyle: 'italic',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  actionsCard: {
    padding: 16,
    borderRadius: 8,
  },
  actionButton: {
    borderRadius: 8,
    marginBottom: 8,
  },
})
