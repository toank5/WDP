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
  IconButton,
} from 'react-native-paper'
import { verifyEmail, resendVerification } from '../../services/auth-api'

/**
 * VerifyEmailScreen - Email verification screen
 *
 * Checklist:
 * - Accepts verification token from email link
 * - Validates token format
 * - Shows success message after verification
 * - Allows resending verification email
 * - Handles error states appropriately
 * - Navigates to login after successful verification
 */
interface VerifyEmailScreenProps {
  navigation: any
  route: {
    params?: {
      token?: string
      email?: string
    }
  }
}

interface VerifyEmailErrors {
  token?: string
  email?: string
}

export const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({
  navigation,
  route,
}) => {
  const theme = useTheme()

  // Get token from route params (deep link) or input
  const initialToken = route.params?.token || ''
  const initialEmail = route.params?.email || ''

  const [token, setToken] = useState(initialToken)
  const [email, setEmail] = useState(initialEmail)
  const [errors, setErrors] = useState<VerifyEmailErrors>({})
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const validateToken = (tokenValue: string): boolean => {
    // Token should be a non-empty string
    return tokenValue.trim().length > 0
  }

  const validateEmail = (emailValue: string): boolean => {
    if (!emailValue) return true // Email is optional for verify (token is main)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(emailValue)
  }

  const validateForm = (): boolean => {
    const newErrors: VerifyEmailErrors = {}

    if (!validateToken(token)) {
      newErrors.token = 'Mã xác thực không được để trống'
    }

    if (!validateEmail(email)) {
      newErrors.email = 'Email không hợp lệ'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleVerifyEmail = async () => {
    if (!validateForm()) {
      return
    }

    setIsVerifying(true)
    setErrors({})

    try {
      await verifyEmail({ token })

      setIsSuccess(true)

      // Show success alert and navigate to login
      Alert.alert(
        'Xác thực thành công!',
        'Email của bạn đã được xác thực thành công. Bạn có thể đăng nhập ngay.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' as never }],
              })
            },
          },
        ]
      )
    } catch (error: any) {
      console.error('Verify email error:', error)

      const message =
        error.response?.data?.message ||
        error.message ||
        'Không thể xác thực email. Mã xác thực có thể đã hết hạn hoặc không hợp lệ.'

      Alert.alert('Xác thực thất bại', message, [
        { text: 'OK', style: 'default' },
      ])
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendEmail = async () => {
    if (!email || !validateEmail(email)) {
      Alert.alert(
        'Cần nhập email',
        'Vui lòng nhập email để gửi lại mã xác thực.',
        [{ text: 'OK', style: 'default' }]
      )
      return
    }

    setIsResending(true)

    try {
      await resendVerification(email)

      Alert.alert(
        'Đã gửi lại!',
        'Email xác thực mới đã được gửi đến hòm thư của bạn.',
        [{ text: 'OK', style: 'default' }]
      )
    } catch (error: any) {
      console.error('Resend verification error:', error)

      const message =
        error.response?.data?.message ||
        error.message ||
        'Không thể gửi lại email xác thực.'

      Alert.alert('Lỗi', message, [{ text: 'OK', style: 'default' }])
    } finally {
      setIsResending(false)
    }
  }

  const navigateBack = () => {
    navigation.goBack()
  }

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
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={navigateBack}
            style={styles.backButton}
          />
          <View style={styles.headerContent}>
            <Text variant="headlineLarge" style={styles.title}>
              Xác thực Email
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Nhập mã xác thực từ email để hoàn tất đăng ký
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.infoBox}>
            <IconButton icon="information" size={24} iconColor={theme.colors.primary} />
            <Text variant="bodyMedium" style={styles.infoText}>
              Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hòm thư
              (bao gồm thư spam) và nhập mã bên dưới.
            </Text>
          </View>

          <TextInput
            label="Email (tùy chọn)"
            value={email}
            onChangeText={(text) => {
              setEmail(text)
              setErrors({ ...errors, email: undefined })
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            mode="outlined"
            error={!!errors.email}
            left={<TextInput.Icon icon="email" />}
            disabled={isVerifying || isResending}
            placeholder="Nhập email để gửi lại mã"
          />
          {errors.email && (
            <HelperText type="error" visible={!!errors.email}>
              {errors.email}
            </HelperText>
          )}

          <TextInput
            label="Mã xác thực"
            value={token}
            onChangeText={(text) => {
              setToken(text)
              setErrors({ ...errors, token: undefined })
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            mode="outlined"
            error={!!errors.token}
            left={<TextInput.Icon icon="key" />}
            disabled={isVerifying || isResending}
            placeholder="Nhập mã từ email"
          />
          {errors.token && (
            <HelperText type="error" visible={!!errors.token}>
              {errors.token}
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleVerifyEmail}
            loading={isVerifying}
            disabled={isVerifying || isResending}
            style={styles.verifyButton}
            contentStyle={styles.buttonContent}
          >
            {isVerifying ? 'Đang xác thực...' : 'Xác thực Email'}
          </Button>

          <Button
            mode="outlined"
            onPress={handleResendEmail}
            loading={isResending}
            disabled={isResending || isVerifying}
            style={styles.resendButton}
            contentStyle={styles.buttonContent}
          >
            {isResending ? 'Đang gửi...' : 'Gửi lại mã'}
          </Button>

          <View style={styles.footer}>
            <Text variant="bodySmall" style={styles.footerText}>
              Không nhận được email? Kiểm tra thư spam hoặc{' '}
              <Text style={styles.link} onPress={handleResendEmail}>
                gửi lại
              </Text>
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
    marginBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  headerContent: {
    marginTop: 8,
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
    gap: 16,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
  },
  verifyButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  resendButton: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
  },
  footerText: {
    opacity: 0.7,
  },
  link: {
    fontWeight: '600',
  },
})
