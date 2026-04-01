import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableOpacity,
  FlatList,
} from 'react-native'
import {
  Text,
  TextInput,
  Button,
  Surface,
  useTheme,
  Divider,
} from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export interface Address {
  fullName: string
  phone: string
  address: string
  district: string
  city: string
  ward?: string
  postalCode?: string
}

interface AddressFormProps {
  initialAddress?: Address
  onSubmit: (address: Address) => void
  loading?: boolean
}

const PROVINCES = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'An Giang',
  'Bà Rịa - Vũng Tàu',
  'Bạc Liêu',
  'Bắc Ninh',
  'Bến Tre',
  'Bình Dương',
  'Bình Phước',
  'Bình Thuận',
  'Cà Mau',
  'Cao Bằng',
  'Đắk Lắk',
  'Đồng Nai',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Giang',
  'Hà Nam',
  'Hà Tĩnh',
  'Hải Dương',
  'Hậu Giang',
  'Hòa Bình',
  'Hưng Yên',
  'Khánh Hòa',
  'Kiên Giang',
  'Kon Tum',
  'Lai Châu',
  'Lâm Đồng',
  'Lạng Sơn',
  'Lào Cai',
  'Long An',
  'Nam Định',
  'Nghệ An',
  'Ninh Bình',
  'Ninh Thuận',
  'Phú Thọ',
  'Phú Yên',
  'Quảng Bình',
  'Quảng Nam',
  'Quảng Ngãi',
  'Quảng Ninh',
  'Quảng Trị',
  'Sóc Trăng',
  'Sơn La',
  'Tây Ninh',
  'Thái Bình',
  'Thái Nguyên',
  'Thanh Hóa',
  'Thừa Thiên Huế',
  'Tiền Giang',
  'Trà Vinh',
  'Tuyên Quang',
  'Vĩnh Long',
  'Vĩnh Phúc',
  'Yên Bái',
]

/**
 * AddressForm - Checkout shipping address form matching FE exactly
 *
 * Fields: Full Name, Phone, Address, City, District, Ward (optional), Postal Code (optional)
 */
export const AddressForm: React.FC<AddressFormProps> = ({
  initialAddress,
  onSubmit,
  loading = false,
}) => {
  const theme = useTheme()

  const [formData, setFormData] = React.useState<Address>({
    fullName: initialAddress?.fullName || '',
    phone: initialAddress?.phone || '',
    address: initialAddress?.address || '',
    city: initialAddress?.city || 'Hà Nội',
    district: initialAddress?.district || '',
    ward: initialAddress?.ward || '',
    postalCode: initialAddress?.postalCode || '',
  })

  const [errors, setErrors] = React.useState<Partial<Record<keyof Address, string>>>({})
  const [showCityModal, setShowCityModal] = useState(false)

  const handleFieldChange = useCallback((field: keyof Address, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }, [])

  const validate = useCallback(() => {
    const newErrors: Partial<Record<keyof Address, string>> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.district.trim()) {
      newErrors.district = 'District is required'
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
            Shipping Address
          </Text>

          {/* Full Name */}
          <View style={styles.fieldContainer}>
            <TextInput
              label="Full Name *"
              value={formData.fullName}
              onChangeText={(text) => handleFieldChange('fullName', text)}
              error={!!errors.fullName}
              mode="outlined"
              dense
              placeholder="Enter your full name"
            />
            {errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName}</Text>
            )}
          </View>

          {/* Phone */}
          <View style={styles.fieldContainer}>
            <TextInput
              label="Phone Number *"
              value={formData.phone}
              onChangeText={(text) => handleFieldChange('phone', text)}
              error={!!errors.phone}
              mode="outlined"
              dense
              keyboardType="phone-pad"
              placeholder="e.g., 0912345678"
            />
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}
          </View>

          {/* Address */}
          <View style={styles.fieldContainer}>
            <TextInput
              label="Address *"
              value={formData.address}
              onChangeText={(text) => handleFieldChange('address', text)}
              error={!!errors.address}
              mode="outlined"
              dense
              placeholder="Street address, house number, etc."
              multiline
              numberOfLines={2}
            />
            {errors.address && (
              <Text style={styles.errorText}>{errors.address}</Text>
            )}
          </View>

          {/* City/Province Dropdown */}
          <View style={styles.fieldContainer}>
            <Text variant="bodyMedium" style={styles.label}>
              City/Province *
            </Text>
            <TouchableOpacity
              style={[
                styles.cityPickerButton,
                errors.city && styles.cityPickerButtonError,
              ]}
              onPress={() => setShowCityModal(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.cityPickerText,
                  !formData.city && styles.cityPickerPlaceholder,
                ]}
              >
                {formData.city || 'Select city/province'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            {errors.city && (
              <Text style={styles.errorText}>{errors.city}</Text>
            )}
          </View>

          {/* District */}
          <View style={styles.fieldContainer}>
            <TextInput
              label="District *"
              value={formData.district}
              onChangeText={(text) => handleFieldChange('district', text)}
              error={!!errors.district}
              mode="outlined"
              dense
              placeholder="Enter district"
            />
            {errors.district && (
              <Text style={styles.errorText}>{errors.district}</Text>
            )}
          </View>

          {/* Ward (Optional) */}
          <View style={styles.fieldContainer}>
            <TextInput
              label="Ward (Optional)"
              value={formData.ward}
              onChangeText={(text) => handleFieldChange('ward', text)}
              mode="outlined"
              dense
              placeholder="Enter ward"
            />
          </View>

          {/* Postal Code (Optional) */}
          <View style={styles.fieldContainer}>
            <TextInput
              label="Postal Code (Optional)"
              value={formData.postalCode}
              onChangeText={(text) => handleFieldChange('postalCode', text)}
              mode="outlined"
              dense
              placeholder="Enter postal code"
            />
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
              Continue to Payment
            </Button>
          </View>

          {/* City Modal Picker */}
          <Modal
            visible={showCityModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowCityModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text variant="titleMedium" style={styles.modalTitle}>
                    Select City/Province
                  </Text>
                  <TouchableOpacity onPress={() => setShowCityModal(false)}>
                    <MaterialCommunityIcons name="close" size={24} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
                <Divider />

                {/* City List */}
                <FlatList
                  data={PROVINCES}
                  keyExtractor={(item) => item}
                  renderItem={({ item: city }) => (
                    <TouchableOpacity
                      style={[
                        styles.cityOption,
                        formData.city === city && styles.cityOptionSelected,
                      ]}
                      onPress={() => {
                        handleFieldChange('city', city)
                        setShowCityModal(false)
                      }}
                      activeOpacity={0.6}
                    >
                      <Text
                        style={[
                          styles.cityOptionText,
                          formData.city === city && styles.cityOptionTextSelected,
                        ]}
                      >
                        {city}
                      </Text>
                      {formData.city === city && (
                        <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <Divider />}
                />
              </View>
            </View>
          </Modal>
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
  cityPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#bdbdbd',
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  cityPickerButtonError: {
    borderColor: '#d32f2f',
  },
  cityPickerText: {
    fontSize: 16,
    color: '#212121',
  },
  cityPickerPlaceholder: {
    color: '#9e9e9e',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalTitle: {
    fontWeight: '600',
  },
  cityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cityOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  cityOptionText: {
    fontSize: 16,
    color: '#212121',
    flex: 1,
  },
  cityOptionTextSelected: {
    fontWeight: '600',
    color: '#1976d2',
  },
})
