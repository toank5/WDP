import { Box, Container, Typography, Stack, Card, CardContent, Button, useTheme, Avatar, Divider } from '@mui/material'
import Grid from '@mui/material/Grid2'
import {
  VisibilityOutlined,
  ShoppingBagOutlined,
  VerifiedUserOutlined,
  MonetizationOnOutlined,
  ViewInAr,
  Psychology,
  Groups,
  LocalShipping,
  ChevronRight,
  ArrowForward,
} from '@mui/icons-material'
import { Link } from 'react-router-dom'

export default function AboutPage() {
  const theme = useTheme()

  const features = [
    {
      icon: <ViewInAr sx={{ fontSize: 36 }} />,
      title: 'Virtual Try-On',
      description: 'See how you look before you buy. Our advanced AR technology lets you try frames instantly from your device.',
    },
    {
      icon: <ShoppingBagOutlined sx={{ fontSize: 36 }} />,
      title: 'Wide Selection',
      description: 'Hundreds of frames, unlimited possibilities. From classic to trendy, find your perfect style.',
    },
    {
      icon: <VerifiedUserOutlined sx={{ fontSize: 36 }} />,
      title: 'Prescription Experts',
      description: 'Our opticians verify every prescription for accuracy. Your vision is our priority.',
    },
    {
      icon: <MonetizationOnOutlined sx={{ fontSize: 36 }} />,
      title: 'Transparent Pricing',
      description: 'No hidden fees, just fair prices. Quality eyewear at prices that make sense.',
    },
  ]

  const techFeatures = [
    {
      icon: '🕶️',
      title: '3D Frame Viewing',
      description: 'Rotate and examine frames from every angle with our interactive 3D viewer.',
    },
    {
      icon: '📸',
      title: 'Virtual Try-On',
      description: 'Upload a selfie or use your camera to see how frames look on your face in real-time.',
    },
    {
      icon: '🔬',
      title: 'Prescription Lens Builder',
      description: 'Customize your lenses with coatings, materials, and tints tailored to your needs.',
    },
    {
      icon: '🏠',
      title: 'Home Delivery',
      description: 'Your complete glasses delivered to your doorstep. No more trips to the store.',
    },
  ]

  const values = [
    { icon: '✓', title: 'Quality First', description: 'Premium materials and expert craftsmanship' },
    { icon: '♥', title: 'Customer Focused', description: 'Your satisfaction is our success' },
    { icon: '∞', title: 'Always Improving', description: 'Continuously enhancing our technology' },
  ]

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: '60vh', md: '70vh' },
          minHeight: 500,
          display: 'flex',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${theme.palette.primary.main}dd 0%, ${theme.palette.primary.dark}dd 100%)`,
          color: 'white',
          overflow: 'hidden',
        }}
      >
        {/* Decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.05)',
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
            bgcolor: 'rgba(255,255,255,0.03)',
            bottom: -50,
            left: -50,
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={3}>
                <Typography
                  variant="overline"
                  sx={{
                    color: 'rgba(255,255,255,0.9)',
                    fontWeight: 600,
                    letterSpacing: 3,
                    fontSize: '0.85rem',
                  }}
                >
                  ABOUT EYEWEAR
                </Typography>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    fontWeight: 800,
                    lineHeight: 1.1,
                  }}
                >
                  See the World
                  <br />
                  <Box component="span" sx={{ color: 'primary.light' }}>Differently</Box>
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    color: 'rgba(255,255,255,0.85)',
                    fontWeight: 400,
                    maxWidth: 550,
                  }}
                >
                  Redefining how you buy glasses. Convenience, style, and clarity delivered to your door.
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    component={Link}
                    to="/store"
                    variant="contained"
                    startIcon={<ShoppingBagOutlined />}
                    sx={{
                      px: 4,
                      py: 1.5,
                      bgcolor: 'white',
                      color: 'primary.main',
                      '&:hover': { bgcolor: 'grey.100' },
                    }}
                  >
                    Shop Now
                  </Button>
                  <Button
                    component={Link}
                    to="/virtual-tryon"
                    variant="outlined"
                    startIcon={<VisibilityOutlined />}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderColor: 'white',
                      color: 'white',
                      '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' },
                    }}
                  >
                    Try Virtual
                  </Button>
                </Stack>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Avatar
                  sx={{
                    width: 280,
                    height: 280,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    fontSize: 120,
                    border: '4px solid rgba(255,255,255,0.2)',
                  }}
                >
                  👓
                </Avatar>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Our Story Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 10, md: 16 } }}>
        <Grid container spacing={6} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={3}>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 600, letterSpacing: 2 }}>
                OUR STORY
              </Typography>
              <Typography variant="h3" fontWeight={800}>
                Why We Started EyeWear
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                We've all been there—spending hours traveling to optical stores, waiting in line, only to find limited options and pushy salespeople. The frames you want are out of stock, and the ones available don't quite fit your style.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                <Box component="span" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  We knew there had to be a better way.
                </Box>
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                EyeWear was born from a simple idea: what if you could browse hundreds of frames, try them on virtually, and get prescription glasses delivered to your door—all from the comfort of your home?
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                Today, we're making that vision a reality. No more traffic. No more waiting. Just great glasses, exactly how you want them.
              </Typography>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                bgcolor: 'grey.50',
                borderRadius: 4,
                p: 4,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Stack spacing={3} alignItems="center" sx={{ textAlign: 'center' }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', mb: 2 }}>
                  <Psychology sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h5" fontWeight={700}>
                  Built for You
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Every feature we build is designed to solve a real problem. From our virtual try-on to our prescription verification system, everything is about making your experience better.
                </Typography>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Why Choose Us Section */}
      <Box sx={{ bgcolor: 'grey.50', py: { xs: 10, md: 16 } }}>
        <Container maxWidth="lg">
          <Stack spacing={3} sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 600, letterSpacing: 2 }}>
              WHY CHOOSE US
            </Typography>
            <Typography variant="h3" fontWeight={800}>
              The EyeWear Difference
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              We're not just another online store. We're reimagining the entire experience of buying glasses.
            </Typography>
          </Stack>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'all 0.3s',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 12px 40px ${theme.palette.primary.main}22}`,
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center' }}>
                      <Box
                        sx={{
                          width: 72,
                          height: 72,
                          borderRadius: '20px',
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
      </Box>

      {/* Our Technology Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 10, md: 16 } }}>
        <Stack spacing={3} sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 600, letterSpacing: 2 }}>
            OUR TECHNOLOGY
          </Typography>
          <Typography variant="h3" fontWeight={800}>
            Innovation You Can See
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            We leverage cutting-edge technology to give you the best online eyewear shopping experience.
          </Typography>
        </Stack>

        <Grid container spacing={4}>
          {techFeatures.map((tech, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.3s',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Box sx={{ fontSize: 48, textAlign: 'center' }}>{tech.icon}</Box>
                    <Typography variant="h6" fontWeight={700} sx={{ textAlign: 'center' }}>
                      {tech.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                      {tech.description}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* CTA */}
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Ready to Experience the Future of Eyewear Shopping?
          </Typography>
          <Button
            component={Link}
            to="/store"
            variant="contained"
            endIcon={<ArrowForward />}
            sx={{ mt: 2, px: 4, py: 1.5 }}
          >
            Browse Collection
          </Button>
        </Box>
      </Container>

      {/* Values Section */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: { xs: 10, md: 16 } }}>
        <Container maxWidth="lg">
          <Stack spacing={3} sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, letterSpacing: 2 }}>
              OUR VALUES
            </Typography>
            <Typography variant="h3" fontWeight={800}>
              What Drives Us
            </Typography>
          </Stack>

          <Grid container spacing={4}>
            {values.map((value, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ width: 64, height: 64, bgcolor: 'rgba(255,255,255,0.15)', fontSize: 32 }}>
                    {value.icon}
                  </Avatar>
                  <Typography variant="h6" fontWeight={700}>
                    {value.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                    {value.description}
                  </Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Team Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 10, md: 16 } }}>
        <Stack spacing={3} sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 600, letterSpacing: 2 }}>
            OUR TEAM
          </Typography>
          <Typography variant="h3" fontWeight={800}>
            Meet the Experts Behind EyeWear
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Our team of optometrists, designers, and engineers work together to bring you the best eyewear experience.
          </Typography>
        </Stack>

        <Grid container spacing={4} justifyContent="center">
          {[
            { name: 'Dr. Sarah Chen', role: 'Chief Optometrist', emoji: '👩‍⚕️' },
            { name: 'Marcus Williams', role: 'Head of Design', emoji: '🎨' },
            { name: 'Emily Rodriguez', role: 'Customer Experience Lead', emoji: '💬' },
          ].map((member, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
              <Card
                sx={{
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: 'primary.main',
                      fontSize: 40,
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {member.emoji}
                  </Avatar>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {member.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {member.role}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'grey.50', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="md">
          <Card
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Stack spacing={3} alignItems="center" sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={800}>
                  Join Thousands of Happy Customers
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem' }}>
                  Experience the future of eyewear shopping today.
                </Typography>
                <Button
                  component={Link}
                  to="/store"
                  variant="contained"
                  endIcon={<ChevronRight />}
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    px: 4,
                    py: 1.5,
                    '&:hover': { bgcolor: 'grey.100' },
                  }}
                >
                  Get Started
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </Box>
  )
}
