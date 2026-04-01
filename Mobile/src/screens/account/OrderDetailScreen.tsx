import React, { useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
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
import { useNavigation } from '@react-navigation/native'
import { getOrderById } from '../../services/order-api'
import { bulkAddCartItems } from '../../services/cart-api'

interface OrderDetailScreenProps {
  route: {
    params?: {
      orderId?: string
    }
  }
}

const ORDER_STEPS = [
  { status: 'pending', label: 'Pending', icon: 'clock-outline' },
  { status: 'confirmed', label: 'Confirmed', icon: 'check-circle-outline' },
  { status: 'processing', label: 'Processing', icon: 'cog-outline' },
  { status: 'shipped', label: 'Shipped', icon: 'truck-outline' },
  { status: 'delivered', label: 'Delivered', icon: 'check-circle' },
  { status: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline' },
  { status: 'refunded', label: 'Refunded', icon: 'cash-refund' },
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
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<OrderItem | null>(null)
  const [reorderDialogVisible, setReorderDialogVisible] = useState(false)

  // Fetch order details
  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      if (!orderId) {
        setError('Missing order id.')
        setOrder(null)
        return
      }

      const data: any = await getOrderById(orderId)
      setOrder({
        id: data._id,
        orderNumber: data.orderNumber,
        createdAt: data.createdAt,
        status: (data.status || data.orderStatus || 'pending').toLowerCase(),
        total: data.total || data.totalAmount || 0,
        itemCount: Array.isArray(data.items) ? data.items.length : 0,
        items: (data.items || []).map((item: any) => ({
          productId: item.productId,
          variantSku: item.variantSku,
          name: item.productName || 'Sản phẩm',
          quantity: item.quantity || 0,
          price: item.price || item.priceAtOrder || 0,
          image: item.productImage || '',
        })),
        shippingAddress: data.shippingAddress
          ? {
              name: data.shippingAddress.fullName || '',
              phone: data.shippingAddress.phone || '',
              address: data.shippingAddress.address || data.shippingAddress.street || '',
              city: data.shippingAddress.city || '',
            }
          : undefined,
      })
    } catch (error) {
      console.error('Fetch order error:', error)
      setError('Unable to load order details. Please try again.')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  // Handle re-order
  const handleReorder = useCallback(() => {
    if (!order) return

    ;(async () => {
      try {
        await bulkAddCartItems(
          order.items.map((item: any) => ({
            productId: item.productId,
            variantSku: item.variantSku,
            quantity: item.quantity,
          }))
        )
        navigation.navigate('Cart' as never)
      } catch (error) {
        console.error('Reorder error:', error)
      } finally {
        setReorderDialogVisible(false)
      }
    })()
  }, [order, navigation])

  // Handle contact support
  const handleContactSupport = useCallback(() => {
    navigation.navigate('Contact' as never)
  }, [navigation])

  // Handle track order
  const handleTrackOrder = useCallback(() => {
    if (!order) return
    if (order.status === 'delivered') return
    navigation.navigate('OrderHistory' as never)
  }, [navigation, order])

  // Get status info
  const getStatusInfo = useCallback((status: OrderStatus) => {
    const statusMap: Record<OrderStatus, { label: string; color: string }> = {
      pending: { label: 'Pending', color: '#ffa726' },
      confirmed: { label: 'Confirmed', color: '#42a5f5' },
      processing: { label: 'Processing', color: '#ffa726' },
      shipped: { label: 'Shipped', color: '#29b6f6' },
      delivered: { label: 'Delivered', color: '#2e7d32' },
      cancelled: { label: 'Cancelled', color: '#e53935' },
      refunded: { label: 'Refunded', color: '#757575' },
    }
    return statusMap[status]
  }, [])

  // Get active steps
  const getActiveSteps = useCallback((status: OrderStatus) => {
    if (status === 'cancelled') {
      return ['pending', 'cancelled']
    }
    if (status === 'refunded') {
      return ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'refunded']
    }
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

  const handleReturnRequest = useCallback(() => {
    if (!order) return
    navigation.navigate('ReturnRequest' as never, { orderId: order.id } as never)
  }, [navigation, order])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Loading order details...
        </Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <IconButton icon="alert-circle-outline" size={64} iconColor={theme.colors.error} />
        <Text variant="titleMedium" style={styles.emptyTitle}>
          Something went wrong
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubtitle}>
          {error}
        </Text>
        <View style={styles.emptyActions}>
          <Button mode="contained" onPress={fetchOrderDetails} style={styles.backButton}>
            Retry
          </Button>
          <Button mode="text" onPress={() => navigation.navigate('OrderHistory' as never)}>
            Back to orders
          </Button>
        </View>
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
          Order not found
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubtitle}>
          The order may have been deleted or you do not have access.
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('OrderHistory' as never)}
          style={styles.backButton}
        >
          Back
        </Button>
      </View>
    )
  }

  const statusInfo = getStatusInfo(order.status)
  const activeSteps = getActiveSteps(order.status)
  const itemsSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingFee = Math.max(0, order.total - itemsSubtotal)
  const canTrack = order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'refunded'
  const canReturn = order.status === 'delivered'

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerRow}>
          <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Order details
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </Surface>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.statusHeaderCard} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionEyebrow}>
            Order status
          </Text>
          <View style={styles.statusHeaderTop}>
            <View style={styles.statusHeaderMeta}>
              <Text variant="titleMedium" style={styles.orderNumber}>
                #{order.orderNumber}
              </Text>
              <Text variant="bodySmall" style={styles.orderDate}>
                Placed at {formatDateTime(order.createdAt)}
              </Text>
            </View>
            <Chip
              mode="flat"
              style={[styles.statusChip, { backgroundColor: statusInfo.color }]}
              textStyle={styles.statusChipText}
            >
              {statusInfo.label}
            </Chip>
          </View>
        </Surface>

        <Surface style={styles.card} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionEyebrow}>
            Quick actions
          </Text>
          <View style={styles.actionGrid}>
            <Button
              mode="contained"
              onPress={handleTrackOrder}
              style={styles.actionButton}
              icon="truck-delivery-outline"
              disabled={!canTrack}
            >
              Track
            </Button>
            <Button
              mode="outlined"
              onPress={() => setReorderDialogVisible(true)}
              style={styles.actionButton}
              icon="cart-plus"
            >
              Reorder
            </Button>
            <Button
              mode="outlined"
              onPress={handleReturnRequest}
              style={styles.actionButton}
              icon="backup-restore"
              disabled={!canReturn}
            >
              Return
            </Button>
            <Button
              mode="outlined"
              onPress={handleContactSupport}
              style={styles.actionButton}
              icon="headset"
            >
              Support
            </Button>
          </View>
        </Surface>

        <Surface style={styles.card} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionEyebrow}>
            Order summary
          </Text>
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.infoLabel}>Order ID:</Text>
            <Text variant="bodyMedium" style={styles.infoValue}>{order.orderNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.infoLabel}>Item count:</Text>
            <Text variant="bodyMedium" style={styles.infoValue}>{order.itemCount}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.infoLabel}>Status:</Text>
            <Text variant="bodyMedium" style={styles.infoValue}>{statusInfo.label}</Text>
          </View>
        </Surface>

        <Surface style={styles.card} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionEyebrow}>
            Delivery progress
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

        <Surface style={styles.card} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionEyebrow}>
            Items
          </Text>

          {order.items.length === 0 ? (
            <Text variant="bodyMedium" style={styles.noAddress}>
              There are no items in this order.
            </Text>
          ) : (
            order.items.map((item, index) => (
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
                    Qty: {item.quantity}
                  </Text>
                  <Text variant="titleMedium" style={styles.itemPrice}>
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Surface>

        <Surface style={styles.card} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionEyebrow}>
            Shipping address
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
              No shipping address yet
            </Text>
          )}
        </Surface>

        <Surface style={styles.card} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionEyebrow}>
            Price details
          </Text>

          <View style={styles.summaryRow}>
            <Text variant="bodyMedium">Subtotal:</Text>
            <Text variant="bodyMedium">{formatPrice(itemsSubtotal)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text variant="bodyMedium">Shipping fee:</Text>
            <Text variant="bodyMedium">{formatPrice(shippingFee)}</Text>
          </View>

          <Divider style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text variant="titleLarge" style={styles.totalLabel}>
              Total:
            </Text>
            <Text variant="headlineMedium" style={styles.totalValue}>
              {formatPrice(order.total)}
            </Text>
          </View>
        </Surface>

        <Surface style={styles.card} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionEyebrow}>
            Support
          </Text>
          <Text variant="bodyMedium" style={styles.supportText}>
            Need help with returns, status, or payment? Our support team is ready to help.
          </Text>
          <Button mode="outlined" onPress={handleContactSupport} icon="message-text-outline">
            Go to support
          </Button>
        </Surface>
      </ScrollView>

      {/* Reorder Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={reorderDialogVisible}
          onDismiss={() => setReorderDialogVisible(false)}
        >
          <Dialog.Title>Reorder this order?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to reorder all items in this order?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setReorderDialogVisible(false)}>
              Cancel
            </Button>
            <Button onPress={handleReorder}>Confirm</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
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
    gap: 12,
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    backgroundColor: '#f8fafc',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    opacity: 0.7,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyActions: {
    gap: 8,
    width: '100%',
    alignItems: 'center',
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
  statusHeaderCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  statusHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusHeaderMeta: {
    flex: 1,
  },
  sectionEyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 10,
  },
  orderNumber: {
    fontWeight: '700',
    marginBottom: 4,
    color: '#0f172a',
  },
  orderDate: {
    color: '#64748b',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  infoLabel: {
    opacity: 0.7,
    flex: 1,
  },
  infoValue: {
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
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
  actionGrid: {
    gap: 10,
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
    backgroundColor: '#d1fae5',
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
  actionButton: {
    borderRadius: 8,
  },
  supportText: {
    opacity: 0.75,
    marginBottom: 12,
    lineHeight: 20,
  },
})
