import React, { useState, useCallback } from 'react'
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native'
import {
  Text,
  Button,
  Surface,
  useTheme,
  IconButton,
  FAB,
  Searchbar,
  Menu,
  Dialog,
  Portal,
} from 'react-native-paper'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

export type PrescriptionStatus = 'active' | 'expired' | 'archived'

export interface PrescriptionItem {
  id: string
  name: string
  leftEye: {
    sphere: number
    cylinder: number
    axis: number
  }
  rightEye: {
    sphere: number
    cylinder: number
    axis: number
  }
  addedDate: string
  expiryDate?: string
  status: PrescriptionStatus
  notes?: string
  image?: string
}

interface StatusFilter {
  id: PrescriptionStatus | 'all'
  label: string
}

const STATUS_FILTERS: StatusFilter[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'active', label: 'Đang dùng' },
  { id: 'expired', label: 'Đã hết hạn' },
  { id: 'archived', label: 'Đã lưu trữ' },
]

/**
 * PrescriptionListScreen - Display list of user prescriptions
 *
 * Feature:
 * - List all prescriptions
 * - Filter by status
 * - Search prescriptions
 * - Add new prescription
 * - Edit existing prescription
 * - Delete prescription
 * - Set default prescription
 */
export const PrescriptionListScreen = () => {
  const theme = useTheme()
  const navigation = useNavigation() as NativeStackNavigationProp<any>

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([])
  const [selectedFilter, setSelectedFilter] = useState<PrescriptionStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMenuVisible, setFilterMenuVisible] = useState(false)
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false)
  const [prescriptionToDelete, setPrescriptionToDelete] = useState<string | null>(null)
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionItem | null>(null)

  // Mock prescriptions (replace with API call)
  const mockPrescriptions: PrescriptionItem[] = React.useMemo(() => {
    return [
      {
        id: '1',
        name: 'Kính mắt gần',
        leftEye: {
          sphere: -1.50,
          cylinder: -0.50,
          axis: 90,
        },
        rightEye: {
          sphere: -1.75,
          cylinder: -0.75,
          axis: 85,
        },
        addedDate: new Date(2024, 1, 15).toISOString(),
        expiryDate: new Date(2025, 1, 15).toISOString(),
        status: 'active',
        notes: 'Kính cho đọc sách',
      },
      {
        id: '2',
        name: 'Kính mắt xa',
        leftEye: {
          sphere: +2.00,
          cylinder: -0.25,
          axis: 180,
        },
        rightEye: {
          sphere: +2.25,
          cylinder: -0.50,
          axis: 175,
        },
        addedDate: new Date(2023, 6, 20).toISOString(),
        expiryDate: new Date(2024, 6, 20).toISOString(),
        status: 'expired',
        notes: 'Kính cho nhìn bảng',
      },
      {
        id: '3',
        name: 'Kính đa tròng',
        leftEye: {
          sphere: 0.00,
          cylinder: 0.00,
          axis: 0,
        },
        rightEye: {
          sphere: +1.00,
          cylinder: 0.00,
          axis: 0,
        },
        addedDate: new Date(2023, 3, 10).toISOString(),
        expiryDate: new Date(2023, 9, 10).toISOString(),
        status: 'archived',
        notes: 'Đã không dùng nữa',
      },
      {
        id: '4',
        name: 'Kính mắt thường',
        leftEye: {
          sphere: -2.50,
          cylinder: -1.00,
          axis: 120,
        },
        rightEye: {
          sphere: -2.75,
          cylinder: -1.25,
          axis: 115,
        },
        addedDate: new Date(2024, 2, 1).toISOString(),
        expiryDate: new Date(2025, 2, 1).toISOString(),
        status: 'active',
      },
    ]
  }, [])

  // Fetch prescriptions
  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true)
      // TODO: Call API to get prescriptions
      // For now, use mock data
      setPrescriptions(mockPrescriptions)
    } catch (error) {
      console.error('Fetch prescriptions error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchPrescriptions()
    setRefreshing(false)
  }, [fetchPrescriptions])

  // Handle filter select
  const handleFilterSelect = useCallback((status: PrescriptionStatus | 'all') => {
    setSelectedFilter(status)
    setFilterMenuVisible(false)
  }, [])

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  // Handle add prescription
  const handleAddPrescription = useCallback(() => {
    navigation.navigate('PrescriptionDetail' as never)
  }, [navigation])

  // Handle edit prescription
  const handleEditPrescription = useCallback((prescription: PrescriptionItem) => {
    navigation.navigate('PrescriptionDetail' as never, {
      prescription,
      isEditing: true,
    })
  }, [navigation])

  // Handle delete prescription
  const handleDeletePress = useCallback((prescriptionId: string) => {
    setPrescriptionToDelete(prescriptionId)
    setDeleteDialogVisible(true)
  }, [])

  // Handle confirm delete
  const handleConfirmDelete = useCallback(() => {
    if (!prescriptionToDelete) return

    // TODO: Call API to delete prescription
    console.log('Delete prescription:', prescriptionToDelete)

    // Update local state
    setPrescriptions((prev) => prev.filter((p) => p.id !== prescriptionToDelete))

    // Close dialog
    setDeleteDialogVisible(false)
    setPrescriptionToDelete(null)
  }, [prescriptionToDelete])

  // Handle cancel delete
  const handleCancelDelete = useCallback(() => {
    setDeleteDialogVisible(false)
    setPrescriptionToDelete(null)
  }, [])

  // Filter and sort prescriptions
  const filteredPrescriptions = React.useMemo(() => {
    let result = [...prescriptions]

    // Filter by status
    if (selectedFilter !== 'all') {
      result = result.filter((p) => p.status === selectedFilter)
    }

    // Filter by search query
    if (searchQuery) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort by date (newest first)
    result.sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime())

    return result
  }, [prescriptions, selectedFilter, searchQuery])

  // Get status display info
  const getStatusInfo = useCallback((status: PrescriptionStatus) => {
    const statusMap: Record<PrescriptionStatus, { label: string; color: string }> = {
      active: { label: 'Đang dùng', color: '#2e7d32' },
      expired: { label: 'Đã hết hạn', color: '#e53935' },
      archived: { label: 'Đã lưu trữ', color: '#757575' },
    }
    return statusMap[status]
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

  // Format prescription value
  const formatValue = useCallback((value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}`
  }, [])

  // Load prescriptions on mount
  React.useEffect(() => {
    fetchPrescriptions()
  }, [fetchPrescriptions])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
            Đơn kính của tôi
          </Text>
          <View style={styles.headerSpacer} />
        </View>

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
              leadingIcon={selectedFilter === filter.id ? 'check' : undefined}
            >
              {filter.label}
            </Menu.Item>
          ))}
        </Menu>

        {/* Search Bar */}
        <Searchbar
          placeholder="Tìm kiếm đơn kính..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          iconColor={theme.colors.primary}
        />
      </Surface>

      {/* Prescriptions List */}
      <FlatList
        data={filteredPrescriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const statusInfo = getStatusInfo(item.status)

          return (
            <Surface style={styles.prescriptionCard} elevation={1}>
              <View style={styles.prescriptionHeader}>
                <View style={styles.prescriptionInfo}>
                  <Text variant="titleMedium" style={styles.prescriptionName}>
                    {item.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.prescriptionDate}>
                    Thêm ngày: {formatDate(item.addedDate)}
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

              {/* Prescription Values */}
              <View style={styles.prescriptionValues}>
                <View style={styles.eyeValues}>
                  <Text variant="titleSmall" style={styles.eyeLabel}>
                    Mắt trái (OD)
                  </Text>
                  <View style={styles.valueRow}>
                    <View style={styles.valueItem}>
                      <Text variant="bodySmall" style={styles.valueLabel}>
                        SPH:
                      </Text>
                      <Text variant="bodyMedium" style={styles.valueText}>
                        {formatValue(item.leftEye.sphere)}
                      </Text>
                    </View>
                    <View style={styles.valueItem}>
                      <Text variant="bodySmall" style={styles.valueLabel}>
                        CYL:
                      </Text>
                      <Text variant="bodyMedium" style={styles.valueText}>
                        {formatValue(item.leftEye.cylinder)}
                      </Text>
                    </View>
                    <View style={styles.valueItem}>
                      <Text variant="bodySmall" style={styles.valueLabel}>
                        AXIS:
                      </Text>
                      <Text variant="bodyMedium" style={styles.valueText}>
                        {item.leftEye.axis}°
                      </Text>
                    </View>
                  </View>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.eyeValues}>
                  <Text variant="titleSmall" style={styles.eyeLabel}>
                    Mắt phải (OS)
                  </Text>
                  <View style={styles.valueRow}>
                    <View style={styles.valueItem}>
                      <Text variant="bodySmall" style={styles.valueLabel}>
                        SPH:
                      </Text>
                      <Text variant="bodyMedium" style={styles.valueText}>
                        {formatValue(item.rightEye.sphere)}
                      </Text>
                    </View>
                    <View style={styles.valueItem}>
                      <Text variant="bodySmall" style={styles.valueLabel}>
                        CYL:
                      </Text>
                      <Text variant="bodyMedium" style={styles.valueText}>
                        {formatValue(item.rightEye.cylinder)}
                      </Text>
                    </View>
                    <View style={styles.valueItem}>
                      <Text variant="bodySmall" style={styles.valueLabel}>
                        AXIS:
                      </Text>
                      <Text variant="bodyMedium" style={styles.valueText}>
                        {item.rightEye.axis}°
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Notes */}
              {item.notes && (
                <View style={styles.notesContainer}>
                  <Text variant="bodySmall" style={styles.notesText}>
                    {item.notes}
                  </Text>
                </View>
              )}

              {/* Actions */}
              <View style={styles.prescriptionActions}>
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={() => handleEditPrescription(item)}
                  style={styles.actionIcon}
                />
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => handleDeletePress(item.id)}
                  style={[styles.actionIcon, styles.deleteIcon]}
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
              icon="clipboard-text"
              size={64}
              iconColor={theme.colors.onSurfaceDisabled}
              style={styles.emptyIcon}
            />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Chưa có đơn kính
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Bạn chưa có đơn kính nào. Thêm ngay để đặt kính nhanh hơn!
            </Text>
            <Button
              mode="contained"
              onPress={handleAddPrescription}
              style={styles.addButton}
            >
              Thêm đơn kính mới
            </Button>
          </View>
        }
      />

      {/* FAB - Add New Prescription */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddPrescription}
        label="Thêm mới"
      />

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={handleCancelDelete}
        >
          <Dialog.Title>Xóa đơn kính?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Bạn có chắc chắn muốn xóa đơn kính "{prescriptions.find((p) => p.id === prescriptionToDelete)?.name}"?
            </Text>
            <Text variant="bodySmall" style={styles.dialogNote}>
              Thao tác này không thể hoàn tác.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCancelDelete}>Hủy</Button>
            <Button onPress={handleConfirmDelete}>Xóa</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  filterButton: {
    borderRadius: 8,
  },
  filterButtonContent: {
    paddingVertical: 6,
  },
  searchBar: {
    backgroundColor: '#fff',
    elevation: 0,
  },
  prescriptionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  prescriptionInfo: {
    flex: 1,
  },
  prescriptionName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  prescriptionDate: {
    opacity: 0.7,
  },
  statusChip: {
    borderRadius: 16,
  },
  statusChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  prescriptionValues: {
    padding: 12,
  },
  eyeValues: {
    marginBottom: 12,
  },
  eyeLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme => theme.colors.primary,
  },
  valueRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  valueItem: {
    alignItems: 'center',
  },
  valueLabel: {
    opacity: 0.7,
    marginRight: 4,
  },
  valueText: {
    fontWeight: '500',
  },
  divider: {
    marginVertical: 8,
  },
  notesContainer: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    marginBottom: 8,
  },
  notesText: {
    opacity: 0.8,
  },
  prescriptionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionIcon: {
    marginLeft: 8,
  },
  deleteIcon: {
    color: '#e53935',
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 100,
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
  addButton: {
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: theme => theme.colors.primary,
  },
  dialogNote: {
    opacity: 0.7,
    marginTop: 8,
  },
})
