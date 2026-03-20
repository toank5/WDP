import React, { useState, useCallback } from 'react'
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native'
import {
  Text,
  Button,
  Surface,
  useTheme,
  IconButton,
  Chip,
  Searchbar,
  Portal,
  Menu,
  Divider,
} from 'react-native-paper'
import { APP_CONFIG } from '../../config'
import { OrderCardSkeleton } from '../../components/Loading'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export interface OrderItem {
  id: string
  orderNumber: string
  createdAt: string
  status: OrderStatus
  total: number
  itemCount: number
  items: Array<{
    name: string
    quantity: number
    price: number
    image: string
  }>
  shippingAddress?: {
    name: string
    phone: string
    address: string
    city: string
  }
}

interface StatusFilter {
  id: OrderStatus | 'all'
  label: string
}

const STATUS_FILTERS: StatusFilter[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ xử lý' },
  { id: 'confirmed', label: 'Đã xác nhận' },
  { id: 'processing', label: 'Đang xử lý' },
  { id: 'shipped', label: 'Đã gửi' },
  { id: 'delivered', label: 'Đã giao' },
  { id: 'cancelled', label: 'Đã hủy' },
]

/**
 * OrderHistoryScreen - Display list of user orders
 *
 * Features:
 * - List all orders with status
 * - Filter by order status
 * - Search orders by order number
 * - Sort by date
 * - View order details
 * - Pull to refresh
 */
