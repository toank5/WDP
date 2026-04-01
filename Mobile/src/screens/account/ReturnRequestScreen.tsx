import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import {
  Text,
  Button,
  Surface,
  useTheme,
  IconButton,
  TextInput,
  RadioButton,
  Divider,
  Chip,
  HelperText,
} from 'react-native-paper'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { getOrderById } from '../../services/order-api'
import type { Order, OrderItem } from '../../types'
import { createReturnRequest } from '../../services/return-api'

/**
 * ReturnRequestScreen - Return/exchange request screen
 *
 * Checklist:
 * - Displays order items eligible for return
 * - Allows selecting items to return
 * - Provides return reason options
 * - Allows uploading images of damaged/wrong items
 * - Shows return policy summary
 * - Displays estimated refund amount
 * - Submits return request successfully
 * - Shows confirmation after submission
 */
interface ReturnRequestScreenProps {
  navigation: NativeStackNavigationProp<any>
  route: RouteProp<{
    ReturnRequest: {
      orderId: string
    }
  }>
}

interface ReturnItem {
  orderItem: OrderItem
  reason: string
  quantity: number
  images?: string[]
}

const RETURN_REASONS = [
  { id: 'wrong_item', label: 'Sai sản phẩm', description: 'Sản phẩm khác với mô tả hoặc đơn đặt hàng' },
  { id: 'damaged', label: 'Sản phẩm bị lỗi', description: 'Sản phẩm bị hư hỏng khi nhận' },
  { id: 'defective', label: 'Lỗi sản xuất', description: 'Sản phẩm có lỗi từ nhà sản xuất' },
  { id: 'not_as_described', label: 'Không đúng mô tả', description: 'Sản phẩm không giống với hình ảnh/mô tả' },
  { id: 'changed_mind', label: 'Đổi ý', description: 'Không còn muốn sản phẩm' },
  { id: 'wrong_size', label: 'Sai kích thước', description: 'Kích thước không phù hợp' },
  { id: 'other', label: 'Lý do khác', description: 'Lý do khác (vui lòng ghi rõ)' },
]

const RETURN_CONDITIONS = [
  'Sản phẩm chưa qua sử dụng',
  'Vẫn còn tem mác và nguyên vẹn',
  'Trong vòng 30 ngày kể từ ngày nhận',
  'Hộp đóng gói còn nguyên vẹn',
]

