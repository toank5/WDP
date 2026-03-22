import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Chip, Text } from 'react-native-paper'
import type { ProductCategory, ProductFilter as Filter } from '../../types/product'

interface ProductFilterProps {
  activeFilter: Filter
  onFilterChange: (filter: Filter) => void
}

const CATEGORIES: { label: string; value: ProductCategory }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Gọng kính', value: 'frame' },
  { label: 'Tròng kính', value: 'lens' },
  { label: 'Dịch vụ', value: 'service' },
]

const PRICES: { label: string; min: number; max: number }[] = [
  { label: 'Tất cả giá', min: 0, max: Infinity },
  { label: 'Dưới 500k', min: 0, max: 500000 },
  { label: '500k - 1tr', min: 500000, max: 1000000 },
  { label: '1tr - 2tr', min: 1000000, max: 2000000 },
  { label: 'Trên 2tr', min: 2000000, max: Infinity },
]

export const ProductFilter: React.FC<ProductFilterProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Danh mục
      </Text>
      <View style={styles.chipContainer}>
        {CATEGORIES.map((category) => (
          <Chip
            key={category.value}
            selected={activeFilter.category === category.value}
            onPress={() => onFilterChange({ ...activeFilter, category: category.value })}
            style={styles.chip}
            mode="flat"
          >
            {category.label}
          </Chip>
        ))}
      </View>

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Khoảng giá
      </Text>
      <View style={styles.chipContainer}>
        {PRICES.map((price) => (
          <Chip
            key={price.label}
            selected={
              activeFilter.minPrice === price.min &&
              activeFilter.maxPrice === price.max
            }
            onPress={() =>
              onFilterChange({ ...activeFilter, minPrice: price.min, maxPrice: price.max })
            }
            style={styles.chip}
            mode="flat"
          >
            {price.label}
          </Chip>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    margin: 0,
  },
})
