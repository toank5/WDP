import { Box, Button, Container, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import HomeIcon from '@mui/icons-material/Home'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)',
          textAlign: 'center',
          py: 8,
        }}
      >
        {/* Large 404 text */}
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '8rem', sm: '10rem' },
            fontWeight: 800,
            background: 'linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
            mb: 2,
          }}
        >
          404
        </Typography>

        {/* Subtitle */}
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}
        >
          Page Not Found
        </Typography>

        {/* Description */}
        <Typography
          variant="body1"
          sx={{ color: 'text.secondary', mb: 4, maxWidth: 400 }}
        >
          Sorry, the page you're looking for doesn't exist or has been moved.
        </Typography>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}
          >
            Go Back
          </Button>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}
          >
            Home Page
          </Button>
        </Box>
      </Box>
    </Container>
  )
}