export const ReturnRequestScreen: React.FC<ReturnRequestScreenProps> = ({
  navigation,
  route,
}) => {
  const theme = useTheme()

  const orderId = route.params?.orderId || ''

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectedReason, setSelectedReason] = useState('')
  const [otherReason, setOtherReason] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Fetch order details
  useEffect(() => {
    fetchOrderDetails()
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const orderData = await getOrderById(orderId)
      setOrder(orderData)
    } catch (error: any) {
      console.error('Fetch order error:', error)
      Alert.alert(
        'Lỗi',
        'Không thể tải thông tin đơn hàng.',
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      )
    } finally {
      setLoading(false)
    }
  }

  const isOrderEligibleForReturn = (): boolean => {
    if (!order) return false

    const deliveredDate = new Date(order.updatedAt)
    const daysSinceDelivery = Math.floor(
      (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    return (
      order.status === 'delivered' &&
      daysSinceDelivery <= 30
    )
  }

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
    setErrors({ ...errors, items: undefined })
  }

  const getReturnableItems = (): OrderItem[] => {
    if (!order) return []
    return order.items.filter(item => {
      // All items in a delivered order are potentially returnable
      return true
    })
  }

  const calculateRefundAmount = (): number => {
    if (!order || selectedItems.size === 0) return 0

    return order.items
      .filter(item => selectedItems.has(item.productId))
      .reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (selectedItems.size === 0) {
      newErrors.items = 'Vui lòng chọn ít nhất một sản phẩm'
    }

    if (!selectedReason) {
      newErrors.reason = 'Vui lòng chọn lý do trả hàng'
    }

    if (selectedReason === 'other' && !otherReason.trim()) {
      newErrors.otherReason = 'Vui lòng nhập lý do trả hàng'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmitReturn = async () => {
    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const returnItems = (order?.items || [])
        .filter((item) => selectedItems.has(item.productId))
        .map((item: any) => ({
          orderItemId: item.itemId || item._id || item.productId,
          quantity: item.quantity || 1,
          reason: selectedReason,
          description: selectedReason === 'other' ? otherReason.trim() : description.trim() || undefined,
        }))

      await createReturnRequest({
        orderId,
        reason: selectedReason,
        description: description.trim() || undefined,
        items: returnItems,
      })

      // Show success alert
      Alert.alert(
        'Gửi yêu cầu thành công!',
        'Yêu cầu trả hàng của bạn đã được ghi nhận. Chúng tôi sẽ liên hệ trong vòng 24h.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      )
    } catch (error: any) {
      console.error('Submit return error:', error)
      Alert.alert(
        'Lỗi',
        'Không thể gửi yêu cầu trả hàng. Vui lòng thử lại.',
        [{ text: 'OK' }]
      )
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải...</Text>
      </View>
    )
  }

  if (!order || !isOrderEligibleForReturn()) {
    return (
      <View style={styles.container}>
        <Surface style={styles.notEligibleCard} elevation={2}>
          <IconButton
            icon="information"
            size={48}
            iconColor="#f57c00"
            style={styles.notEligibleIcon}
          />
          <Text variant="titleLarge" style={styles.notEligibleTitle}>
            Không thể trả hàng
          </Text>
          <Text variant="bodyMedium" style={styles.notEligibleText}>
            {order?.status !== 'delivered'
              ? 'Chỉ có thể trả hàng sau khi đơn hàng đã được giao thành công.'
              : 'Đã quá thời hạn trả hàng (30 ngày).'}
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            Quay lại
          </Button>
        </Surface>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>
          Yêu cầu trả hàng
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          Đơn hàng: {order.orderNumber}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Return Conditions */}
        <Surface style={styles.card} elevation={2}>
          <View style={styles.cardHeader}>
            <IconButton icon="information" size={20} iconColor="#1976d2" />
            <Text variant="titleMedium" style={styles.cardTitle}>
              Điều kiện trả hàng
            </Text>
          </View>
          {RETURN_CONDITIONS.map((condition, index) => (
            <View key={index} style={styles.conditionRow}>
              <Text style={styles.conditionBullet}>•</Text>
              <Text variant="bodyMedium" style={styles.conditionText}>
                {condition}
              </Text>
            </View>
          ))}
        </Surface>

        {/* Select Items */}
        <Surface style={styles.card} elevation={2}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Chọn sản phẩm muốn trả
          </Text>
          {errors.items && (
            <HelperText type="error" visible={!!errors.items}>
              {errors.items}
            </HelperText>
          )}

          {getReturnableItems().map((item) => (
            <View key={item.productId} style={styles.itemRow}>
              <RadioButton
                value={item.productId}
                status={selectedItems.has(item.productId) ? 'checked' : 'unchecked'}
                onPress={() => toggleItemSelection(item.productId)}
              />
              <View style={styles.itemInfo}>
                <Text variant="titleMedium" style={styles.itemName}>
                  {item.productName}
                </Text>
                <View style={styles.itemDetails}>
                  <Text variant="bodySmall" style={styles.itemQuantity}>
                    x{item.quantity}
                  </Text>
                  <Text variant="bodyMedium" style={styles.itemPrice}>
                    {formatPrice(item.price)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Surface>

        {/* Return Reason */}
        <Surface style={styles.card} elevation={2}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Lý do trả hàng
          </Text>
          {errors.reason && (
            <HelperText type="error" visible={!!errors.reason}>
              {errors.reason}
            </HelperText>
          )}

          {RETURN_REASONS.map((reason) => (
            <View key={reason.id} style={styles.reasonRow}>
              <RadioButton
                value={reason.id}
                status={selectedReason === reason.id ? 'checked' : 'unchecked'}
                onPress={() => {
                  setSelectedReason(reason.id)
                  setErrors({ ...errors, reason: undefined })
                }}
              />
              <View style={styles.reasonInfo}>
                <Text variant="titleSmall" style={styles.reasonLabel}>
                  {reason.label}
                </Text>
                <Text variant="bodySmall" style={styles.reasonDescription}>
                  {reason.description}
                </Text>
              </View>
            </View>
          ))}

          {selectedReason === 'other' && (
            <TextInput
              label="Mô tả lý do"
              value={otherReason}
              onChangeText={(text) => {
                setOtherReason(text)
                setErrors({ ...errors, otherReason: undefined })
              }}
              mode="outlined"
              multiline
              numberOfLines={3}
              error={!!errors.otherReason}
              style={styles.otherReasonInput}
            />
          )}
        </Surface>

        {/* Additional Description */}
        <Surface style={styles.card} elevation={2}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Mô tả thêm (tùy chọn)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            placeholder="Vui lòng cung cấp thêm thông tin về vấn đề..."
            style={styles.descriptionInput}
          />
        </Surface>

        {/* Refund Summary */}
        {selectedItems.size > 0 && (
          <Surface style={[styles.card, styles.summaryCard]} elevation={2}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Thông tin hoàn tiền
            </Text>

            <View style={styles.summaryRow}>
              <Text variant="bodyMedium">Số sản phẩm:</Text>
              <Text variant="bodyMedium">{selectedItems.size}</Text>
            </View>

            <Divider style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text variant="titleMedium">Số tiền hoàn预估:</Text>
              <Text variant="titleLarge" style={styles.refundAmount}>
                {formatPrice(calculateRefundAmount())}
              </Text>
            </View>

            <Text variant="bodySmall" style={styles.refundNote}>
              Số tiền hoàn sẽ được tính toán sau khi kiểm tra sản phẩm
            </Text>
          </Surface>
        )}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleSubmitReturn}
          disabled={submitting || selectedItems.size === 0}
          loading={submitting}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    elevation: 2,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  headerSubtitle: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  conditionRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  conditionBullet: {
    fontSize: 20,
    marginRight: 8,
  },
  conditionText: {
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    marginBottom: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemQuantity: {
    opacity: 0.7,
  },
  itemPrice: {
    fontWeight: '600',
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reasonInfo: {
    flex: 1,
  },
  reasonLabel: {
    fontWeight: '600',
    marginBottom: 2,
  },
  reasonDescription: {
    opacity: 0.7,
  },
  otherReasonInput: {
    marginTop: 8,
  },
  descriptionInput: {
    backgroundColor: '#f5f5f5',
  },
  summaryCard: {
    backgroundColor: '#e8f5e9',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryDivider: {
    marginVertical: 12,
  },
  refundAmount: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  refundNote: {
    opacity: 0.7,
    marginTop: 8,
  },
  notEligibleCard: {
    flex: 1,
    margin: 32,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notEligibleIcon: {
    marginBottom: 16,
  },
  notEligibleTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  notEligibleText: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 24,
  },
  backButton: {
    borderRadius: 8,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    elevation: 4,
  },
  submitButton: {
    borderRadius: 8,
  },
  submitButtonContent: {
    paddingVertical: 12,
  },
})
