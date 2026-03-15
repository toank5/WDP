import React from 'react'
import { Box, Container, Typography, Button, Stack, Alert, Paper } from '@mui/material'
import { Home, Refresh, ArrowBack } from '@mui/icons-material'

type Props = {
  children: React.ReactNode
}

type State = {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}

// Separate component for the error fallback UI (no hooks!)
function ErrorFallback({ error }: { error?: Error }) {
  // Force a fresh page load when going back
  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back()
      // Force a hard reload after navigation to clear error state
      setTimeout(() => {
        window.location.reload()
      }, 100)
    } else {
      // No history, go to home with fresh load
      window.location.href = '/'
    }
  }

  // Direct reload for refresh button
  const handleReload = () => {
    window.location.reload()
  }

  // Go to home with fresh load
  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50',
        py: 8,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            bgcolor: 'background.paper',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
            border: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          <Stack spacing={3} alignItems="center" textAlign="center">
            {/* Error Icon with gradient background */}
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fee2e2 0%, #fef2f2 50%, #fef3f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
                <Typography
                  variant="h4"
                  sx={{
                    color: 'error.main',
                    fontWeight: 700,
                  }}
                >
                  !
                </Typography>
            </Box>

            {/* Error Message */}
            <Stack spacing={1}>
              <Typography variant="h5" sx={{ color: 'grey.900', fontWeight: 600 }}>
                Something went wrong
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.600' }}>
                We encountered an unexpected error. You can go back, refresh the page,
                or return to the home screen.
              </Typography>
            </Stack>

            {/* Error Details (in development) */}
            {import.meta.env.DEV && error && (
              <Box
                sx={{
                  width: '100%',
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'grey.100',
                  border: '1px dashed',
                  borderColor: 'grey.300',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'monospace',
                    color: 'error.main',
                    wordBreak: 'break-all',
                    display: 'block',
                    maxHeight: 60,
                    overflow: 'auto',
                  }}
                >
                  {error.message}
                </Typography>
              </Box>
            )}

            {/* Action Buttons */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ width: '100%' }}
            >
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ArrowBack sx={{ fontSize: 18 }} />}
                onClick={handleGoBack}
                sx={{
                  borderColor: 'grey.300',
                  color: 'grey.700',
                  bgcolor: 'white',
                  py: 1.25,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    borderColor: 'grey.400',
                    bgcolor: 'grey.50',
                  },
                }}
              >
                Go Back
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Refresh sx={{ fontSize: 18 }} />}
                onClick={handleReload}
                sx={{
                  background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                  py: 1.25,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 500,
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1d4ed8, #4338ca)',
                    boxShadow: '0 6px 16px rgba(37, 99, 235, 0.4)',
                  },
                }}
              >
                Refresh Page
              </Button>
            </Stack>

            {/* Go Home Link */}
            <Box>
              <Button
                size="small"
                startIcon={<Home sx={{ fontSize: 16 }} />}
                onClick={handleGoHome}
                sx={{
                  color: 'grey.600',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: 'transparent',
                    color: 'grey.800',
                  },
                }}
              >
                Return to Home
              </Button>
            </Box>

            {/* Support Info */}
            <Typography variant="caption" sx={{ color: 'grey.500' }}>
              If this problem persists, please contact our support team
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}
