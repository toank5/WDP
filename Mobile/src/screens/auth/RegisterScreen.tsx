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
  Checkbox,
  IconButton,
  useTheme,
} from 'react-native-paper'
import { useAuthStore } from '../../store/auth-store'
import { APP_CONFIG } from '../../config'

interface RegisterScreenProps {
  navigation: any
}

interface RegisterFormData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  agreeTerms: boolean
}

interface RegisterErrors {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
  agreeTerms?: string
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const theme = useTheme()
  const { register, isLoading } = useAuthStore()

  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  })

  const [errors, setErrors] = useState<RegisterErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string): boolean => {
    return password.length >= 6
  }

  const validateForm = (): boolean => {
    const newErrors: RegisterErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên'
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự'
    }

    if (!formData.email) {
      newErrors.email = 'Vui lòng nhập email'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email không hợp lệ'
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu'
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'Bạn phải đồng ý với điều khoản dịch vụ'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async () => {
    if (!validateForm()) {
      return
    }

    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      })

      Alert.alert(
        'Đăng ký thành công',
        'Tài khoản của bạn đã được tạo. Vui lòng đăng nhập để tiếp tục.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login' as never),
          },
        ]
      )
    } catch (error: any) {
      console.error('Register error:', error)

      // Handle specific error messages from API
      if (error.response?.data?.message) {
        if (error.response.data.message.includes('email')) {
          setErrors({ email: error.response.data.message })
        } else {
          Alert.alert('Đăng ký thất bại', error.response.data.message)
        }
      } else if (error.message) {
        Alert.alert('Đăng ký thất bại', error.message)
      } else {
        Alert.alert(
          'Đăng ký thất bại',
          'Đã có lỗi xảy ra. Vui lòng thử lại sau.'
        )
      }
    }
  }

  const navigateBack = () => {
    // Get root navigation (which has access to Main screen)
    const rootNav = navigation.getParent() as any
    if (rootNav) {
      rootNav.reset({
        index: 0,
        routes: [{ name: 'Main' as never }],
      })
    } else {
      navigation.goBack()
    }
  }

  const navigateToLogin = () => {
    navigation.navigate('Login')
  }

  const navigateToTerms = () => {
    // TODO: Navigate to Terms screen
    Alert.alert('Điều khoản dịch vụ', 'Màn hình điều khoản dịch vụ đang phát triển')
  }

  const navigateToPrivacy = () => {
    // TODO: Navigate to Privacy screen
    Alert.alert('Chính sách bảo mật', 'Màn hình chính sách bảo mật đang phát triển')
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.title}>
            {APP_CONFIG.name}
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Đăng ký tài khoản mới
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Họ tên"
            value={formData.fullName}
            onChangeText={(text) => {
              setFormData({ ...formData, fullName: text })
              setErrors({ ...errors, fullName: undefined })
            }}
            autoCapitalize="words"
            mode="outlined"
            error={!!errors.fullName}
            left={<TextInput.Icon icon="account" />}
            disabled={isLoading}
          />
          {errors.fullName && (
            <HelperText type="error" visible={!!errors.fullName}>
              {errors.fullName}
            </HelperText>
          )}

          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => {
              setFormData({ ...formData, email: text })
              setErrors({ ...errors, email: undefined })
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            mode="outlined"
            error={!!errors.email}
            left={<TextInput.Icon icon="email" />}
            disabled={isLoading}
          />
          {errors.email && (
            <HelperText type="error" visible={!!errors.email}>
              {errors.email}
            </HelperText>
          )}

          <TextInput
            label="Mật khẩu"
            value={formData.password}
            onChangeText={(text) => {
              setFormData({ ...formData, password: text })
              setErrors({ ...errors, password: undefined, confirmPassword: undefined })
            }}
            secureTextEntry={!showPassword}
            mode="outlined"
            error={!!errors.password}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            disabled={isLoading}
          />
          {errors.password && (
            <HelperText type="error" visible={!!errors.password}>
              {errors.password}
            </HelperText>
          )}

          <TextInput
            label="Xác nhận mật khẩu"
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
            disabled={isLoading}
          />
          {errors.confirmPassword && (
            <HelperText type="error" visible={!!errors.confirmPassword}>
              {errors.confirmPassword}
            </HelperText>
          )}

          <View style={styles.termsContainer}>
            <View style={styles.checkboxContainer}>
              <Checkbox.Android
                status={formData.agreeTerms ? 'checked' : 'unchecked'}
                onPress={() =>
                  setFormData({ ...formData, agreeTerms: !formData.agreeTerms })
                }
                disabled={isLoading}
              />
              <Text variant="bodyMedium" style={styles.termsText}>
                Tôi đồng ý với{' '}
                <Text
                  style={[styles.linkText, { color: theme.colors.primary }]}
                  onPress={navigateToTerms}
                >
                  Điều khoản dịch vụ
                </Text>{' '}
                và{' '}
                <Text
                  style={[styles.linkText, { color: theme.colors.primary }]}
                  onPress={navigateToPrivacy}
                >
                  Chính sách bảo mật
                </Text>
              </Text>
            </View>
          </View>
          {errors.agreeTerms && (
            <HelperText type="error" visible={!!errors.agreeTerms}>
              {errors.agreeTerms}
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            style={styles.registerButton}
            contentStyle={styles.registerButtonContent}
          >
            {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
          </Button>

          <View style={styles.loginContainer}>
            <Text variant="bodyMedium">Đã có tài khoản? </Text>
            <Text
              variant="bodyMedium"
              style={[styles.loginText, { color: theme.colors.primary }]}
              onPress={navigateToLogin}
            >
              Đăng nhập ngay
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={navigateBack}
            style={styles.backButton}
          />
          <View style={styles.footerContent}>
            <Text variant="bodySmall" style={styles.footerText}>
              {APP_CONFIG.name} © {new Date().getFullYear()}
            </Text>
          </View>
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
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  termsContainer: {
    marginTop: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  termsText: {
    fontSize: 14,
    flex: 1,
    flexWrap: 'wrap',
  },
  linkText: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  registerButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  registerButtonContent: {
    paddingVertical: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  backButton: {
    position: 'absolute',
    left: 0,
  },
  footerContent: {
    paddingHorizontal: 16,
  },
  footerText: {
    opacity: 0.5,
  },
})
