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
} from 'react-native-paper'
import { useCartStore } from '../../store/cart-store'
import { useAuthStore } from '../../store/auth-store'
import { AddressForm, type Address } from '../../components/checkout/AddressForm'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

/**
 * AddressScreen - Chọn hoặc nhập địa chỉ giao hàng
 *
 * Features:
 * - Display saved addresses
 * - Select existing address
 * - Add new address form
 * - Set default address
 * - Delete address
 * - Guest cart support
 */
export const AddressScreen = () => {
  const theme = useTheme()
  const navigation = useNavigation() as NativeStackNavigationProp<any>
  const { isAuthenticated } = useAuthStore()
  const { guestAddress } = useCartStore()

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Load saved addresses on mount
  React.useEffect(() => {
    loadAddresses()
  }, [])

  // If logged in, use saved addresses
  // If guest, use guest address from cart
  React.useEffect(() => {
    if (!isAuthenticated && guestAddress && !showForm) {
      setShowForm(true)
    }
  }, [isAuthenticated, guestAddress, showForm])

  const loadAddresses = async () => {
    try {
      setLoading(true)
      // TODO: Call API to get saved addresses
      // Mock data for now
      setSavedAddresses([
        {
          id: '1',
          recipientName: 'Nguyễn Văn A',
          recipientPhone: '0901234567',
          address: '123 Đường ABC',
          ward: 'Phường 1',
          district: 'Quận 1',
          province: 'Hà Nội',
          isDefault: true,
        },
        {
          id: '2',
          recipientName: 'Nguyễn Văn B',
          recipientPhone: '0987654321',
          address: '456 Đường XYZ',
          ward: 'Phường 2',
          district: 'Quận 3',
          province: 'TP. Hồ Chí Minh',
          isDefault: false,
        },
      ])
    } catch (error) {
      console.error('Error loading addresses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddressSelect = useCallback((address: Address) => {
    setSelectedAddress(address)
  }, [])

  const handleAddNew = useCallback(() => {
    setShowForm(true)
    setSelectedAddress(null)
  }, [])

  const handleEditAddress = useCallback((address: Address) => {
    setSelectedAddress(address)
    setShowForm(true)
  }, [])

  const handleDeleteAddress = useCallback((addressId: string) => {
    setSavedAddresses((prev) => prev.filter((a) => a.id !== addressId))
    if (selectedAddress?.id === addressId) {
      setSelectedAddress(null)
    }
  }, [selectedAddress])

  const handleFormSubmit = useCallback(async (addressData: Omit<Address, 'id'>) => {
    try {
      setSubmitting(true)

      if (selectedAddress) {
        // Update existing address
        // TODO: Call API to update address
        setSavedAddresses((prev) =>
          prev.map((a) =>
            a.id === selectedAddress.id ? { ...addressData, id: a.id } : a
          )
        )
      } else {
        // Add new address
        const newAddress: Address = {
          ...addressData,
          id: Date.now().toString(),
        }
        setSavedAddresses((prev) => [...prev, newAddress])
      }

      setShowForm(false)
      setSelectedAddress(null)
    } catch (error) {
      console.error('Error saving address:', error)
    } finally {
      setSubmitting(false)
    }
  }, [selectedAddress])

  const handleContinue = useCallback(() => {
    if (!selectedAddress && !guestAddress) {
      // Show error - need to select or add address
      return
    }

    // Navigate to payment screen
    navigation.navigate('CheckoutPayment' as never)
  }, [selectedAddress, guestAddress, navigation])

  const handleBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerRow}>
          <IconButton icon="arrow-left" size={24} onPress={handleBack} />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Địa chỉ giao hàng
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </Surface>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {!showForm ? (
          <>
            {/* Saved Addresses */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Địa chỉ đã lưu ({savedAddresses.length})
                </Text>
                <Button
                  mode="text"
                  onPress={handleAddNew}
                  icon="plus"
                >
                  Thêm mới
                </Button>
              </View>

              {savedAddresses.length === 0 ? (
                <Surface style={styles.emptyState} elevation={1}>
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    Bạn chưa có địa chỉ nào. Hãy thêm địa chỉ giao hàng mới.
                  </Text>
                </Surface>
              ) : (
                <View style={styles.addressList}>
                  {savedAddresses.map((address) => (
                    <Card
                      key={address.id}
                      style={[
                        styles.addressCard,
                        selectedAddress?.id === address.id && styles.selectedCard,
                      ]}
                      onPress={() => handleAddressSelect(address)}
                    >
                      <View style={styles.addressHeader}>
                        <Text variant="titleMedium" style={styles.recipientName}>
                          {address.recipientName}
                        </Text>
                        {address.isDefault && (
                          <Text style={styles.defaultBadge}>Mặc định</Text>
                        )}
                      </View>

                      <View style={styles.addressDetails}>
                        <Text variant="bodyMedium">{address.recipientPhone}</Text>
                        <Text variant="bodyMedium">
                          {address.address}, {address.ward}, {address.district}, {address.province}
                        </Text>
                      </View>

                      <Divider style={styles.divider} />

                      <View style={styles.addressActions}>
                        <Button
                          mode="text"
                          onPress={() => handleEditAddress(address)}
                          icon="pencil"
                        >
                          Sửa
                        </Button>
                        {!address.isDefault && (
                          <Button
                            mode="text"
                            onPress={() => handleDeleteAddress(address.id)}
                            icon="delete"
                            textColor={theme.colors.error}
                          >
                            Xóa
                          </Button>
                        )}
                      </View>
                    </Card>
                  ))}
                </View>
              )}
            </View>

            {/* Guest Address Hint */}
            {!isAuthenticated && (
              <Surface style={styles.guestHint} elevation={1}>
                <Text variant="bodyMedium" style={styles.guestHintText}>
                  💡 Đăng nhập để lưu địa chỉ cho lần sau.
                </Text>
              </Surface>
            )}
          </>
        ) : (
          /* Address Form */
          <>
            <Button
              mode="text"
              onPress={() => setShowForm(false)}
              icon="arrow-left"
              style={styles.backButton}
            >
              Quay lại danh sách
            </Button>

            <AddressForm
              initialAddress={selectedAddress || undefined}
              onSubmit={handleFormSubmit}
              loading={submitting}
              submitLabel={selectedAddress ? 'Cập nhật' : 'Thêm mới'}
            />
          </>
        )}
      </ScrollView>

      {/* Continue Button */}
      {!showForm && (
        <Surface style={styles.footer} elevation={3}>
          <Button
            mode="contained"
            onPress={handleContinue}
            disabled={!selectedAddress && !guestAddress}
            style={styles.continueButton}
            contentStyle={styles.continueButtonContent}
          >
            Tiếp tục
          </Button>
        </Surface>
      )}
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
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 24,
    borderRadius: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  addressList: {
    gap: 12,
  },
  addressCard: {
    borderRadius: 8,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#1e88e5',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipientName: {
    fontWeight: 'bold',
  },
  defaultBadge: {
    backgroundColor: '#4caf50',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
  addressDetails: {
    gap: 4,
    marginBottom: 12,
  },
  divider: {
    marginBottom: 12,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  guestHint: {
    padding: 16,
    borderRadius: 8,
  },
  guestHintText: {
    color: '#f57c00',
  },
  backButton: {
    marginLeft: -16,
    marginBottom: 8,
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
})
