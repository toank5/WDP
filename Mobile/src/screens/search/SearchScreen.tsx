import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
  TextInput,
  RefreshControl,
} from 'react-native'
import {
  Text,
  Card,
  Chip,
  IconButton,
  Surface,
  Searchbar,
  SegmentedButtons,
  ActivityIndicator,
  Portal,
  Modal,
  Button,
  Divider,
} from 'react-native-paper'
import { useTheme } from 'react-native-paper'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { MainTabParamList } from '../../types'
import { getAllProducts, type Product, type ProductCategory } from '../../services/product-api'
import { Loading, ProductCardSkeleton } from '../../components/Loading'

type Props = BottomTabScreenProps<MainTabParamList, 'SearchTab'>

const SCREEN_WIDTH = Dimensions.get('window').width

// Price formatter
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

// Categories - Synced with FE (Frames, Lenses, Services)
const CATEGORIES: Array<{ id: ProductCategory; name: string }> = [
  { id: 'frame', name: 'Frames' },
  { id: 'lens', name: 'Lenses' },
  { id: 'service', name: 'Services' },
]

// Color options
const COLOR_OPTIONS = [
  { name: 'Đen', value: 'black', hex: '#000000' },
  { name: 'Trắng', value: 'white', hex: '#FFFFFF' },
  { name: 'Đỏ', value: 'red', hex: '#EF4444' },
  { name: 'Xanh dương', value: 'blue', hex: '#3B82F6' },
  { name: 'Xanh lá', value: 'green', hex: '#10B981' },
  { name: 'Vàng', value: 'yellow', hex: '#F59E0B' },
]

// Size options
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', '52', '54', '56', '58']

// Sort options
const SORT_OPTIONS = [
  { label: 'Liên quan', value: 'relevance' },
  { label: 'Giá thấp', value: 'price-asc' },
  { label: 'Giá cao', value: 'price-desc' },
]

interface Filters {
  category: string
  minPrice: number
  maxPrice: number
  colors: string[]
  sizes: string[]
  inStockOnly: boolean
}

const DEFAULT_FILTERS: Filters = {
  category: '',
  minPrice: 0,
  maxPrice: 50000000,
  colors: [],
  sizes: [],
  inStockOnly: false,
}

interface ProductCardProps {
  product: Product
  onPress: () => void
}

function ProductCard({ product, onPress }: ProductCardProps) {
  const theme = useTheme()

  return (
    <Card style={styles.productCard} onPress={onPress}>
      <View style={styles.productImageContainer}>
        {product.images2D && product.images2D.length > 0 ? (
          <Image
            source={{ uri: product.images2D[0] }}
            style={styles.productImage}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.productImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>👓</Text>
          </View>
        )}
        {product.images3D && product.images3D.length > 0 && (
          <Chip style={styles.threeDChip} textStyle={styles.threeDChipText}>
            3D
          </Chip>
        )}
      </View>
      <Card.Content style={styles.productContent}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productPrice}>{formatPrice(product.basePrice)}</Text>
      </Card.Content>
    </Card>
  )
}

