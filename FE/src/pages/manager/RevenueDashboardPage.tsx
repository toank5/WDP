import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Tab,
  Tabs,
  Stack,
  InputAdornment,
  Skeleton,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material'
import {
  TrendingUp,
  AttachMoney,
  ShoppingCart,
  ArrowUpward,
  Search,
  CalendarToday,
  BarChart,
  Refresh,
} from '@mui/icons-material'
import { useSearchParams } from 'react-router-dom'
import {
  getRevenueOverview,
  getRevenueTimeSeries,
  getRevenueByCategory,
  getRevenueByProduct,
  formatCurrency,
  type RevenueQueryParams,
  type RevenueByProductQueryParams,
} from '@/lib/revenue-api'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
} from 'recharts'

// Date range presets
const DATE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'This month', days: 'thisMonth' },
  { label: 'Last 3 months', days: 90 },
]

const GROUP_BY_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

const RevenueDashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Parse URL params for initial state
  const [fromDate, setFromDate] = useState(() => {
    const from = searchParams.get('from')
    return from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })
  const [toDate, setToDate] = useState(() => {
    const to = searchParams.get('to')
    return to || new Date().toISOString().split('T')[0]
  })
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>(() =>
    (searchParams.get('groupBy') as 'day' | 'week' | 'month') || 'day',
  )
  const [tabValue, setTabValue] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [productPage, setProductPage] = useState(1)
  const [productLimit] = useState(10)

  // Data states
  const [overview, setOverview] = useState<{
    totalRevenue: number
    totalOrders: number
    avgOrderValue: number
  } | null>(null)
  const [timeSeries, setTimeSeries] = useState<{ periodStart: string; revenue: number; orders: number }[]>([])
  const [categoryData, setCategoryData] = useState<{
    category: string
    revenue: number
    orders: number
    units: number
  }[]>([])
  const [productData, setProductData] = useState<{
    items: {
      productId: string
      name: string
      revenue: number
      orders: number
      units: number
      avgPrice: number
    }[]
    total: number
  }>({ items: [], total: 0 })

  // Loading states
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [timeSeriesLoading, setTimeSeriesLoading] = useState(true)
  const [categoryLoading, setCategoryLoading] = useState(true)
  const [productLoading, setProductLoading] = useState(true)

  // Error state
  const [error, setError] = useState<string | null>(null)

  // Update URL params when filters change
  useEffect(() => {
    const params: Record<string, string> = {}
    if (fromDate) params.from = fromDate
    if (toDate) params.to = toDate
    if (groupBy) params.groupBy = groupBy
    setSearchParams(params)
  }, [fromDate, toDate, groupBy, setSearchParams])

  // Fetch overview data
  useEffect(() => {
    const fetchOverview = async () => {
      setOverviewLoading(true)
      setError(null)
      try {
        const params: RevenueQueryParams = { from: fromDate, to: toDate }
        const data = await getRevenueOverview(params)
        setOverview(data)
      } catch (err) {
        console.error('Error fetching overview:', err)
        setError('Failed to fetch revenue overview. Please try again.')
      } finally {
        setOverviewLoading(false)
      }
    }
    fetchOverview()
  }, [fromDate, toDate])

  // Fetch time series data
  useEffect(() => {
    const fetchTimeSeries = async () => {
      setTimeSeriesLoading(true)
      try {
        const params: RevenueQueryParams = { from: fromDate, to: toDate, groupBy }
        const data = await getRevenueTimeSeries(params)
        setTimeSeries(data.points)
      } catch (err) {
        console.error('Error fetching time series:', err)
      } finally {
        setTimeSeriesLoading(false)
      }
    }
    fetchTimeSeries()
  }, [fromDate, toDate, groupBy])

  // Fetch category data
  useEffect(() => {
    const fetchCategoryData = async () => {
      setCategoryLoading(true)
      try {
        const params: RevenueQueryParams = { from: fromDate, to: toDate }
        const data = await getRevenueByCategory(params)
        setCategoryData(data.items)
      } catch (err) {
        console.error('Error fetching category data:', err)
      } finally {
        setCategoryLoading(false)
      }
    }
    fetchCategoryData()
  }, [fromDate, toDate])

  // Fetch product data
  useEffect(() => {
    const fetchProductData = async () => {
      setProductLoading(true)
      try {
        const params: RevenueByProductQueryParams = {
          from: fromDate,
          to: toDate,
          page: productPage,
          limit: productLimit,
          search: searchTerm || undefined,
        }
        const data = await getRevenueByProduct(params)
        setProductData(data)
      } catch (err) {
        console.error('Error fetching product data:', err)
      } finally {
        setProductLoading(false)
      }
    }
    fetchProductData()
  }, [fromDate, toDate, productPage, productLimit, searchTerm])

  const handlePresetClick = (days: number | 'thisMonth') => {
    const today = new Date()
    const to = today.toISOString().split('T')[0]

    let from: string
    if (days === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      from = firstDay.toISOString().split('T')[0]
    } else {
      const fromDate = new Date(today)
      fromDate.setDate(today.getDate() - (days as number))
      from = fromDate.toISOString().split('T')[0]
    }

    setFromDate(from)
    setToDate(to)
  }

  const handleApplyFilters = () => {
    setProductPage(1)
  }

  const handleRefresh = () => {
    // Trigger re-fetch by updating dates
    setFromDate(fromDate)
    setToDate(toDate)
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
    setProductPage(1)
  }

  // Calculate category share percentage
  const categoryDataWithShare = categoryData.map((item) => ({
    ...item,
    share: overview?.totalRevenue ? (item.revenue / overview.totalRevenue) * 100 : 0,
  }))

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BarChart sx={{ color: 'text.secondary' }} />
          <Typography
            variant="h1"
            sx={{
              fontSize: '1.25rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Revenue Management
          </Typography>
        </Box>
        <Button
          startIcon={<Refresh />}
          onClick={handleRefresh}
          size="small"
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters Bar */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              label="From date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarToday fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              label="To date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarToday fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              select
              label="Group by"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
              fullWidth
              size="small"
            >
              {GROUP_BY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Stack direction="row" spacing={1}>
              {DATE_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outlined"
                  size="small"
                  onClick={() => handlePresetClick(preset.days)}
                >
                  {preset.label}
                </Button>
              ))}
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleApplyFilters}
              startIcon={<Search />}
            >
              Apply
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}
              >
                Total Revenue
              </Typography>
              <AttachMoney color="primary" />
            </Box>
            {overviewLoading ? (
              <Skeleton variant="text" width="60%" height={48} />
            ) : (
              <>
                <Typography variant="h2">{formatCurrency(overview?.totalRevenue || 0)}</Typography>
                {overview && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
                    <Chip
                      size="small"
                      icon={<ArrowUpward fontSize="small" />}
                      label={`${overview.totalOrders} orders`}
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}
              >
                Total Orders
              </Typography>
              <ShoppingCart color="secondary" />
            </Box>
            {overviewLoading ? (
              <Skeleton variant="text" width="40%" height={48} />
            ) : (
              <>
                <Typography variant="h2">{overview?.totalOrders || 0}</Typography>
                {overview && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
                    <Chip
                      size="small"
                      label={`+${Math.round(overview.totalOrders / 10)}% vs avg`}
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}
              >
                Average Value
              </Typography>
              <TrendingUp sx={{ color: '#10b981' }} />
            </Box>
            {overviewLoading ? (
              <Skeleton variant="text" width="50%" height={48} />
            ) : (
              <>
                <Typography variant="h2">{formatCurrency(overview?.avgOrderValue || 0)}</Typography>
                {overview && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
                    <Chip
                      size="small"
                      label="Above avg"
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Revenue Over Time Chart */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Revenue Over Time
        </Typography>
        {timeSeriesLoading ? (
          <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : timeSeries.length === 0 ? (
          <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">
              No revenue data in this period
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeries}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="periodStart"
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' })
                }}
              />
              <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                labelFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Paper>

      {/* Revenue Breakdown Tabs */}
      <Paper variant="outlined">
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="By Category" />
            <Tab label="By Product" />
          </Tabs>
        </Box>

        {/* By Category */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Revenue by Product Category
          </Typography>
          {categoryLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : categoryDataWithShare.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No revenue data in this period
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">% Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categoryDataWithShare.map((item) => (
                    <TableRow key={item.category}>
                      <TableCell>
                        <Chip label={item.category} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">{formatCurrency(item.revenue)}</TableCell>
                      <TableCell align="right">{item.orders}</TableCell>
                      <TableCell align="right">{item.units}</TableCell>
                      <TableCell align="right">{item.share.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* By Product */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Revenue by Product</Typography>
            <TextField
              placeholder="Search products..."
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 250 }}
            />
          </Box>
          {productLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : productData.items.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                {searchTerm
                  ? 'No products found'
                  : 'No revenue data in this period'}
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product Name</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Orders</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Avg Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {productData.items.map((item) => (
                      <TableRow
                        key={item.productId}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => {
                          // Navigate to product detail if needed
                          window.location.href = `/dashboard/all-products/${item.productId}`
                        }}
                      >
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{formatCurrency(item.revenue)}</TableCell>
                        <TableCell align="right">{item.orders}</TableCell>
                        <TableCell align="right">{item.units}</TableCell>
                        <TableCell align="right">{formatCurrency(item.avgPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={productData.total}
                page={productPage - 1}
                onPageChange={(_, newPage) => setProductPage(newPage + 1)}
                rowsPerPage={productLimit}
                rowsPerPageOptions={[productLimit]}
                labelRowsPerPage=""
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`}
              />
            </>
          )}
        </TabPanel>
      </Paper>
    </Box>
  )
}

export default RevenueDashboardPage
