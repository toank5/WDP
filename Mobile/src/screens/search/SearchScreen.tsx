import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
  RefreshControl,
  Pressable,
  Animated,
  Easing,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  Text,
  Card,
  Chip,
  IconButton,
  Surface,
  Searchbar,
  Portal,
  Modal,
  Button,
  Divider,
  ActivityIndicator,
} from 'react-native-paper'
import { useTheme } from 'react-native-paper'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { MainTabParamList, Product, ProductCategory, ProductVariant } from '../../types'
import { getAllProducts } from '../../services/product-api'

const SCREEN_WIDTH = Dimensions.get('window').width
const PRODUCT_PAGE_SIZE = 20
const RECENT_SEARCHES_KEY = '@wdp_recent_searches'
const POPULAR_SEARCHES = ['Blue light lenses', 'Cat-eye frames', 'Round glasses', 'Aviator']

type Props = BottomTabScreenProps<MainTabParamList, 'SearchTab'>

type SortValue = 'recommended' | 'price-asc' | 'price-desc' | 'newest'

interface Filters {
  category: '' | ProductCategory
  minPrice: number
  maxPrice: number
  brands: string[]
  shapes: string[]
  colors: string[]
  sizes: string[]
  inStockOnly: boolean
}

const DEFAULT_FILTERS: Filters = {
  category: '',
  minPrice: 0,
  maxPrice: 50000000,
  brands: [],
  shapes: [],
  colors: [],
  sizes: [],
  inStockOnly: false,
}

const CATEGORIES: Array<{ id: ProductCategory; name: string }> = [
  { id: 'frame', name: 'Frames' },
  { id: 'lens', name: 'Lenses' },
  { id: 'service', name: 'Services' },
]

const COLOR_OPTIONS = [
  { name: 'Black', value: 'black', hex: '#000000' },
  { name: 'White', value: 'white', hex: '#FFFFFF' },
  { name: 'Red', value: 'red', hex: '#EF4444' },
  { name: 'Blue', value: 'blue', hex: '#3B82F6' },
  { name: 'Green', value: 'green', hex: '#10B981' },
  { name: 'Yellow', value: 'yellow', hex: '#F59E0B' },
]

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', '52', '54', '56', '58']
const PRICE_BUCKETS = [
  { label: 'Any', min: 0, max: Number.MAX_SAFE_INTEGER },
  { label: 'Under 1M', min: 0, max: 1000000 },
  { label: '1M - 3M', min: 1000000, max: 3000000 },
  { label: '3M - 8M', min: 3000000, max: 8000000 },
  { label: '8M+', min: 8000000, max: Number.MAX_SAFE_INTEGER },
]

const SORT_OPTIONS: Array<{ value: SortValue; label: string }> = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
]

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

function includesAny(source: string, values: string[]) {
  if (values.length === 0) {
    return true
  }

  const lower = source.toLowerCase()
  return values.some((v) => lower.includes(v.toLowerCase()))
}

function ProductSkeletonCard() {
  return (
    <Surface style={styles.productCard} elevation={0}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonLineLarge} />
      <View style={styles.skeletonLineSmall} />
    </Surface>
  )
}

