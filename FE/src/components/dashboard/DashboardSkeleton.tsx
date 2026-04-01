import { Box, Card, CardContent, Grid, Skeleton, Typography } from '@mui/material'

interface DashboardSkeletonProps {
  kpiCount?: number
  showCharts?: boolean
  showList?: boolean
}

export function DashboardSkeleton({
  kpiCount = 4,
  showCharts = true,
  showList = true,
}: DashboardSkeletonProps) {
  return (
    <Box sx={{ p: 0 }}>
      {/* Header Skeleton */}
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={500} height={24} />
      </Box>

      {/* KPI Cards Skeleton */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Array.from({ length: kpiCount }).map((_, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <Skeleton variant="text" width={100} height={20} />
                  <Skeleton variant="circular" width={40} height={40} />
                </Box>
                <Skeleton variant="text" width={80} height={36} />
                <Skeleton variant="text" width={120} height={20} sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Skeleton */}
      {showCharts && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                  }}
                >
                  <Box>
                    <Skeleton variant="text" width={200} height={28} />
                    <Skeleton variant="text" width={150} height={20} sx={{ mt: 0.5 }} />
                  </Box>
                  <Skeleton variant="rectangular" width={100} height={32} />
                </Box>
                <Skeleton variant="rectangular" width="100%" height={250} />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Skeleton variant="text" width={150} height={28} sx={{ mb: 1 }} />
                <Skeleton variant="text" width={100} height={20} sx={{ mb: 2 }} />
                <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', display: 'block' }} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Alert Cards Skeleton */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Skeleton variant="rectangular" width={48} height={48} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width={200} height={24} />
                  <Skeleton variant="text" width={250} height={20} sx={{ mt: 0.5 }} />
                </Box>
              </Box>
              <Skeleton variant="rectangular" width="100%" height={36} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width={150} height={24} sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Grid item xs={6} sm={3} key={index}>
                    <Skeleton variant="rectangular" width="100%" height={60} />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* List Skeleton */}
      {showList && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="text" width={200} height={28} />
              <Skeleton variant="rectangular" width={100} height={32} />
            </Box>
            {Array.from({ length: 5 }).map((_, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  py: 2,
                  borderBottom: index < 4 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width={200} height={20} />
                  <Skeleton variant="text" width={300} height={18} sx={{ mt: 0.5 }} />
                </Box>
                <Skeleton variant="rectangular" width={80} height={24} />
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

/**
 * KPI Card Skeleton
 * A smaller skeleton for individual KPI cards
 */
export function KPICardSkeleton() {
  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Skeleton variant="text" width={100} height={16} />
          <Skeleton variant="circular" width={32} height={32} />
        </Box>
        <Skeleton variant="text" width={80} height={32} />
        <Skeleton variant="rectangular" width={60} height={20} sx={{ mt: 1 }} />
      </CardContent>
    </Card>
  )
}

/**
 * Table Skeleton
 * For tables with loading data
 */
interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <Box>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box
          key={rowIndex}
          sx={{
            display: 'flex',
            py: 2,
            borderBottom: rowIndex < rows - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Box key={colIndex} sx={{ flex: 1, px: 1 }}>
              {colIndex === 0 ? (
                <Skeleton variant="circular" width={40} height={40} />
              ) : (
                <Skeleton variant="text" width="100%" height={24} />
              )}
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  )
}
