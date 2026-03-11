import { Link } from 'react-router-dom'
import { Box, Container, Typography, Button, Stack, Card, CardContent, Grid, useTheme } from '@mui/material'
import {
  AddCircleOutlined,
  FolderOpenOutlined,
  ContentCut,
  Verified,
  Speed,
  SupportAgent,
  ArrowForward,
} from '@mui/icons-material'

export default function PrescriptionPage() {
  const theme = useTheme()

  const features = [
    {
      icon: <Verified sx={{ fontSize: 32 }} />,
      title: 'Expert Verified',
      description: 'Our opticians review every prescription',
    },
    {
      icon: <Speed sx={{ fontSize: 32 }} />,
      title: 'Fast Processing',
      description: 'Ready in 5-7 business days',
    },
    {
      icon: <ContentCut sx={{ fontSize: 32 }} />,
      title: 'Premium Quality',
      description: 'Scratch-resistant & UV protection',
    },
    {
      icon: <SupportAgent sx={{ fontSize: 32 }} />,
      title: 'Expert Support',
      description: 'Help when you need it',
    },
  ]

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main}dd 0%, ${theme.palette.primary.dark}dd 100%)`,
          position: 'relative',
          py: { xs: 12, md: 16 },
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.03)',
            top: -100,
            right: -100,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.05)',
            bottom: -80,
            left: -80,
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack spacing={3} alignItems="center" sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                width: { xs: 80, md: 100 },
                height: { xs: 80, md: 100 },
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <ContentCut sx={{ fontSize: { xs: 40, md: 52 }, color: 'white' }} />
            </Box>

            <Typography
              variant="overline"
              sx={{
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 600,
                letterSpacing: 3,
                fontSize: '0.85rem',
              }}
            >
              YOUR VISION, OUR CRAFT
            </Typography>

            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '2.2rem', md: '3.5rem' },
                fontWeight: 800,
                color: 'white',
                lineHeight: 1.1,
                maxWidth: 700,
              }}
            >
              Prescription Glasses
              <Box component="br" sx={{ display: { xs: 'none', md: 'block' } }} />
              Made Simple
            </Typography>

            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255,255,255,0.85)',
                fontWeight: 400,
                maxWidth: 550,
                fontSize: { xs: '1rem', md: '1.15rem' },
              }}
            >
              Save your prescription once, order glasses anytime. Our expert opticians verify every prescription for accuracy.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
              <Button
                component={Link}
                to="/prescription/upload"
                variant="contained"
                size="large"
                startIcon={<AddCircleOutlined />}
                sx={{
                  px: 4,
                  py: 1.8,
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'grey.100', transform: 'translateY(-2px)' },
                  transition: 'all 0.2s',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                }}
              >
                Upload Prescription
              </Button>
              <Button
                component={Link}
                to="/orders"
                variant="outlined"
                size="large"
                startIcon={<FolderOpenOutlined />}
                sx={{
                  px: 4,
                  py: 1.8,
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  borderColor: 'rgba(255,255,255,0.4)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.08)',
                  },
                }}
              >
                My Orders
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Features Grid */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.3s ease',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: `0 12px 40px ${theme.palette.primary.main}22`,
                    borderColor: 'primary.main',
                  },
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Stack spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '16px',
                        bgcolor: `${theme.palette.primary.main}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'primary.main',
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Quick Start Cards */}
      <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 } }}>
        <Stack spacing={3} sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="h4" fontWeight={800}>
            Get Started Today
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Choose how you'd like to proceed
          </Typography>
        </Stack>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s ease',
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
                border: '2px solid',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'scale(1.02)',
                  boxShadow: `0 20px 60px ${theme.palette.primary.main}18`,
                },
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack spacing={3}>
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: '20px',
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AddCircleOutlined sx={{ fontSize: 40, color: 'white' }} />
                  </Box>

                  <Stack spacing={1}>
                    <Typography variant="h5" fontWeight={800}>
                      New Prescription
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add your prescription details to your account for faster checkout
                    </Typography>
                  </Stack>

                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                      You'll need:
                    </Typography>
                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary">
                        • SPH, CYL, Axis values from your prescription
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Pupillary Distance (PD) measurement
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Or upload a photo of your prescription
                      </Typography>
                    </Stack>
                  </Stack>

                  <Button
                    component={Link}
                    to="/prescription/upload"
                    variant="contained"
                    size="large"
                    fullWidth
                    endIcon={<ArrowForward />}
                    sx={{ mt: 2, py: 1.5 }}
                  >
                    Upload Prescription
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s ease',
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
                border: '2px solid',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'success.main',
                  transform: 'scale(1.02)',
                  boxShadow: `0 20px 60px ${theme.palette.success.main}18`,
                },
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack spacing={3}>
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: '20px',
                      bgcolor: 'success.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FolderOpenOutlined sx={{ fontSize: 40, color: 'white' }} />
                  </Box>

                  <Stack spacing={1}>
                    <Typography variant="h5" fontWeight={800}>
                      My Orders
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View your orders and prescription-based glasses
                    </Typography>
                  </Stack>

                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                      You can:
                    </Typography>
                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary">
                        • View all your orders with prescriptions
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Track order status and fulfillment
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • View manufacturing proof when ready
                      </Typography>
                    </Stack>
                  </Stack>

                  <Button
                    component={Link}
                    to="/orders"
                    variant="outlined"
                    size="large"
                    fullWidth
                    endIcon={<ArrowForward />}
                    sx={{ mt: 2, py: 1.5 }}
                  >
                    View Orders
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Bottom CTA */}
      <Box sx={{ bgcolor: 'grey.50', py: 8, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Stack spacing={2} alignItems="center">
            <Typography variant="h6" fontWeight={700} color="text.primary">
              Ready to shop for frames?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Browse our collection of stylish frames
            </Typography>
            <Button
              component={Link}
              to="/store"
              variant="text"
              endIcon={<ArrowForward />}
              sx={{ mt: 1 }}
            >
              Shop Frames
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}
