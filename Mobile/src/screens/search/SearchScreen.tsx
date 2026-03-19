import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  TextInput,
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
import { Loading } from '../../components/Loading'

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

  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('relevance')
  const [maxPrice, setMaxPrice] = useState(50000000)

  // Filters
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [tempFilters, setTempFilters] = useState<Filters>(DEFAULT_FILTERS)

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }, [])

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
    navigation.navigate('ProductDetail', {
      slug: product.slug,
      productId: product._id,
    })
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

  if (loading) {
    return <Loading />
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không tìm thấy sản phẩm nào</Text>
            <Button mode="text" onPress={() => setFilters({ ...DEFAULT_FILTERS, maxPrice })}>
              Xóa bộ lọc
            </Button>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onPress={() => handleProductPress(product)}
              />
            ))}
          </View>
        )}
      </ScrollView>

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

          <ScrollView style={styles.filterScrollView}>
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
          </ScrollView>

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
    padding: 12,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    elevation: 0,
    backgroundColor: 'white',
  },
  filterButton: {
    backgroundColor: 'white',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  resultsText: {
    fontSize: 14,
    color: '#64748b',
  },
  sortButtons: {
    height: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  productCard: {
    width: SCREEN_WIDTH / 2 - 20,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImageContainer: {
    position: 'relative',
    height: 140,
    backgroundColor: '#f1f5f9',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
  },
  placeholderText: {
    fontSize: 48,
  },
  threeDChip: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    height: 20,
    backgroundColor: '#8b5cf6',
  },
  threeDChipText: {
    color: 'white',
    fontSize: 10,
  },
  productContent: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  filterModal: {
    margin: 16,
    borderRadius: 16,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterScrollView: {
    maxHeight: 400,
  },
  filterSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1e293b',
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
  },
  filterActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  filterAction: {
    flex: 1,
  },
})
