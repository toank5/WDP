import { useAuthStore } from '@/store/auth-store'
import { Box, Card, CardContent, Typography, Chip, Button } from '@mui/material'
import { ShoppingBag, People, Inventory2, TrendingUp } from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { roleLabels } from '@/lib/constants'

export function DashboardOverview() {
  const { user } = useAuthStore()

  if (!user) return null

  const isAdmin = user.role === 0

  return (
    <Box sx={{ p: 0 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Welcome back, {user.fullName}!
        </Typography>
        <Typography color="text.secondary">
          Here's what's happening with your WDP Eyewear account today.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
          gap: 3,
          mb: 4,
        }}
      >
        <Card variant="outlined" sx={{ borderRadius: 1 }}>
          <CardContent sx={{ p: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1.5,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={700}
                sx={{ textTransform: 'uppercase', letterSpacing: 1 }}
              >
                Account Type
              </Typography>
              <People sx={{ color: 'grey.500', fontSize: 20 }} />
            </Box>
            <Typography variant="h5" fontWeight="bold" color="text.primary">
              {roleLabels[user.role]}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Access Level
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{ textTransform: 'uppercase' }}
              >
                Email
              </Typography>
              <Box sx={{ bgcolor: 'primary.light', borderRadius: 2, p: 1 }}>
                <Inventory2 sx={{ color: 'primary.main' }} />
              </Box>
            </Box>
            <Typography variant="body1" fontWeight={600} noWrap>
              {user.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Primary Contact
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 1, bgcolor: 'grey.50' }}>
          <CardContent sx={{ p: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1.5,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={700}
                sx={{ textTransform: 'uppercase', letterSpacing: 1 }}
              >
                Status
              </Typography>
              <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />
            </Box>
            <Typography variant="h5" fontWeight="bold" color="success.dark">
              Active
            </Typography>
            <Typography variant="caption" color="success.dark">
              ● Online Now
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{ textTransform: 'uppercase' }}
              >
                Member Since
              </Typography>
              <Box sx={{ bgcolor: 'secondary.light', borderRadius: 2, p: 1 }}>
                <ShoppingBag sx={{ color: 'secondary.main' }} />
              </Box>
            </Box>
            <Typography variant="h4" fontWeight="bold">
              2026
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Joined This Year
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: isAdmin ? '1fr 1fr' : '1fr' },
          gap: 3,
        }}
      >
        {isAdmin && (
          <Card sx={{ bgcolor: 'primary.light' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ bgcolor: 'primary.main', borderRadius: 2, p: 1.5 }}>
                  <People sx={{ color: 'white', fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Admin Panel
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    System Management
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Manage users, products, and system configuration. Access advanced features and
                analytics to oversee the entire WDP Eyewear platform.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button component={Link} to="/dashboard/users" variant="contained" size="small">
                  User Management
                </Button>
                <Chip label="System Config" color="secondary" size="small" />
                <Chip label="Analytics" color="success" size="small" />
              </Box>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ bgcolor: 'grey.200', borderRadius: 2, p: 1.5 }}>
                <Inventory2 sx={{ color: 'grey.700', fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Quick Actions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Frequently Used
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Access your frequently used features and tools based on your role. Browse products,
              manage orders, and track prescriptions.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" fullWidth sx={{ justifyContent: 'flex-start' }}>
                Browse Frames & Lenses
              </Button>
              <Button variant="outlined" fullWidth sx={{ justifyContent: 'flex-start' }}>
                View My Orders
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ gridColumn: { xs: '1', lg: isAdmin ? '1 / -1' : '1' } }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ bgcolor: 'warning.light', borderRadius: 2, p: 1.5 }}>
                <TrendingUp sx={{ color: 'warning.dark', fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Recent Activity
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Latest Updates
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              View your recent actions and system notifications. Stay updated with order status and
              prescription processing.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
              <Box
                sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.5 }}
              />
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Account Created
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Just now
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
