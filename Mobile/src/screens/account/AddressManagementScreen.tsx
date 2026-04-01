import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native'
import {
  Text,
  Button,
  IconButton,
  TextInput,
  Chip,
  FAB,
  Dialog,
  Portal,
} from 'react-native-paper'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../types'
import { Loading } from '../../components/Loading'
import { getMyProfile, updateMyProfile } from '../../services/user-api'

type Props = NativeStackScreenProps<RootStackParamList, any>

interface Address {
  id: string
  type: 'SHIPPING' | 'BILLING'
  isDefault: boolean
  street: string
  city: string
  zipCode: string
  phone?: string
}

interface AddressFormData {
  street: string
  city: string
  zipCode: string
  phone: string
  type: 'SHIPPING' | 'BILLING'
}

const DEFAULT_FORM_DATA: AddressFormData = {
  street: '',
  city: '',
  zipCode: '',
  phone: '',
  type: 'SHIPPING',
}

// Colors
const COLORS = {
  primary: '#6366f1',
  error: '#ef4444',
  warning: '#f59e0b',
  surface: '#ffffff',
  onSurface: '#f1f5f9',
  onSurfaceDisabled: '#64748b',
}

export function AddressManagementScreen({ navigation }: Props) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [isDefaultAddress, setIsDefaultAddress] = useState(true)
  const [formData, setFormData] = useState<AddressFormData>({ ...DEFAULT_FORM_DATA })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showAddDialog, setShowAddDialog] = useState(false)

  useEffect(() => {
    loadAddresses()
  }, [])

  const loadAddresses = async () => {
    try {
      setLoading(true)
      const profile = await getMyProfile()
      const rawAddresses = Array.isArray((profile as any).addresses)
        ? ((profile as any).addresses as Array<any>)
        : []
      const mapped = rawAddresses.map((item, index) => ({
        id: String(item._id || item.id || index + 1),
        type: item.type || 'SHIPPING',
        isDefault: Boolean(item.isDefault),
        street: item.street || item.address || '',
        city: item.city || '',
        zipCode: item.zipCode || '',
        phone: item.phone || '',
      }))
      setAddresses(mapped)
    } catch (error) {
      console.error('Failed to load addresses:', error)
      Alert.alert('Lỗi', 'Không thể tải danh sách địa chỉ')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.street.trim()) {
      newErrors.street = 'Vui lòng nhập địa chỉ'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Vui lòng nhập thành phố'
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'Vui lòng nhập mã bưu chính'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveAddress = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const profile = await getMyProfile()
      const rawAddresses = Array.isArray((profile as any).addresses)
        ? ((profile as any).addresses as Array<any>)
        : []

      const nextAddress = {
        type: formData.type,
        isDefault: isDefaultAddress,
        street: formData.street,
        city: formData.city,
        zipCode: formData.zipCode,
        phone: formData.phone,
      }

      const nextAddresses = editingAddress
        ? rawAddresses.map((item: any, index: number) => {
            const id = String(item._id || item.id || index + 1)
            return id === editingAddress.id ? { ...item, ...nextAddress } : item
          })
        : [...rawAddresses, nextAddress]

      const normalized = isDefaultAddress
        ? nextAddresses.map((item: any) => ({ ...item, isDefault: false })).map((item: any, idx: number) =>
            idx === nextAddresses.length - 1 && !editingAddress ? { ...item, isDefault: true } : item
          )
        : nextAddresses

      await updateMyProfile({ addresses: normalized } as any)

      handleCloseDialog()
      await loadAddresses()
      Alert.alert('Thành công', editingAddress ? 'Đã cập nhật địa chỉ' : 'Đã thêm địa chỉ mới')
    } catch (error) {
      console.error('Failed to save address:', error)
      Alert.alert('Lỗi', 'Không thể lưu địa chỉ')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (address: Address) => {
    setEditingAddress(address)
    setFormData({
      street: address.street,
      city: address.city,
      zipCode: address.zipCode,
      phone: address.phone || '',
      type: address.type,
    })
    setShowAddDialog(true)
  }

  const handleAddNew = () => {
    setEditingAddress(null)
    setIsDefaultAddress(addresses.length === 0)
    setFormData({ ...DEFAULT_FORM_DATA })
    setShowAddDialog(true)
  }

  const handleSetDefault = (_address: Address) => {
    ;(async () => {
      try {
        const profile = await getMyProfile()
        const rawAddresses = Array.isArray((profile as any).addresses)
          ? ((profile as any).addresses as Array<any>)
          : []
        const nextAddresses = rawAddresses.map((item: any, index: number) => {
          const id = String(item._id || item.id || index + 1)
          return { ...item, isDefault: id === _address.id }
        })
        await updateMyProfile({ addresses: nextAddresses } as any)
        await loadAddresses()
        Alert.alert('Thành công', 'Đã đặt làm địa chỉ mặc định')
      } catch (error) {
        console.error('Set default address error:', error)
        Alert.alert('Lỗi', 'Không thể cập nhật địa chỉ mặc định')
      }
    })()
  }

  const handleDelete = (_address: Address) => {
    Alert.alert(
      'Xóa địa chỉ',
      'Bạn có chắc chắn muốn xóa địa chỉ này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const profile = await getMyProfile()
              const rawAddresses = Array.isArray((profile as any).addresses)
                ? ((profile as any).addresses as Array<any>)
                : []
              const nextAddresses = rawAddresses.filter((item: any, index: number) => {
                const id = String(item._id || item.id || index + 1)
                return id !== _address.id
              })
              await updateMyProfile({ addresses: nextAddresses } as any)
              await loadAddresses()
              Alert.alert('Thành công', 'Đã xóa địa chỉ')
            } catch (error) {
              console.error('Failed to delete address:', error)
              Alert.alert('Lỗi', 'Không thể xóa địa chỉ')
            }
          },
        },
      ]
    )
  }

  const handleCloseDialog = () => {
    setShowAddDialog(false)
    setEditingAddress(null)
    setFormData({ ...DEFAULT_FORM_DATA })
    setErrors({})
  }

  if (loading) {
    return <Loading />
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} size={24} />
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>My Account</Text>
          <Text style={styles.headerPage}>Addresses</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title */}
        <View style={styles.pageTitleRow}>
          <Text style={styles.pageTitle}>Addresses</Text>
          <Text style={styles.pageSubtitle}>
            Manage your shipping and billing addresses
          </Text>
        </View>

        {/* Add Button */}
        <View style={styles.addAddressRow}>
          <Text style={styles.addressesCount}>
            {addresses.length} {addresses.length === 1 ? 'address' : 'addresses'} saved
          </Text>
          <Button
            mode="contained"
            icon="plus"
            onPress={handleAddNew}
            style={styles.addButton}
          >
            Add New Address
          </Button>
        </View>

        {/* Addresses Grid */}
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyTitle}>No addresses saved</Text>
            <Text style={styles.emptyText}>
              Add your first address to make checkout faster
            </Text>
          </View>
        ) : (
          <View style={styles.addressesGrid}>
            {addresses.map((address) => {
              const cardStyle = [
                styles.addressCard,
                address.isDefault && styles.defaultCard,
              ]

              return (
                <View key={address.id} style={cardStyle}>
                  <View style={styles.addressCardContent}>
                    <View style={styles.addressHeader}>
                      <View style={styles.addressIconContainer}>
                        <Text style={styles.addressIcon}>📍</Text>
                        <Chip style={styles.typeChip}>
                          <Text style={styles.typeChipText}>
                            {address.type === 'SHIPPING' ? 'Shipping' : 'Billing'}
                          </Text>
                        </Chip>
                      </View>
                    </View>

                    <View style={styles.addressInfo}>
                      <Text style={styles.addressStreet}>{address.street}</Text>
                      <Text style={styles.addressCity}>
                        {address.city}, {address.zipCode}
                      </Text>
                      {address.phone && (
                        <Text style={styles.addressPhone}>{address.phone}</Text>
                      )}
                    </View>

                    <View style={styles.addressActions}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => handleEdit(address)}
                        style={styles.actionButton}
                        iconColor={COLORS.primary}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => handleDelete(address)}
                        style={styles.actionButton}
                        iconColor={COLORS.error}
                      />
                      {!address.isDefault && (
                        <IconButton
                          icon="star"
                          size={20}
                          onPress={() => handleSetDefault(address)}
                          style={styles.actionButton}
                          iconColor={COLORS.warning}
                        />
                      )}
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* FAB for quick add */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddNew}
      />

      {/* Add/Edit Address Dialog */}
      <Portal>
        <Dialog visible={showAddDialog} onDismiss={handleCloseDialog}>
          <Dialog.Title>
            {editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
          </Dialog.Title>
          <Dialog.Content>
            <View style={styles.dialogContent}>
              <TextInput
                label="Địa chỉ *"
                value={formData.street}
                onChangeText={(text) => {
                  setFormData({ ...formData, street: text })
                  setErrors({ ...errors, street: '' })
                }}
                mode="outlined"
                style={styles.dialogInput}
                error={!!errors.street}
                placeholder="Nhập địa chỉ"
              />
              {errors.street && <Text style={styles.errorText}>{errors.street}</Text>}

              <TextInput
                label="Thành phố *"
                value={formData.city}
                onChangeText={(text) => {
                  setFormData({ ...formData, city: text })
                  setErrors({ ...errors, city: '' })
                }}
                mode="outlined"
                style={styles.dialogInput}
                error={!!errors.city}
                placeholder="Nhập thành phố"
              />
              {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}

              <TextInput
                label="Mã bưu chính *"
                value={formData.zipCode}
                onChangeText={(text) => {
                  setFormData({ ...formData, zipCode: text })
                  setErrors({ ...errors, zipCode: '' })
                }}
                mode="outlined"
                style={styles.dialogInput}
                error={!!errors.zipCode}
                placeholder="Nhập mã bưu chính"
              />
              {errors.zipCode && <Text style={styles.errorText}>{errors.zipCode}</Text>}

              <TextInput
                label="Số điện thoại"
                value={formData.phone}
                onChangeText={(text) => {
                  setFormData({ ...formData, phone: text })
                  setErrors({ ...errors, phone: '' })
                }}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.dialogInput}
                error={!!errors.phone}
                placeholder="Nhập số điện thoại (tùy chọn)"
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

              <View style={styles.addressTypeRow}>
                <Text style={styles.addressTypeLabel}>Loại địa chỉ:</Text>
                <View style={styles.addressTypeButtons}>
                  <Chip
                    selected={formData.type === 'SHIPPING'}
                    onPress={() => setFormData({ ...formData, type: 'SHIPPING' })}
                    style={[styles.typeChipDialog, formData.type === 'SHIPPING' && styles.typeChipSelected]}
                  >
                    Shipping
                  </Chip>
                  <Chip
                    selected={formData.type === 'BILLING'}
                    onPress={() => setFormData({ ...formData, type: 'BILLING' })}
                    style={[styles.typeChipDialog, formData.type === 'BILLING' && styles.typeChipSelected]}
                  >
                    Billing
                  </Chip>
                </View>
              </View>

              {!editingAddress && (
                <View style={styles.defaultToggleRow}>
                  <Text style={styles.defaultLabel}>Đặt làm mặc định</Text>
                  <Button
                    mode="outlined"
                    compact
                    onPress={() => setIsDefaultAddress(!isDefaultAddress)}
                    style={[
                      styles.defaultToggle,
                      isDefaultAddress && styles.defaultToggleSelected,
                    ]}
                  >
                    {isDefaultAddress ? '✓' : ''}
                  </Button>
                </View>
              )}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCloseDialog}>Hủy</Button>
            <Button
              mode="contained"
              onPress={handleSaveAddress}
              loading={loading}
              disabled={loading || Object.keys(errors).length > 0}
            >
              Lưu
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d1fae5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerTitle: {
    flex: 1,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: COLORS.onSurface,
  },
  headerPage: {
    fontSize: 14,
    color: COLORS.onSurfaceDisabled,
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  pageTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.onSurfaceDisabled,
    maxWidth: 300,
  },
  addAddressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressesCount: {
    fontSize: 14,
    color: COLORS.onSurfaceDisabled,
  },
  addButton: {
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.onSurfaceDisabled,
    textAlign: 'center',
  },
  addressesGrid: {
    gap: 16,
  },
  addressCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  defaultCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  addressCardContent: {
    padding: 16,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressIcon: {
    fontSize: 20,
  },
  typeChip: {
    height: 24,
    backgroundColor: COLORS.primary,
  },
  typeChipText: {
    color: '#fff',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  defaultChip: {
    backgroundColor: COLORS.warning,
  },
  defaultChipText: {
    color: '#fff',
    fontSize: 10,
  },
  addressInfo: {
    gap: 4,
  },
  addressStreet: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  addressCity: {
    fontSize: 14,
    color: COLORS.onSurface,
  },
  addressPhone: {
    fontSize: 12,
    color: COLORS.onSurface,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    margin: 0,
    padding: 4,
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: COLORS.primary,
  },
  dialogContent: {
    paddingVertical: 8,
  },
  dialogInput: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginLeft: 12,
    marginBottom: 4,
  },
  addressTypeRow: {
    marginTop: 16,
  },
  addressTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  addressTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChipDialog: {
    height: 32,
    backgroundColor: COLORS.warning,
  },
  typeChipSelected: {
    backgroundColor: COLORS.primary,
  },
  defaultToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  defaultLabel: {
    fontSize: 14,
    color: COLORS.onSurface,
    marginRight: 8,
  },
  defaultToggle: {
    borderWidth: 1,
    borderColor: COLORS.onSurface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  defaultToggleSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
})
