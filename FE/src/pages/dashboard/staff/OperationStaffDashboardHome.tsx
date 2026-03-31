import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import {
  Biotech,
  LocalShipping,
  Inventory as InventoryIcon,
  AssignmentReturn,
  Warning,
  CheckCircle,
  Schedule,
  Science,
  Warehouse,
} from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { KPICard } from '@/components/dashboard/KPICard'
import { useOperationStaffDashboard } from '@/hooks/useDashboardData'
import { LAB_JOB_STATUS, ORDER_STATUS } from '@eyewear/shared'

const getLabJobStatusColor = (status: string) => {
  switch (status) {
    case LAB_JOB_STATUS.PENDING:
      return 'warning'
    case LAB_JOB_STATUS.IN_PROGRESS:
      return 'info'
    case LAB_JOB_STATUS.COMPLETED:
      return 'success'
    case LAB_JOB_STATUS.FAILED:
      return 'error'
    case LAB_JOB_STATUS.CANCELLED:
      return 'default'
    default:
      return 'default'
  }
}

const getLabJobStatusLabel = (status: string) => {
  switch (status) {
    case LAB_JOB_STATUS.PENDING:
      return 'Pending'
    case LAB_JOB_STATUS.IN_PROGRESS:
      return 'In Progress'
    case LAB_JOB_STATUS.COMPLETED:
      return 'Completed'
    case LAB_JOB_STATUS.FAILED:
      return 'Failed'
    case LAB_JOB_STATUS.CANCELLED:
      return 'Cancelled'
    default:
      return status
  }
}

