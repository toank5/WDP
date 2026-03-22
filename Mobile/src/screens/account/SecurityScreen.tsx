import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native'
import {
  Text,
  Card,
  TextInput,
  Button,
  Divider,
  List,
} from 'react-native-paper'
import { useTheme } from 'react-native-paper'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../types'
import { changePassword } from '../../services/user-api'

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileSettings'>

export function SecurityScreen({ navigation }: Props) {
  const theme = useTheme()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại'
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới'
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChangePassword = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      })

      Alert.alert(
        'Thành công',
        'Đã thay đổi mật khẩu thành công',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      )

      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error: any) {
      console.error('Failed to change password:', error)
      Alert.alert(
        'Lỗi',
        error.message || 'Không thể thay đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bảo mật</Text>
        <Text style={styles.headerSubtitle}>
          Quản lý mật khẩu và cài đặt bảo mật
        </Text>
      </View>

      {/* Change Password Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Thay đổi mật khẩu</Text>

          <TextInput
            label="Mật khẩu hiện tại"
            value={formData.currentPassword}
            onChangeText={(text) => {
              setFormData({ ...formData, currentPassword: text })
              setErrors({ ...errors, currentPassword: '' })
            }}
            secureTextEntry={!showPasswords.current}
            right={
              <TextInput.Icon
                icon={showPasswords.current ? 'eye-off' : 'eye'}
                onPress={() =>
                  setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                }
              />
            }
            mode="outlined"
            style={styles.input}
            error={!!errors.currentPassword}
          />
          {errors.currentPassword && (
            <Text style={styles.errorText}>{errors.currentPassword}</Text>
          )}

          <TextInput
            label="Mật khẩu mới"
            value={formData.newPassword}
            onChangeText={(text) => {
              setFormData({ ...formData, newPassword: text })
              setErrors({ ...errors, newPassword: '' })
            }}
            secureTextEntry={!showPasswords.new}
            right={
              <TextInput.Icon
                icon={showPasswords.new ? 'eye-off' : 'eye'}
                onPress={() =>
                  setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                }
              />
            }
            mode="outlined"
            style={styles.input}
            error={!!errors.newPassword}
          />
          {errors.newPassword && (
            <Text style={styles.errorText}>{errors.newPassword}</Text>
          )}

          <TextInput
            label="Xác nhận mật khẩu mới"
            value={formData.confirmPassword}
            onChangeText={(text) => {
              setFormData({ ...formData, confirmPassword: text })
              setErrors({ ...errors, confirmPassword: '' })
            }}
            secureTextEntry={!showPasswords.confirm}
            right={
              <TextInput.Icon
                icon={showPasswords.confirm ? 'eye-off' : 'eye'}
                onPress={() =>
                  setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                }
              />
            }
            mode="outlined"
            style={styles.input}
            error={!!errors.confirmPassword}
          />
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}

          <Button
            mode="contained"
            onPress={handleChangePassword}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Thay đổi mật khẩu
          </Button>
        </Card.Content>
      </Card>

      {/* Security Tips Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Mẹo bảo mật</Text>

          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>🔐</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Sử dụng mật khẩu mạnh</Text>
              <Text style={styles.tipText}>
                Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt
              </Text>
            </View>
          </View>

          <Divider style={styles.tipDivider} />

          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>🔄</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Thay đổi mật khẩu định kỳ</Text>
              <Text style={styles.tipText}>
                Cập nhật mật khẩu mỗi 3-6 tháng để bảo mật tốt hơn
              </Text>
            </View>
          </View>

          <Divider style={styles.tipDivider} />

          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>🚫</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Không chia sẻ mật khẩu</Text>
              <Text style={styles.tipText}>
                Không bao giờ chia sẻ mật khẩu với bất kỳ ai
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginBottom: 16,
    marginLeft: 12,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  tipDivider: {
    marginVertical: 12,
  },
})
