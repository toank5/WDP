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
} from '@mui/material'
import {
  Description,
  AssignmentReturn,
  Warning,
  CheckCircle,
  Schedule,
  Person,
  Visibility,
} from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { KPICard } from '@/components/dashboard/KPICard'
import { useSaleStaffDashboard } from '@/hooks/useDashboardData'
import {
  PRESCRIPTION_REVIEW_STATUS,
  RETURN_STATUS,
} from '@eyewear/shared'

const getPrescriptionStatusColor = (status: string) => {
  switch (status) {
    case PRESCRIPTION_REVIEW_STATUS.PENDING_REVIEW:
      return 'warning'
    case PRESCRIPTION_REVIEW_STATUS.APPROVED:
      return 'success'
    case PRESCRIPTION_REVIEW_STATUS.REJECTED:
      return 'error'
    case PRESCRIPTION_REVIEW_STATUS.INFO_REQUESTED:
      return 'info'
    default:
      return 'default'
  }
}

const getReturnStatusColor = (status: string) => {
  switch (status) {
    case RETURN_STATUS.SUBMITTED:
      return 'info'
    case RETURN_STATUS.IN_REVIEW:
      return 'warning'
    case RETURN_STATUS.APPROVED:
      return 'success'
    case RETURN_STATUS.REJECTED:
      return 'error'
    case RETURN_STATUS.COMPLETED:
      return 'success'
    default:
      return 'default'
  }
}