export function OperationStaffDashboardHome() {
  const {
    pendingLabJobs,
    inProgressLabJobs,
    ordersReadyToShip,
    returnsReceivedNotProcessed,
    lowStockItems,
    todayLabJobsCompleted,
    isLoading,
    error,
  } = useOperationStaffDashboard()

  // Mock lab jobs data - replace with real API data
  const mockLabJobs = [
    {
      _id: '1',
      orderNumber: 'ORD-2024-001',
      customerName: 'Nguyen Van A',
      frameName: 'Ray-Ban Aviator',
      status: LAB_JOB_STATUS.PENDING,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: '2',
      orderNumber: 'ORD-2024-002',
      customerName: 'Tran Thi B',
      frameName: 'Oakley Holbrook',
      status: LAB_JOB_STATUS.IN_PROGRESS,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
  ]

  // Mock ready to ship orders
  const mockReadyToShip = [
    {
      _id: '1',
      orderNumber: 'ORD-2024-003',
      customerName: 'Le Van C',
      shippingAddress: { fullName: 'Le Van C', city: 'Ho Chi Minh City' },
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: '2',
      orderNumber: 'ORD-2024-004',
      customerName: 'Pham Thi D',
      shippingAddress: { fullName: 'Pham Thi D', city: 'Hanoi' },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load dashboard data: {error}
      </Alert>
    )
  }

  const hasNoTasks =
    pendingLabJobs === 0 &&
    inProgressLabJobs === 0 &&
    ordersReadyToShip === 0 &&
    returnsReceivedNotProcessed === 0

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Operations Dashboard
        </Typography>
        <Typography color="text.secondary">
          Lab jobs, shipping queue, and inventory status
        </Typography>
      </Box>

      {/* KPI Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="Pending Lab Jobs"
            value={pendingLabJobs}
            icon={<Science fontSize="medium" />}
            color="warning"
            subtitle="Awaiting processing"
            loading={isLoading}
            action={
              pendingLabJobs > 0 && (
                <Button
                  component={Link}
                  to="/dashboard/lab-jobs"
                  size="small"
                  variant="contained"
                  color="warning"
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  Start Jobs
                </Button>
              )
            }
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="In Progress Lab Jobs"
            value={inProgressLabJobs}
            icon={<Biotech fontSize="medium" />}
            color="info"
            subtitle="Currently processing"
            loading={isLoading}
            action={
              inProgressLabJobs > 0 && (
                <Button
                  component={Link}
                  to="/dashboard/lab-jobs"
                  size="small"
                  variant="contained"
                  color="info"
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  View Progress
                </Button>
              )
            }
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="Ready to Ship"
            value={ordersReadyToShip}
            icon={<LocalShipping fontSize="medium" />}
            color="success"
            subtitle="Orders awaiting pickup"
            loading={isLoading}
            action={
              ordersReadyToShip > 0 && (
                <Button
                  component={Link}
                  to="/dashboard/shipping"
                  size="small"
                  variant="contained"
                  color="success"
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  Ship Orders
                </Button>
              )
            }
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="Returns to Process"
            value={returnsReceivedNotProcessed}
            icon={<AssignmentReturn fontSize="medium" />}
            color="error"
            subtitle="Received but not processed"
            loading={isLoading}
            action={
              returnsReceivedNotProcessed > 0 && (
                <Button
                  component={Link}
                  to="/dashboard/returns"
                  size="small"
                  variant="contained"
                  color="error"
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  Process Returns
                </Button>
              )
            }
          />
        </Grid>
      </Grid>

      {/* Empty State - All Caught Up */}
      {hasNoTasks && !isLoading && (
        <Card sx={{ textAlign: 'center', py: 6, mb: 4 }}>
          <CardContent>
            <CheckCircle
              sx={{
                fontSize: 64,
                color: 'success.main',
                mb: 2,
              }}
            />
            <Typography variant="h5" fontWeight={600} gutterBottom>
              All Caught Up!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              No pending lab jobs, shipments, or returns to process. Great work!
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                component={Link}
                to="/dashboard/lab-jobs"
                variant="outlined"
                startIcon={<Biotech />}
              >
                View All Lab Jobs
              </Button>
              <Button
                component={Link}
                to="/dashboard/inventory"
                variant="outlined"
                startIcon={<Warehouse />}
              >
                Check Inventory
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Lab Jobs Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Lab Jobs
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {pendingLabJobs} pending / {inProgressLabJobs} in progress
                  </Typography>
                </Box>
                <Button
                  component={Link}
                  to="/dashboard/lab-jobs"
                  size="small"
                  variant="outlined"
                  endIcon={<Biotech />}
                >
                  View All
                </Button>
              </Box>
              {mockLabJobs.length > 0 ? (
                <List>
                  {mockLabJobs.map((job, index) => (
                    <>
                      <ListItem
                        key={job._id}
                        component={Link}
                        to={`/dashboard/lab-jobs`}
                        sx={{
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'action.hover' },
                          textDecoration: 'none',
                          color: 'inherit',
                        }}
                      >
                        <ListItemIcon>
                          <Avatar
                            sx={{
                              bgcolor:
                                job.status === LAB_JOB_STATUS.PENDING
                                  ? 'warning.light'
                                  : 'info.light',
                            }}
                          >
                            <Science
                              sx={{
                                color:
                                  job.status === LAB_JOB_STATUS.PENDING
                                    ? 'warning.dark'
                                    : 'info.dark',
                              }}
                            />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight={600}>
                                {job.orderNumber}
                              </Typography>
                              <Chip
                                label={getLabJobStatusLabel(job.status)}
                                size="small"
                                color={getLabJobStatusColor(job.status) as any}
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {job.customerName} • {job.frameName}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Schedule sx={{ fontSize: 14 }} />
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(job.createdAt).toLocaleString()}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < mockLabJobs.length - 1 && <Divider />}
                    </>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Science sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No active lab jobs
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Orders Ready to Ship */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Ready to Ship
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {ordersReadyToShip} orders awaiting pickup
                  </Typography>
                </Box>
                <Button
                  component={Link}
                  to="/dashboard/shipping"
                  size="small"
                  variant="outlined"
                  endIcon={<LocalShipping />}
                >
                  View All
                </Button>
              </Box>
              {mockReadyToShip.length > 0 ? (
                <List>
                  {mockReadyToShip.map((order, index) => (
                    <>
                      <ListItem
                        key={order._id}
                        component={Link}
                        to={`/dashboard/orders/${order._id}`}
                        sx={{
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'action.hover' },
                          textDecoration: 'none',
                          color: 'inherit',
                        }}
                      >
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'success.light' }}>
                            <LocalShipping sx={{ color: 'success.dark' }} />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight={600}>
                                {order.orderNumber}
                              </Typography>
                              <Chip label="Ready" size="small" color="success" />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {order.shippingAddress.fullName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {order.shippingAddress.city}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Schedule sx={{ fontSize: 14 }} />
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < mockReadyToShip.length - 1 && <Divider />}
                    </>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <LocalShipping sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No orders ready to ship
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card
          sx={{
            mb: 4,
            borderLeft: 4,
            borderColor: 'warning.main',
            bgcolor: 'warning.lighter',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'warning.main', color: 'white' }}>
                <Warning />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={600}>
                  Low Stock Alert
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {lowStockItems.length} items need restocking soon
                </Typography>
              </Box>
              <Button
                component={Link}
                to="/dashboard/inventory"
                variant="contained"
                color="warning"
              >
                View Inventory
              </Button>
            </Box>
            <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>SKU</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Stock</TableCell>
                    <TableCell align="right">Reorder Level</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lowStockItems.slice(0, 5).map((item) => (
                    <TableRow key={item._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {item.sku}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{item.productName}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={item.availableQuantity}
                          size="small"
                          color={item.availableQuantity === 0 ? 'error' : 'warning'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {item.reorderLevel}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            component={Link}
            to="/dashboard/lab-jobs"
            variant="outlined"
            fullWidth
            startIcon={<Biotech />}
          >
            Lab Jobs
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            component={Link}
            to="/dashboard/shipping"
            variant="outlined"
            fullWidth
            startIcon={<LocalShipping />}
          >
            Shipping Queue
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            component={Link}
            to="/dashboard/inventory"
            variant="outlined"
            fullWidth
            startIcon={<Warehouse />}
          >
            Inventory
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            component={Link}
            to="/dashboard/operations"
            variant="outlined"
            fullWidth
            startIcon={<AssignmentReturn />}
          >
            Operations
          </Button>
        </Grid>
      </Grid>
    </Box>
  )
}
