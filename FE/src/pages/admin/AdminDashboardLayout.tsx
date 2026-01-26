import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Inventory,
  Settings,
  Gavel,
  Logout,
} from '@mui/icons-material'
import { roleLabels, ADMIN_ROLE, MANAGER_ROLE } from '@/lib/constants'

const drawerWidth = 260

export function AdminDashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!user) return null

  console.log('User object:', user)
  console.log('User role:', user.role, 'Type:', typeof user.role)

  const menuItems = [
    {
      title: 'Dashboard',
      icon: <Dashboard />,
      url: '/dashboard',
    },
    {
      title: 'User Management',
      icon: <People />,
      url: '/dashboard/users',
      adminOnly: true,
    },
    {
      title: 'Policy Management',
      icon: <Gavel />,
      url: '/dashboard/policies',
      managerOnly: true,
    },
    {
      title: 'Products',
      icon: <Inventory />,
      url: '/dashboard/products',
      managerOnly: true,
    },
    {
      title: 'Settings',
      icon: <Settings />,
      url: '/dashboard/settings',
    },
  ]

  const isAdmin = user.role === ADMIN_ROLE || Number(user.role) === ADMIN_ROLE
  const isManager = user.role === MANAGER_ROLE || Number(user.role) === MANAGER_ROLE

  const drawer = (
    <Box>
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 'bold' }}>
            WDP
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {user.fullName}
            </Typography>
            <Chip
              label={`${roleLabels[user.role] ?? 'User'} (${user.role})`}
              size="small"
              sx={{ bgcolor: 'primary.dark', color: 'white', fontSize: '0.7rem' }}
            />
          </Box>
        </Box>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => {
          const shouldShow = (!item.adminOnly || isAdmin) && (!item.managerOnly || isManager)
          console.log(`Item: ${item.title}, adminOnly: ${item.adminOnly}, managerOnly: ${item.managerOnly}, isAdmin: ${isAdmin}, isManager: ${isManager}, show: ${shouldShow}`)
          return shouldShow ? (
            <ListItem key={item.title} disablePadding>
              <ListItemButton
                component={Link}
                to={item.url}
                selected={location.pathname === item.url}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.title} />
              </ListItemButton>
            </ListItem>
          ) : null
        })}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <Logout />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            WDP Eyewear Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          bgcolor: 'grey.50',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}