export function SaleStaffDashboardHome() {
  const {
    pendingPrescriptions,
    pendingReturns,
    ordersWithIssues,
    recentPrescriptions,
    recentReturns,
    isLoading,
    error,
  } = useSaleStaffDashboard()

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load dashboard data: {error}
      </Alert>
    )
  }

  const hasNoData = pendingPrescriptions === 0 && pendingReturns === 0 && ordersWithIssues === 0

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Sales Dashboard
        </Typography>
        <Typography color="text.secondary">
          Customer care queue: Prescription reviews and return requests
        </Typography>
      </Box>

      {/* KPI Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={4}>
          <KPICard
            title="Pending Prescriptions"
            value={pendingPrescriptions}
            icon={<Description fontSize="medium" />}
            color="warning"
            subtitle="Awaiting review"
            trend={pendingPrescriptions > 0 ? { value: pendingPrescriptions, label: 'to handle' } : undefined}
            loading={isLoading}
            action={
              pendingPrescriptions > 0 && (
                <Button
                  component={Link}
                  to="/dashboard/prescriptions"
                  size="small"
                  variant="contained"
                  color="warning"
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  Review Now
                </Button>
              )
            }
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <KPICard
            title="Pending Returns"
            value={pendingReturns}
            icon={<AssignmentReturn fontSize="medium" />}
            color="info"
            subtitle="Awaiting decision"
            trend={pendingReturns > 0 ? { value: pendingReturns, label: 'requests' } : undefined}
            loading={isLoading}
            action={
              pendingReturns > 0 && (
                <Button
                  component={Link}
                  to="/dashboard/returns"
                  size="small"
                  variant="contained"
                  color="info"
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  Process Returns
                </Button>
              )
            }
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <KPICard
            title="Orders with Issues"
            value={ordersWithIssues}
            icon={<Warning fontSize="medium" />}
            color="error"
            subtitle="Need attention"
            loading={isLoading}
            action={
              ordersWithIssues > 0 && (
                <Button
                  component={Link}
                  to="/dashboard/orders"
                  size="small"
                  variant="contained"
                  color="error"
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  View Issues
                </Button>
              )
            }
          />
        </Grid>
      </Grid>

      {/* Empty State - All Caught Up */}
      {hasNoData && !isLoading && (
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
              No pending prescriptions or returns to review. Great job!
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                component={Link}
                to="/dashboard/orders"
                variant="outlined"
                startIcon={<Visibility />}
              >
                View All Orders
              </Button>
              <Button
                component={Link}
                to="/dashboard/prescriptions"
                variant="outlined"
                startIcon={<Description />}
              >
                Prescription Queue
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Prescriptions to Handle Today */}
      {recentPrescriptions.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Prescriptions to Handle Today
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {pendingPrescriptions} pending review
                </Typography>
              </Box>
              <Button
                component={Link}
                to="/dashboard/prescriptions"
                size="small"
                variant="outlined"
                endIcon={<Visibility />}
              >
                View All
              </Button>
            </Box>
            <List>
              {recentPrescriptions.map((prescriptionOrder, index) => {
                const prescriptionItem = prescriptionOrder.items.find(
                  (item) => item.requiresPrescription || item.prescriptionReviewStatus
                )
                return (
                  <>
                    <ListItem
                      key={prescriptionOrder._id}
                      component={Link}
                      to={`/dashboard/prescriptions/${prescriptionItem?.itemId}`}
                      sx={{
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'action.hover' },
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'warning.light' }}>
                          <Description sx={{ color: 'warning.dark' }} />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight={600}>
                              Order #{prescriptionOrder.orderNumber}
                            </Typography>
                            <Chip
                              label={prescriptionItem?.prescriptionReviewStatus || 'PENDING'}
                              size="small"
                              color={getPrescriptionStatusColor(
                                prescriptionItem?.prescriptionReviewStatus || ''
                              ) as any}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {prescriptionOrder.shippingAddress.fullName}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Schedule sx={{ fontSize: 14 }} />
                              <Typography variant="caption" color="text.secondary">
                                {new Date(prescriptionOrder.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentPrescriptions.length - 1 && <Divider />}
                  </>
                )
              })}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Returns Waiting for Decision */}
      {recentReturns.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Returns Waiting for Decision
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {pendingReturns} requests need review
                </Typography>
              </Box>
              <Button
                component={Link}
                to="/dashboard/returns"
                size="small"
                variant="outlined"
                endIcon={<Visibility />}
              >
                View All
              </Button>
            </Box>
            <List>
              {recentReturns.map((returnRequest, index) => (
                <>
                  <ListItem
                    key={returnRequest.id}
                    component={Link}
                    to={`/dashboard/returns/${returnRequest.id}`}
                    sx={{
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'action.hover' },
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'info.light' }}>
                        <AssignmentReturn sx={{ color: 'info.dark' }} />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" fontWeight={600}>
                            Return #{returnRequest.returnNumber}
                          </Typography>
                          <Chip
                            label={returnRequest.status}
                            size="small"
                            color={getReturnStatusColor(returnRequest.status) as any}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Person sx={{ fontSize: 14 }} />
                            <Typography variant="caption" color="text.secondary">
                              {returnRequest.customerEmail || returnRequest.customerPhone || 'Customer'}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {returnRequest.items.length} item(s) •{' '}
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(returnRequest.requestedRefundAmount)}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Schedule sx={{ fontSize: 14 }} />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(returnRequest.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < recentReturns.length - 1 && <Divider />}
                </>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Empty State for Returns */}
      {recentReturns.length === 0 && !isLoading && pendingReturns === 0 && (
        <Card sx={{ textAlign: 'center', py: 4 }}>
          <CardContent>
            <AssignmentReturn sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No pending returns
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              All return requests have been processed
            </Typography>
            <Button component={Link} to="/dashboard/returns" variant="outlined">
              View Return History
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mt: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            component={Link}
            to="/dashboard/prescriptions"
            variant="outlined"
            fullWidth
            startIcon={<Description />}
          >
            Prescription Queue
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            component={Link}
            to="/dashboard/returns"
            variant="outlined"
            fullWidth
            startIcon={<AssignmentReturn />}
          >
            Returns Queue
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            component={Link}
            to="/dashboard/orders"
            variant="outlined"
            fullWidth
            startIcon={<Visibility />}
          >
            View Orders
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            component={Link}
            to="/dashboard/settings"
            variant="outlined"
            fullWidth
            startIcon={<Person />}
          >
            My Profile
          </Button>
        </Grid>
      </Grid>
    </Box>
  )
}
