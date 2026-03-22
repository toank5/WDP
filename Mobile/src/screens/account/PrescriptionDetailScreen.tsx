import React, { useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import {
  Text,
  Button,
  Surface,
  useTheme,
  IconButton,
  TextInput,
  Chip,
  SegmentedButtons,
  Divider,
  Modal,
  Portal,
} from 'react-native-paper'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { PrescriptionItem } from './PrescriptionListScreen'

interface PrescriptionDetailScreenProps {
  route: {
    params?: {
      prescription?: PrescriptionItem
      isEditing?: boolean
    }
  }
}

/**
 * PrescriptionDetailScreen - Form nhập/chỉnh sửa đơn kính
 *
 * Features:
 * - Form nhập prescription values (SPH, CYL, AXIS)
 * - Left eye (OD) and Right eye (OS) values
 * - Prescription status
 * - Prescription notes
 * - Expiry date picker
 * - Save prescription
 * - Validation
 */
export const PrescriptionDetailScreen: React.FC<PrescriptionDetailScreenProps> = ({
  route,
}) => {
  const theme = useTheme()
  const navigation = useNavigation() as NativeStackNavigationProp<any>

  const isEditing = route.params?.isEditing || false
  const existingPrescription = route.params?.prescription

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState(existingPrescription?.name || '')
  const [leftEye, setLeftEye] = useState({
    sphere: existingPrescription?.leftEye?.sphere?.toString() || '0.00',
    cylinder: existingPrescription?.leftEye?.cylinder?.toString() || '0.00',
    axis: existingPrescription?.leftEye?.axis?.toString() || '0',
  })
  const [rightEye, setRightEye] = useState({
    sphere: existingPrescription?.rightEye?.sphere?.toString() || '0.00',
    cylinder: existingPrescription?.rightEye?.cylinder?.toString() || '0.00',
    axis: existingPrescription?.rightEye?.axis?.toString() || '0',
  })
  const [status, setStatus] = useState<'active' | 'expired' | 'archived'>(
    existingPrescription?.status || 'active'
  )
  const [notes, setNotes] = useState(existingPrescription?.notes || '')
  const [expiryDate, setExpiryDate] = useState<Date>(
    existingPrescription?.expiryDate
      ? new Date(existingPrescription.expiryDate)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Default 1 year
  )
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dateInput, setDateInput] = useState(
    expiryDate
      ? expiryDate.toISOString().split('T')[0]
      : ''
  )

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Handle save
  const handleSave = useCallback(async () => {
    // Validate
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Tên đơn kính không được để trống'
    }

    // Validate sphere (-20.00 to +20.00)
    const leftSphere = parseFloat(leftEye.sphere)
    const rightSphere = parseFloat(rightEye.sphere)
    if (isNaN(leftSphere) || leftSphere < -20 || leftSphere > 20) {
      newErrors.leftSphere = 'SPH mắt trái không hợp lệ'
    }
    if (isNaN(rightSphere) || rightSphere < -20 || rightSphere > 20) {
      newErrors.rightSphere = 'SPH mắt phải không hợp lệ'
    }

    // Validate cylinder (-10.00 to +10.00)
    const leftCylinder = parseFloat(leftEye.cylinder)
    const rightCylinder = parseFloat(rightEye.cylinder)
    if (isNaN(leftCylinder) || leftCylinder < -10 || leftCylinder > 10) {
      newErrors.leftCylinder = 'CYL mắt trái không hợp lệ'
    }
    if (isNaN(rightCylinder) || rightCylinder < -10 || rightCylinder > 10) {
      newErrors.rightCylinder = 'CYL mắt phải không hợp lệ'
    }

    // Validate axis (0 to 180)
    const leftAxis = parseInt(leftEye.axis)
    const rightAxis = parseInt(rightEye.axis)
    if (isNaN(leftAxis) || leftAxis < 0 || leftAxis > 180) {
      newErrors.leftAxis = 'AXIS mắt trái không hợp lệ'
    }
    if (isNaN(rightAxis) || rightAxis < 0 || rightAxis > 180) {
      newErrors.rightAxis = 'AXIS mắt phải không hợp lệ'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      return
    }

    try {
      setSaving(true)

      const prescriptionData: PrescriptionItem = {
        id: existingPrescription?.id || `prescription_${Date.now()}`,
        name,
        leftEye: {
          sphere: leftSphere,
          cylinder: leftCylinder,
          axis: leftAxis,
        },
        rightEye: {
          sphere: rightSphere,
          cylinder: rightCylinder,
          axis: rightAxis,
        },
        addedDate: existingPrescription?.addedDate || new Date().toISOString(),
        expiryDate: expiryDate.toISOString(),
        status,
        notes,
      }

      // TODO: Call API to save prescription
      console.log('Saving prescription:', prescriptionData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Navigate back
      navigation.goBack()
    } catch (error) {
      console.error('Save prescription error:', error)
      // Show error message
    } finally {
      setSaving(false)
    }
  }, [
    name,
    leftEye,
    rightEye,
    status,
    notes,
    expiryDate,
    existingPrescription,
    navigation,
  ])

  // Handle date change
  const handleDateChange = useCallback((date: Date) => {
    setExpiryDate(date)
    setShowDatePicker(false)
  }, [])

  const handleDateInputChange = (text: string) => {
    setDateInput(text)
    try {
      if (text) {
        const date = new Date(text)
        setExpiryDate(date)
      }
    } catch (e) {
      console.warn('Invalid date format')
    }
  }

  // Format date for display
  const formatDate = useCallback((date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Chưa chọn'
    }
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }, [])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerRow}>
          <IconButton
            icon="close"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text variant="titleLarge" style={styles.headerTitle}>
            {isEditing ? 'Chỉnh sửa đơn kính' : 'Thêm đơn kính mới'}
          </Text>
          <View style={styles.headerSpacer} />
          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
          >
            Lưu
          </Button>
        </View>
      </Surface>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Name */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Thông tin cơ bản
          </Text>

          <TextInput
            label="Tên đơn kính *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            error={!!errors.name}
            helperText={errors.name}
            placeholder="Ví dụ: Kính mắt gần, Kính đọc sách..."
            style={styles.input}
          />

          {/* Status */}
          <Text variant="bodyMedium" style={styles.label}>
            Trạng thái:
          </Text>
          <SegmentedButtons
            value={status}
            onValueChange={(value) => setStatus(value as any)}
            buttons={[
              { value: 'active', label: 'Đang dùng' },
              { value: 'expired', label: 'Đã hết hạn' },
              { value: 'archived', label: 'Đã lưu trữ' },
            ]}
            style={styles.segmentedButtons}
          />

          {/* Expiry Date */}
          <View style={styles.dateRow}>
            <Text variant="bodyMedium">Ngày hết hạn:</Text>
            <TextInput
              label="Ngày hết hạn (YYYY-MM-DD)"
              value={dateInput}
              onChangeText={handleDateInputChange}
              mode="outlined"
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
            />
            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              icon="calendar"
              style={styles.dateButton}
              contentStyle={styles.dateButtonContent}
            >
              {formatDate(expiryDate)}
            </Button>
          </View>
        </Surface>

        {/* Left Eye */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Mắt trái (OD)
          </Text>

          <TextInput
            label="SPH (Khúc xạ) *"
            value={leftEye.sphere}
            onChangeText={(text) => setLeftEye({ ...leftEye, sphere: text })}
            mode="outlined"
            keyboardType="decimal-pad"
            error={!!errors.leftSphere}
            helperText={errors.leftSphere}
            style={styles.input}
            placeholder="-20.00 đến +20.00"
          />

          <TextInput
            label="CYL (Trụ) *"
            value={leftEye.cylinder}
            onChangeText={(text) => setLeftEye({ ...leftEye, cylinder: text })}
            mode="outlined"
            keyboardType="decimal-pad"
            error={!!errors.leftCylinder}
            helperText={errors.leftCylinder}
            style={styles.input}
            placeholder="-10.00 đến +10.00"
          />

          <TextInput
            label="AXIS (Trục) *"
            value={leftEye.axis}
            onChangeText={(text) => setLeftEye({ ...leftEye, axis: text })}
            mode="outlined"
            keyboardType="number-pad"
            error={!!errors.leftAxis}
            helperText={errors.leftAxis}
            style={styles.input}
            placeholder="0 đến 180"
          />
        </Surface>

        {/* Right Eye */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Mắt phải (OS)
          </Text>

          <TextInput
            label="SPH (Khúc xạ) *"
            value={rightEye.sphere}
            onChangeText={(text) => setRightEye({ ...rightEye, sphere: text })}
            mode="outlined"
            keyboardType="decimal-pad"
            error={!!errors.rightSphere}
            helperText={errors.rightSphere}
            style={styles.input}
            placeholder="-20.00 đến +20.00"
          />

          <TextInput
            label="CYL (Trụ) *"
            value={rightEye.cylinder}
            onChangeText={(text) => setRightEye({ ...rightEye, cylinder: text })}
            mode="outlined"
            keyboardType="decimal-pad"
            error={!!errors.rightCylinder}
            helperText={errors.rightCylinder}
            style={styles.input}
            placeholder="-10.00 đến +10.00"
          />

          <TextInput
            label="AXIS (Trục) *"
            value={rightEye.axis}
            onChangeText={(text) => setRightEye({ ...rightEye, axis: text })}
            mode="outlined"
            keyboardType="number-pad"
            error={!!errors.rightAxis}
            helperText={errors.rightAxis}
            style={styles.input}
            placeholder="0 đến 180"
          />
        </Surface>

        {/* Notes */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Ghi chú
          </Text>

          <TextInput
            label="Ghi chú"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
            placeholder="Ghi chú về đơn kính (nếu có)"
          />
        </Surface>

        {/* Help Section */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.helpHeader}>
            <IconButton
              icon="help-circle"
              size={20}
              iconColor={theme.colors.primary}
            />
            <Text variant="titleMedium" style={styles.helpTitle}>
              Hướng dẫn nhập đơn kính
            </Text>
          </View>

          <View style={styles.helpContent}>
            <View style={styles.helpItem}>
              <Text variant="bodySmall" style={styles.helpLabel}>
                SPH (Khúc xạ):
              </Text>
              <Text variant="bodySmall" style={styles.helpText}>
                Chỉ số khúc xạ, thường từ -20.00 đến +20.00. Dấu (+) cho mắt xa, dấu (-) cho mắt gần.
              </Text>
            </View>

            <Divider style={styles.helpDivider} />

            <View style={styles.helpItem}>
              <Text variant="bodySmall" style={styles.helpLabel}>
                CYL (Trụ):
              </Text>
              <Text variant="bodySmall" style={styles.helpText}>
                Chỉ số trụ, thường từ -10.00 đến +10.00. Thường đi kèm với trục.
              </Text>
            </View>

            <Divider style={styles.helpDivider} />

            <View style={styles.helpItem}>
              <Text variant="bodySmall" style={styles.helpLabel}>
                AXIS (Trục):
              </Text>
              <Text variant="bodySmall" style={styles.helpText}>
                Trục kính, từ 0 đến 180 độ. Xác định góc độ của trụ kính.
              </Text>
            </View>

            <Divider style={styles.helpDivider} />

            <View style={styles.helpItem}>
              <Text variant="bodySmall" style={styles.helpLabel}>
                Ví dụ đơn kính:
              </Text>
              <Text variant="bodySmall" style={styles.helpText}>
                OD: -1.50 -0.50 x 90°
              </Text>
              <Text variant="bodySmall" style={styles.helpText}>
                OS: -1.75 -0.75 x 85°
              </Text>
            </View>
          </View>
        </Surface>
      </ScrollView>

      {/* Date Picker Modal */}
      <Portal>
        <Modal
          visible={showDatePicker}
          onDismiss={() => setShowDatePicker(false)}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleLarge">Chọn ngày hết hạn</Text>
            <IconButton
              icon="close"
              onPress={() => setShowDatePicker(false)}
              style={styles.modalClose}
            />
          </View>
          <View style={styles.datePickerContainer}>
            <TextInput
              label="Nhập ngày (YYYY-MM-DD)"
              value={dateInput}
              onChangeText={handleDateInputChange}
              mode="outlined"
              style={styles.dateInputModal}
              placeholder="YYYY-MM-DD"
              autoFocus
            />
          </View>
          <Button
            mode="contained"
            onPress={() => handleDateChange(expiryDate)}
            style={styles.modalButton}
          >
            Xác nhận
          </Button>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
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
    padding: 16,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
    flex: 1,
  },
  headerSpacer: {
    flex: 1,
  },
  saveButton: {
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  label: {
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateButton: {
    borderRadius: 8,
  },
  dateButtonContent: {
    paddingVertical: 8,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  helpTitle: {
    fontWeight: 'bold',
  },
  helpContent: {
    gap: 12,
  },
  helpItem: {
    gap: 4,
  },
  helpLabel: {
    fontWeight: 'bold',
  },
  helpText: {
    opacity: 0.8,
  },
  helpDivider: {
    marginVertical: 8,
  },
  datePicker: {
    backgroundColor: '#fff',
  },
  dateInputModal: {
    marginBottom: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalClose: {
    margin: 0,
  },
  datePickerContainer: {
    marginBottom: 16,
  },
  modalButton: {
    marginTop: 8,
  },
})
