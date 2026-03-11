import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Pagination,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ViewModule as ViewModuleIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  ViewInAr as ThreeDIcon,
} from '@mui/icons-material'
import {
  getProductsCatalog,
  type ProductCatalogQueryParams,
  type ProductListItem,
  type ProductCategory,
  type ProductSortBy,
} from '@/lib/product-api'

const formatPrice = (price?: number): string => {
  if (price === undefined) return 'N/A'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price)
}

const getCategoryLabel = (category: string): string => {
  switch (category?.toLowerCase()) {
    case 'frame':
      return 'Frame'
    case 'lens':
      return 'Lens'
    case 'service':
      return 'Service'
    default:
      return category || 'N/A'
  }
}

const getCategoryColor = (category: string): 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'default' => {
  switch (category?.toLowerCase()) {
    case 'frame':
      return 'primary'
    case 'lens':
      return 'info'
    case 'service':
      return 'success'
    default:
      return 'default'
  }
}

const SORT_OPTIONS = [
  { label: 'Newest', value: 'createdAt' as const, order: 'desc' as const },
  { label: 'Oldest', value: 'createdAt' as const, order: 'asc' as const },
  { label: 'Name A–Z', value: 'name' as const, order: 'asc' as const },
  { label: 'Name Z–A', value: 'name' as const, order: 'desc' as const },
  { label: 'Price low–high', value: 'price' as const, order: 'asc' as const },
  { label: 'Price high–low', value: 'price' as const, order: 'desc' as const },
  { label: 'Recently updated', value: 'updatedAt' as const, order: 'desc' as const },
]