function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const badge = product.tags?.find((tag: string) => ['sale', 'new', 'hot'].includes(tag.toLowerCase()))
  const brand = product.tags?.[0] || product.category.toUpperCase()

  return (
    <Card style={styles.productCard} onPress={onPress}>
      <View style={styles.productImageWrap}>
        {product.images2D?.[0] ? (
          <Image source={{ uri: product.images2D[0] }} style={styles.productImage} resizeMode="contain" />
        ) : (
          <View style={[styles.productImage, styles.placeholderImage]}>
            <Text style={styles.placeholderIcon}>👓</Text>
          </View>
        )}
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge.toUpperCase()}</Text>
          </View>
        )}
      </View>

      <Card.Content style={styles.productContent}>
        <Text style={styles.brandText} numberOfLines={1}>
          {brand}
        </Text>
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
  const headerAnim = useRef(new Animated.Value(0)).current
  const stickyAnim = useRef(new Animated.Value(0)).current
  const resultsAnim = useRef(new Animated.Value(0)).current
  const suggestionsAnim = useRef(new Animated.Value(0)).current

  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [visibleCount, setVisibleCount] = useState(PRODUCT_PAGE_SIZE)

  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const [sortBy, setSortBy] = useState<SortValue>('recommended')
  const [sortModalVisible, setSortModalVisible] = useState(false)

  const [maxPrice, setMaxPrice] = useState(50000000)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [tempFilters, setTempFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [filterModalVisible, setFilterModalVisible] = useState(false)

  const availableBrands = useMemo(() => {
    const brands = allProducts
      .map((p) => p.tags?.[0]?.trim())
      .filter((v): v is string => !!v)
    return Array.from(new Set(brands)).slice(0, 12)
  }, [allProducts])

  const availableShapes = useMemo(() => {
    const shapes = allProducts
      .map((p) => p.shape?.trim())
      .filter((v): v is string => !!v)
    return Array.from(new Set(shapes))
  }, [allProducts])

  const hasActiveFilters =
    !!filters.category ||
    filters.minPrice > 0 ||
    filters.maxPrice < maxPrice ||
    filters.brands.length > 0 ||
    filters.shapes.length > 0 ||
    filters.colors.length > 0 ||
    filters.sizes.length > 0 ||
    filters.inStockOnly

  const activeFilterCount =
    (filters.category ? 1 : 0) +
    (filters.minPrice > 0 || filters.maxPrice < maxPrice ? 1 : 0) +
    (filters.brands.length > 0 ? 1 : 0) +
    (filters.shapes.length > 0 ? 1 : 0) +
    (filters.colors.length > 0 ? 1 : 0) +
    (filters.sizes.length > 0 ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0)

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  )

  const loadRecentSearches = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY)
      if (raw) {
        setRecentSearches(JSON.parse(raw) as string[])
      }
    } catch (storageError) {
      console.warn('Failed to read recent searches:', storageError)
    }
  }, [])

  const persistRecentSearches = useCallback(async (items: string[]) => {
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items))
    } catch (storageError) {
      console.warn('Failed to save recent searches:', storageError)
    }
  }, [])

  const saveSearchHistory = useCallback(
    async (query: string) => {
      const trimmed = query.trim()
      if (!trimmed) {
        return
      }

      const next = [trimmed, ...recentSearches.filter((q) => q.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6)
      setRecentSearches(next)
      await persistRecentSearches(next)
    },
    [persistRecentSearches, recentSearches]
  )

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await getAllProducts()
      const activeProducts = data.filter((p) => !p.isDeleted && p.isActive)
      setAllProducts(activeProducts)

      if (activeProducts.length > 0) {
        const max = Math.max(...activeProducts.map((p) => p.basePrice))
        const roundedMax = Math.ceil(max / 1000000) * 1000000
        setMaxPrice(roundedMax)
        setFilters((prev) => ({ ...prev, maxPrice: roundedMax }))
        setTempFilters((prev) => ({ ...prev, maxPrice: roundedMax }))
      }
    } catch (loadError) {
      console.error('Failed to load products:', loadError)
      setError('We could not load products. Please check your connection and retry.')
    } finally {
      setLoading(false)
    }
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await loadProducts()
    } finally {
      setRefreshing(false)
    }
  }, [loadProducts])

  useEffect(() => {
    loadProducts()
    loadRecentSearches()
  }, [loadProducts, loadRecentSearches])

  useEffect(() => {
    setSearching(true)
    const handle = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setSearching(false)
    }, 220)

    return () => {
      clearTimeout(handle)
    }
  }, [searchQuery])

  useEffect(() => {
    const query = debouncedQuery.trim().toLowerCase()
    let next = [...allProducts]

    if (query) {
      next = next.filter((p) => {
        return (
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags?.some((tag: string) => tag.toLowerCase().includes(query))
        )
      })
    }

    if (filters.category) {
      next = next.filter((p) => p.category === filters.category)
    }

    next = next.filter((p) => p.basePrice >= filters.minPrice && p.basePrice <= filters.maxPrice)

    if (filters.colors.length > 0) {
      next = next.filter((p) => includesAny((p.tags || []).join(' '), filters.colors))
    }

    if (filters.brands.length > 0) {
      next = next.filter((p) => {
        const brand = p.tags?.[0] || ''
        return includesAny(brand, filters.brands)
      })
    }

    if (filters.shapes.length > 0) {
      next = next.filter((p) => {
        const shape = p.shape || ''
        return includesAny(shape, filters.shapes)
      })
    }

    if (filters.sizes.length > 0) {
      next = next.filter((p) => {
        const productSizes = p.variants?.map((v: ProductVariant) => v.size) || []
        return productSizes.some((s: string) => filters.sizes.includes(s))
      })
    }

    if (filters.inStockOnly) {
      next = next.filter((p) => p.isActive)
    }

    switch (sortBy) {
      case 'price-asc':
        next.sort((a, b) => a.basePrice - b.basePrice)
        break
      case 'price-desc':
        next.sort((a, b) => b.basePrice - a.basePrice)
        break
      case 'newest':
        next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      default:
        break
    }

    setFilteredProducts(next)
    setVisibleCount(PRODUCT_PAGE_SIZE)
  }, [allProducts, debouncedQuery, filters, sortBy])

  const handleProductPress = (product: Product) => {
    const rootNav = navigation.getParent() as any
    if (rootNav) {
      rootNav.navigate('ProductDetail', {
        slug: product.slug,
        productId: product._id,
      })
      return
    }

    ;(navigation as any).navigate('ProductDetail', {
      slug: product.slug,
      productId: product._id,
    })
  }

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack()
      return
    }
    navigation.navigate('HomeTab')
  }

  const handleSubmitSearch = async () => {
    await saveSearchHistory(searchQuery)
    setSearchFocused(false)
  }

  const runSearchFromSuggestion = async (value: string) => {
    setSearchQuery(value)
    setDebouncedQuery(value)
    await saveSearchHistory(value)
    setSearchFocused(false)
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
    setTempFilters(cleared)
    setFilters(cleared)
    setFilterModalVisible(false)
  }

  const clearHistory = async () => {
    setRecentSearches([])
    await persistRecentSearches([])
  }

  const suggestionVisible = searchFocused && searchQuery.trim().length < 2

  useEffect(() => {
    const enter = Animated.stagger(70, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(stickyAnim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(resultsAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ])

    enter.start()
  }, [headerAnim, resultsAnim, stickyAnim])

  useEffect(() => {
    Animated.timing(suggestionsAnim, {
      toValue: suggestionVisible ? 1 : 0,
      duration: suggestionVisible ? 200 : 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }, [suggestionVisible, suggestionsAnim])

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: headerAnim,
          transform: [
            {
              translateY: headerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-16, 0],
              }),
            },
          ],
        }}
      >
        <Surface style={styles.searchHeader} elevation={2}>
        <View style={styles.searchRow}>
          <IconButton icon="arrow-left" size={22} onPress={handleBack} style={styles.backButton} />
          <Searchbar
            placeholder="Search frames, lenses, sunglasses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
            onSubmitEditing={handleSubmitSearch}
            inputStyle={styles.searchInput}
            style={styles.searchbar}
            icon="magnify"
            clearIcon="close"
            elevation={0}
          />
        </View>

        <Animated.View
          style={{
            opacity: stickyAnim,
            transform: [
              {
                translateY: stickyAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0],
                }),
              },
            ],
          }}
        >
          <View style={styles.stickyBar}>
          <Button
            mode={hasActiveFilters ? 'contained' : 'outlined'}
            icon="tune-variant"
            onPress={openFilterModal}
            style={styles.actionButton}
          >
            {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
          </Button>

          <Button
            mode="outlined"
            icon="sort"
            onPress={() => setSortModalVisible(true)}
            style={styles.actionButton}
          >
            Sort
          </Button>

          {searching ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
          </View>
        </Animated.View>
      </Surface>
      </Animated.View>

      {suggestionVisible ? (
        <Animated.View
          style={{
            opacity: suggestionsAnim,
            transform: [
              {
                translateY: suggestionsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-8, 0],
                }),
              },
            ],
          }}
        >
          <Surface style={styles.suggestionsPanel} elevation={2}>
          <View style={styles.suggestionHeaderRow}>
            <Text style={styles.suggestionTitle}>Recent searches</Text>
            {recentSearches.length > 0 ? (
              <Button compact mode="text" onPress={clearHistory}>
                Clear
              </Button>
            ) : null}
          </View>

          {recentSearches.length > 0 ? (
            <View style={styles.suggestionList}>
              {recentSearches.map((item) => (
                <Chip key={item} style={styles.suggestionChip} onPress={() => runSearchFromSuggestion(item)}>
                  {item}
                </Chip>
              ))}
            </View>
          ) : (
            <Text style={styles.suggestionEmpty}>No recent searches yet.</Text>
          )}

          <Text style={styles.suggestionTitle}>Popular</Text>
          <View style={styles.suggestionList}>
            {POPULAR_SEARCHES.map((item) => (
              <Chip key={item} style={styles.suggestionChip} onPress={() => runSearchFromSuggestion(item)}>
                {item}
              </Chip>
            ))}
          </View>
          </Surface>
        </Animated.View>
      ) : null}

      <Animated.View
        style={{
          flex: 1,
          opacity: resultsAnim,
          transform: [
            {
              translateY: resultsAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
        }}
      >
      <FlatList
        data={
          loading
            ? Array.from({ length: 8 }, (_, index) => ({ _id: `skeleton-${index}`, _skeleton: true }))
            : visibleProducts
        }
        keyExtractor={(item: Product | { _id: string }) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        renderItem={({ item }) => {
          if ((item as { _skeleton?: boolean })._skeleton) {
            return <ProductSkeletonCard />
          }

          return <ProductCard product={item as Product} onPress={() => handleProductPress(item as Product)} />
        }}
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          if (visibleCount < filteredProducts.length) {
            setVisibleCount((prev) => prev + PRODUCT_PAGE_SIZE)
          }
        }}
        ListHeaderComponent={
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>{filteredProducts.length} results</Text>
            <Text style={styles.resultsHint}>Tap filters to refine by category, price and more.</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? null : error ? (
            <View style={styles.centerState}>
              <Text style={styles.stateTitle}>Unable to load products</Text>
              <Text style={styles.stateText}>{error}</Text>
              <Button mode="contained" onPress={loadProducts} icon="refresh" style={styles.stateButton}>
                Retry
              </Button>
            </View>
          ) : (
            <View style={styles.centerState}>
              <Text style={styles.stateTitle}>No matches for "{debouncedQuery || 'your query'}"</Text>
              <Text style={styles.stateText}>Try fewer keywords or remove some filters.</Text>
              {hasActiveFilters ? (
                <Button mode="outlined" onPress={clearFilters} style={styles.stateButton}>
                  Clear all filters
                </Button>
              ) : null}
            </View>
          )
        }
        ListFooterComponent={
          !loading && visibleCount < filteredProducts.length ? (
            <Button mode="text" onPress={() => setVisibleCount((prev) => prev + PRODUCT_PAGE_SIZE)}>
              Load more products
            </Button>
          ) : (
            <View style={styles.footerSpacing} />
          )
        }
      />
      </Animated.View>

      <Portal>
        <Modal
          visible={filterModalVisible}
          onDismiss={() => setFilterModalVisible(false)}
          contentContainerStyle={styles.bottomSheet}
        >
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filters</Text>
            <IconButton icon="close" onPress={() => setFilterModalVisible(false)} />
          </View>

          <FlatList
            data={[{ id: 'content' }]}
            keyExtractor={(item) => item.id}
            renderItem={() => (
              <View>
                <View style={styles.sheetSection}>
                  <Text style={styles.sectionLabel}>Category</Text>
                  <View style={styles.wrapRow}>
                    <Chip
                      selected={tempFilters.category === ''}
                      onPress={() => setTempFilters((prev) => ({ ...prev, category: '' }))}
                    >
                      All
                    </Chip>
                    {CATEGORIES.map((cat) => (
                      <Chip
                        key={cat.id}
                        selected={tempFilters.category === cat.id}
                        onPress={() => setTempFilters((prev) => ({ ...prev, category: cat.id }))}
                      >
                        {cat.name}
                      </Chip>
                    ))}
                  </View>
                </View>

                <View style={styles.sheetSection}>
                  <Text style={styles.sectionLabel}>Price range</Text>
                  <View style={styles.wrapRow}>
                    {PRICE_BUCKETS.map((bucket) => {
                      const selected =
                        tempFilters.minPrice === bucket.min &&
                        (bucket.max === Number.MAX_SAFE_INTEGER
                          ? tempFilters.maxPrice >= maxPrice
                          : tempFilters.maxPrice === bucket.max)

                      return (
                        <Chip
                          key={bucket.label}
                          selected={selected}
                          onPress={() =>
                            setTempFilters((prev) => ({
                              ...prev,
                              minPrice: bucket.min,
                              maxPrice: bucket.max === Number.MAX_SAFE_INTEGER ? maxPrice : bucket.max,
                            }))
                          }
                        >
                          {bucket.label}
                        </Chip>
                      )
                    })}
                  </View>
                </View>

                <View style={styles.sheetSection}>
                  <Text style={styles.sectionLabel}>Color</Text>
                  <View style={styles.colorRow}>
                    {COLOR_OPTIONS.map((color) => {
                      const selected = tempFilters.colors.includes(color.value)
                      return (
                        <Pressable
                          key={color.value}
                          style={[
                            styles.colorDot,
                            {
                              backgroundColor: color.hex,
                              borderColor: selected ? '#2563eb' : '#cbd5e1',
                            },
                          ]}
                          onPress={() =>
                            setTempFilters((prev) => ({
                              ...prev,
                              colors: selected
                                ? prev.colors.filter((c) => c !== color.value)
                                : [...prev.colors, color.value],
                            }))
                          }
                        >
                          {selected ? <View style={styles.colorDotInner} /> : null}
                        </Pressable>
                      )
                    })}
                  </View>
                </View>

                <View style={styles.sheetSection}>
                  <Text style={styles.sectionLabel}>Brand</Text>
                  <View style={styles.wrapRow}>
                    {availableBrands.length === 0 ? (
                      <Text style={styles.helperText}>No brand data available yet.</Text>
                    ) : (
                      availableBrands.map((brand) => {
                        const selected = tempFilters.brands.includes(brand)
                        return (
                          <Chip
                            key={brand}
                            selected={selected}
                            onPress={() =>
                              setTempFilters((prev) => ({
                                ...prev,
                                brands: selected
                                  ? prev.brands.filter((b) => b !== brand)
                                  : [...prev.brands, brand],
                              }))
                            }
                          >
                            {brand}
                          </Chip>
                        )
                      })
                    )}
                  </View>
                </View>

                <View style={styles.sheetSection}>
                  <Text style={styles.sectionLabel}>Frame shape</Text>
                  <View style={styles.wrapRow}>
                    {availableShapes.length === 0 ? (
                      <Text style={styles.helperText}>No shape data available yet.</Text>
                    ) : (
                      availableShapes.map((shape) => {
                        const selected = tempFilters.shapes.includes(shape)
                        return (
                          <Chip
                            key={shape}
                            selected={selected}
                            onPress={() =>
                              setTempFilters((prev) => ({
                                ...prev,
                                shapes: selected
                                  ? prev.shapes.filter((s) => s !== shape)
                                  : [...prev.shapes, shape],
                              }))
                            }
                          >
                            {shape}
                          </Chip>
                        )
                      })
                    )}
                  </View>
                </View>

                <View style={styles.sheetSection}>
                  <Text style={styles.sectionLabel}>Size</Text>
                  <View style={styles.wrapRow}>
                    {SIZE_OPTIONS.map((size) => {
                      const selected = tempFilters.sizes.includes(size)
                      return (
                        <Chip
                          key={size}
                          selected={selected}
                          onPress={() =>
                            setTempFilters((prev) => ({
                              ...prev,
                              sizes: selected ? prev.sizes.filter((s) => s !== size) : [...prev.sizes, size],
                            }))
                          }
                        >
                          {size}
                        </Chip>
                      )
                    })}
                  </View>
                </View>

                <View style={styles.sheetSection}>
                  <Button
                    mode={tempFilters.inStockOnly ? 'contained-tonal' : 'outlined'}
                    icon={tempFilters.inStockOnly ? 'check-circle' : 'checkbox-blank-circle-outline'}
                    onPress={() => setTempFilters((prev) => ({ ...prev, inStockOnly: !prev.inStockOnly }))}
                  >
                    In stock only
                  </Button>
                </View>
              </View>
            )}
          />

          <Divider />
          <View style={styles.sheetActions}>
            <Button mode="text" onPress={clearFilters} style={styles.sheetActionButton}>
              Clear all
            </Button>
            <Button mode="contained" onPress={applyFilters} style={styles.sheetActionButton}>
              Apply
            </Button>
          </View>
        </Modal>

        <Modal
          visible={sortModalVisible}
          onDismiss={() => setSortModalVisible(false)}
          contentContainerStyle={styles.sortSheet}
        >
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Sort by</Text>
            <IconButton icon="close" onPress={() => setSortModalVisible(false)} />
          </View>

          {SORT_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={styles.sortOption}
              onPress={() => {
                setSortBy(option.value)
                setSortModalVisible(false)
              }}
            >
              <Text style={styles.sortOptionText}>{option.label}</Text>
              <IconButton
                icon={sortBy === option.value ? 'radiobox-marked' : 'radiobox-blank'}
                size={20}
                iconColor={sortBy === option.value ? theme.colors.primary : '#64748b'}
              />
            </Pressable>
          ))}
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
  searchHeader: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    zIndex: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 6,
  },
  backButton: {
    margin: 0,
  },
  searchbar: {
    flex: 1,
    backgroundColor: '#f8fafc',
    elevation: 0,
  },
  searchInput: {
    minHeight: 40,
  },
  stickyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  actionButton: {
    borderRadius: 10,
  },
  suggestionsPanel: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  suggestionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 8,
    marginBottom: 8,
  },
  suggestionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  suggestionChip: {
    backgroundColor: '#eff6ff',
  },
  suggestionEmpty: {
    color: '#64748b',
    marginBottom: 8,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  resultsCount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  resultsHint: {
    marginTop: 2,
    fontSize: 13,
    color: '#64748b',
  },
  listContent: {
    paddingBottom: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  productCard: {
    width: SCREEN_WIDTH / 2 - 18,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  productImageWrap: {
    height: 132,
    backgroundColor: '#f1f5f9',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 42,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  productContent: {
    paddingTop: 10,
    paddingBottom: 12,
  },
  brandText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: '#0f172a',
  },
  productPrice: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  skeletonImage: {
    height: 132,
    backgroundColor: '#e2e8f0',
  },
  skeletonLineLarge: {
    height: 14,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 7,
    backgroundColor: '#e2e8f0',
  },
  skeletonLineSmall: {
    height: 14,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 14,
    borderRadius: 7,
    width: '55%',
    backgroundColor: '#e2e8f0',
  },
  centerState: {
    paddingHorizontal: 28,
    paddingVertical: 64,
    alignItems: 'center',
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  stateText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 21,
  },
  stateButton: {
    marginTop: 18,
    borderRadius: 10,
  },
  footerSpacing: {
    height: 16,
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    marginTop: '22%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    flex: 1,
  },
  sortSheet: {
    backgroundColor: '#ffffff',
    marginTop: '50%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  sheetSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  helperText: {
    fontSize: 13,
    color: '#64748b',
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sheetActionButton: {
    flex: 1,
    borderRadius: 10,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sortOptionText: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
  },
})
