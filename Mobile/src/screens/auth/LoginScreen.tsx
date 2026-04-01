import React, { useRef, useState } from 'react'
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native'
import {
  TextInput,
  Button,
  Text,
  HelperText,
  Checkbox,
  Icon,
  Snackbar,
  useTheme,
  Surface,
} from 'react-native-paper'
import { useAuthStore } from '../../store/auth-store'
import { APP_CONFIG } from '../../config'
import { ScreenContainer } from '../../components'

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
  const { login } = useAuthStore()
  const passwordInputRef = useRef<any>(null)
  const lightControlTheme = {
    ...theme,
    dark: false,
    colors: {
      ...theme.colors,
      background: '#f8fafc',
      surface: '#ffffff',
      onSurface: '#0f172a',
      onSurfaceVariant: '#475569',
      outline: '#cbd5e1',
      primary: '#60a5fa',
      onPrimary: '#0f172a',
    },
  }

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  })

  const [errors, setErrors] = useState<LoginErrors>({})
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

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
      newErrors.email = 'Please enter your email address.'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address.'
    }

    if (!formData.password) {
      newErrors.password = 'Please enter your password.'
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters.'
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
    setFormError('')

    try {
      await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      })

      setShowSuccess(true)
      // Navigation to main flow is handled by RootNavigator when auth state updates.
    } catch (error: any) {
      console.error('Login error:', error)

      if (error.response?.data?.message) {
        const apiMessage = String(error.response.data.message)
        const lower = apiMessage.toLowerCase()

        if (lower.includes('email')) {
          setErrors({ email: error.response.data.message })
        } else if (lower.includes('password')) {
          setErrors({ password: error.response.data.message })
        } else {
          setFormError('Unable to log in. Please check your credentials and try again.')
        }
      } else if (error.message) {
        setFormError('Unable to log in right now. Please try again in a moment.')
      } else {
        setFormError('Unable to log in right now. Please try again in a moment.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const navigateToRegister = () => {
    navigation.navigate('Register' as never)
  }

  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword' as never)
  }

  const navigateAsGuest = () => {
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

  const updateEmail = (text: string) => {
    setFormData({ ...formData, email: text })
    if (errors.email) {
      setErrors({ ...errors, email: undefined })
    }
    if (formError) {
      setFormError('')
    }
  }

  const updatePassword = (text: string) => {
    setFormData({ ...formData, password: text })
    if (errors.password) {
      setErrors({ ...errors, password: undefined })
    }
    if (formError) {
      setFormError('')
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={[styles.baseBackground, styles.pointerEventsNone]} />
        <View style={[styles.backgroundCircleTop, styles.pointerEventsNone]} />
        <View style={[styles.backgroundCircleBottom, styles.pointerEventsNone]} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
              <Surface style={styles.brandMark} elevation={0}>
                <Icon source="glasses" size={24} color={theme.colors.primary} />
              </Surface>
              <Text variant="headlineMedium" style={styles.title}>
                Log in
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                Access your {APP_CONFIG.name} account
              </Text>
            </View>

            <Surface style={styles.form} elevation={2}>
              {!!formError && (
                <View
                  style={styles.formErrorContainer}
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                >
                  <HelperText type="error" visible style={styles.formErrorText}>
                    {formError}
                  </HelperText>
                </View>
              )}

              <TextInput
                label="Email"
                placeholder="you@example.com"
                value={formData.email}
                onChangeText={updateEmail}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect={false}
                mode="outlined"
                returnKeyType="next"
                autoFocus
                error={!!errors.email}
                left={<TextInput.Icon icon="email-outline" />}
                onSubmitEditing={() => passwordInputRef.current?.focus?.()}
                disabled={isSubmitting}
                accessibilityLabel="Email"
                theme={lightControlTheme}
                textColor="#0f172a"
              />
              <HelperText type="error" visible={!!errors.email}>
                {errors.email ?? ' '}
              </HelperText>

              <TextInput
                ref={passwordInputRef}
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChangeText={updatePassword}
                secureTextEntry={!showPassword}
                mode="outlined"
                returnKeyType="done"
                textContentType="password"
                autoComplete="password"
                error={!!errors.password}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    onPress={() => setShowPassword(!showPassword)}
                    forceTextInputFocus={false}
                  />
                }
                onSubmitEditing={handleLogin}
                disabled={isSubmitting}
                accessibilityLabel="Password"
                theme={lightControlTheme}
                textColor="#0f172a"
              />
              <HelperText type="error" visible={!!errors.password}>
                {errors.password ?? ' '}
              </HelperText>

              <View style={styles.rememberContainer}>
                <Pressable
                  style={styles.checkboxContainer}
                  onPress={() =>
                    setFormData({ ...formData, rememberMe: !formData.rememberMe })
                  }
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: formData.rememberMe }}
                >
                  <Checkbox.Android
                    status={formData.rememberMe ? 'checked' : 'unchecked'}
                    disabled={isSubmitting}
                  />
                  <Text variant="bodyMedium" style={styles.rememberText}>
                    Remember me
                  </Text>
                </Pressable>

                <Button
                  mode="text"
                  compact
                  onPress={navigateToForgotPassword}
                  disabled={isSubmitting}
                  labelStyle={styles.forgotPasswordText}
                  accessibilityLabel="Forgot password"
                >
                  Forgot password?
                </Button>
              </View>

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={styles.loginButton}
                contentStyle={styles.loginButtonContent}
                accessibilityLabel="Log in"
                buttonColor="#93c5fd"
                textColor="#172554"
              >
                {isSubmitting ? 'Logging in...' : 'Log in'}
              </Button>

              <View style={styles.registerContainer}>
                <Text variant="bodyMedium" style={styles.bottomText}>
                  New to {APP_CONFIG.name}?
                </Text>
                <Button
                  mode="text"
                  compact
                  onPress={navigateToRegister}
                  disabled={isSubmitting}
                  labelStyle={styles.registerText}
                >
                  Create account
                </Button>
              </View>
            </Surface>

            <Button
              mode="text"
              onPress={navigateAsGuest}
              style={styles.guestButton}
              labelStyle={styles.guestButtonLabel}
            >
              Continue as guest
            </Button>
        </ScrollView>

        <Snackbar visible={showSuccess} onDismiss={() => setShowSuccess(false)} duration={1800}>
          Logged in successfully.
        </Snackbar>
      </KeyboardAvoidingView>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  pointerEventsNone: {
    pointerEvents: 'none',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  baseBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f8fafc',
  },
  backgroundCircleTop: {
    position: 'absolute',
    top: -80,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
  },
  backgroundCircleBottom: {
    position: 'absolute',
    bottom: -90,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 26,
  },
  brandMark: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    backgroundColor: '#e0f2fe',
  },
  title: {
    fontWeight: '700',
    marginBottom: 6,
    color: '#0f172a',
  },
  subtitle: {
    color: '#64748b',
    textAlign: 'center',
  },
  form: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formErrorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 6,
  },
  formErrorText: {
    marginTop: 0,
  },
  rememberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8,
  },
  rememberText: {
    fontSize: 13,
    color: '#334155',
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '500',
  },
  loginButton: {
    marginTop: 12,
    borderRadius: 12,
  },
  loginButtonContent: {
    minHeight: 52,
  },
  registerContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  bottomText: {
    color: '#64748b',
  },
  registerText: {
    fontWeight: '600',
  },
  guestButton: {
    alignSelf: 'center',
    marginTop: 14,
  },
  guestButtonLabel: {
    color: '#475569',
  },
})
