import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  ImageBackground,
  Image,
  RefreshControl,
} from 'react-native'
import {
  Text,
  Card,
  Chip,
  IconButton,
  Button,
  Surface,
  ActivityIndicator,
} from 'react-native-paper'
import { useTheme } from 'react-native-paper'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { MainTabParamList } from '../../types'
import { getAllProducts, type Product } from '../../services/product-api'
import { CustomButton } from '../../components/Button'
import { Loading, ProductCardSkeleton } from '../../components/Loading'

type Props = BottomTabScreenProps<MainTabParamList, 'HomeTab'>

const SCREEN_WIDTH = Dimensions.get('window').width

// Price formatter for VND
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

// Category data - Synced with FE (Frames, Lenses, Services)
const categories = [
  { id: 'frame', name: 'Frames', icon: 'glasses', color: '#2563eb' },
  { id: 'lens', name: 'Lenses', icon: 'eye', color: '#8b5cf6' },
  { id: 'service', name: 'Services', icon: 'account-heart', color: '#ec4899' },
]

// Feature data
const features = [
  { icon: 'truck', title: 'Giao hàng miễn phí', description: 'Đơn hàng trên 2 triệu' },
  { icon: 'shield-check', title: 'Bảo hành', description: '12 tháng chính hãng' },
  { icon: 'refresh', title: 'Đổi trả', description: 'Trong vòng 30 ngày' },
]

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
        {product.category && (
          <Chip style={styles.categoryChip} textStyle={styles.categoryChipText}>
            {product.category}
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

function CategoryCard({ category, onPress }: { category: (typeof categories)[0]; onPress: () => void }) {
  const theme = useTheme()

  return (
    <Surface style={[styles.categoryCard, { backgroundColor: category.color }]} elevation={2}>
      <IconButton icon={category.icon} iconColor="white" size={32} />
      <Text style={styles.categoryName}>{category.name}</Text>
    </Surface>
  )
}

function FeatureItem({ feature }: { feature: (typeof features)[0] }) {
  const theme = useTheme()

  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: theme.colors.primaryContainer }]}>
        <IconButton icon={feature.icon} iconColor={theme.colors.primary} size={24} />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </View>
    </View>
  )
}

export function HomeScreen({ navigation }: Props) {
  const theme = useTheme()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllProducts()
      const activeProducts = data.filter((p) => !p.isDeleted && p.isActive)
      setProducts(activeProducts)
      // Get first 6 as featured products
      setFeaturedProducts(activeProducts.slice(0, 6))
    } catch (error) {
      console.error('Failed to load products:', error)
      setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadProducts()
    setRefreshing(false)
  }, [loadProducts])

  const handleCategoryPress = (categoryId: string) => {
    navigation.navigate('Main', { screen: 'Search' })
  }

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', {
      slug: product.slug,
      productId: product._id,
    })
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Sản phẩm mới</Text>
          <View style={styles.productsGrid}>
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </View>
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Có lỗi xảy ra</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Button
            mode="contained"
            onPress={() => loadProducts()}
            style={styles.retryButton}
            icon="refresh"
          >
            Thử lại
          </Button>
        </View>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
      }
    >
      {/* Hero Banner */}
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80',
        }}
        style={styles.heroBanner}
        imageStyle={styles.heroImage}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Khám phá bộ sưu tập</Text>
          <Text style={styles.heroSubtitle}>Kính mắt phong cách & đẳng cấp</Text>
          <CustomButton
            mode="contained"
            onPress={() => navigation.navigate('Main', { screen: 'Search' })}
            style={styles.heroButton}
            contentStyle={styles.heroButtonContent}
          >
            Mua ngay
          </CustomButton>
        </View>
      </ImageBackground>

      {/* Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Danh mục</Text>
        </View>
        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onPress={() => handleCategoryPress(category.id)}
            />
          ))}
        </View>
      </View>

      {/* Features */}
      <View style={styles.section}>
        {features.map((feature, index) => (
          <FeatureItem key={index} feature={feature} />
        ))}
      </View>

      {/* Featured Products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sản phẩm nổi bật</Text>
        </View>
        {featuredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>Chưa có sản phẩm nổi bật</Text>
            <Text style={styles.emptyText}>
              Các sản phẩm mới sẽ hiển thị ở đây
            </Text>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Main', { screen: 'Search' })}
              style={styles.emptyButton}
              icon="magnify"
            >
              Tìm sản phẩm
            </Button>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScrollView}>
            {featuredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onPress={() => handleProductPress(product)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* All Products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tất cả sản phẩm</Text>
        </View>
        {products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👓</Text>
            <Text style={styles.emptyTitle}>Chưa có sản phẩm nào</Text>
            <Text style={styles.emptyText}>
              Chúng tôi đang cập nhật kho sản phẩm. Hãy quay lại sau!
            </Text>
            <Button
              mode="contained"
              onPress={() => loadProducts()}
              style={styles.emptyButton}
              icon="refresh"
            >
              Làm mới
            </Button>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {products.map((product) => (
              <ProductCard key={product._id} product={product} onPress={() => handleProductPress(product)} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
  },
  heroBanner: {
    height: 220,
    justifyContent: 'center',
    padding: 24,
  },
  heroImage: {
    opacity: 0.3,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 16,
  },
  heroButton: {
    alignSelf: 'flex-start',
    marginHorizontal: 0,
  },
  heroButtonContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  categoryName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  productsScrollView: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
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
  categoryChip: {
    position: 'absolute',
    top: 8,
    left: 8,
    height: 24,
  },
  categoryChipText: {
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
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#ef4444',
  },
  errorMessage: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 32,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e293b',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: 24,
  },
})
