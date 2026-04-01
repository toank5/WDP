import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native'
import {
  TextInput,
  Button,
  Text,
  HelperText,
  useTheme,
} from 'react-native-paper'
import { resetPassword } from '../../services/auth-api'

interface ResetPasswordScreenProps {
  navigation: any
  route: {
    params?: {
      token?: string
    }
  }
}

interface ResetPasswordFormData {
  newPassword: string
  confirmPassword: string
}

interface ResetPasswordErrors {
  newPassword?: string
  confirmPassword?: string
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation, route }) => {
  const theme = useTheme()
  const token = route.params?.token || ''

  const [formData, setFormData] = useState<ResetPasswordFormData>({
    newPassword: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<ResetPasswordErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validatePassword = (password: string): boolean => {
    return password.length >= 6
  }

  const validateForm = (): boolean => {
    const newErrors: ResetPasswordErrors = {}

    if (!formData.newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới'
    } else if (!validatePassword(formData.newPassword)) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleResetPassword = async () => {
    if (!token) {
      Alert.alert(
        'Lỗi',
        'Link đặt lại mật khẩu không hợp lệ. Vui lòng yêu cầu lại.',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('ForgotPassword'),
          },
        ]
      )
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      await resetPassword({
        token,
        newPassword: formData.newPassword,
      })

      Alert.alert(
        'Thành công',
        'Mật khẩu của bạn đã được đặt lại thành công.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              })
            },
          },
        ]
      )
    } catch (error: any) {
      console.error('Reset password error:', error)

      if (error.response?.data?.message) {
        Alert.alert('Đặt lại mật khẩu thất bại', error.response.data.message)
      } else if (error.message) {
        Alert.alert('Đặt lại mật khẩu thất bại', error.message)
      } else {
        Alert.alert(
          'Đặt lại mật khẩu thất bại',
          'Đã có lỗi xảy ra. Vui lòng thử lại sau.'
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPasswordStrength = (password: string): { strength: string; color: string } => {
    if (!password) return { strength: '', color: '' }

    if (password.length < 6) {
      return { strength: 'Yếu', color: theme.colors.error }
    }

    if (password.length < 10) {
      return { strength: 'Trung bình', color: '#f59e0b' }
    }

    return { strength: 'Mạnh', color: '#10b981' }
  }

  const passwordStrength = getPasswordStrength(formData.newPassword)

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔒</Text>
          </View>
          <Text variant="headlineLarge" style={styles.title}>
            Đặt lại mật khẩu
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Nhập mật khẩu mới cho tài khoản của bạn
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Mật khẩu mới"
            value={formData.newPassword}
            onChangeText={(text) => {
              setFormData({ ...formData, newPassword: text })
              setErrors({ ...errors, newPassword: undefined, confirmPassword: undefined })
            }}
            secureTextEntry={!showPassword}
            mode="outlined"
            error={!!errors.newPassword}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            disabled={isSubmitting}
          />
          {errors.newPassword && (
            <HelperText type="error" visible={!!errors.newPassword}>
              {errors.newPassword}
            </HelperText>
          )}
          {formData.newPassword && !errors.newPassword && passwordStrength.strength && (
            <HelperText type="info" visible style={{ color: passwordStrength.color }}>
              Mức độ: {passwordStrength.strength}
            </HelperText>
          )}

          <TextInput
            label="Xác nhận mật khẩu mới"
            value={formData.confirmPassword}
            onChangeText={(text) => {
              setFormData({ ...formData, confirmPassword: text })
              setErrors({ ...errors, confirmPassword: undefined })
            }}
            secureTextEntry={!showConfirmPassword}
            mode="outlined"
            error={!!errors.confirmPassword}
            left={<TextInput.Icon icon="lock-check" />}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
            disabled={isSubmitting}
          />
          {errors.confirmPassword && (
            <HelperText type="error" visible={!!errors.confirmPassword}>
              {errors.confirmPassword}
            </HelperText>
          )}

          <View style={styles.passwordRequirements}>
            <Text variant="bodyMedium" style={styles.requirementsTitle}>
              Yêu cầu mật khẩu:
            </Text>
            <View style={styles.requirementItem}>
              <Text style={formData.newPassword.length >= 6 ? styles.requirementMet : styles.requirementUnmet}>
                ✓
              </Text>
              <Text variant="bodyMedium">Ít nhất 6 ký tự</Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={formData.newPassword === formData.confirmPassword && formData.confirmPassword ? styles.requirementMet : styles.requirementUnmet}>
                ✓
              </Text>
              <Text variant="bodyMedium">Mật khẩu khớp</Text>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleResetPassword}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.resetButton}
            contentStyle={styles.resetButtonContent}
          >
            {isSubmitting ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
            style={styles.cancelButton}
            textColor={theme.colors.primary}
          >
            Hủy
          </Button>
        </View>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            Đảm bảo mật khẩu của bạn đủ mạnh và dễ nhớ.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  passwordRequirements: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
  },
  requirementsTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  requirementMet: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  requirementUnmet: {
    color: '#d1d5db',
    fontWeight: 'bold',
  },
  resetButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  resetButtonContent: {
    paddingVertical: 8,
  },
  cancelButton: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    opacity: 0.5,
    textAlign: 'center',
    fontSize: 12,
  },
})
