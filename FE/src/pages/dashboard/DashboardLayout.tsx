import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  ThemeProvider,
  CssBaseline,
  List,
  ListSubheader,
} from '@mui/material'
import { adminTheme } from '@/admin-theme'
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Inventory as InventoryIcon,
  Settings,
  Gavel,
  Logout,
  ShoppingCart,
  LocalShipping,
  Assignment,
  AssignmentReturn,
  Campaign,
  Assessment,
  Build,
  Warehouse,
  Business,
  AttachMoney,
  LocalOffer,
  Discount,
  TrendingUp,
  Description,
  Biotech,
} from '@mui/icons-material'
import { roleLabels, ADMIN_ROLE, MANAGER_ROLE, OPERATION_ROLE, SALE_ROLE } from '@/lib/constants'
import { ReactNode } from 'react'

const drawerWidth = 260

type MenuItem = {
  title: string
  icon: ReactNode
  url: string
  adminOnly?: boolean
  managerOnly?: boolean
  operationOnly?: boolean
  saleOnly?: boolean
  staffOnly?: boolean
  managerOrOperationOnly?: boolean
}

type MenuSection = {
  title?: string
  items: MenuItem[]
  adminOnly?: boolean
  managerOnly?: boolean
  operationOnly?: boolean
  saleOnly?: boolean
  staffOnly?: boolean
}