export function SearchScreen({ navigation }: Props) {
  const theme = useTheme()

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
      return
    }
    navigation.navigate('HomeTab')
  }, [navigation])

  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null)
  const [sortBy, setSortBy] = useState('relevance')
  const [maxPrice, setMaxPrice] = useState(50000000)

  // Filters
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [tempFilters, setTempFilters] = useState<Filters>(DEFAULT_FILTERS)

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllProducts()
      const activeProducts = data.filter((p) => !p.isDeleted && p.isActive)
      setProducts(activeProducts)

      // Calculate max price
      if (activeProducts.length > 0) {
        const maxP = Math.max(...activeProducts.map((p) => p.basePrice))
        const roundedMax = Math.ceil(maxP / 1000000) * 1000000
        setMaxPrice(roundedMax)
        setFilters((prev) => ({ ...prev, maxPrice: roundedMax }))
        setTempFilters((prev) => ({ ...prev, maxPrice: roundedMax }))
      }
    } catch (error) {
      console.error('Failed to load products:', error)
      setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await loadProducts()
    } finally {
      setRefreshing(false)
    }
  }, [loadProducts])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    let filtered = products

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter((p) => p.category === filters.category)
    }

    // Price range filter
    filtered = filtered.filter((p) => p.basePrice >= filters.minPrice && p.basePrice <= filters.maxPrice)

    // In stock filter
    if (filters.inStockOnly) {
      filtered = filtered.filter((p) => p.isActive)
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.basePrice - b.basePrice)
        break
      case 'price-desc':
        filtered.sort((a, b) => b.basePrice - a.basePrice)
        break
      default:
        break
    }

    setFilteredProducts(filtered)
  }, [products, filters, searchQuery, sortBy])

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail' as never, {
      slug: product.slug,
      productId: product._id,
    } as never)
  }

  const openFilterModal = () => {
    setTempFilters(filters)
    setFilterModalVisible(true)
  }

  const applyFilters = () => {
    setFilters(tempFilters)
    setFilterModalVisible(false)
  }

  const clearFilters = () => {
    const cleared = { ...DEFAULT_FILTERS, maxPrice }
    setFilters(cleared)
    setTempFilters(cleared)
    setFilterModalVisible(false)
  }

  const toggleColor = (color: string) => {
    setTempFilters((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
    }))
  }

  const toggleSize = (size: string) => {
    setTempFilters((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }))
  }

  const hasActiveFilters = Boolean(
    filters.category ||
    filters.minPrice > 0 ||
    filters.maxPrice < maxPrice ||
    filters.colors.length > 0 ||
    filters.sizes.length > 0 ||
    filters.inStockOnly
  )

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <IconButton icon="arrow-left" size={22} onPress={handleBack} style={styles.backButton} />
        <Searchbar
          placeholder="Tìm kiếm sản phẩm..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <IconButton
          icon="filter-variant"
          size={24}
          onPress={openFilterModal}
          style={styles.filterButton}
          iconColor={hasActiveFilters ? theme.colors.primary : theme.colors.onSurfaceDisabled}
        />
      </View>

      {/* Sort and Results */}
      <View style={styles.headerRow}>
        <Text style={styles.resultsText}>
          {filteredProducts.length} sản phẩm
        </Text>
        <SegmentedButtons
          value={sortBy}
          onValueChange={setSortBy}
          buttons={SORT_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          style={styles.sortButtons}
          density="small"
        />
      </View>

      {/* Products Grid */}
      <FlatList
        data={
          error
            ? [{ _id: 'error', isError: true }]
            : loading
            ? Array.from({ length: 6 }, (_, i) => ({ _id: `skeleton-${i}`, isSkeleton: true }))
            : filteredProducts
        }
        renderItem={({ item }) => {
          if ((item as any).isError) {
            return (
              <View style={styles.emptyContainer}>
                <IconButton
                  icon="shopping"
                  size={64}
                  iconColor={theme.colors.onSurfaceDisabled}
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyTitle}>Có lỗi xảy ra</Text>
                <Text style={styles.emptyText}>
                  Không thể tải danh sách sản phẩm
                </Text>
                <Button
                  mode="contained"
                  onPress={() => loadProducts()}
                  style={styles.emptyButton}
                  icon="refresh"
                >
                  Thử lại
                </Button>
              </View>
            )
          }

          if ((item as any).isSkeleton) {
            return <ProductCardSkeleton />
          }

          const product = item as Product
          return (
            <ProductCard
              product={product}
              onPress={() => handleProductPress(product)}
            />
          )
        }
        }
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListFooterComponent={
          <View style={styles.listFooter} />
        }
      />

      {/* Filter Modal */}
      <Portal>
        <Modal
          visible={filterModalVisible}
          onDismiss={() => setFilterModalVisible(false)}
          contentContainerStyle={[styles.filterModal, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Bộ lọc</Text>
            <IconButton icon="close" onPress={() => setFilterModalVisible(false)} />
          </View>

          <View style={styles.filterModalScrollView}>
            {/* Category */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Danh mục</Text>
              <View style={styles.chipContainer}>
                <Chip
                  selected={tempFilters.category === ''}
                  onPress={() => setTempFilters((prev) => ({ ...prev, category: '' }))}
                  style={styles.filterChip}
                >
                  Tất cả
                </Chip>
                {CATEGORIES.map((cat) => (
                  <Chip
                    key={cat.id}
                    selected={tempFilters.category === cat.id}
                    onPress={() => setTempFilters((prev) => ({ ...prev, category: cat.id }))}
                    style={styles.filterChip}
                  >
                    {cat.name}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Colors */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Màu sắc</Text>
              <View style={styles.colorContainer}>
                {COLOR_OPTIONS.map((color) => (
                  <View
                    key={color.value}
                    style={[
                      styles.colorOption,
                      {
                        backgroundColor: color.hex,
                        borderColor: tempFilters.colors.includes(color.value)
                          ? theme.colors.primary
                          : '#e2e8f0',
                      },
                    ]}
                    onPress={() => toggleColor(color.value)}
                  >
                    {tempFilters.colors.includes(color.value) && (
                      <View style={styles.colorCheck} />
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* Sizes */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Kích thước</Text>
              <View style={styles.chipContainer}>
                {SIZE_OPTIONS.map((size) => (
                  <Chip
                    key={size}
                    selected={tempFilters.sizes.includes(size)}
                    onPress={() => toggleSize(size)}
                    style={styles.filterChip}
                  >
                    {size}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Availability */}
            <View style={styles.filterSection}>
              <View style={styles.checkboxRow}>
                <Text style={styles.checkboxLabel}>Còn hàng</Text>
                <IconButton
                  icon={tempFilters.inStockOnly ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  onPress={() => setTempFilters((prev) => ({ ...prev, inStockOnly: !prev.inStockOnly }))}
                  iconColor={theme.colors.primary}
                />
              </View>
            </View>
          </View>

          <Divider />

          <View style={styles.filterActions}>
            <Button mode="text" onPress={clearFilters} style={styles.filterAction}>
              Xóa
            </Button>
            <Button mode="contained" onPress={applyFilters} style={styles.filterAction}>
              Áp dụng
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    margin: 0,
  },
  searchbar: {
    flex: 1,
  },
  searchBar: {
    flex: 1,
    elevation: 0,
    backgroundColor: '#f8fafc',
  },
  filtersContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  categoryButtons: {
    width: '100%',
  },
  filterButton: {
    flex: 1,
    elevation: 0,
    backgroundColor: '#f8fafc',
  },
  filterButtonActive: {
    backgroundColor: '#ffffff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  resultsText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  sortButtons: {
    height: 32,
    backgroundColor: '#f8fafc',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: '#0f172a',
  },
  emptyButton: {
    marginBottom: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  productCard: {
    width: SCREEN_WIDTH / 2 - 20,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  productImageContainer: {
    position: 'relative',
    height: 140,
    backgroundColor: '#f8fafc',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  placeholderText: {
    fontSize: 48,
  },
  threeDChip: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    height: 24,
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
  },
  threeDChipText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  productContent: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
  },
  filterModal: {
    margin: 16,
    borderRadius: 20,
    maxHeight: '80%',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  filterSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterModalScrollView: {
    maxHeight: 400,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#0f172a',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    height: 32,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCheck: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  filterActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  filterAction: {
    flex: 1,
    borderRadius: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#ef4444',
  },
  errorMessage: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    paddingHorizontal: 32,
  },
})
