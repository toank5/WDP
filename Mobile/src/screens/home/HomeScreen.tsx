import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { Button, Text, useTheme } from 'react-native-paper'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../navigation/types'
import type { Product } from '../../types'
import { APP_CONFIG } from '../../config'
import { getAllProducts } from '../../services/product-api'
import { useAuthStore } from '../../store/auth-store'
import { useCartStore } from '../../store/cart-store'
import {
  HeroBanner,
  HomeSectionHeader,
  HomeTopBar,
  ProductCarousel,
  ScreenContainer,
  SearchEntry,
} from '../../components'

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>

const hasAnyTag = (product: Product, tags: string[]) => {
  if (!product.tags?.length) {
    return false
  }

  const lowered = product.tags.map((tag) => tag.toLowerCase())
  return tags.some((tag) => lowered.includes(tag))
}

export function HomeScreen({ navigation }: Props) {
  const theme = useTheme()
  const { isAuthenticated } = useAuthStore()
  const cartCount = useCartStore((state) => state.totalItems || 0)

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllProducts()
      const activeProducts = data.filter((item) => !item.isDeleted && item.isActive)
      setProducts(activeProducts)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load home data.'
      setError(message)
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

  const newArrivals = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  }, [products])

  const bestSellers = useMemo(() => {
    const tagged = products.filter((item) => hasAnyTag(item, ['best', 'bestseller', 'popular', 'hot']))
    if (tagged.length >= 8) {
      return tagged.slice(0, 10)
    }

    const fallback = [...products]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10)

    return Array.from(new Map([...tagged, ...fallback].map((item) => [item._id, item])).values()).slice(0, 10)
  }, [products])

  const recommended = useMemo(() => {
    if (!isAuthenticated) {
      return []
    }

    const prioritized = products.filter((item) => hasAnyTag(item, ['recommended', 'new']))
    const fallback = products.slice(0, 10)
    return Array.from(new Map([...prioritized, ...fallback].map((item) => [item._id, item])).values()).slice(0, 10)
  }, [products, isAuthenticated])

  const goToSearch = useCallback(() => {
    const tabNav = navigation.getParent()
    tabNav?.navigate('SearchTab' as never)
  }, [navigation])

  const goToCart = useCallback(() => {
    const tabNav = navigation.getParent()
    tabNav?.navigate('CartTab' as never)
  }, [navigation])

  const goToOrders = useCallback(() => {
    const tabNav = navigation.getParent()
    tabNav?.navigate('OrdersTab' as never)
  }, [navigation])

  const goToAccount = useCallback(() => {
    const tabNav = navigation.getParent()
    tabNav?.navigate('AccountTab' as never)
  }, [navigation])

  const handleProductPress = useCallback(
    (product: Product) => {
      navigation.navigate('ProductDetail', {
        slug: product.slug,
        productId: product._id,
      } as never)
    },
    [navigation]
  )

  const handleRetry = useCallback(() => {
    loadProducts().catch(() => {
      Alert.alert('Error', 'Unable to reload data.')
    })
  }, [loadProducts])

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <HomeTopBar
          appName={APP_CONFIG.name}
          cartCount={cartCount}
          onSearchPress={goToSearch}
          onCartPress={goToCart}
          onProfilePress={goToAccount}
        />

        <SearchEntry onPress={goToSearch} />

        <HeroBanner navigation={navigation} />

        <View style={styles.section}>
          <View style={styles.quickActionsRow}>
            <Button mode='outlined' compact icon='heart-outline' onPress={() => navigation.navigate('Favorites')}>
              Favorites
            </Button>
            <Button mode='outlined' compact icon='clipboard-list-outline' onPress={goToOrders}>
              Orders
            </Button>
            <Button mode='outlined' compact icon='cart-outline' onPress={goToCart}>
              Cart
            </Button>
          </View>
        </View>

        <View style={styles.section}>
          <HomeSectionHeader title='New arrivals' actionLabel='See all' onActionPress={goToSearch} />
          <ProductCarousel products={newArrivals} loading={loading} onProductPress={handleProductPress} />
        </View>

        <View style={styles.section}>
          <HomeSectionHeader title='Best sellers' actionLabel='See all' onActionPress={goToSearch} />
          <ProductCarousel products={bestSellers} loading={loading} onProductPress={handleProductPress} />
        </View>

        {recommended.length > 0 ? (
          <View style={styles.section}>
            <HomeSectionHeader title='Recommended for you' actionLabel='See all' onActionPress={goToSearch} />
            <ProductCarousel products={recommended} loading={loading} onProductPress={handleProductPress} />
          </View>
        ) : null}

        {!loading && products.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No products available yet</Text>
            <Text style={styles.emptyText}>Start with popular categories or use search to find products.</Text>
            <Button mode='contained' onPress={goToSearch}>Find products</Button>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorState}>
            <Text style={styles.errorTitle}>Unable to load Home</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Button mode='outlined' onPress={handleRetry}>Retry</Button>
          </View>
        ) : null}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyState: {
    marginTop: 22,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#ffffff',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
  errorState: {
    marginTop: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#fef2f2',
    gap: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991b1b',
  },
  errorText: {
    fontSize: 14,
    color: '#7f1d1d',
  },
  bottomSpace: {
    height: 24,
  },
})
