import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Badge,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Collapse,
  Button,
} from '@mui/material'
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ShoppingBag as ShoppingBagIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  Category as CategoryIcon,
  Visibility,
  RemoveRedEye as GlassesIcon,
  ContactPage as ContactIcon,
  Info as InfoIcon,
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
  Medication as PrescriptionIcon,
} from '@mui/icons-material'
import { useAuthStore } from '@/store/auth-store'
import { useCart } from '@/store/cart.store'
import { wishlistApi } from '@/lib/wishlist-api'

const roleLabels: Record<number, string> = {
  0: 'Admin',
  1: 'Manager',
  2: 'Operation',
  3: 'Sale',
  4: 'Customer',
}

// Navigation links config
const navLinks = [
  { label: 'Home', path: '/', icon: <HomeIcon /> },
  { label: 'All Products', path: '/products', icon: <CategoryIcon /> },
  { label: 'Prescription', path: '/prescription', icon: <PrescriptionIcon /> },
  { label: 'About', path: '/about', icon: <InfoIcon /> },
  { label: 'Contact', path: '/contact', icon: <ContactIcon /> },
]

export function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, logout, user } = useAuthStore()
  const { totalItems: cartCount, loadCart } = useCart()

  // State
  const [wishlistCount, setWishlistCount] = useState(0)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountMenuAnchor, setAccountMenuAnchor] = useState<null | HTMLElement>(null)

  // Update counts
  useEffect(() => {
    const updateCounts = async () => {
      try {
        // Load cart from store (handles both guest and authenticated users)
        await loadCart()

        // Update wishlist count
        const wishlist = await wishlistApi.getWishlistCount()
        setWishlistCount(wishlist)
      } catch (err) {
        console.error('Failed to get counts:', err)
      }
    }

    updateCounts()

    const handleCartUpdate = () => updateCounts()
    const handleWishlistUpdate = () => updateCounts()

    window.addEventListener('cartUpdated', handleCartUpdate)
    window.addEventListener('wishlistUpdated', handleWishlistUpdate)

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate)
    }
  }, [loadCart])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Close account menu on route change
  useEffect(() => {
    setAccountMenuAnchor(null)
  }, [location.pathname])

  // Handlers
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setShowSearch(false)
    }
  }

  const handleAccountMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAccountMenuAnchor(event.currentTarget)
  }

  const handleAccountMenuClose = () => {
    setAccountMenuAnchor(null)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    handleAccountMenuClose()
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  // Check if current path matches nav link
  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  // Mobile drawer content
  const drawerContent = (
    <Box sx={{ width: 280, height: '100%' }}>
      {/* Logo in drawer */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ cursor: 'pointer', letterSpacing: 0.5 }}
          onClick={() => {
            navigate('/')
            setMobileOpen(false)
          }}
        >
          <Box component="span" sx={{ color: 'primary.main' }}>
            Eye
          </Box>
          Wear
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Navigation links */}
      <List sx={{ px: 2, py: 1 }}>
        {navLinks.map((link) => (
          <ListItem key={link.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={isActivePath(link.path)}
              onClick={() => navigate(link.path)}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{link.icon}</ListItemIcon>
              <ListItemText primary={link.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ mx: 2 }} />

      {/* User section */}
      <List sx={{ px: 2, py: 1 }}>
        {isAuthenticated ? (
          <>
            {/* User info */}
            <ListItem disablePadding>
              <Box sx={{ px: 2, py: 1, width: 1 }}>
                <Typography variant="subtitle2" fontWeight={600} noWrap>
                  {user?.fullName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {roleLabels[user?.role ?? 4] || 'Customer'}
                </Typography>
              </Box>
            </ListItem>

            <Divider sx={{ my: 1 }} />

            {/* Account menu items */}
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton onClick={() => navigate('/account')}>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="My Account" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton onClick={() => navigate('/orders')}>
                <ListItemIcon>
                  <ShoppingBagIcon />
                </ListItemIcon>
                <ListItemText primary="My Orders" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton onClick={() => navigate('/favorites')}>
                <ListItemIcon>
                  <FavoriteBorderIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Favorites"
                  secondary={wishlistCount > 0 ? `${wishlistCount} items` : undefined}
                />
              </ListItemButton>
            </ListItem>

            {/* Dashboard link for non-customers */}
            {user && user.role !== 4 && (
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton onClick={() => navigate('/dashboard')}>
                  <ListItemIcon>
                    <DashboardIcon />
                  </ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </ListItemButton>
              </ListItem>
            )}

            <Divider sx={{ my: 1 }} />

            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon>
                  <LogoutIcon color="error" />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </>
        ) : (
          <>
            <ListItem disablePadding sx={{ mb: 1 }}>
              <ListItemButton onClick={() => navigate('/login')}>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="Sign In" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <Button
                fullWidth
                variant="contained"
                sx={{ mx: 2, mb: 1 }}
                onClick={() => navigate('/register')}
              >
                Create Account
              </Button>
            </ListItem>
          </>
        )}
      </List>
    </Box>
  )

  return (
    <>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255,255,255,0.9)',
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          {/* Mobile menu button */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="open menu"
              onClick={handleDrawerToggle}
            >
              <MenuIcon />
            </IconButton>
          </Box>

          {/* Logo/Brand */}
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{
              cursor: 'pointer',
              letterSpacing: 0.5,
              display: { xs: 'none', sm: 'block' },
            }}
            onClick={() => navigate('/')}
          >
            <Box component="span" sx={{ color: 'primary.main' }}>
              Eye
            </Box>
            Wear
          </Typography>

          {/* Mobile Logo (smaller) */}
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              cursor: 'pointer',
              letterSpacing: 0.5,
              display: { xs: 'block', sm: 'none' },
            }}
            onClick={() => navigate('/')}
          >
            <Box component="span" sx={{ color: 'primary.main' }}>
              Eye
            </Box>
            Wear
          </Typography>

          {/* Desktop Navigation Links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, alignItems: 'center' }}>
            {navLinks.map((link) => (
              <Button
                key={link.path}
                color="inherit"
                onClick={() => navigate(link.path)}
                sx={{
                  px: 2,
                  py: 1,
                  minWidth: 'auto',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 2,
                  color: isActivePath(link.path) ? 'primary.main' : 'text.primary',
                  bgcolor: isActivePath(link.path) ? 'primary.50' : 'transparent',
                  '&:hover': {
                    bgcolor: isActivePath(link.path) ? 'primary.100' : 'action.hover',
                  },
                }}
              >
                {link.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ flex: 1 }} />

          {/* Right side icons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Search */}
            <Box sx={{ display: { xs: showSearch ? 'block' : 'none', sm: 'block' } }}>
              <TextField
                size="small"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSubmit={handleSearchSubmit}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    onKeyDown: (e) => {
                      if (e.key === 'Enter') {
                        handleSearchSubmit(e as any)
                      }
                    },
                  },
                }}
                sx={{ width: { xs: 150, sm: 200 } }}
                autoFocus
              />
            </Box>

            <IconButton
              size="small"
              color="inherit"
              onClick={() => {
                if (showSearch) {
                  setShowSearch(false)
                  setSearchQuery('')
                } else {
                  setShowSearch(true)
                }
              }}
              sx={{ display: { xs: showSearch ? 'none' : 'flex', sm: 'none' } }}
            >
              <SearchIcon />
            </IconButton>

            {/* Favorites */}
            <IconButton
              size="small"
              color="inherit"
              onClick={() => navigate('/favorites')}
              sx={{ display: { xs: 'none', sm: 'flex' }, minWidth: 44, minHeight: 44 }}
            >
              <Badge badgeContent={wishlistCount} color="primary" max={99}>
                <FavoriteBorderIcon />
              </Badge>
            </IconButton>

            {/* Cart */}
            <IconButton
              size="small"
              color="inherit"
              onClick={() => navigate('/cart')}
              sx={{ minWidth: 44, minHeight: 44 }}
            >
              <Badge badgeContent={cartCount} color="primary" max={99}>
                <ShoppingBagIcon />
              </Badge>
            </IconButton>

            {/* Account */}
            {isAuthenticated ? (
              <>
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={handleAccountMenuOpen}
                  sx={{ minWidth: 44, minHeight: 44 }}
                >
                  <PersonIcon />
                </IconButton>

                {/* Account dropdown menu */}
                <Menu
                  anchorEl={accountMenuAnchor}
                  open={Boolean(accountMenuAnchor)}
                  onClose={handleAccountMenuClose}
                  onClick={handleAccountMenuClose}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  PaperProps={{ sx: { minWidth: 200, mt: 1 } }}
                >
                  {/* User info */}
                  <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" fontWeight={600} noWrap>
                      {user?.fullName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {roleLabels[user?.role ?? 4] || 'Customer'}
                    </Typography>
                  </Box>

                  <MenuItem onClick={() => navigate('/account')}>
                    <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                    My Account
                  </MenuItem>
                  <MenuItem onClick={() => navigate('/orders')}>
                    <ShoppingBagIcon fontSize="small" sx={{ mr: 1 }} />
                    My Orders
                  </MenuItem>
                  <MenuItem onClick={() => navigate('/favorites')}>
                    <FavoriteBorderIcon fontSize="small" sx={{ mr: 1 }} />
                    Favorites
                    {wishlistCount > 0 && (
                      <Badge
                        badgeContent={wishlistCount}
                        color="primary"
                        sx={{ ml: 1 }}
                        max={99}
                      />
                    )}
                  </MenuItem>

                  {/* Dashboard for non-customers */}
                  {user && user.role !== 4 && (
                    <MenuItem onClick={() => navigate('/dashboard')}>
                      <DashboardIcon fontSize="small" sx={{ mr: 1 }} />
                      Dashboard
                    </MenuItem>
                  )}

                  <Divider />
                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/login')}
                sx={{ display: { xs: 'none', sm: 'flex' }, minWidth: 80 }}
              >
                Sign In
              </Button>
            )}
          </Box>
        </Toolbar>

        {/* Search bar for desktop (expandable) */}
        {showSearch && (
          <Box sx={{ display: { xs: 'none', sm: 'block' }, px: 2, pb: 2 } }>
            <TextField
              fullWidth
              size="small"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  onKeyDown: (e) => {
                    if (e.key === 'Enter') {
                      handleSearchSubmit(e as any)
                    }
                  },
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSearchQuery('')
                          setShowSearch(false)
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              autoFocus
            />
          </Box>
        )}
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box' },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  )
}
