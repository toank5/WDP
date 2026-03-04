import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  EmailRounded,
  LockRounded,
  PersonRounded,
  ShoppingBagOutlined,
  HowToRegRounded,
} from '@mui/icons-material'
import { register } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'

interface FormValues {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  // Form state
  const [values, setValues] = useState<FormValues>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  // Form validation errors
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    // Full name validation
    if (!values.fullName.trim()) {
      errors.fullName = 'Full name is required'
    } else if (values.fullName.trim().length < 5) {
      errors.fullName = 'Full name must be at least 5 characters'
    }

    // Email validation
    if (!values.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!values.password) {
      errors.password = 'Password is required'
    } else if (values.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    // Confirm password validation
    if (!values.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }))
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    // Clear global error when user makes changes
    if (globalError) {
      setGlobalError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous global error
    setGlobalError(null)

    // Validate form
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const data = await register({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      })

      // Auto-login after successful registration
      setAuth(data)

      toast.success('Registration successful! Please check your email to verify your account.')

      // Redirect to home page
      navigate('/', { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.'
      setGlobalError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleMouseDownPassword = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fb 0%, #ffffff 50%, #e6f0ff 100%)',
        p: 2,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
          }}
        >
          {/* Logo/Brand */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <HowToRegRounded sx={{ fontSize: 36, color: 'white' }} />
            </Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Create your account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign up to track orders and save favorites
            </Typography>
          </Box>

          {/* Global Error Alert */}
          {globalError && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setGlobalError(null)}>
              {globalError}
            </Alert>
          )}

          {/* Register Form */}
          <Box component="form" onSubmit={handleSubmit}>
            {/* Full Name Field */}
            <TextField
              fullWidth
              label="Full name"
              margin="normal"
              value={values.fullName}
              onChange={handleChange('fullName')}
              error={!!formErrors.fullName}
              helperText={formErrors.fullName}
              autoComplete="name"
              autoFocus
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonRounded color="action" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ mb: 1 }}
            />

            {/* Email Field */}
            <TextField
              fullWidth
              label="Email"
              type="email"
              margin="normal"
              value={values.email}
              onChange={handleChange('email')}
              error={!!formErrors.email}
              helperText={formErrors.email}
              autoComplete="email"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailRounded color="action" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ mb: 1 }}
            />

            {/* Password Field */}
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              value={values.password}
              onChange={handleChange('password')}
              error={!!formErrors.password}
              helperText={formErrors.password || 'At least 6 characters'}
              autoComplete="new-password"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockRounded color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((prev) => !prev)}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        tabIndex={-1}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ mb: 1 }}
            />

            {/* Confirm Password Field */}
            <TextField
              fullWidth
              label="Confirm password"
              type={showConfirmPassword ? 'text' : 'password'}
              margin="normal"
              value={values.confirmPassword}
              onChange={handleChange('confirmPassword')}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
              autoComplete="new-password"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockRounded color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ mb: 2 }}
            />

            {/* Submit Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={loading}
              sx={{
                py: 1.5,
                mt: 1,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                minHeight: 48, // 44px touch target + padding
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Creating account…
                </>
              ) : (
                'Create account'
              )}
            </Button>

            {/* Login Link */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  to="/login"
                  style={{
                    color: '#1976d2',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  Log in
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 3, color: 'text.secondary' }}>
          <Typography variant="caption">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}

export default RegisterPage
