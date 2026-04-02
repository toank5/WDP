import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Link as MuiLink,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material'
import {
  AttachMoney,
  ShoppingCart,
  Warning,
  Inventory as InventoryIcon,
  TrendingUp,
  AssignmentReturn,
  Speed,
} from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { KPICard } from '@/components/dashboard/KPICard'
import { useManagerDashboard, formatRevenue } from '@/hooks/useDashboardData'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function ManagerDashboardHome() {
  const {
    revenueOverview,
    todayRevenue,
    monthRevenue,
    totalOrders,
    pendingOrders,
    processingOrders,
    delayedOrders,
    preordersOverview,
    lowStockCount,
    isLoading,
    error,
  } = useManagerDashboard()

  // Mock data for charts - replace with real API data
  const revenueTimeData = [
    { day: '01', revenue: 4500000 },
    { day: '02', revenue: 5200000 },
    { day: '03', revenue: 4800000 },
    { day: '04', revenue: 6100000 },
    { day: '05', revenue: 5900000 },
    { day: '06', revenue: 6700000 },
    { day: '07', revenue: 7200000 },
  ]

  const orderStatusData = [
    { name: 'Pending', value: pendingOrders || 12, color: '#FFBB28' },
    { name: 'Processing', value: processingOrders || 24, color: '#0088FE' },
    { name: 'Shipped', value: 45, color: '#00C49F' },
    { name: 'Delivered', value: 120, color: '#8884D8' },
  ]

  const preordersData = preordersOverview?.recentPreorders?.slice(0, 5) || []

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load dashboard data: {error}
      </Alert>
    )
  }

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Manager Dashboard
        </Typography>
        <Typography color="text.secondary">
          Overview of your eyewear business performance and operations
        </Typography>
      </Box>

      {/* KPI Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="Today's Revenue"
            value={formatRevenue(todayRevenue)}
            icon={<AttachMoney fontSize="medium" />}
            color="success"
            trend={{ value: 12.5, label: 'vs yesterday' }}
            loading={isLoading}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="This Month's Revenue"
            value={formatRevenue(monthRevenue)}
            icon={<TrendingUp fontSize="medium" />}
            color="primary"
            trend={{ value: 8.2, label: 'vs last month' }}
            loading={isLoading}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="Total Orders"
            value={totalOrders}
            icon={<ShoppingCart fontSize="medium" />}
            color="info"
            subtitle={`${pendingOrders} pending`}
            loading={isLoading}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="Pre-orders"
            value={preordersOverview?.totalOpenPreorders || 0}
            icon={<Speed fontSize="medium" />}
            color="warning"
            subtitle={`${preordersOverview?.totalUnitsOnPreorder || 0} units`}
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Box sx={{ mb: 4 }}>
        {/* Revenue Trend Chart - Full Width */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Revenue Overview
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Last 7 days performance
                </Typography>
              </Box>
              <Button
                component={Link}
                to="/dashboard/revenue"
                size="small"
                variant="outlined"
              >
                View Details
              </Button>
            </Box>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={revenueTimeData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0088FE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`₫${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0088FE"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Order Status
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  Current distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [value, name]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: 8,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {orderStatusData.map((item) => (
                    <Chip
                      key={item.name}
                      label={`${item.name}: ${item.value}`}
                      size="small"
                      sx={{
                        bgcolor: item.color,
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Placeholder for future content */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CardContent sx={{ textAlign: 'center', width: '100%' }}>
                <Typography variant="body2" color="text.secondary">
                  More insights coming soon
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Alerts and Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Alerts */}
        <Grid item xs={12}>
          <Card
            sx={{
              bgcolor: lowStockCount > 0 ? 'warning.lighter' : 'success.lighter',
              borderLeft: 4,
              borderColor: lowStockCount > 0 ? 'warning.main' : 'success.main',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: lowStockCount > 0 ? 'warning.main' : 'success.main',
                    color: 'white',
                  }}
                >
                  <Warning />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {lowStockCount > 0 ? 'Low Stock Alert' : 'Inventory Healthy'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {lowStockCount > 0
                      ? `${lowStockCount} items are running low`
                      : 'All items are well stocked'}
                  </Typography>
                </Box>
              </Box>
              {lowStockCount > 0 && (
                <Button
                  component={Link}
                  to="/dashboard/inventory"
                  variant="contained"
                  color="warning"
                  size="small"
                  fullWidth
                >
                  View Low Stock Items
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Button
                    component={Link}
                    to="/dashboard/revenue"
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{ height: '100%', flexDirection: 'column', gap: 0.5 }}
                  >
                    <TrendingUp />
                    Revenue
                  </Button>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button
                    component={Link}
                    to="/dashboard/products"
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{ height: '100%', flexDirection: 'column', gap: 0.5 }}
                  >
                    <InventoryIcon />
                    Products
                  </Button>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button
                    component={Link}
                    to="/dashboard/policies"
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{ height: '100%', flexDirection: 'column', gap: 0.5 }}
                  >
                    <AssignmentReturn />
                    Policies
                  </Button>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button
                    component={Link}
                    to="/dashboard/preorders"
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{ height: '100%', flexDirection: 'column', gap: 0.5 }}
                  >
                    <Speed />
                    Pre-orders
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Pre-orders */}
      {preordersData.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Recent Pre-orders
              </Typography>
              <Button
                component={Link}
                to="/dashboard/preorders"
                size="small"
                variant="text"
              >
                View All
              </Button>
            </Box>
            <List>
              {preordersData.map((preorder, index) => (
                <>
                  <ListItem
                    key={preorder.orderId}
                    component={Link}
                    to={`/orders/${preorder.orderId}`}
                    sx={{
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'action.hover' },
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" fontWeight={600}>
                            {preorder.productName}
                          </Typography>
                          <Chip
                            label={preorder.preorderStatus}
                            size="small"
                            color={
                              preorder.preorderStatus === 'OK'
                                ? 'success'
                                : preorder.preorderStatus === 'TIGHT'
                                  ? 'warning'
                                  : 'error'
                            }
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Order #{preorder.orderNumber} • {preorder.customerName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {preorder.quantity} units
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < preordersData.length - 1 && <Divider />}
                </>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Empty State for Pre-orders */}
      {preordersData.length === 0 && !isLoading && (
        <Card sx={{ textAlign: 'center', py: 4 }}>
          <CardContent>
            <Speed sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No active pre-orders
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              All pre-orders have been fulfilled
            </Typography>
            <Button component={Link} to="/dashboard/products" variant="outlined">
              Manage Products
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