export function DashboardLayout() {
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

  const menuSections: MenuSection[] = [
    {
      title: 'Overview',
      items: [
        {
          title: 'Dashboard',
          icon: <Dashboard />,
          url: '/dashboard',
        },
      ],
    },
    {
      title: 'Customer Care',
      saleOnly: true,
      items: [
        {
          title: 'Orders',
          icon: <ShoppingCart />,
          url: '/dashboard/orders',
          saleOnly: true,
        },
        {
          title: 'Prescriptions',
          icon: <Description />,
          url: '/dashboard/prescriptions',
          saleOnly: true,
        },
        {
          title: 'Returns',
          icon: <AssignmentReturn />,
          url: '/dashboard/returns',
          saleOnly: true,
        },
      ],
    },
    {
      title: 'Operations',
      operationOnly: true,
      items: [
        {
          title: 'Lab Jobs',
          icon: <Biotech />,
          url: '/dashboard/lab-jobs',
          operationOnly: true,
        },
        {
          title: 'Operations',
          icon: <Assignment />,
          url: '/dashboard/operations',
          operationOnly: true,
        },
        {
          title: 'Shipping',
          icon: <LocalShipping />,
          url: '/dashboard/shipping',
          operationOnly: true,
        },
        {
          title: 'Inventory',
          icon: <Warehouse />,
          url: '/dashboard/inventory',
          operationOnly: true,
        },
        {
          title: 'Returns',
          icon: <AssignmentReturn />,
          url: '/dashboard/returns',
          operationOnly: true,
        },
      ],
    },
    {
      title: 'Sales & Revenue',
      managerOnly: true,
      items: [
        {
          title: 'Revenue',
          icon: <TrendingUp />,
          url: '/dashboard/revenue',
          managerOnly: true,
        },
        {
          title: 'Orders',
          icon: <ShoppingCart />,
          url: '/dashboard/orders',
          staffOnly: true,
        },
      ],
    },
    {
      title: 'Catalog',
      managerOnly: true,
      items: [
        {
          title: 'Products',
          icon: <Build />,
          url: '/dashboard/products',
          managerOnly: true,
        },
        {
          title: 'Inventory',
          icon: <Warehouse />,
          url: '/dashboard/inventory',
          managerOrOperationOnly: true,
        },
        {
          title: 'Suppliers',
          icon: <Business />,
          url: '/dashboard/suppliers',
          managerOnly: true,
        },
        {
          title: 'Pre-orders',
          icon: <LocalOffer />,
          url: '/dashboard/preorders',
          managerOnly: true,
        },
      ],
    },
    {
      title: 'Marketing',
      managerOnly: true,
      items: [
        {
          title: 'Promotions',
          icon: <Campaign />,
          url: '/dashboard/promotions',
          managerOnly: true,
        },
        {
          title: 'Combos',
          icon: <Discount />,
          url: '/dashboard/combos',
          managerOnly: true,
        },
        {
          title: 'Pricing',
          icon: <AttachMoney />,
          url: '/dashboard/pricing',
          managerOnly: true,
        },
      ],
    },
    {
      title: 'Management',
      managerOnly: true,
      items: [
        {
          title: 'Policies',
          icon: <Gavel />,
          url: '/dashboard/policies',
          managerOnly: true,
        },
        {
          title: 'Returns',
          icon: <AssignmentReturn />,
          url: '/dashboard/returns',
          staffOnly: true,
        },
      ],
    },
    {
      title: 'System',
      adminOnly: true,
      items: [
        {
          title: 'User Management',
          icon: <People />,
          url: '/dashboard/users',
          adminOnly: true,
        },
        {
          title: 'Analytics',
          icon: <Assessment />,
          url: '/dashboard/analytics',
          managerOnly: true,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          title: 'Settings',
          icon: <Settings />,
          url: '/dashboard/settings',
        },
      ],
    },
  ]

  const isAdmin = user.role === ADMIN_ROLE
  const isManager = user.role === MANAGER_ROLE
  const isOperation = user.role === OPERATION_ROLE
  const isSale = user.role === SALE_ROLE
  const isStaff = isSale || isOperation || isManager || isAdmin

  const shouldShowMenuItem = (item: MenuItem): boolean => {
    return (
      (item.adminOnly && isAdmin) ||
      (item.managerOnly && isManager) ||
      (item.operationOnly && isOperation) ||
      (item.saleOnly && isSale) ||
      (item.managerOrOperationOnly && (isManager || isOperation)) ||
      (item.staffOnly && (isSale || isOperation || isManager)) ||
      (!item.adminOnly &&
        !item.managerOnly &&
        !item.saleOnly &&
        !item.staffOnly &&
        !item.operationOnly &&
        !item.managerOrOperationOnly)
    )
  }

  const shouldShowSection = (section: MenuSection): boolean => {
    // Check if section itself is role-restricted
    if (
      (section.adminOnly && !isAdmin) ||
      (section.managerOnly && !isManager) ||
      (section.operationOnly && !isOperation) ||
      (section.saleOnly && !isSale) ||
      (section.staffOnly && !isStaff)
    ) {
      return false
    }

    // Check if section has any visible items
    return section.items.some(shouldShowMenuItem)
  }

  const drawer = (
    <Box sx={{ height: '100%', borderRight: '1px solid', borderColor: 'divider' }}>
      <Box
        sx={{
          p: 2,
          bgcolor: 'grey.100',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              fontWeight: 'bold',
              width: 32,
              height: 32,
              fontSize: '0.8rem',
            }}
          >
            WDP
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              {user.fullName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {roleLabels[user.role]}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Divider />
      <Box sx={{ overflowY: 'auto', height: 'calc(100% - 120px)' }}>
        {menuSections.map(
          (section, sectionIndex) =>
            shouldShowSection(section) && (
              <Box key={sectionIndex}>
                {section.title && (
                  <ListSubheader
                    sx={{
                      bgcolor: 'transparent',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                      mt: sectionIndex > 0 ? 2 : 1,
                    }}
                  >
                    {section.title}
                  </ListSubheader>
                )}
                {section.items.map((item: MenuItem) => {
                  const shouldShow = shouldShowMenuItem(item)

                  return shouldShow ? (
                    <ListItem key={item.title} disablePadding>
                      <ListItemButton
                        component={Link}
                        to={item.url}
                        selected={location.pathname === item.url}
                        sx={{
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
                        <ListItemIcon
                          sx={{
                            color: 'inherit',
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.title} />
                      </ListItemButton>
                    </ListItem>
                  ) : null
                })}
              </Box>
            )
        )}
      </Box>
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
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            bgcolor: 'white',
            color: 'text.primary',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Toolbar sx={{ minHeight: '56px !important' }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Typography variant="h6" noWrap component="div">
                WDP Eyewear Dashboard
              </Typography>
              <Chip
                label={roleLabels[user.role]}
                size="small"
                variant="outlined"
                sx={{ display: { xs: 'none', sm: 'flex' } }}
              />
            </Box>
          </Toolbar>
        </AppBar>
        <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
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
    </ThemeProvider>
  )
}
