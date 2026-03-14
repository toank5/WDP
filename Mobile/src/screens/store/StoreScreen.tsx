import React, { useState, useCallback } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { Text, Searchbar, useTheme, Divider } from 'react-native-paper'
import { useNavigation } from '@react-navigation/native'
import { ProductCard } from '../../components/ProductCard'
import { SkeletonLoader } from '../../components/SkeletonLoader'
import { ProductFilter } from '../../components/product/ProductFilter'
import { APP_CONFIG } from '../../config'
import type { ProductFilter as Filter } from '../../types/product'

interface StoreScreenProps {
  navigation: any
}

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  images?: string[]
  category: 'frame' | 'lens' | 'service'
  inStock: boolean
  preOrder?: boolean
  discount?: number
  color?: string
  size?: string
}

const SCREEN_WIDTH = Dimensions.get('window').width
const NUM_COLUMNS = 2
const CARD_WIDTH = (SCREEN_WIDTH - 32) / NUM_COLUMNS // 16 padding each side

/**
 * StoreScreen - Main store/home screen
 *
 * Features:
 * - Grid layout of products
 * - Search functionality
 * - Category filter (frame, lens, service)
 * - Price range filter
 * - Refresh on pull
 * - Loading skeleton
 */
export const StoreScreen: React.FC<StoreScreenProps> = ({ navigation }) => {
  const theme = useTheme()
  const nav = useNavigation()

  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<Filter>({
    category: 'all',
    minPrice: 0,
    maxPrice: Infinity,
  })

  // Load products (mock data for now)
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      // const response = await getProducts()
      // setProducts(response.data)

      // Mock data for demonstration with colors and sizes
      const colors = ['Đen', 'Nâu', 'Xám', 'Hồng']
      const sizes = ['S', 'M', 'L']
      const categories: ('frame' | 'lens' | 'service')[] = ['frame', 'lens', 'service']

      const mockProducts: Product[] = Array.from({ length: 12 }, (_, i) => ({
        id: `product-${i}`,
        name: `Kính mẫu ${i + 1}`,
        price: (i + 1) * 150000 + 200000, // Price from 350k to 1.95M
        originalPrice: ((i + 1) * 150000 + 200000) * 1.2,
        image: 'https://via.placeholder.com/300x300',
        category: categories[i % categories.length],
        inStock: i % 3 !== 0,
        preOrder: i % 5 === 0,
        discount: i % 4 === 0 ? 15 : undefined,
        color: colors[i % colors.length],
        size: sizes[i % sizes.length],
      }))

      setTimeout(() => {
        setProducts(mockProducts)
        setFilteredProducts(mockProducts)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error loading products:', error)
      setLoading(false)
    }
  }, [])

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadProducts()
    setRefreshing(false)
  }, [loadProducts])

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  // Apply filters (category, price range, search)
  const applyFilters = useCallback(() => {
    let filtered = products

    // Apply category filter
    if (filter.category !== 'all') {
      filtered = filtered.filter((product) => product.category === filter.category)
    }

    // Apply price filter
    filtered = filtered.filter((product) => {
      const price = product.discount
        ? product.price * (1 - product.discount / 100)
        : product.price
      return price >= filter.minPrice && price <= filter.maxPrice
    })

    // Apply search filter
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase()
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(lowerQuery)
      )
    }

    setFilteredProducts(filtered)
  }, [products, filter, searchQuery])

  // Re-apply filters when filter changes
  React.useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // Handle product press
  const handleProductPress = useCallback(
    (productId: string) => {
      nav.navigate('ProductDetail' as never, { productId })
    },
    [nav]
  )

  // Render product item
  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        product={item}
        onPress={() => handleProductPress(item.id)}
        style={styles.productCard}
      />
    ),
    [handleProductPress]
  )

  // Handle filter change
  const handleFilterChange = useCallback((newFilter: Filter) => {
    setFilter(newFilter)
  }, [])

  // Initial load
  React.useEffect(() => {
    loadProducts()
  }, [loadProducts])

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          {APP_CONFIG.name}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Tìm kiếm sản phẩm..."
          value={searchQuery}
          onChangeText={handleSearch}
          mode="view"
          style={styles.searchbar}
          iconColor={theme.colors.placeholder}
        />
      </View>

      {/* Product Filter */}
      <ProductFilter activeFilter={filter} onFilterChange={handleFilterChange} />

      <Divider />

      {/* Products List */}
      {loading ? (
        <View style={styles.skeletonContainer}>
          <SkeletonLoader type="product" />
          <SkeletonLoader type="product" />
          <SkeletonLoader type="product" />
          <SkeletonLoader type="product" />
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            {searchQuery || filter.category !== 'all' || filter.minPrice > 0 || filter.maxPrice !== Infinity
              ? 'Không tìm thấy sản phẩm phù hợp'
              : 'Không có sản phẩm nào'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          numColumns={NUM_COLUMNS}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.productList}
          scrollEnabled={false}
        />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchbar: {
    elevation: 2,
    backgroundColor: '#f8f9fa',
  },
  productList: {
    padding: 16,
    paddingBottom: 32,
  },
  productCard: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  skeletonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    opacity: 0.5,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
})
