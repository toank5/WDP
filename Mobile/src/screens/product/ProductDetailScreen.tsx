import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  TouchableOpacity,
} from 'react-native'
import {
  Text,
  Card,
  IconButton,
  Button,
  Chip,
  Divider,
  ActivityIndicator,
  SegmentedButtons,
} from 'react-native-paper'
import { useTheme } from 'react-native-paper'
import { useRoute, useNavigation } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../navigation/types'
import type { Product, ProductVariant } from '../../types'
import { getProductById } from '../../services/product-api'
import { addToCart } from '../../services/cart-api'
import { Loading } from '../../components/Loading'

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>

const SCREEN_WIDTH = Dimensions.get('window').width

// Price formatter
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

// Category display names - Synced with FE (Frames, Lenses, Services)
const CATEGORY_NAMES: Record<string, string> = {
  frame: 'Frames',
  lens: 'Lenses',
  service: 'Services',
}

// Reassurance points
const REASSURANCE_POINTS = [
  { icon: '🚚', text: 'Miễn phí giao hàng' },
  { icon: '🔄', text: 'Đổi trả 30 ngày' },
  { icon: '✅', text: 'Bảo hành 12 tháng' },
  { icon: '🛡️', text: 'Cam kết chính hãng' },
  { icon: '💎', text: 'Dịch vụ hậu mãi' },
]

interface ImageGalleryProps {
  images2D: string[]
  images3D: string[]
  productName: string
}

