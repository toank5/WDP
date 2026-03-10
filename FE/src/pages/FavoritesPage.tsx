import { Box, Container, Typography, Stack, Card, CardContent, Button, Grid } from '@mui/material'
import { Heart, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function FavoritesPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Stack spacing={4} alignItems="center" sx={{ textAlign: 'center' }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: 'error.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Heart size={40} color="#ef4444" />
        </Box>
        <Typography variant="h4" fontWeight={800}>
          Your Favorites
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 500 }}>
          Save your favorite frames and lenses here. Items you add to your wishlist will appear on this page.
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            component={Link}
            to="/products"
            variant="contained"
            size="large"
            startIcon={<ShoppingBag size={20} />}
          >
            Browse Products
          </Button>
          <Button
            component={Link}
            to="/"
            variant="outlined"
            size="large"
          >
            Return Home
          </Button>
        </Stack>
      </Stack>
    </Container>
  )
}
