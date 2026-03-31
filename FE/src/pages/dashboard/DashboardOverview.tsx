import { useAuthStore } from '@/store/auth-store'
import { Box } from '@mui/material'
import { ADMIN_ROLE, MANAGER_ROLE, OPERATION_ROLE, SALE_ROLE } from '@/lib/constants'
import { ManagerDashboardHome } from './manager/ManagerDashboardHome'
import { SaleStaffDashboardHome } from './staff/SaleStaffDashboardHome'
import { OperationStaffDashboardHome } from './staff/OperationStaffDashboardHome'

/**
 * Role-based Dashboard Overview
 *
 * This component routes to the appropriate dashboard home based on the user's role:
 * - ADMIN: Falls back to Manager dashboard (Admins have full access)
 * - MANAGER: Executive overview with revenue, orders, inventory, pre-orders
 * - SALE_STAFF: Customer care queue with prescriptions and returns
 * - OPERATION_STAFF: Lab jobs, shipping queue, and inventory status
 *
 * Each dashboard is optimized for the role's daily tasks and priorities.
 */
export function DashboardOverview() {
  const { user } = useAuthStore()

  if (!user) return null

  // Admin users see the Manager dashboard (they have full access + user management)
  if (user.role === ADMIN_ROLE || user.role === MANAGER_ROLE) {
    return (
      <Box sx={{ p: 0 }}>
        <ManagerDashboardHome />
      </Box>
    )
  }

  // Sale staff see customer care focused dashboard
  if (user.role === SALE_ROLE) {
    return (
      <Box sx={{ p: 0 }}>
        <SaleStaffDashboardHome />
      </Box>
    )
  }

  // Operation staff see lab and shipping focused dashboard
  if (user.role === OPERATION_ROLE) {
    return (
      <Box sx={{ p: 0 }}>
        <OperationStaffDashboardHome />
      </Box>
    )
  }

  // Fallback for any other roles (should not happen with proper RBAC)
  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
        }}
      >
        <Box
          component="img"
          src="/images/empty-dashboard.svg"
          alt="No dashboard available"
          sx={{
            width: 200,
            height: 200,
            opacity: 0.5,
            mb: 2,
          }}
        />
        <h3>No Dashboard Available</h3>
        <p color="text.secondary">
          Your account role does not have access to a dashboard. Please contact your
          administrator.
        </p>
      </Box>
    </Box>
  )
}