export const OrderHistoryScreen = () => {
  const theme = useTheme()
  const navigation = useNavigation() as NativeStackNavigationProp<any>

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMenuVisible, setFilterMenuVisible] = useState(false)
  const [sortMenuVisible, setSortMenuVisible] = useState(false)
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'total'>('date')

  // Mock orders (replace with API call)
  const mockOrders: OrderItem[] = React.useMemo(() => {
    return [
      {
        id: '1',
        orderNumber: 'ORD-2024-001',
        createdAt: new Date(2024, 2, 15).toISOString(),
        status: 'delivered',
        total: 1500000,
        itemCount: 2,
        items: [
          {
            name: 'Gọng kính thời trang 01',
            quantity: 1,
            price: 800000,
            image: 'https://via.placeholder.com/80x80',
          },
          {
            name: 'Tròng chống tia UV',
            quantity: 1,
            price: 700000,
            image: 'https://via.placeholder.com/80x80',
          },
        ],
        shippingAddress: {
          name: 'Nguyễn Văn A',
          phone: '0123456789',
          address: '123 Đường ABC',
          city: 'Hồ Chí Minh',
        },
      },
      {
        id: '2',
        orderNumber: 'ORD-2024-002',
        createdAt: new Date(2024, 2, 10).toISOString(),
        status: 'shipped',
        total: 2500000,
        itemCount: 1,
        items: [
          {
            name: 'Gọng kính mát 02',
            quantity: 1,
            price: 2500000,
            image: 'https://via.placeholder.com/80x80',
          },
        ],
      },
      {
        id: '3',
        orderNumber: 'ORD-2024-003',
        createdAt: new Date(2024, 2, 5).toISOString(),
        status: 'processing',
        total: 1200000,
        itemCount: 3,
        items: [
          {
            name: 'Gọng kính trẻ em',
            quantity: 2,
            price: 400000,
            image: 'https://via.placeholder.com/80x80',
          },
          {
            name: 'Khăn lau kính',
            quantity: 1,
            price: 50000,
            image: 'https://via.placeholder.com/80x80',
          },
        ],
      },
      {
        id: '4',
        orderNumber: 'ORD-2024-004',
        createdAt: new Date(2024, 1, 28).toISOString(),
        status: 'pending',
        total: 5000000,
        itemCount: 1,
        items: [
          {
            name: 'Gọng kính cao cấp 01',
            quantity: 1,
            price: 5000000,
            image: 'https://via.placeholder.com/80x80',
          },
        ],
      },
    ]
  }, [])

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      // TODO: Call API to get orders
      // For now, use mock data
      setOrders(mockOrders)
    } catch (error) {
      console.error('Fetch orders error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
  }, [fetchOrders])

  // Handle filter select
  const handleFilterSelect = useCallback((status: OrderStatus | 'all') => {
    setSelectedFilter(status)
    setFilterMenuVisible(false)
  }, [])

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  // Handle sort
  const handleSort = useCallback((sort: 'date' | 'status' | 'total') => {
    setSortBy(sort)
    setSortMenuVisible(false)
  }, [])

  // Handle order press
  const handleOrderPress = useCallback((orderId: string) => {
    navigation.navigate('OrderDetail' as never, { orderId })
  }, [navigation])

  // Filter and sort orders
  const filteredOrders = React.useMemo(() => {
    let result = [...orders]

    // Filter by status
    if (selectedFilter !== 'all') {
      result = result.filter((order) => order.status === selectedFilter)
    }

    // Filter by search query
    if (searchQuery) {
      result = result.filter((order) =>
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort
    if (sortBy === 'date') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (sortBy === 'total') {
      result.sort((a, b) => b.total - a.total)
    } else if (sortBy === 'status') {
      const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
      result.sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status))
    }

    return result
  }, [orders, selectedFilter, searchQuery, sortBy])

  // Get status display info
  const getStatusInfo = useCallback((status: OrderStatus) => {
    const statusMap: Record<OrderStatus, { label: string; color: string }> = {
      pending: { label: 'Chờ xử lý', color: '#ffa726' },
      confirmed: { label: 'Đã xác nhận', color: '#42a5f5' },
      processing: { label: 'Đang xử lý', color: '#ffa726' },
      shipped: { label: 'Đã gửi', color: '#29b6f6' },
      delivered: { label: 'Đã giao', color: '#2e7d32' },
      cancelled: { label: 'Đã hủy', color: '#e53935' },
      refunded: { label: 'Đã hoàn', color: '#757575' },
    }
    return statusMap[status]
  }, [])

  // Format price
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: APP_CONFIG.currency,
    }).format(price)
  }, [])

  // Format date
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }, [])

  // Load orders on mount
  React.useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Lịch sử đơn hàng</Text>
          <Text style={styles.headerSubtitle}>
            Đang tải lịch sử đơn hàng...
          </Text>
        </View>
        <View style={styles.content}>
          {Array.from({ length: 3 }).map((_, index) => (
            <OrderCardSkeleton key={index} />
          ))}
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerRow}>
          <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Đơn hàng của tôi
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Filter and Sort */}
        <View style={styles.filterRow}>
          {/* Filter */}
          <Menu
            visible={filterMenuVisible}
            onDismiss={() => setFilterMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                icon="filter"
                onPress={() => setFilterMenuVisible(true)}
                style={styles.filterButton}
                contentStyle={styles.filterButtonContent}
              >
                {STATUS_FILTERS.find((f) => f.id === selectedFilter)?.label}
              </Button>
            }
          >
            {STATUS_FILTERS.map((filter) => (
              <Menu.Item
                key={filter.id}
                onPress={() => handleFilterSelect(filter.id)}
                leadingIcon={
                  selectedFilter === filter.id ? 'check' : undefined
                }
              >
                {filter.label}
              </Menu.Item>
            ))}
          </Menu>

          {/* Sort */}
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                icon="sort"
                onPress={() => setSortMenuVisible(true)}
                style={styles.filterButton}
                contentStyle={styles.filterButtonContent}
              >
                {sortBy === 'date' && 'Mới nhất'}
                {sortBy === 'status' && 'Trạng thái'}
                {sortBy === 'total' && 'Giá trị'}
              </Button>
            }
          >
            <Menu.Item
              leadingIcon={sortBy === 'date' ? 'check' : undefined}
              onPress={() => handleSort('date')}
            >
              Mới nhất
            </Menu.Item>
            <Menu.Item
              leadingIcon={sortBy === 'status' ? 'check' : undefined}
              onPress={() => handleSort('status')}
            >
              Trạng thái
            </Menu.Item>
            <Menu.Item
              leadingIcon={sortBy === 'total' ? 'check' : undefined}
              onPress={() => handleSort('total')}
            >
              Giá trị
            </Menu.Item>
          </Menu>
        </View>

        {/* Search Bar */}
        <Searchbar
          placeholder="Tìm kiếm đơn hàng..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          iconColor={theme.colors.primary}
        />
      </Surface>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const statusInfo = getStatusInfo(item.status)

          return (
            <Surface style={styles.orderCard} elevation={1}>
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text variant="titleSmall" style={styles.orderNumber}>
                    {item.orderNumber}
                  </Text>
                  <Text variant="bodySmall" style={styles.orderDate}>
                    {formatDate(item.createdAt)}
                  </Text>
                </View>
                <Chip
                  mode="flat"
                  style={[styles.statusChip, { backgroundColor: statusInfo.color }]}
                  textStyle={styles.statusChipText}
                >
                  {statusInfo.label}
                </Chip>
              </View>

              <View style={styles.orderContent}>
                {/* Items Preview */}
                <View style={styles.itemsPreview}>
                  {item.items.slice(0, 3).map((orderItem, index) => (
                    <View key={index} style={styles.itemPreview}>
                      <Text variant="bodySmall" numberOfLines={1}>
                        {orderItem.name} x{orderItem.quantity}
                      </Text>
                    </View>
                  ))}
                  {item.items.length > 3 && (
                    <Text variant="bodySmall" style={styles.moreItems}>
                      +{item.items.length - 3} sản phẩm khác
                    </Text>
                  )}
                </View>

                {/* Total */}
                <View style={styles.orderTotal}>
                  <Text variant="titleMedium" style={styles.totalAmount}>
                    {formatPrice(item.total)}
                  </Text>
                  <Text variant="bodySmall" style={styles.itemCount}>
                    {item.itemCount} sản phẩm
                  </Text>
                </View>
              </View>

              <Divider style={styles.divider} />

              {/* Footer */}
              <View style={styles.orderFooter}>
                <IconButton
                  icon="chevron-right"
                  size={20}
                  onPress={() => handleOrderPress(item.id)}
                  style={styles.viewButton}
                />
              </View>
            </Surface>
          )
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconButton
              icon="package-variant"
              size={64}
              iconColor={theme.colors.onSurfaceDisabled}
              style={styles.emptyIcon}
            />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Chưa có đơn hàng
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Bạn chưa có đơn hàng nào. Hãy mua sắm ngay!
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Store' as never)}
              style={styles.shopNowButton}
            >
              Mua sắm ngay
            </Button>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    marginBottom: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  headerSpacer: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filterButton: {
    flex: 1,
    borderRadius: 8,
  },
  filterButtonContent: {
    paddingVertical: 6,
  },
  searchBar: {
    backgroundColor: '#fff',
    elevation: 0,
  },
  orderCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  orderDate: {
    opacity: 0.7,
  },
  statusChip: {
    borderRadius: 16,
  },
  statusChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  orderContent: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemsPreview: {
    flex: 1,
    gap: 4,
  },
  itemPreview: {
    backgroundColor: '#f5f5f5',
    padding: 4,
    borderRadius: 4,
  },
  moreItems: {
    opacity: 0.6,
  },
  orderTotal: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontWeight: 'bold',
    color: '#e53935',
  },
  itemCount: {
    opacity: 0.7,
  },
  divider: {
    marginVertical: 0,
  },
  orderFooter: {
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  viewButton: {
    marginLeft: 'auto',
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 32,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  shopNowButton: {
    borderRadius: 8,
  },
})
