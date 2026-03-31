import React, { useState, useCallback } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native'
import {
  Text,
  Button,
  Chip,
  IconButton,
  Divider,
  Surface,
  useTheme,
} from 'react-native-paper'
import { useRoute, useNavigation } from '@react-navigation/native'
import { useCartStore } from '../../store/cart-store'
import { APP_CONFIG } from '../../config'
import type { Product } from '../../types/product'
import { VariantSelector } from '../../components/product/VariantSelector'
import { ImageGallery } from '../../components/product/ImageGallery'

interface RouteParams {
  productId: string
}

const SCREEN_WIDTH = Dimensions.get('window').width

/**
 * ProductDetailScreen - Display product information, images, variants
 *
 * Features:
 * - Product images gallery (swipeable)
 * - Product info (name, price, description)
 * - Variant selection (color, size)
 * - Add to cart functionality
 * - Favorite toggle
 */
export const ProductDetailScreen = () => {
  const theme = useTheme()
  const route = useRoute()
  const navigation = useNavigation()
  const { productId } = route.params as RouteParams

  const { addToCart, isInCart } = useCartStore()

  // State
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [quantity, setQuantity] = useState(1)

  // Mock product data (replace with API call)
  React.useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockProduct: Product = {
        id: productId,
        name: 'Kính Gọng Titanium Cao Cấp',
        slug: 'kinh-gong-titanium-cao-cap',
        description: 'Kính gọng titan siêu nhẹ, bền bỉ, thiết kế hiện đại phù hợp với mọi khuôn mặt.',
        category: 'frame',
        type: 'in-stock',
        basePrice: 1250000,
        discountPrice: 980000,
        rating: 4.5,
        reviewCount: 128,
        isActive: true,
        shape: 'cat-eye',
        material: 'titanium',
        gender: 'unisex',
        images: [
          {
            id: '1',
            url: 'https://via.placeholder.com/400x400?text=Front+View',
            isPrimary: true,
          },
          {
            id: '2',
            url: 'https://via.placeholder.com/400x400?text=Side+View',
            is3D: true,
          },
          {
            id: '3',
            url: 'https://via.placeholder.com/400x400?text=Detail+View',
          },
        ],
        variants: [
          { id: 'v1', sku: 'KT-001-BLK-M', color: 'Đen', size: 'M', price: 980000, stock: 15, isAvailable: true },
          { id: 'v2', sku: 'KT-001-BRN-M', color: 'Nâu', size: 'M', price: 980000, stock: 8, isAvailable: true },
          { id: 'v3', sku: 'KT-001-GRY-M', color: 'Xám', size: 'M', price: 980000, stock: 12, isAvailable: true },
          { id: 'v4', sku: 'KT-001-BLK-L', color: 'Đen', size: 'L', price: 980000, stock: 10, isAvailable: true },
        ],
        tags: ['Hot', 'Mới', 'Titanium'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      setProduct(mockProduct)
      setSelectedVariant(mockProduct.variants[0])
      setLoading(false)
    }, 500)
  }, [productId])

  // Handle image press (for full screen view)
  const handleImagePress = useCallback((index: number) => {
    // TODO: Open full screen image viewer
    console.log('Image pressed:', index)
  }, [])

  // Handle variant selection
  const handleVariantChange = useCallback((variant: any) => {
    if (!variant.isAvailable) return
    setSelectedVariant(variant)
  }, [])

  // Handle add to cart
  const handleAddToCart = useCallback(() => {
    if (!product || !selectedVariant) return

    addToCart({
      productId: product.id,
      productVariantId: selectedVariant.id,
      quantity,
    })

    // Show feedback
    navigation.goBack()
  }, [product, selectedVariant, quantity, addToCart, navigation])

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(() => {
    setIsFavorite((prev) => !prev)
    // TODO: Call API to add/remove from wishlist
  }, [])

  // Get current price
  const getCurrentPrice = useCallback(() => {
    if (!product) return 0
    return selectedVariant ? selectedVariant.price : (product.discountPrice || product.basePrice)
  }, [product, selectedVariant])

  // Format price
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: APP_CONFIG.currency,
    }).format(price)
  }, [])

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  // Product not found
  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="titleLarge" style={styles.errorText}>
          Không tìm thấy sản phẩm
        </Text>
      </View>
    )
  }

  const currentPrice = getCurrentPrice()
  const hasDiscount = product.discountPrice !== undefined
  const discountPercent = hasDiscount
    ? Math.round(((product.basePrice - product.discountPrice) / product.basePrice) * 100)
    : 0

  return (
    <View style={styles.container}>
      {/* Header Actions */}
      <View style={styles.headerActions}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        />
        <IconButton
          icon={isFavorite ? 'heart' : 'heart-outline'}
          size={24}
          onPress={handleFavoriteToggle}
          iconColor={isFavorite ? theme.colors.error : undefined}
          style={styles.headerButton}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <ImageGallery
          images={product.images}
          onImagePress={handleImagePress}
          show3DBadge={true}
          autoPlay={false}
        />

        {/* Product Info */}
        <Surface style={styles.productInfo} elevation={2}>
          <View style={styles.titleRow}>
            <Text variant="headlineSmall" style={styles.productName}>
              {product.name}
            </Text>
            <View style={styles.ratingContainer}>
              <IconButton icon="star" size={16} iconColor={theme.colors.warning} />
              <Text variant="bodyMedium" style={styles.rating}>
                {product.rating}
              </Text>
              <Text variant="bodySmall" style={styles.reviewCount}>
                ({product.reviewCount})
              </Text>
            </View>
          </View>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            {product.tags.map((tag) => (
              <Chip key={tag} mode="flat" compact style={styles.tag}>
                {tag}
              </Chip>
            ))}
          </View>

          <Divider style={styles.divider} />

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text variant="headlineMedium" style={styles.currentPrice}>
              {formatPrice(currentPrice)}
            </Text>
            {hasDiscount && (
              <>
                <Text variant="titleMedium" style={styles.originalPrice}>
                  {formatPrice(product.basePrice)}
                </Text>
                <Chip mode="flat" compact style={styles.discountChip}>
                  -{discountPercent}%
                </Chip>
              </>
            )}
          </View>

          {/* Type Badge */}
          <View style={styles.typeContainer}>
            <Chip
              mode="flat"
              icon={product.type === 'in-stock' ? 'check-circle' : 'clock-outline'}
              style={styles.typeChip}
            >
              {product.type === 'in-stock'
                ? 'Có sẵn'
                : product.type === 'pre-order'
                  ? 'Đặt trước'
                  : 'Đặt theo đơn'}
            </Chip>
          </View>

          <Divider style={styles.divider} />

          {/* Description */}
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Mô tả
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            {product.description}
          </Text>

          {/* Frame Details */}
          {product.category === 'frame' && (
            <>
              <Divider style={styles.divider} />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Thông số
              </Text>
              <View style={styles.specRow}>
                <Text variant="bodyMedium" style={styles.specLabel}>
                  Kiểu dáng:
                </Text>
                <Text variant="bodyMedium">{product.shape}</Text>
              </View>
              <View style={styles.specRow}>
                <Text variant="bodyMedium" style={styles.specLabel}>
                  Chất liệu:
                </Text>
                <Text variant="bodyMedium">{product.material}</Text>
              </View>
              <View style={styles.specRow}>
                <Text variant="bodyMedium" style={styles.specLabel}>
                  Giới tính:
                </Text>
                <Text variant="bodyMedium">
                  {product.gender === 'male' ? 'Nam' : product.gender === 'female' ? 'Nữ' : 'Unisex'}
                </Text>
              </View>
            </>
          )}

          {/* Lens Details */}
          {product.category === 'lens' && (
            <>
              <Divider style={styles.divider} />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Thông số tròng
              </Text>
              <View style={styles.specRow}>
                <Text variant="bodyMedium" style={styles.specLabel}>
                  Loại tròng:
                </Text>
                <Text variant="bodyMedium">{product.lensType}</Text>
              </View>
              <View style={styles.specRow}>
                <Text variant="bodyMedium" style={styles.specLabel}>
                  Chỉ số khúc xạ:
                </Text>
                <Text variant="bodyMedium">{product.lensIndex}</Text>
              </View>
              {product.coatings && product.coatings.length > 0 && (
                <View style={styles.specRow}>
                  <Text variant="bodyMedium" style={styles.specLabel}>
                    Lớp phủ:
                  </Text>
                  <View style={styles.coatingsContainer}>
                    {product.coatings.map((coating) => (
                      <Chip key={coating} mode="flat" compact style={styles.coatingChip}>
                        {coating}
                      </Chip>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          <Divider style={styles.divider} />

          {/* Variant Selection */}
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Chọn biến thể
          </Text>

          <VariantSelector
            variants={product.variants}
            selectedVariant={selectedVariant}
            onVariantChange={handleVariantChange}
            showStock={true}
          />

          {/* Quantity */}
          <View style={styles.quantityContainer}>
            <Text variant="bodyMedium" style={styles.quantityLabel}>
              Số lượng:
            </Text>
            <View style={styles.quantityControls}>
              <IconButton
                icon="minus"
                size={20}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                mode="contained"
                disabled={quantity <= 1}
              />
              <Text variant="titleMedium" style={styles.quantity}>
                {quantity}
              </Text>
              <IconButton
                icon="plus"
                size={20}
                onPress={() => setQuantity(quantity + 1)}
                mode="contained"
                disabled={!selectedVariant || quantity >= selectedVariant.stock}
              />
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Add to Cart Button */}
          <Button
            mode="contained"
            onPress={handleAddToCart}
            disabled={!selectedVariant || !selectedVariant.isAvailable}
            style={styles.addToCartButton}
            contentStyle={styles.addToCartButtonContent}
          >
            {selectedVariant?.isAvailable ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
          </Button>
        </Surface>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d1fae5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    opacity: 0.5,
  },
  headerActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    zIndex: 10,
  },
  headerButton: {
    backgroundColor: '#fff',
  },
  productInfo: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productName: {
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontWeight: 'bold',
  },
  reviewCount: {
    marginLeft: 4,
    opacity: 0.7,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#e3f2fd',
  },
  divider: {
    marginVertical: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentPrice: {
    color: '#e53935',
    fontWeight: 'bold',
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  discountChip: {
    backgroundColor: '#ffebee',
  },
  typeContainer: {
    marginTop: 8,
  },
  typeChip: {
    backgroundColor: '#e8f5e9',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    lineHeight: 22,
    marginBottom: 8,
  },
  specRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  specLabel: {
    width: 120,
    opacity: 0.7,
  },
  coatingsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  coatingChip: {
    backgroundColor: '#fff3e0',
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  quantityLabel: {
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantity: {
    minWidth: 32,
    textAlign: 'center',
  },
  addToCartButton: {
    marginTop: 16,
  },
  addToCartButtonContent: {
    paddingVertical: 8,
  },
})
