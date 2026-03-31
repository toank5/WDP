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

interface LoginScreenProps {
  navigation: any
}

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

interface LoginErrors {
  email?: string
  password?: string
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
const theme = useTheme()
  const { login, isLoading } = useAuthStore()

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  })

  const [errors, setErrors] = useState<LoginErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string): boolean => {
    return password.length >= 6
  }

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {}

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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      })

      // Navigation will be handled by RootNavigator
    } catch (error: any) {
      console.error('Login error:', error)

      // Handle specific error messages from API
      if (error.response?.data?.message) {
        if (error.response.data.message.includes('email')) {
          setErrors({ email: error.response.data.message })
        } else if (error.response.data.message.includes('password')) {
          setErrors({ password: error.response.data.message })
        } else {
          Alert.alert('Đăng nhập thất bại', error.response.data.message)
        }
      } else if (error.message) {
        Alert.alert('Đăng nhập thất bại', error.message)
      } else {
        Alert.alert(
          'Đăng nhập thất bại',
          'Đã có lỗi xảy ra. Vui lòng thử lại sau.'
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const navigateToHome = () => {
    // After login, RootNavigator will auto-redirect to Main based on auth state
    navigation.goBack()
  }

  const navigateToRegister = () => {
    navigation.navigate('Register' as never)
  }

  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword' as never)
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
            Đăng nhập tài khoản
          </Text>
        </View>

        <View style={styles.form}>
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
            disabled={isSubmitting}
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
              setErrors({ ...errors, password: undefined })
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
            disabled={isSubmitting}
          />
          {errors.password && (
            <HelperText type="error" visible={!!errors.password}>
              {errors.password}
            </HelperText>
          )}

          <View style={styles.rememberContainer}>
            <View style={styles.checkboxContainer}>
              <Checkbox.Android
                status={formData.rememberMe ? 'checked' : 'unchecked'}
                onPress={() =>
                  setFormData({ ...formData, rememberMe: !formData.rememberMe })
                }
                disabled={isSubmitting}
              />
              <Text variant="bodyMedium" style={styles.rememberText}>
                Ghi nhớ đăng nhập
              </Text>
            </View>
            <Text
              variant="bodyMedium"
              style={[
                styles.forgotPasswordText,
                { color: theme.colors.primary },
              ]}
              onPress={navigateToForgotPassword}
            >
              Quên mật khẩu?
            </Text>
          </View>

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
          >
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>

          <View style={styles.registerContainer}>
            <Text variant="bodyMedium">Chưa có tài khoản? </Text>
            <Text
              variant="bodyMedium"
              style={[styles.registerText, { color: theme.colors.primary }]}
              onPress={navigateToRegister}
            >
              Đăng ký ngay
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
  rememberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rememberText: {
    fontSize: 14,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
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
