import React, { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
} from '@mui/material'
import {
  AttachMoney as PriceIcon,
  TrendingUp as PriceChangeIcon,
  Category as CategoryIcon,
  LocalOffer as DiscountIcon,
} from '@mui/icons-material'
import { getAllProducts, type Product } from '@/lib/product-api'
import { getAllCombos, type Combo } from '@/lib/combo-api'
import { getAllPromotions, type Promotion } from '@/lib/promotion-api'

interface PriceSummary {
  category: string
  totalProducts: number
  minPrice: number
  maxPrice: number
  avgPrice: number
}

const PriceManagementPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [combos, setCombos] = useState<Combo[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [priceSummaries, setPriceSummaries] = useState<PriceSummary[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [productsData, combosData, promotionsData] = await Promise.all([
        getAllProducts({ limit: 500 }),
        getAllCombos({ limit: 100 }),
        getAllPromotions({ limit: 100 }),
      ])

      setProducts(productsData.items)
      setCombos(combosData.items)
      setPromotions(promotionsData.items)

      // Calculate price summaries by category
      const summaries: PriceSummary[] = []
      const categories = ['frame', 'lens', 'service']

      for (const category of categories) {
        const categoryProducts = productsData.items.filter((p) => p.category === category)
        if (categoryProducts.length > 0) {
          const prices = categoryProducts.map((p) => p.basePrice)
          summaries.push({
            category: category.charAt(0).toUpperCase() + category.slice(1),
            totalProducts: categoryProducts.length,
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices),
            avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
          })
        }
      }

      setPriceSummaries(summaries)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Typography>Loading pricing data...</Typography>
      </Box>
    )
  }

  const activeCombosCount = combos.filter((c) => c.status === 'active').length
  const activePromotionsCount = promotions.filter((p) => p.status === 'active').length
  const totalSavingsFromCombos = combos
    .filter((c) => c.status === 'active')
    .reduce((sum, c) => sum + c.discountAmount, 0)

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PriceIcon sx={{ color: 'text.secondary' }} />
        <Typography
          variant="h1"
          sx={{
            fontSize: '1.25rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Price Management Overview
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CategoryIcon color="primary" />
                <Typography variant="body2" color="text.secondary">
                  Total Products
                </Typography>
              </Box>
              <Typography variant="h4">{products.length}</Typography>
              <Typography variant="caption" color="text.secondary">
                Across all categories
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PriceIcon color="success" />
                <Typography variant="body2" color="text.secondary">
                  Active Combos
                </Typography>
              </Box>
              <Typography variant="h4">{activeCombosCount}</Typography>
              <Typography variant="caption" color="text.secondary">
                {combos.length} total combos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <DiscountIcon color="warning" />
                <Typography variant="body2" color="text.secondary">
                  Active Promotions
                </Typography>
              </Box>
              <Typography variant="h4">{activePromotionsCount}</Typography>
              <Typography variant="caption" color="text.secondary">
                {promotions.length} total promotions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PriceChangeIcon color="info" />
                <Typography variant="body2" color="text.secondary">
                  Customer Savings
                </Typography>
              </Box>
              <Typography variant="h4">{formatPrice(totalSavingsFromCombos)}</Typography>
              <Typography variant="caption" color="text.secondary">
                From active combos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Price Summary by Category */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {priceSummaries.map((summary) => (
          <Grid size={{ xs: 12, md: 4 }} key={summary.category}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {summary.category} Pricing
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Products:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {summary.totalProducts}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Min Price:
                </Typography>
                <Typography variant="body2" color="success.main">
                  {formatPrice(summary.minPrice)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Max Price:
                </Typography>
                <Typography variant="body2" color="error.main">
                  {formatPrice(summary.maxPrice)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Average:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {formatPrice(summary.avgPrice)}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
                → Manage Product Prices
              </Typography>
              <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
                → Create New Combo
              </Typography>
              <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
                → Create New Promotion
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Pricing Tips
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                • Combo pricing helps increase average order value
              </Typography>
              <Typography variant="caption" color="text.secondary">
                • Limited-time promotions create urgency
              </Typography>
              <Typography variant="caption" color="text.secondary">
                • Featured items get more visibility
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Price Changes (placeholder) */}
      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Pricing Overview
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Products</TableCell>
                  <TableCell align="right">Price Range</TableCell>
                  <TableCell align="right">Average Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {priceSummaries.map((summary) => (
                  <TableRow key={summary.category} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CategoryIcon fontSize="small" color="action" />
                        {summary.category}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{summary.totalProducts}</TableCell>
                    <TableCell align="right">
                      {formatPrice(summary.minPrice)} - {formatPrice(summary.maxPrice)}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        size="small"
                        label={formatPrice(summary.avgPrice)}
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>
    </Box>
  )
}

export default PriceManagementPage
