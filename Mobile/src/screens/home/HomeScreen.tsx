import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  ImageBackground,
  Image,
  RefreshControl,
  Alert,
} from 'react-native'
import {
  Text,
  Card,
  Chip,
  IconButton,
  Button,
  Surface,
  ActivityIndicator,
  Portal,
} from 'react-native-paper'
import { useTheme } from 'react-native-paper'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../navigation/types'
import type { Product } from '../../types'
import { getAllProducts } from '../../services/product-api'
import { CustomButton } from '../../components/Button'
import { Loading, ProductCardSkeleton } from '../../components/Loading'
import { useAuthStore } from '../../store/auth-store'
import { useCartStore } from '../../store/cart-store'

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>

const SCREEN_WIDTH = Dimensions.get('window').width

// Price formatter for VND
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

// Category data - Synced with FE (Frames, Lenses, Services) - Blue-purple theme
const categories = [
  { id: 'frame', name: 'Frames', icon: 'glasses', color: '#6366f1' },
  { id: 'lens', name: 'Lenses', icon: 'eye', color: '#8b5cf6' },
  { id: 'service', name: 'Services', icon: 'account-heart', color: '#a855f7' },
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
  onAddToCart?: () => void
}

function ProductCard({ product, onPress, onAddToCart }: ProductCardProps) {
  const theme = useTheme()

  // Lấy variant đầu tiên có sẵn (nếu có)
  const firstVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null

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
        {firstVariant && firstVariant.isActive !== false && (
          <View style={styles.variantInfo}>
            {firstVariant.size && (
              <Chip
                style={styles.variantChip}
                icon="ruler"
                textStyle={styles.variantText}
              >
                {firstVariant.size}
              </Chip>
            )}
            {firstVariant.color && (
              <Chip
                style={styles.variantChip}
                icon="palette"
                textStyle={styles.variantText}
              >
                {firstVariant.color}
              </Chip>
            )}
          </View>
        )}
      </View>
      <Card.Content style={styles.productContent}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productPrice}>{formatPrice(product.basePrice)}</Text>
        {/* Hiển thị số lượng biến thể nếu có */}
        {product.variants && product.variants.length > 0 && (
          <Text style={styles.variantCount}>
            {product.variants.length} biến thể
          </Text>
        )}
        {/* Nút thêm vào giỏ hàng */}
        {onAddToCart && (
          <Button
            mode="contained"
            onPress={onAddToCart}
            style={styles.addToCartButton}
            icon="cart-plus"
          >
            Thêm vào giỏ
          </Button>
        )}
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

  const { isAuthenticated, user } = useAuthStore()

  // Get root navigation for auth navigation
  const rootNavigation = navigation.getParent()

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
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải danh sách sản phẩm. Vui lòng thử lại.'
      setError(errorMessage)
      Alert.alert('Lỗi', errorMessage)
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
    // Navigate to Search tab via parent tab navigator
    const tabNav = navigation.getParent()
    if (tabNav) {
      tabNav.navigate('SearchTab' as never)
    }
  }

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', {
      slug: product.slug,
      productId: product._id,
    } as never)
  }

  // Xử lý thêm vào giỏ hàng
  const cartStore = useCartStore()
  const handleAddToCart = useCallback(async (product: Product) => {
    try {
      const variant = product.variants && product.variants.length > 0 ? product.variants[0] : null

      // Thêm vào giỏ hàng thông qua cart store (works for both authenticated and guest users)
      const result = await cartStore.addItem({
        productId: product._id,
        variantSku: variant ? variant.sku : undefined,
        quantity: 1,
        productData: {
          name: product.name,
          image: product.images2D?.[0],
          price: variant ? variant.price : product.basePrice,
          variantName: variant ? `${variant.size} - ${variant.color}` : undefined,
        }
      })

      if (result.success) {
        Alert.alert(
          'Thành công',
          `${product.name} đã được thêm vào giỏ hàng!`,
          [
            { text: 'Tiếp tục mua', style: 'default' },
            { text: 'Xem giỏ hàng', onPress: () => {
              const tabNav = navigation.getParent()
              if (tabNav) {
                tabNav.navigate('Cart' as never)
              }
            }}
          ]
        )
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể thêm sản phẩm vào giỏ hàng')
      }
    } catch (error) {
      console.error('Failed to add to cart:', error)
      Alert.alert(
        'Lỗi',
        'Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.'
      )
    }
  }, [navigation, cartStore])

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
            onPress={() => {
              const tabNav = navigation.getParent()
              if (tabNav) {
                tabNav.navigate('SearchTab' as never)
              }
            }}
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
        {error ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛍</Text>
            <Text style={styles.emptyTitle}>Có lỗi xảy ra</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <Button
              mode="outlined"
              onPress={() => loadProducts()}
              style={styles.emptyButton}
              icon="refresh"
            >
              Thử lại
            </Button>
          </View>
        ) : loading ? (
          <View style={styles.productsGrid}>
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </View>
        ) : featuredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>Chưa có sản phẩm nổi bật</Text>
            <Text style={styles.emptyText}>
              Các sản phẩm mới sẽ hiển thị ở đây
            </Text>
            <Button
              mode="outlined"
              onPress={() => {
                const tabNav = navigation.getParent()
                if (tabNav) {
                  tabNav.navigate('SearchTab' as never)
                }
              }}
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
                onAddToCart={() => handleAddToCart(product)}
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
        {error ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛍</Text>
            <Text style={styles.emptyTitle}>Có lỗi xảy ra</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <Button
              mode="contained"
              onPress={() => loadProducts()}
              style={styles.emptyButton}
              icon="refresh"
            >
              Thử lại
            </Button>
          </View>
        ) : loading ? (
          <View style={styles.productsGrid}>
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👓</Text>
            <Text style={styles.emptyTitle}>Chưa có sản phẩm nào</Text>
            <Text style={styles.emptyText}>
              Chúng tôi đang cập nhật kho sản phẩm. Hãy quay lại sau!
            </Text>
            <Button
              mode="contained"
              onPress={() => {
                const tabNav = navigation.getParent()
                if (tabNav) {
                  tabNav.navigate('SearchTab' as never)
                }
              }}
              style={styles.emptyButton}
              icon="magnify"
            >
              Tìm sản phẩm
            </Button>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onPress={() => handleProductPress(product)}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Auth Buttons - Đăng nhập / Đăng ký */}
      {!isAuthenticated && (
        <View style={styles.authButtonsContainer}>
          <Button
            mode="outlined"
            onPress={() => {
              rootNavigation?.reset({
                index: 0,
                routes: [{ name: 'Auth' as never }],
              })
            }}
            style={styles.authButton}
            icon="login"
          >
            Đăng nhập
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              rootNavigation?.reset({
                index: 0,
                routes: [{ name: 'Auth' as never }],
              })
            }}
            style={[styles.authButton, { backgroundColor: theme.colors.primary }]}
            icon="account-plus"
          >
            Đăng ký
          </Button>
        </View>
      )}

      {/* User Info - hiển thị khi đã đăng nhập */}
      {isAuthenticated && user && (
        <View style={styles.userInfoContainer}>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>Xin chào, {user.fullName}</Text>
          </View>
          <Button
            mode="outlined"
            onPress={() => {
              //Implement logout logic here
              Alert.alert(
                'Đăng xuất',
                'Bạn có chắc muốn đăng xuất?',
                [
                  { text: 'Hủy', style: 'cancel' },
                  { text: 'Đăng xuất', onPress: () => {
                    // Call logout from auth store
                    // useAuthStore().logout()
                    // For now just show a message since auth store isn't fully accessible
                    Alert.alert('Thông báo', 'Bạn đã đăng xuất')
                  }}
                ]
              )
            }}
            style={styles.logoutButton}
            icon="logout"
          >
            Đăng xuất
          </Button>
        </View>
      )}
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
    backgroundColor: '#eff6ff',
  },
  heroImage: {
    opacity: 0.15,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    lineHeight: 38,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 22,
  },
  heroButton: {
    alignSelf: 'flex-start',
    marginHorizontal: 0,
    borderRadius: 12,
  },
  heroButtonContent: {
    paddingHorizontal: 28,
    paddingVertical: 10,
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
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
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
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
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
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
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
    backgroundColor: '#e0e7ff',
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
    gap: 8,
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
  variantInfo: {
    position: 'absolute',
    top: 36,
    left: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  variantChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  variantText: {
    fontSize: 10,
    color: '#333',
  },
  variantCount: {
    fontSize: 11,
    color: '#757575',
    marginTop: 4,
  },
  addToCartButton: {
    marginTop: 8,
  },
  authButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  authButton: {
    flex: 1,
  },
  userInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#e0e7ff',
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#000000',
  },
  logoutButton: {
    borderColor: '#ef4444',
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
    color: '#000000',
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
