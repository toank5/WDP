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
import { forgotPassword } from '../../services/auth-api'

interface ForgotPasswordScreenProps {
  navigation: any
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const theme = useTheme()

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSendResetLink = async () => {
    // Reset error
    setEmailError('')

    // Validate email
    if (!email) {
      setEmailError('Vui lòng nhập email')
      return
    }

    if (!validateEmail(email)) {
      setEmailError('Email không hợp lệ')
      return
    }

    setIsLoading(true)

    try {
      await forgotPassword({ email })

      setEmailSent(true)
      Alert.alert(
        'Gửi thành công',
        'Link đặt lại mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack()
            },
          },
        ]
      )
    } catch (error: any) {
      console.error('Forgot password error:', error)

      if (error.response?.data?.message) {
        Alert.alert('Gửi thất bại', error.response.data.message)
      } else if (error.message) {
        Alert.alert('Gửi thất bại', error.message)
      } else {
        Alert.alert(
          'Gửi thất bại',
          'Đã có lỗi xảy ra. Vui lòng thử lại sau.'
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
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
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📧</Text>
          </View>
          <Text variant="headlineLarge" style={styles.title}>
            Quên mật khẩu?
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Nhập email của bạn để nhận link đặt lại mật khẩu
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text)
              setEmailError('')
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            mode="outlined"
            error={!!emailError}
            left={<TextInput.Icon icon="email" />}
            disabled={isLoading}
          />
          {emailError && (
            <HelperText type="error" visible={!!emailError}>
              {emailError}
            </HelperText>
          )}

          {emailSent && (
            <HelperText type="info" visible={emailSent} style={styles.successText}>
              Link đặt lại mật khẩu đã được gửi đến {email}
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleSendResetLink}
            loading={isLoading}
            disabled={isLoading}
            style={styles.sendButton}
            contentStyle={styles.sendButtonContent}
          >
            {isLoading ? 'Đang gửi...' : 'Gửi link đặt lại'}
          </Button>

          <Button
            mode="text"
            onPress={handleBackToLogin}
            disabled={isLoading}
            style={styles.backButton}
            textColor={theme.colors.primary}
          >
            Quay lại đăng nhập
          </Button>
        </View>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            Nếu bạn không nhận được email trong vài phút, vui lòng kiểm tra thư mục spam.
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
    gap: 16,
  },
  successText: {
    marginTop: 8,
    fontSize: 14,
  },
  sendButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  sendButtonContent: {
    paddingVertical: 8,
  },
  backButton: {
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