function ImageGallery({ images2D, images3D, productName }: ImageGalleryProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const allImages = [...images2D, ...images3D]
  const hasMultiple = allImages.length > 1

  const goToPrevious = () => {
    if (!hasMultiple) return
    setActiveImageIndex((prev) =>
      prev === 0 ? allImages.length - 1 : prev - 1
    )
  }

  const goToNext = () => {
    if (!hasMultiple) return
    setActiveImageIndex((prev) =>
      prev === allImages.length - 1 ? 0 : prev + 1
    )
  }

  return (
    <View style={styles.imageGallery}>
      {/* Main Image */}
      <View style={styles.mainImageContainer}>
        {allImages[activeImageIndex] ? (
          <Image
            source={{ uri: allImages[activeImageIndex] }}
            style={styles.mainImage}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.mainImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>👓</Text>
          </View>
        )}

        {/* Navigation Buttons */}
        {hasMultiple && (
          <>
            <IconButton
              icon="chevron-left"
              size={32}
              onPress={goToPrevious}
              style={styles.navButtonLeft}
            />
            <IconButton
              icon="chevron-right"
              size={32}
              onPress={goToNext}
              style={styles.navButtonRight}
            />
          </>
        )}

        {/* Image Counter */}
        {hasMultiple && (
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {activeImageIndex + 1} / {allImages.length}
            </Text>
          </View>
        )}
      </View>

      {/* Thumbnail Row */}
      {allImages.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.thumbnailScroll}
          contentContainerStyle={styles.thumbnailContent}
        >
          {allImages.map((url, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setActiveImageIndex(index)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.thumbnail,
                  index === activeImageIndex && styles.activeThumbnail,
                ]}
              >
                <Image
                  source={{ uri: url }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

interface VariantSelectorProps {
  variants?: ProductVariant[]
  selectedVariant?: ProductVariant
  onSelectVariant: (variant: ProductVariant | undefined) => void
}

function VariantSelector({
  variants,
  selectedVariant,
  onSelectVariant,
}: VariantSelectorProps) {
  if (!variants || variants.length === 0) return null

  // Group variants by color
  const colors = [...new Set(variants.map((v) => v.color))]

  return (
    <View style={styles.variantSection}>
      <Text style={styles.variantLabel}>Màu sắc</Text>
      <View style={styles.colorOptions}>
        {colors.map((color) => (
          <Chip
            key={color}
            selected={selectedVariant?.color === color}
            onPress={() => {
              const variant = variants.find((v) => v.color === color)
              onSelectVariant(variant)
            }}
            style={styles.colorChip}
          >
            {color}
          </Chip>
        ))}
      </View>

      {selectedVariant?.color && (
        <>
          <Text style={styles.variantLabel}>Kích thước</Text>
          <View style={styles.sizeOptions}>
            {variants
              .filter((v) => v.color === selectedVariant.color)
              .map((variant) => (
                <Chip
                  key={variant.sku}
                  selected={selectedVariant?.sku === variant.sku}
                  onPress={() => onSelectVariant(variant)}
                  style={styles.sizeChip}
                >
                  {variant.size}
                </Chip>
              ))}
          </View>
        </>
      )}
    </View>
  )
}

interface SpecItemProps {
  label: string
  value: string
  icon: string
}

function SpecItem({ label, value, icon }: SpecItemProps) {
  return (
    <View style={styles.specItem}>
      <Text style={styles.specIcon}>{icon}</Text>
      <View style={styles.specContent}>
        <Text style={styles.specLabel}>{label}</Text>
        <Text style={styles.specValue}>{value}</Text>
      </View>
    </View>
  )
}

export function ProductDetailScreen() {
  const theme = useTheme()
  const route = useRoute()
  const navigation = useNavigation<Props['navigation']>()
  const { productId } = route.params as { productId: string; slug?: string }

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    undefined
  )
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    loadProduct()
  }, [productId])

  const loadProduct = async () => {
    try {
      setLoading(true)
      const data = await getProductById(productId)
      setProduct(data)
      // Select first variant by default
      if (data.variants && data.variants.length > 0) {
        setSelectedVariant(data.variants[0])
      }
    } catch (error: any) {
      console.error('Failed to load product:', error)
      Alert.alert('Lỗi', 'Không thể tải thông tin sản phẩm')
      navigation.goBack()
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product) return

    // For frame products with variants, require variant selection
    if (product.category === 'frame' && !selectedVariant && product.variants?.length) {
      Alert.alert('Thông báo', 'Vui lòng chọn màu sắc và kích thước')
      return
    }

    setAddingToCart(true)
    try {
      await addToCart({
        productId: product._id,
        variantSku: selectedVariant?.sku,
        quantity,
      })
      Alert.alert('Thành công', 'Đã thêm sản phẩm vào giỏ hàng')
      navigation.navigate('Cart')
    } catch (error: any) {
      console.error('Failed to add to cart:', error)
      Alert.alert('Lỗi', 'Không thể thêm sản phẩm vào giỏ hàng')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    await handleAddToCart()
    // Navigate to checkout after adding to cart
    navigation.navigate('Checkout')
  }

  const getDisplayPrice = () => {
    if (selectedVariant?.price) return selectedVariant.price
    return product?.basePrice || 0
  }

  const isInStock = () => {
    if (selectedVariant) return selectedVariant.isActive !== false
    return product?.isActive !== false
  }

  if (loading) {
    return <Loading />
  }

  if (!product) return null

  const price = getDisplayPrice()
  const stockStatus = isInStock() ? 'Còn hàng' : 'Hết hàng'
  const stockColor = isInStock() ? '#10b981' : '#ef4444'

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <ImageGallery
          images2D={product.images2D || []}
          images3D={product.images3D || []}
          productName={product.name}
        />

        {/* Product Info */}
        <View style={styles.productInfo}>
          {/* Category Badge */}
          <Chip
            style={styles.categoryBadge}
            textStyle={styles.categoryBadgeText}
          >
            {CATEGORY_NAMES[product.category] || product.category}
          </Chip>

          {/* Product Name */}
          <Text style={styles.productName}>{product.name}</Text>

          {/* Price and Stock */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(price)}</Text>
            <Chip
              textStyle={[styles.stockStatusText, { color: stockColor }]}
              style={styles.stockStatus}
            >
              {stockStatus}
            </Chip>
          </View>

          {/* Description */}
          <Divider style={styles.divider} />
          <Text style={styles.sectionTitle}>Mô tả</Text>
          <Text style={styles.description}>{product.description}</Text>

          {/* Variant Selector */}
          <VariantSelector
            variants={product.variants}
            selectedVariant={selectedVariant}
            onSelectVariant={setSelectedVariant}
          />

          {/* Specifications */}
          <Divider style={styles.divider} />
          <Text style={styles.sectionTitle}>Thông số kỹ thuật</Text>

          <View style={styles.specsContainer}>
            {product.category === 'frame' && (
              <>
                {product.frameType && (
                  <SpecItem
                    label="Loại gọng"
                    value={product.frameType}
                    icon="👓"
                  />
                )}
                {product.shape && (
                  <SpecItem label="Dáng kính" value={product.shape} icon="🔷" />
                )}
                {product.material && (
                  <SpecItem label="Chất liệu" value={product.material} icon="✨" />
                )}
                {product.gender && (
                  <SpecItem label="Giới tính" value={product.gender} icon="👤" />
                )}
              </>
            )}

            {product.category === 'lens' && (
              <>
                {product.lensType && (
                  <SpecItem
                    label="Loại lens"
                    value={product.lensType}
                    icon="👁️"
                  />
                )}
                {product.index && (
                  <SpecItem label="Chiết suất" value={product.index.toString()} icon="🔍" />
                )}
                {product.coatings && product.coatings.length > 0 && (
                  <SpecItem
                    label="Lớp phủ"
                    value={product.coatings.join(', ')}
                    icon="🛡️"
                  />
                )}
              </>
            )}

            {product.category === 'service' && (
              <>
                {product.serviceType && (
                  <SpecItem
                    label="Loại dịch vụ"
                    value={product.serviceType}
                    icon="🔧"
                  />
                )}
                {product.durationMinutes && (
                  <SpecItem
                    label="Thời gian"
                    value={`${product.durationMinutes} phút`}
                    icon="⏱️"
                  />
                )}
              </>
            )}
          </View>

          {/* Reassurance Points */}
          <Divider style={styles.divider} />
          <Text style={styles.sectionTitle}>Chính sách bảo hành</Text>
          <View style={styles.reassuranceContainer}>
            {REASSURANCE_POINTS.map((point, index) => (
              <View key={index} style={styles.reassuranceItem}>
                <Text style={styles.reassuranceIcon}>{point.icon}</Text>
                <Text style={styles.reassuranceText}>{point.text}</Text>
              </View>
            ))}
          </View>

          {/* Additional Info */}
          <Divider style={styles.divider} />
          <Text style={styles.sectionTitle}>Thông tin thêm</Text>
          <View style={styles.additionalInfoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>SKU:</Text>
              <Text style={styles.infoValue}>{product._id || 'N/A'}</Text>
            </View>
            {product.createdAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ngày thêm:</Text>
                <Text style={styles.infoValue}>
                  {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            )}
            {product.tags && product.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                <Text style={styles.tagsLabel}>Tags:</Text>
                <View style={styles.tagsRow}>
                  {product.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      mode="outlined"
                      compact
                      style={styles.tagChip}
                      textStyle={styles.tagChipText}
                    >
                      {tag}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Footer with Actions */}
      <View style={styles.footer}>
        {/* Quantity Selector */}
        <View style={styles.quantityContainer}>
          <IconButton
            icon="minus"
            size={20}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
          />
          <Text style={styles.quantityText}>{quantity}</Text>
          <IconButton
            icon="plus"
            size={20}
            onPress={() => setQuantity((q) => q + 1)}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={handleAddToCart}
            disabled={addingToCart || !isInStock()}
            style={styles.addToCartButton}
            contentStyle={styles.buttonContent}
            loading={addingToCart}
          >
            Thêm vào giỏ
          </Button>
          <Button
            mode="contained"
            onPress={handleBuyNow}
            disabled={addingToCart || !isInStock()}
            style={styles.buyNowButton}
            contentStyle={styles.buttonContent}
          >
            Mua ngay
          </Button>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d1fae5',
  },
  scrollView: {
    flex: 1,
  },
  imageGallery: {
    backgroundColor: '#a7f3d0',
  },
  mainImageContainer: {
    position: 'relative',
    width: SCREEN_WIDTH,
    aspectRatio: 1,
    backgroundColor: '#ecfdf5',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 80,
  },
  navButtonLeft: {
    position: 'absolute',
    left: 8,
    top: '50%',
    marginTop: -20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  navButtonRight: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  thumbnailScroll: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  thumbnailContent: {
    gap: 8,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  activeThumbnail: {
    borderColor: '#3b82f6',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    padding: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    backgroundColor: '#d1fae5',
  },
  categoryBadgeText: {
    color: '#4338ca',
    fontSize: 12,
    fontWeight: '600',
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  stockStatus: {
    backgroundColor: 'transparent',
  },
  stockStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 22,
    marginBottom: 16,
  },
  variantSection: {
    marginBottom: 16,
  },
  variantLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorChip: {
    height: 36,
  },
  sizeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  sizeChip: {
    height: 36,
  },
  specsContainer: {
    gap: 12,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
  },
  specIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  specContent: {
    flex: 1,
  },
  specLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  reassuranceContainer: {
    gap: 12,
  },
  reassuranceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#a7f3d0',
    borderRadius: 12,
  },
  reassuranceIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  reassuranceText: {
    fontSize: 14,
    color: '#4c1d95',
    flex: 1,
    fontWeight: '500',
  },
  footer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    borderRadius: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    minWidth: 40,
    textAlign: 'center',
    color: '#000000',
  },
  actionButtons: {
    flex: 1,
    gap: 8,
  },
  addToCartButton: {
    borderRadius: 8,
  },
  buyNowButton: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 10,
  },
  additionalInfoContainer: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  tagsContainer: {
    marginTop: 12,
  },
  tagsLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    height: 28,
    backgroundColor: '#d1fae5',
  },
  tagChipText: {
    fontSize: 12,
    color: '#4338ca',
  },
})
