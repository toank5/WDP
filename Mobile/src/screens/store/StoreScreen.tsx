import React, { useState, useCallback } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { Text, Searchbar, Chip, useTheme } from 'react-native-paper'
import { useNavigation } from '@react-navigation/native'
import { ProductCard } from '../../components/ProductCard'
import { SkeletonLoader } from '../../components/SkeletonLoader'
import { APP_CONFIG } from '../../config'

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
  category: string
  inStock: boolean
  preOrder?: boolean
  discount?: number
}

interface Category {
  id: string
  name: string
  count: number
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
 * - Category filter
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<Category[]>([])

  // Mock categories
  const CATEGORIES: Category[] = [
    { id: 'all', name: 'Tất cả', count: 0 },
    { id: 'frame', name: 'Gọng kính', count: 0 },
    { id: 'lens', name: 'Tròng kính', count: 0 },
    { id: 'service', name: 'Dịch vụ', count: 0 },
  ]

  // Load products (mock data for now)
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      // const response = await getProducts()
      // setProducts(response.data)

      // Mock data for demonstration
      const mockProducts: Product[] = Array.from({ length: 8 }, (_, i) => ({
        id: `product-${i}`,
        name: `Kính mẫu ${i + 1}`,
        price: (i + 1) * 150000,
        originalPrice: (i + 1) * 180000,
        image: 'https://via.placeholder.com/300x300',
        category: i % 2 === 0 ? 'frame' : 'lens',
        inStock: i % 3 !== 0,
        preOrder: i % 5 === 0,
        discount: i % 4 === 0 ? 15 : undefined,
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

    if (!query.trim()) {
      setFilteredProducts(products)
      return
    }

    const lowerQuery = query.toLowerCase()
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(lowerQuery)
    )
    setFilteredProducts(filtered)
  }, [products])

  // Handle category filter
  const handleCategoryFilter = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId)

    if (categoryId === 'all') {
      setFilteredProducts(products)
    } else {
      const filtered = products.filter(
        (product) => product.category === categoryId
      )
      setFilteredProducts(filtered)
    }
  }, [products])

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

  // Render category chip
  const renderCategory = useCallback(
    (category: Category) => (
      <Chip
        mode={selectedCategory === category.id ? 'flat' : 'outlined'}
        selected={selectedCategory === category.id}
        onPress={() => handleCategoryFilter(category.id)}
        style={[
          styles.categoryChip,
          selectedCategory === category.id && { backgroundColor: theme.colors.primary },
        ]}
        textStyle={
          selectedCategory === category.id
            ? { color: '#fff' }
            : { color: theme.colors.primary }
        }
      >
        {category.name}
      </Chip>
    ),
    [selectedCategory, theme.colors.primary, handleCategoryFilter]
  )

  // Initial load
  React.useEffect(() => {
    loadProducts()
  }, [loadProducts])

  return (
    <View style={styles.container}>
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

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderCategory(item)}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* Products List */}
      {loading ? (
        <View style={styles.skeletonContainer}>
          <SkeletonLoader type="product" />
          <SkeletonLoader type="product" />
          <SkeletonLoader type="product" />
          <SkeletonLoader type="product" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          numColumns={NUM_COLUMNS}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.productList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                Không tìm thấy sản phẩm nào
              </Text>
            </View>
          }
        />
      )}
    </View>
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
  categoryContainer: {
    backgroundColor: '#fff',
    paddingBottom: 12,
  },
  categoryList: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    marginRight: 8,
  },
  productList: {
    padding: 16,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    opacity: 0.5,
  },
})
