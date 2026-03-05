import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Button,
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import LoginIcon from '@mui/icons-material/Login'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    if (!token) {
      setStatus('error')
      setMessage('No verification token provided.')
      return
    }

    const verify = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/verify-email`, {
          params: { token },
        })
        setStatus('success')
        setMessage(
          res.data?.message ||
            res.data?.metadata?.message ||
            'Email verified successfully! You can now log in.'
        )
      } catch (err) {
        setStatus('error')
        if (axios.isAxiosError(err)) {
          const data = err.response?.data as { message?: string }
          setMessage(data?.message || 'Verification failed. The token may be invalid or expired.')
        } else {
          setMessage('Something went wrong. Please try again.')
        }
      }
    }

    verify()
  }, [token])

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)',
          py: 8,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: { xs: 4, sm: 5 },
            borderRadius: 3,
            textAlign: 'center',
            width: '100%',
          }}
        >
          {status === 'loading' && (
            <>
              <CircularProgress size={56} sx={{ mb: 3 }} />
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Verifying your email...
              </Typography>
              <Typography color="text.secondary">
                Please wait while we verify your email address.
              </Typography>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircleOutlineIcon
                sx={{ fontSize: 72, color: 'success.main', mb: 2 }}
              />
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Email Verified!
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 4 }}>
                {message}
              </Typography>
              <Button
                variant="contained"
                startIcon={<LoginIcon />}
                onClick={() => navigate('/login')}
                sx={{ textTransform: 'none', borderRadius: 2, px: 4 }}
              >
                Go to Login
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <ErrorOutlineIcon
                sx={{ fontSize: 72, color: 'error.main', mb: 2 }}
              />
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Verification Failed
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 4 }}>
                {message}
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/login')}
                sx={{ textTransform: 'none', borderRadius: 2, px: 4 }}
              >
                Go to Login
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  )
}
