import React, { useRef, useState } from 'react'
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
  Icon,
  useTheme,
  Snackbar,
  Surface,
} from 'react-native-paper'
import { useAuthStore } from '../../store/auth-store'
import { APP_CONFIG } from '../../config'
import { ScreenContainer } from '../../components'

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
  const emailInputRef = useRef<any>(null)
  const passwordInputRef = useRef<any>(null)
  const confirmInputRef = useRef<any>(null)
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

  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  })

  const [errors, setErrors] = useState<RegisterErrors>({})
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

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
      newErrors.fullName = 'Please enter your full name.'
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters.'
    }

    if (!formData.email) {
      newErrors.email = 'Please enter your email address.'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address.'
    }

    if (!formData.password) {
      newErrors.password = 'Please enter a password.'
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters.'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.'
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must accept Terms and Privacy Policy.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async () => {
    if (!validateForm()) {
      return
    }

    setFormError('')

    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      })

      setShowSuccess(true)
      Alert.alert('Account created', 'Your account has been created. Please log in to continue.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login' as never),
        },
      ])
    } catch (error: any) {
      console.error('Register error:', error)

      if (error.response?.data?.message) {
        const apiMessage = String(error.response.data.message)
        const lower = apiMessage.toLowerCase()

        if (lower.includes('email')) {
          setErrors({ email: error.response.data.message })
        } else {
          setFormError('Unable to create account right now. Please try again.')
        }
      } else if (error.message) {
        setFormError('Unable to create account right now. Please try again.')
      } else {
        setFormError('Unable to create account right now. Please try again.')
      }
    }
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

  const navigateToLogin = () => {
    navigation.navigate('Login' as never)
  }

  const navigateToTerms = () => {
    Alert.alert('Terms of Service', 'Terms screen is under development.')
  }

  const navigateToPrivacy = () => {
    Alert.alert('Privacy Policy', 'Privacy screen is under development.')
  }

  const updateField = (field: keyof RegisterFormData, value: string | boolean) => {
    setFormData({ ...formData, [field]: value })
    if (formError) {
      setFormError('')
    }
  }

  const validateField = (field: keyof RegisterErrors) => {
    const nextErrors: RegisterErrors = { ...errors }

    if (field === 'fullName') {
      if (!formData.fullName.trim()) {
        nextErrors.fullName = 'Please enter your full name.'
      } else if (formData.fullName.trim().length < 2) {
        nextErrors.fullName = 'Full name must be at least 2 characters.'
      } else {
        nextErrors.fullName = undefined
      }
    }

    if (field === 'email') {
      if (!formData.email) {
        nextErrors.email = 'Please enter your email address.'
      } else if (!validateEmail(formData.email)) {
        nextErrors.email = 'Please enter a valid email address.'
      } else {
        nextErrors.email = undefined
      }
    }

    if (field === 'password') {
      if (!formData.password) {
        nextErrors.password = 'Please enter a password.'
      } else if (!validatePassword(formData.password)) {
        nextErrors.password = 'Password must be at least 6 characters.'
      } else {
        nextErrors.password = undefined
      }

      if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
        nextErrors.confirmPassword = 'Passwords do not match.'
      } else {
        nextErrors.confirmPassword = undefined
      }
    }

    if (field === 'confirmPassword') {
      if (!formData.confirmPassword) {
        nextErrors.confirmPassword = 'Please confirm your password.'
      } else if (formData.password !== formData.confirmPassword) {
        nextErrors.confirmPassword = 'Passwords do not match.'
      } else {
        nextErrors.confirmPassword = undefined
      }
    }

    setErrors(nextErrors)
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
                Create account
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                Save your prescriptions, orders and addresses.
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
                label="Full name"
                placeholder="Your full name"
                value={formData.fullName}
                onChangeText={(text) => {
                  updateField('fullName', text)
                  if (errors.fullName) {
                    setErrors({ ...errors, fullName: undefined })
                  }
                }}
                onBlur={() => validateField('fullName')}
                autoCapitalize="words"
                mode="outlined"
                returnKeyType="next"
                autoFocus
                error={!!errors.fullName}
                left={<TextInput.Icon icon="account-outline" />}
                onSubmitEditing={() => emailInputRef.current?.focus?.()}
                disabled={isLoading}
                theme={lightControlTheme}
                textColor="#0f172a"
              />
              <HelperText type="error" visible={!!errors.fullName}>
                {errors.fullName ?? ' '}
              </HelperText>

              <TextInput
                ref={emailInputRef}
                label="Email"
                placeholder="you@example.com"
                value={formData.email}
                onChangeText={(text) => {
                  updateField('email', text)
                  if (errors.email) {
                    setErrors({ ...errors, email: undefined })
                  }
                }}
                onBlur={() => validateField('email')}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect={false}
                mode="outlined"
                returnKeyType="next"
                error={!!errors.email}
                left={<TextInput.Icon icon="email-outline" />}
                onSubmitEditing={() => passwordInputRef.current?.focus?.()}
                disabled={isLoading}
                theme={lightControlTheme}
                textColor="#0f172a"
              />
              <HelperText type="error" visible={!!errors.email}>
                {errors.email ?? ' '}
              </HelperText>

              <TextInput
                ref={passwordInputRef}
                label="Password"
                placeholder="Create password"
                value={formData.password}
                onChangeText={(text) => {
                  updateField('password', text)
                  if (errors.password || errors.confirmPassword) {
                    setErrors({ ...errors, password: undefined, confirmPassword: undefined })
                  }
                }}
                onBlur={() => validateField('password')}
                secureTextEntry={!showPassword}
                mode="outlined"
                returnKeyType="next"
                textContentType="newPassword"
                autoComplete="password-new"
                error={!!errors.password}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    onPress={() => setShowPassword(!showPassword)}
                    forceTextInputFocus={false}
                  />
                }
                onSubmitEditing={() => confirmInputRef.current?.focus?.()}
                disabled={isLoading}
                theme={lightControlTheme}
                textColor="#0f172a"
              />
              <HelperText type="info" visible={!errors.password}>
                Use at least 6 characters.
              </HelperText>
              <HelperText type="error" visible={!!errors.password}>
                {errors.password ?? ' '}
              </HelperText>

              <TextInput
                ref={confirmInputRef}
                label="Confirm password"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChangeText={(text) => {
                  updateField('confirmPassword', text)
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: undefined })
                  }
                }}
                onBlur={() => validateField('confirmPassword')}
                secureTextEntry={!showConfirmPassword}
                mode="outlined"
                returnKeyType="done"
                textContentType="newPassword"
                autoComplete="password-new"
                error={!!errors.confirmPassword}
                left={<TextInput.Icon icon="lock-check-outline" />}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    forceTextInputFocus={false}
                  />
                }
                onSubmitEditing={handleRegister}
                disabled={isLoading}
                theme={lightControlTheme}
                textColor="#0f172a"
              />
              <HelperText type="error" visible={!!errors.confirmPassword}>
                {errors.confirmPassword ?? ' '}
              </HelperText>

              <View style={styles.termsContainer}>
                <View style={styles.checkboxContainer}>
                  <Checkbox.Android
                    status={formData.agreeTerms ? 'checked' : 'unchecked'}
                    onPress={() => {
                      updateField('agreeTerms', !formData.agreeTerms)
                      if (errors.agreeTerms) {
                        setErrors({ ...errors, agreeTerms: undefined })
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Text variant="bodyMedium" style={styles.termsText}>
                    I agree to the{' '}
                    <Text style={[styles.linkText, { color: theme.colors.primary }]} onPress={navigateToTerms}>
                      Terms of Service
                    </Text>{' '}
                    and{' '}
                    <Text style={[styles.linkText, { color: theme.colors.primary }]} onPress={navigateToPrivacy}>
                      Privacy Policy
                    </Text>
                  </Text>
                </View>
              </View>
              <HelperText type="error" visible={!!errors.agreeTerms}>
                {errors.agreeTerms ?? ' '}
              </HelperText>

              <Button
                mode="contained"
                onPress={handleRegister}
                loading={isLoading}
                disabled={isLoading}
                style={styles.registerButton}
                contentStyle={styles.registerButtonContent}
                buttonColor="#93c5fd"
                textColor="#172554"
              >
                {isLoading ? 'Creating account...' : 'Sign up'}
              </Button>

              <View style={styles.loginContainer}>
                <Text variant="bodyMedium" style={styles.bottomText}>
                  Already have an account?
                </Text>
                <Button mode="text" compact onPress={navigateToLogin} labelStyle={styles.loginText}>
                  Log in
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
          Account created successfully.
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
  termsContainer: {
    marginTop: 2,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: -8,
  },
  termsText: {
    fontSize: 13,
    flex: 1,
    flexWrap: 'wrap',
    color: '#334155',
  },
  linkText: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  registerButton: {
    marginTop: 10,
    borderRadius: 12,
  },
  registerButtonContent: {
    minHeight: 52,
  },
  loginContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  bottomText: {
    color: '#64748b',
  },
  loginText: {
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
