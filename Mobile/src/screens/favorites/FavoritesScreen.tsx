import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  RefreshControl,
} from 'react-native'
import {
  Text,
  Card,
  IconButton,
  Chip,
  Button,
  Avatar,
} from 'react-native-paper'
import { useTheme } from 'react-native-paper'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList, Product } from '../../types'
import { getWishlist, removeFromWishlist } from '../../services/wishlist-api'
import { addToCart } from '../../services/cart-api'
import { Loading, ProductCardSkeleton } from '../../components/Loading'

type Props = NativeStackScreenProps<RootStackParamList, any>

const SCREEN_WIDTH = Dimensions.get('window').width

// Price formatter
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

interface ProductCardProps {
  product: Product
  onPress: () => void
  onRemove: () => void
  onAddToCart: () => void
  isAddingToCart: boolean
}

function ProductCard({ product, onPress, onRemove, onAddToCart, isAddingToCart }: ProductCardProps) {
  const theme = useTheme()

  return (
    <Card style={styles.productCard}>
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
        <IconButton
          icon="heart"
          iconColor={theme.colors.error}
          size={20}
          onPress={onRemove}
          style={styles.favoriteButton}
        />
        {/* 3D Badge */}
        {product.images3D && product.images3D.length > 0 && (
          <Chip
            icon="cube-outline"
            style={styles.threeDChip}
            textStyle={styles.threeDChipText}
          >
            3D
          </Chip>
        )}
      </View>
      <Card.Content style={styles.productContent}>
        {/* Category Badge */}
        {product.category && (
          <Chip
            style={styles.categoryChip}
            textStyle={styles.categoryChipText}
          >
            {product.category}
          </Chip>
        )}

        {/* Product Name */}
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Price */}
        <Text style={styles.productPrice}>{formatPrice(product.basePrice)}</Text>

        {/* Variant Info */}
        {product.variants && product.variants.length > 0 && (
          <Text style={styles.variantInfo}>
            {product.variants.length} variant{product.variants.length > 1 ? 's' : ''} available
          </Text>
        )}

        {/* Add to Cart Button */}
        <Button
          mode="contained"
          onPress={onAddToCart}
          loading={isAddingToCart}
          disabled={!product.isActive || isAddingToCart}
          style={styles.addToCartButton}
          contentStyle={styles.addToCartButtonContent}
        >
          {isAddingToCart ? 'Adding...' : product.isActive ? 'Add to Cart' : 'Unavailable'}
        </Button>
      </Card.Content>
    </Card>
  )
}

export function FavoritesScreen({ navigation }: Props) {
  const theme = useTheme()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [addingToCartIds, setAddingToCartIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getWishlist()
      setProducts(data)
    } catch (error) {
      console.error('Failed to load favorites:', error)
      setError('Không thể tải danh sách yêu thích. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await loadFavorites()
    } finally {
      setRefreshing(false)
    }
  }, [])

  const handleRemove = async (productId: string) => {
    Alert.alert(
      'Xóa sản phẩm',
      'Bạn có chắc chắn muốn xóa sản phẩm này khỏi danh sách yêu thích?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFromWishlist(productId)
              await loadFavorites()
            } catch (error) {
              console.error('Failed to remove from favorites:', error)
              Alert.alert('Lỗi', 'Không thể xóa sản phẩm')
            }
          },
        },
      ]
    )
  }

  const handleAddToCart = async (productId: string) => {
    const product = products.find((p) => p._id === productId)
    if (!product || !product.isActive) {
      Alert.alert('Thông báo', 'Sản phẩm hiện không khả dụng')
      return
    }

    setAddingToCartIds((prev) => new Set(prev).add(productId))
    try {
      await addToCart({
        productId: productId,
        quantity: 1,
      })
      Alert.alert('Thành công', 'Đã thêm sản phẩm vào giỏ hàng')
    } catch (error) {
      console.error('Failed to add to cart:', error)
      Alert.alert('Lỗi', 'Không thể thêm sản phẩm vào giỏ hàng')
    } finally {
      setAddingToCartIds((prev) => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }
  }

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail' as any, {
      slug: product.slug,
      productId: product._id,
    })
  }

  const handleClearAll = async () => {
    Alert.alert(
      'Xóa tất cả',
      'Bạn có chắc chắn muốn xóa tất cả sản phẩm yêu thích?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const product of products) {
                await removeFromWishlist(product._id)
              }
              await loadFavorites()
              Alert.alert('Thành công', 'Đã xóa tất cả sản phẩm yêu thích')
            } catch (error) {
              console.error('Failed to clear favorites:', error)
              Alert.alert('Lỗi', 'Không thể xóa tất cả sản phẩm')
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Favorites</Text>
            <Text style={styles.headerSubtitle}>
              Đang tải danh sách yêu thích...
            </Text>
          </View>
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.productsGrid}>
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </View>
        </ScrollView>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Favorites</Text>
            <Text style={styles.headerSubtitle}>Lỗi xảy ra</Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Có lỗi xảy ra</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Button
            mode="contained"
            onPress={loadFavorites}
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Favorites</Text>
          <Text style={styles.headerSubtitle}>
            {products.length} {products.length === 1 ? 'item' : 'items'} saved
          </Text>
        </View>
        {products.length > 0 && (
          <Button
            mode="outlined"
            textColor={theme.colors.error}
            onPress={handleClearAll}
            style={styles.clearAllButton}
          >
            Clear All
          </Button>
        )}
      </View>

      {/* Products Grid */}
      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Avatar.Text
            size={80}
            label="💔"
            style={styles.emptyAvatar}
            labelStyle={styles.emptyAvatarLabel}
          />
          <Text style={styles.emptyTitle}>Bạn chưa có sản phẩm yêu thích nào</Text>
          <Text style={styles.emptyText}>
            Bắt đầu duyệt và lưu các sản phẩm bạn thích bằng cách nhấn vào icon trái tim
          </Text>
          <View style={styles.emptyButtons}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('HomeTab' as any)}
              style={styles.emptyButton}
            >
              Shop Frames
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.emptyButton}
            >
              Return Home
            </Button>
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          <View style={styles.productsGrid}>
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onPress={() => handleProductPress(product)}
                onRemove={() => handleRemove(product._id)}
                onAddToCart={() => handleAddToCart(product._id)}
                isAddingToCart={addingToCartIds.has(product._id)}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  clearAllButton: {
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
    height: 180,
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
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    margin: 0,
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
  categoryChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    height: 24,
  },
  categoryChipText: {
    fontSize: 10,
    textTransform: 'lowercase',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
  },
  variantInfo: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  addToCartButton: {
    borderRadius: 8,
  },
  addToCartButtonContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyAvatar: {
    backgroundColor: '#e2e8f0',
    marginBottom: 16,
  },
  emptyAvatarLabel: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  emptyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyButton: {
    paddingHorizontal: 24,
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
})
