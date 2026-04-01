import React from 'react'
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import {
  Badge,
  IconButton,
  Surface,
  Text,
  TouchableRipple,
  useTheme,
} from 'react-native-paper'
import type { Product } from '../../types'

const CARD_WIDTH = 176

type HomeTopBarProps = {
  appName: string
  cartCount: number
  onSearchPress: () => void
  onCartPress: () => void
  onProfilePress: () => void
}

export const HomeTopBar: React.FC<HomeTopBarProps> = ({
  appName,
  cartCount,
  onSearchPress,
  onCartPress,
  onProfilePress,
}) => {
  const theme = useTheme()

  return (
    <View style={styles.topBar}>
      <View>
        <Text style={styles.appEyebrow}>EyeCare Commerce</Text>
        <Text style={styles.appName}>{appName}</Text>
      </View>

      <View style={styles.topBarActions}>
        <IconButton icon="magnify" size={22} onPress={onSearchPress} />

        <View style={styles.cartIconWrap}>
          <IconButton icon="cart-outline" size={22} onPress={onCartPress} />
          {cartCount > 0 && (
            <Badge style={[styles.cartBadge, { backgroundColor: theme.colors.error }]} size={18}>
              {cartCount > 99 ? '99+' : cartCount}
            </Badge>
          )}
        </View>

        <IconButton icon="account-circle-outline" size={22} onPress={onProfilePress} />
      </View>
    </View>
  )
}

type SearchEntryProps = {
  onPress: () => void
}

export const SearchEntry: React.FC<SearchEntryProps> = ({ onPress }) => {
  const theme = useTheme()

  return (
    <TouchableRipple onPress={onPress} borderless={false} style={styles.searchEntry}>
      <View style={styles.searchEntryInner}>
        <IconButton icon="magnify" size={18} iconColor={theme.colors.onSurfaceDisabled} />
        <Text style={styles.searchEntryText}>Search glasses, lenses, sunglasses...</Text>
      </View>
    </TouchableRipple>
  )
}

type HomeSectionHeaderProps = {
  title: string
  actionLabel?: string
  onActionPress?: () => void
}

export const HomeSectionHeader: React.FC<HomeSectionHeaderProps> = ({
  title,
  actionLabel,
  onActionPress,
}) => {
  const theme = useTheme()

  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onActionPress ? (
        <Pressable onPress={onActionPress} hitSlop={8}>
          <Text style={[styles.sectionAction, { color: theme.colors.primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

type CategoryShortcut = {
  id: string
  label: string
  icon: string
}

type CategoryShortcutRowProps = {
  categories: CategoryShortcut[]
  onPress: (categoryId: string) => void
}

export const CategoryShortcutRow: React.FC<CategoryShortcutRowProps> = ({ categories, onPress }) => {
  const theme = useTheme()

  return (
    <FlatList
      horizontal
      data={categories}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.categoryList}
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onPress(item.id)}
          style={({ pressed }) => [
            styles.categoryChip,
            {
              borderColor: theme.colors.outline,
              backgroundColor: pressed ? theme.colors.primaryContainer : theme.colors.surface,
            },
          ]}
        >
          <IconButton icon={item.icon} size={16} style={styles.categoryIcon} />
          <Text numberOfLines={1} style={styles.categoryLabel}>{item.label}</Text>
        </Pressable>
      )}
    />
  )
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

type HomeProductCardProps = {
  product: Product
  onPress: () => void
}

export const HomeProductCard: React.FC<HomeProductCardProps> = ({ product, onPress }) => {
  const imageUri = product.images2D?.[0]
  const badge = product.tags?.find((tag) => ['sale', 'new', 'hot', 'best'].includes(tag.toLowerCase()))

  return (
    <Pressable onPress={onPress} style={styles.productCardPress}>
      <Surface style={styles.productCard} elevation={1}>
        <View style={styles.productImageWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={styles.productImageFallback}>
              <Text style={styles.productFallbackText}>No image</Text>
            </View>
          )}
          {badge ? <Badge style={styles.productBadge}>{badge.toUpperCase()}</Badge> : null}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
          <Text style={styles.productPrice}>{formatPrice(product.basePrice)}</Text>
        </View>
      </Surface>
    </Pressable>
  )
}

type ProductCarouselProps = {
  products: Product[]
  loading?: boolean
  onProductPress: (product: Product) => void
}

export const ProductCarousel: React.FC<ProductCarouselProps> = ({ products, loading = false, onProductPress }) => {
  if (loading) {
    return (
      <FlatList
        horizontal
        data={[1, 2, 3]}
        keyExtractor={(item) => String(item)}
        contentContainerStyle={styles.carouselList}
        showsHorizontalScrollIndicator={false}
        renderItem={() => (
          <View style={styles.productCardPress}>
            <Surface style={styles.productCard} elevation={1}>
              <View style={styles.skeletonImage} />
              <View style={styles.skeletonInfo}>
                <View style={styles.skeletonLinePrimary} />
                <View style={styles.skeletonLineSecondary} />
              </View>
            </Surface>
          </View>
        )}
      />
    )
  }

  return (
    <FlatList
      horizontal
      data={products}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.carouselList}
      decelerationRate="fast"
      snapToInterval={CARD_WIDTH + 12}
      snapToAlignment="start"
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => (
        <HomeProductCard product={item} onPress={() => onProductPress(item)} />
      )}
    />
  )
}

type TrustItem = {
  id: string
  icon: string
  title: string
  subtitle: string
}

type TrustRowProps = {
  items: TrustItem[]
}

export const TrustRow: React.FC<TrustRowProps> = ({ items }) => {
  const theme = useTheme()

  return (
    <View style={styles.trustRow}>
      {items.map((item) => (
        <View key={item.id} style={styles.trustItem}>
          <View style={[styles.trustIconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
            <IconButton icon={item.icon} size={16} iconColor={theme.colors.primary} style={styles.trustIcon} />
          </View>
          <Text style={styles.trustTitle}>{item.title}</Text>
          <Text style={styles.trustSubtitle}>{item.subtitle}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartIconWrap: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    right: 4,
    top: 2,
  },
  searchEntry: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dbe3ef',
    backgroundColor: '#ffffff',
  },
  searchEntryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingRight: 10,
  },
  searchEntryText: {
    color: '#64748b',
    fontSize: 14,
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '700',
  },
  categoryList: {
    paddingBottom: 4,
    gap: 10,
  },
  categoryChip: {
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  categoryIcon: {
    margin: 0,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginRight: 8,
  },
  productCardPress: {
    marginRight: 12,
  },
  productCard: {
    width: CARD_WIDTH,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  productImageWrap: {
    height: 126,
    backgroundColor: '#eff3f8',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImageFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productFallbackText: {
    fontSize: 12,
    color: '#64748b',
  },
  productBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ef4444',
  },
  productInfo: {
    padding: 10,
    gap: 6,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    minHeight: 34,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  carouselList: {
    paddingBottom: 2,
  },
  skeletonImage: {
    height: 126,
    backgroundColor: '#e5e7eb',
  },
  skeletonInfo: {
    padding: 10,
    gap: 8,
  },
  skeletonLinePrimary: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
    width: '84%',
  },
  skeletonLineSecondary: {
    height: 11,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
    width: '54%',
  },
  trustRow: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
  },
  trustIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginBottom: 6,
  },
  trustIcon: {
    margin: 0,
  },
  trustTitle: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    color: '#0f172a',
  },
  trustSubtitle: {
    fontSize: 10,
    textAlign: 'center',
    color: '#64748b',
    marginTop: 2,
  },
})