export function ProductCatalogPage() {
  const navigate = useNavigate()

  // State
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [totalPages, setTotalPages] = useState(0)

  // Filter states
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ProductCategory | ''>('')
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | ''>('')
  const [has3D, setHas3D] = useState<boolean | null>(null)
  const [hasVariants, setHasVariants] = useState<boolean | null>(null)
  const [sortBy, setSortBy] = useState<ProductSortBy>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Build query params
  const buildQueryParams = useCallback((): ProductCatalogQueryParams => {
    const params: ProductCatalogQueryParams = {
      page,
      limit,
      sortBy,
      sortOrder,
    }

    if (search.trim()) params.search = search.trim()
    if (category) params.category = category
    if (status) params.status = status
    if (has3D === true) params.has3D = 'true'
    if (has3D === false) params.has3D = 'false'
    if (hasVariants === true) params.hasVariants = 'true'
    if (hasVariants === false) params.hasVariants = 'false'

    return params
  }, [search, category, status, has3D, hasVariants, sortBy, sortOrder, page, limit])

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      const params = buildQueryParams()
      const result = await getProductsCatalog(params)
      setProducts(result.items)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (err) {
      console.error('Failed to load products:', err)
      setProducts([])
      setTotal(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [buildQueryParams])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadProducts()
  }

  // Handle clear filters
  const handleClearFilters = () => {
    setSearch('')
    setCategory('')
    setStatus('')
    setHas3D(null)
    setHasVariants(null)
    setSortBy('createdAt')
    setSortOrder('desc')
    setPage(1)
  }

  // Handle page change
  const handlePageChange = (_event: unknown, value: number) => {
    setPage(value)
  }

  // Handle sort change
  const handleSortChange = (value: string) => {
    const option = SORT_OPTIONS.find((opt) => opt.label === value)
    if (option) {
      setSortBy(option.value)
      setSortOrder(option.order)
      setPage(1)
    }
  }

  // Navigate to product detail
  const handleViewProduct = (productId: string) => {
    navigate(`/dashboard/products-catalog/${productId}`)
  }

  const hasActiveFilters = search || category || status || has3D !== null || hasVariants !== null

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ViewModuleIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight={600}>
              All Products
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {total} products found
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {/* Filters Sidebar */}
        <Grid size={{ xs: 12, md: 3, lg: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FilterIcon fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Filters
                  </Typography>
                </Box>
                {hasActiveFilters && (
                  <Button size="small" onClick={handleClearFilters} startIcon={<ClearIcon />}>
                    Clear
                  </Button>
                )}
              </Box>

              <Stack spacing={2}>
                {/* Search */}
                <Box component="form" onSubmit={handleSearchSubmit}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by name or SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />,
                      endAdornment: search ? (
                        <IconButton size="small" onClick={() => setSearch('')} sx={{ visibility: search ? 'visible' : 'hidden' }}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      ) : null,
                    }}
                  />
                </Box>

                {/* Category */}
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={category}
                    label="Category"
                    onChange={(e) => setCategory(e.target.value as ProductCategory | '')}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    <MenuItem value="frame">Frame</MenuItem>
                    <MenuItem value="lens">Lens</MenuItem>
                    <MenuItem value="service">Service</MenuItem>
                  </Select>
                </FormControl>

                {/* Status */}
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={status}
                    label="Status"
                    onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE' | '')}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                  </Select>
                </FormControl>

                {/* Has 3D Media */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={has3D === true}
                      indeterminate={has3D === null}
                      onChange={(e) => setHas3D(e.target.checked ? true : has3D === true ? null : false)}
                      size="small"
                    />
                  }
                  label="Has 3D Media"
                />

                {/* Has Variants */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={hasVariants === true}
                      indeterminate={hasVariants === null}
                      onChange={(e) => setHasVariants(e.target.checked ? true : hasVariants === true ? null : false)}
                      size="small"
                    />
                  }
                  label="Multiple Variants"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Products Table */}
        <Grid size={{ xs: 12, md: 9, lg: 9 }}>
          <Card>
            <CardContent>
              {/* Sort and Toolbar */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
                </Typography>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Sort by</InputLabel>
                  <Select
                    value={SORT_OPTIONS.find((opt) => opt.value === sortBy && opt.order === sortOrder)?.label || 'Newest'}
                    label="Sort by"
                    onChange={(e) => handleSortChange(e.target.value)}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <MenuItem key={option.label} value={option.label}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Table */}
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : products.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography color="text.secondary">
                    No products found. Try adjusting your filters.
                  </Typography>
                </Box>
              ) : (
                <>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell width={80}>Thumbnail</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Shape/Material</TableCell>
                          <TableCell>Price Range</TableCell>
                          <TableCell>Variants</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow
                            key={product.id}
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() => handleViewProduct(product.id)}
                          >
                            <TableCell>
                              <Box
                                sx={{
                                  width: 60,
                                  height: 60,
                                  bgcolor: 'grey.100',
                                  borderRadius: 1,
                                  overflow: 'hidden',
                                  position: 'relative',
                                }}
                              >
                                {product.defaultImage2DUrl ? (
                                  <Box
                                    component="img"
                                    src={product.defaultImage2DUrl}
                                    alt={product.name}
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <Box
                                    sx={{
                                      width: '100%',
                                      height: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: 24,
                                    }}
                                  >
                                    👓
                                  </Box>
                                )}
                                {product.has3D && (
                                  <Chip
                                    icon={<ThreeDIcon sx={{ fontSize: 10 }} />}
                                    label="3D"
                                    size="small"
                                    sx={{
                                      position: 'absolute',
                                      bottom: 2,
                                      right: 2,
                                      height: 18,
                                      fontSize: 10,
                                      bgcolor: 'primary.main',
                                      color: 'white',
                                    }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {product.name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getCategoryLabel(product.category)}
                                color={getCategoryColor(product.category)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {product.shape || product.material ? (
                                  <>
                                    {product.shape && <span>{product.shape}</span>}
                                    {product.shape && product.material && <span> / </span>}
                                    {product.material && <span>{product.material}</span>}
                                  </>
                                ) : (
                                  '—'
                                )}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {product.minPrice !== undefined && product.maxPrice !== undefined
                                  ? product.minPrice === product.maxPrice
                                    ? formatPrice(product.minPrice)
                                    : `${formatPrice(product.minPrice)} - ${formatPrice(product.maxPrice)}`
                                  : 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {product.variantCount}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={product.isActive ? 'Active' : 'Inactive'}
                                color={product.isActive ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewProduct(product.id)
                                  }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Pagination */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={handlePageChange}
                      color="primary"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
