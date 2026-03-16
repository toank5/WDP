import React, { useCallback, useEffect } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import {
  Text,
  TextInput,
  Button,
  Surface,
  useTheme,
  Checkbox,
} from 'react-native-paper'
import { useCartStore } from '../../store/cart-store'

export interface Address {
  id: string
  recipientName: string
  recipientPhone: string
  address: string
  ward: string
  district: string
  province: string
  isDefault: boolean
}

interface AddressFormProps {
  initialAddress?: Address
  onSubmit: (address: Omit<Address, 'id'>) => void
  loading?: boolean
  submitLabel?: string
}

const PROVINCES = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Cần Thơ',
  'Hải Phòng',
  'Nghe An',
  'Thừa Thiên Huế',
  'Khánh Hòa',
  'Lâm Đồng',
  'Bà Rịa - Vũng Tàu',
]

/**
 * AddressForm - Form để nhập thông tin giao hàng
 *
 * Features:
 * - Full name input
 * - Phone number input
 * - Address input
 * - Ward/District/Province dropdowns
 * - Set as default checkbox
 * - Form validation
 * - Save address option
 */
export const AddressForm: React.FC<AddressFormProps> = ({
  initialAddress,
  onSubmit,
  loading = false,
  submitLabel = 'Lưu địa chỉ',
}) => {
  const theme = useTheme()
  const { saveGuestAddress } = useCartStore()

  const [formData, setFormData] = React.useState<Omit<Address, 'id'>>({
    recipientName: initialAddress?.recipientName || '',
    recipientPhone: initialAddress?.recipientPhone || '',
    address: initialAddress?.address || '',
    ward: initialAddress?.ward || '',
    district: initialAddress?.district || '',
    province: initialAddress?.province || 'Hà Nội',
    isDefault: initialAddress?.isDefault || false,
  })

  const [errors, setErrors] = React.useState<Partial<Record<keyof Address, string>>>({})

  // Auto-save to guest cart when fields change
  useEffect(() => {
    if (formData.recipientName && formData.recipientPhone) {
      saveGuestAddress({
        fullName: formData.recipientName,
        phone: formData.recipientPhone,
        address: `${formData.address}, ${formData.ward}, ${formData.district}, ${formData.province}`,
      })
    }
  }, [formData, saveGuestAddress])

  const handleFieldChange = useCallback((field: keyof Address, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }, [])

  const validate = useCallback(() => {
    const newErrors: Partial<Record<keyof Address, string>> = {}

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = 'Vui lòng nhập họ tên'
    }

    if (!formData.recipientPhone.trim()) {
      newErrors.recipientPhone = 'Vui lòng nhập số điện thoại'
    } else if (!/^0\d{9,10}$/.test(formData.recipientPhone)) {
      newErrors.recipientPhone = 'Số điện thoại không hợp lệ'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ'
    }

    if (!formData.ward.trim()) {
      newErrors.ward = 'Vui lòng nhập phường/xã'
    }

    if (!formData.district.trim()) {
      newErrors.district = 'Vui lòng nhập quận/huyện'
    }

    if (!formData.province.trim()) {
      newErrors.province = 'Vui lòng chọn tỉnh/thành phố'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleSubmit = useCallback(() => {
    if (validate()) {
      onSubmit(formData)
    }
  }, [formData, validate, onSubmit])

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoiding}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Surface style={styles.container} elevation={2}>
          <Text variant="titleLarge" style={styles.title}>
            Thông tin giao hàng
          </Text>

          {/* Recipient Name */}
          <View style={styles.fieldContainer}>
            <TextInput
              label="Họ tên người nhận *"
              value={formData.recipientName}
              onChangeText={(text) => handleFieldChange('recipientName', text)}
              error={!!errors.recipientName}
              mode="outlined"
              dense
              placeholder="Nhập họ tên người nhận"
            />
            {errors.recipientName && (
              <Text style={styles.errorText}>{errors.recipientName}</Text>
            )}
          </View>

          {/* Recipient Phone */}
          <View style={styles.fieldContainer}>
            <TextInput
              label="Số điện thoại *"
              value={formData.recipientPhone}
              onChangeText={(text) => handleFieldChange('recipientPhone', text)}
              error={!!errors.recipientPhone}
              mode="outlined"
              dense
              keyboardType="phone-pad"
              placeholder="Nhập số điện thoại"
            />
            {errors.recipientPhone && (
              <Text style={styles.errorText}>{errors.recipientPhone}</Text>
            )}
          </View>

          {/* Address */}
          <View style={styles.fieldContainer}>
            <TextInput
              label="Địa chỉ chi tiết *"
              value={formData.address}
              onChangeText={(text) => handleFieldChange('address', text)}
              error={!!errors.address}
              mode="outlined"
              dense
              placeholder="Số nhà, tên đường"
              multiline
              numberOfLines={2}
            />
            {errors.address && (
              <Text style={styles.errorText}>{errors.address}</Text>
            )}
          </View>

          {/* Ward */}
          <View style={styles.fieldContainer}>
            <TextInput
              label="Phường/Xã *"
              value={formData.ward}
              onChangeText={(text) => handleFieldChange('ward', text)}
              error={!!errors.ward}
              mode="outlined"
              dense
              placeholder="Nhập phường/xã"
            />
            {errors.ward && (
              <Text style={styles.errorText}>{errors.ward}</Text>
            )}
          </View>

          {/* District */}
          <View style={styles.fieldContainer}>
            <TextInput
              label="Quận/Huyện *"
              value={formData.district}
              onChangeText={(text) => handleFieldChange('district', text)}
              error={!!errors.district}
              mode="outlined"
              dense
              placeholder="Nhập quận/huyện"
            />
            {errors.district && (
              <Text style={styles.errorText}>{errors.district}</Text>
            )}
          </View>

          {/* Province */}
          <View style={styles.fieldContainer}>
            <Text variant="bodyMedium" style={styles.label}>
              Tỉnh/Thành phố *
            </Text>
            <View style={styles.provinceButtons}>
              {PROVINCES.map((province) => (
                <Button
                  key={province}
                  mode={formData.province === province ? 'contained' : 'outlined'}
                  onPress={() => handleFieldChange('province', province)}
                  style={styles.provinceButton}
                  compact
                >
                  {province}
                </Button>
              ))}
            </View>
            {errors.province && (
              <Text style={styles.errorText}>{errors.province}</Text>
            )}
          </View>

          {/* Set as Default */}
          <View style={styles.fieldContainer}>
            <View style={styles.checkboxContainer}>
              <Checkbox
                status={formData.isDefault ? 'checked' : 'unchecked'}
                onPress={() => handleFieldChange('isDefault', !formData.isDefault)}
              />
              <Text variant="bodyMedium" style={styles.checkboxLabel}>
                Đặt làm địa chỉ mặc định
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
            >
              {submitLabel}
            </Button>
          </View>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  container: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  provinceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  provinceButton: {
    marginRight: 0,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 4,
  },
  submitContainer: {
    marginTop: 8,
  },
  submitButton: {
    borderRadius: 8,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
})
