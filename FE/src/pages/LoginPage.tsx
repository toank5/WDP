import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
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
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  EmailRounded,
  LockRounded,
  ShoppingBagOutlined,
} from '@mui/icons-material'
import { login } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'

interface FormValues {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((state) => state.setAuth)

  // Form state
  const [values, setValues] = useState<FormValues>({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)

  // Form validation errors
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  // Get redirect path from location state or default to home
  const from = (location.state as any)?.from?.pathname || '/'

  // Load saved email if remember me was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    if (savedEmail) {
      setValues((prev) => ({ ...prev, email: savedEmail }))
      setRememberMe(true)
    }
  }, [])

  const validateForm = (): boolean => {
    const errors: FormErrors = {}

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

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }))
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous error
    setError(null)

    // Validate form
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const data = await login({ email: values.email, password: values.password })
      setAuth(data)

      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', values.email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }

      toast.success('Logged in successfully')

      // Redirect to the page they tried to visit, or home
      navigate(from, { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.'
      setError(message)
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
              <ShoppingBagOutlined sx={{ fontSize: 36, color: 'white' }} />
            </Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to manage your orders and favorites
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit}>
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
              autoFocus
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
              helperText={formErrors.password}
              autoComplete="current-password"
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
              sx={{ mb: 2 }}
            />

            {/* Remember Me & Forgot Password */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    Remember me
                  </Typography>
                }
              />
              <Link
                to="/forgot-password"
                style={{
                  fontSize: '0.875rem',
                  color: '#1976d2',
                  textDecoration: 'none',
                }}
              >
                Forgot password?
              </Link>
            </Box>

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
                  Logging in…
                </>
              ) : (
                'Log in'
              )}
            </Button>

            {/* Create Account Link */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  style={{
                    color: '#1976d2',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  Create account
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 3, color: 'text.secondary' }}>
          <Typography variant="caption">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
