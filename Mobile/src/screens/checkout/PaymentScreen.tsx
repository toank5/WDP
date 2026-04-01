import React, { useState, useCallback, useEffect } from 'react'
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native'
import {
  Text,
  Button,
  Surface,
  useTheme,
  IconButton,
  Card,
  Divider,
  RadioButton,
  TextInput,
} from 'react-native-paper'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useCartStore, getGuestCartForCheckout, type GuestCustomerInfo } from '../../store/cart-store'
import type { Address } from '../../components/checkout/AddressForm'
import { getPaymentConfig, getVnpayPaymentUrl, type PaymentConfig } from '../../services/payment-api'

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
    fee: 0,
  },
  {
    id: 'momo',
    name: 'MoMo',
    icon: 'wallet',
    description: 'Thanh toán qua ví MoMo',
    available: true,
    fee: 0,
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

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ route }) => {
  const theme = useTheme()
  const navigation = useNavigation() as NativeStackNavigationProp<any>
  const { subtotal, items } = useCartStore()

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cod')
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [customerInfo, setCustomerInfo] = useState<GuestCustomerInfo | null>(null)
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Partial<GuestCustomerInfo>>({})
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null)
  const [showVnpayModal, setShowVnpayModal] = useState(false)
  const [vnpayQrCode, setVnpayQrCode] = useState<string>('')
  const [vnpayPaymentUrl, setVnpayPaymentUrl] = useState<string>('')

  const selectedAddress = route.params?.address

  useEffect(() => {
    loadCustomerInfo()
    loadPaymentConfig()
  }, [])

  const loadCustomerInfo = async () => {
    try {
      const data = await getGuestCartForCheckout()
      setCustomerInfo(data.customerInfo)
    } catch (error) {
      console.error('Failed to load customer info:', error)
    }
  }

  const loadPaymentConfig = async () => {
    try {
      const config = await getPaymentConfig()
      setPaymentConfig(config)
    } catch (error) {
      console.error('Failed to load payment config:', error)
    }
  }

  const totals = React.useMemo(() => {
    const subtotalValue = subtotal
    const taxValue = subtotalValue * 0.1
    const shippingValue = items.length > 0 ? 30000 : 0
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

  const validateEmail = useCallback((email?: string): boolean => {
    if (!email) return false
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }, [])

  const validatePhone = useCallback((phone?: string): boolean => {
    if (!phone) return false
    const phoneRegex = /^(0|\+84)[1-9]\d{8,9}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }, [])

  const handlePaymentSelect = useCallback((method: PaymentMethod) => {
    setSelectedPayment(method)
  }, [])

  const handleSaveCustomerInfo = useCallback(async () => {
    if (editingCustomer.email && !validateEmail(editingCustomer.email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ')
      return
    }

    if (editingCustomer.phone && !validatePhone(editingCustomer.phone)) {
      Alert.alert('Lỗi', 'Số điện thoại không hợp lệ')
      return
    }

    try {
      const updatedInfo: GuestCustomerInfo = {
        ...customerInfo,
        ...editingCustomer,
      }

      const { saveCustomerInfo } = useCartStore.getState()
      await saveCustomerInfo(updatedInfo)

      setCustomerInfo(updatedInfo)
      setEditingCustomer({})
      setShowCustomerForm(false)

      Alert.alert('Thành công', 'Đã lưu thông tin khách hàng')
    } catch (error) {
      console.error('Failed to save customer info:', error)
      Alert.alert('Lỗi', 'Không thể lưu thông tin khách hàng')
    }
  }, [customerInfo, editingCustomer, validateEmail, validatePhone])

  const handleContinue = useCallback(() => {
    if (!selectedAddress) {
      return
    }

    if (!customerInfo?.phone) {
      Alert.alert(
        'Thông báo',
        'Vui lòng cung cấp số điện thoại để chúng tôi có thể liên hệ.',
        [
          {
            text: 'Thêm',
            onPress: () => {
              setEditingCustomer({ phone: '', ...customerInfo })
              setShowCustomerForm(true)
            },
          },
          {
            text: 'Hủy',
            style: 'cancel',
          },
        ]
      )
      return
    }

    if (!validatePhone(customerInfo.phone)) {
      Alert.alert(
        'Lỗi',
        'Số điện thoại không hợp lệ. Vui lòng cập nhật.',
        [
          {
            text: 'Cập nhật',
            onPress: () => {
              setEditingCustomer({ ...customerInfo })
              setShowCustomerForm(true)
            },
          },
          {
            text: 'Hủy',
            style: 'cancel',
          },
        ]
      )
      return
    }

    navigation.navigate('CheckoutReview' as never, {
      address: selectedAddress,
      paymentMethod: selectedPayment,
      totals,
      customerInfo,
    })
  }, [selectedAddress, selectedPayment, totals, customerInfo, validatePhone, navigation])

  const handleBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const handleVNPay = useCallback(async () => {
    try {
      setProcessing(true)

      // Check if VNPay is enabled
      if (!paymentConfig?.vnpay?.enabled) {
        Alert.alert(
          'Thông báo',
          'VNPay hiện đang được bảo trì. Vui lòng chọn phương thức thanh toán khác.',
          [{ text: 'OK' }]
        )
        return
      }

      // Use QR code from config or backend
      const qrCode = paymentConfig.vnpay.qrCode || process.env.VNPAY_QR_CODE || ''
      if (!qrCode) {
        Alert.alert(
          'Thông báo',
          'Không thể tạo mã QR thanh toán. Vui lòng chọn phương thức thanh toán khác.',
          [{ text: 'OK' }]
        )
        return
      }

      setVnpayQrCode(qrCode)
      setVnpayPaymentUrl(paymentConfig.vnpay.paymentUrl || '')
      setShowVnpayModal(true)

      console.log('VNPay QR code generated:', qrCode)
    } catch (error) {
      console.error('VNPay error:', error)
      Alert.alert(
        'Lỗi',
        'Không thể khởi tạo thanh toán VNPay. Vui lòng thử lại sau.',
        [{ text: 'OK' }]
      )
    } finally {
      setProcessing(false)
    }
  }, [paymentConfig])

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
        <Surface style={styles.summaryCard} elevation={1}>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={styles.summaryTitle}>
              Thông tin khách hàng
            </Text>
            <Button
              mode="text"
              onPress={() => {
                setEditingCustomer({
                  fullName: customerInfo?.fullName || '',
                  phone: customerInfo?.phone || '',
                  email: customerInfo?.email || '',
                  address: customerInfo?.address || '',
                  ward: customerInfo?.ward || '',
                  district: customerInfo?.district || '',
                  province: customerInfo?.province || '',
                })
                setShowCustomerForm(true)
              }}
              icon="pencil"
              compact
            >
              {customerInfo ? 'Sửa' : 'Thêm'}
            </Button>
          </View>

          {showCustomerForm ? (
            <View>
              <TextInput
                label="Họ tên"
                value={editingCustomer.fullName}
                onChangeText={(text) => setEditingCustomer({ ...editingCustomer, fullName: text })}
                mode="outlined"
                style={styles.formInput}
              />
              <TextInput
                label="Số điện thoại"
                value={editingCustomer.phone}
                onChangeText={(text) => setEditingCustomer({ ...editingCustomer, phone: text })}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.formInput}
                error={editingCustomer.phone && !validatePhone(editingCustomer.phone)}
              />
              <TextInput
                label="Email"
                value={editingCustomer.email}
                onChangeText={(text) => setEditingCustomer({ ...editingCustomer, email: text })}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.formInput}
                error={editingCustomer.email && !validateEmail(editingCustomer.email)}
              />
              <TextInput
                label="Địa chỉ"
                value={editingCustomer.address}
                onChangeText={(text) => setEditingCustomer({ ...editingCustomer, address: text })}
                mode="outlined"
                style={styles.formInput}
              />
              <View style={styles.addressDetailRow}>
                <TextInput
                  label="Phường/Xã"
                  value={editingCustomer.ward}
                  onChangeText={(text) => setEditingCustomer({ ...editingCustomer, ward: text })}
                  mode="outlined"
                  style={[styles.formInput, styles.flex1]}
                />
                <TextInput
                  label="Quận/Huyện"
                  value={editingCustomer.district}
                  onChangeText={(text) => setEditingCustomer({ ...editingCustomer, district: text })}
                  mode="outlined"
                  style={[styles.formInput, styles.flex1]}
                />
              </View>
              <TextInput
                label="Tỉnh/Thành phố"
                value={editingCustomer.province}
                onChangeText={(text) => setEditingCustomer({ ...editingCustomer, province: text })}
                mode="outlined"
                style={styles.formInput}
              />
              <View style={styles.formActions}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setEditingCustomer({})
                    setShowCustomerForm(false)
                  }}
                  style={styles.formButton}
                >
                  Hủy
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveCustomerInfo}
                  style={styles.formButton}
                >
                  Lưu
                </Button>
              </View>
            </View>
          ) : customerInfo ? (
            <View style={styles.customerInfo}>
              {customerInfo.fullName && (
                <View style={styles.customerInfoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>
                    Họ tên:
                  </Text>
                  <Text variant="bodyMedium">{customerInfo.fullName}</Text>
                </View>
              )}
              {customerInfo.phone && (
                <View style={styles.customerInfoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>
                    Số điện thoại:
                  </Text>
                  <Text variant="bodyMedium">{customerInfo.phone}</Text>
                </View>
              )}
              {customerInfo.email && (
                <View style={styles.customerInfoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>
                    Email:
                  </Text>
                  <Text variant="bodyMedium">{customerInfo.email}</Text>
                </View>
              )}
              {customerInfo.address && (
                <View style={styles.customerInfoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>
                    Địa chỉ:
                  </Text>
                  <Text variant="bodyMedium" style={styles.flex1}>
                    {customerInfo.address}, {customerInfo.ward}, {customerInfo.district}, {customerInfo.province}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text variant="bodyMedium" style={styles.emptyText}>
              Chưa có thông tin khách hàng. Vui lòng thêm thông tin để tiếp tục.
            </Text>
          )}
        </Surface>

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

        {selectedPaymentOption && (
          <Surface style={styles.infoCard} elevation={1}>
            <View style={styles.paymentInfoRow}>
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

      {/* VNPay QR Code Modal */}
      <Modal
        visible={showVnpayModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVnpayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Surface style={styles.modalContent} elevation={4}>
              <View style={styles.modalHeader}>
                <Text variant="titleLarge" style={styles.modalTitle}>
                  Thanh toán VNPay
                </Text>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={() => setShowVnpayModal(false)}
                />
              </View>

              <Divider style={styles.modalDivider} />

              <View style={styles.modalBody}>
                <Text variant="bodyMedium" style={styles.modalText}>
                  Quét mã QR bên dưới để thanh toán
                </Text>

                <View style={styles.qrCodeContainer}>
                  <Text variant="headlineMedium" style={styles.qrCodeText}>
                    {vnpayQrCode}
                  </Text>
                </View>

                <Text variant="bodySmall" style={styles.modalHint}>
                  Mã QR: {vnpayQrCode}
                </Text>

                <Text variant="bodySmall" style={styles.modalNote}>
                  • Sử dụng app VNPay để quét mã
                </Text>
                <Text variant="bodySmall" style={styles.modalNote}>
                  • Sau khi thanh toán thành công, bấm "Đã thanh toán"
                </Text>

                <View style={styles.modalActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowVnpayModal(false)}
                    style={styles.modalButton}
                  >
                    Hủy
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => {
                      setShowVnpayModal(false)
                      handleContinue()
                    }}
                    style={styles.modalButton}
                    icon="check-circle"
                  >
                    Đã thanh toán
                  </Button>
                </View>
              </View>
            </Surface>
          </View>
        </View>
      </Modal>
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
  summaryCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerInfo: {
    paddingTop: 8,
  },
  customerInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  formInput: {
    marginBottom: 12,
  },
  addressDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flex1: {
    flex: 1,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  formButton: {
    flex: 1,
  },
  infoLabel: {
    minWidth: 100,
    opacity: 0.7,
  },
  emptyText: {
    opacity: 0.6,
    fontStyle: 'italic',
    paddingVertical: 8,
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
    marginBottom: 16,
  },
  paymentCard: {
    borderRadius: 8,
    marginBottom: 12,
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
  },
  paymentInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  paymentDetails: {
    flex: 1,
    marginLeft: 12,
  },
  paymentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '80%',
  },
  modalContent: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  modalDivider: {
    marginVertical: 0,
  },
  modalBody: {
    padding: 20,
  },
  modalText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  qrCodeContainer: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1e88e5',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  qrCodeText: {
    color: '#1e88e5',
    fontWeight: 'bold',
  },
  modalHint: {
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  modalNote: {
    opacity: 0.7,
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
})
