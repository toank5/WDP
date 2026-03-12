import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useTheme } from 'react-native-paper'

interface SkeletonLoaderProps {
  type: 'product' | 'listItem' | 'text' | 'circle'
  style?: any
}

/**
 * SkeletonLoader - Loading placeholder for various content types
 *
 * Types:
 * - product: Product card skeleton
 * - listItem: List item skeleton
 * - text: Text line skeleton
 * - circle: Circular avatar/image skeleton
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type,
  style,
}) => {
  const theme = useTheme()

  if (type === 'product') {
    return (
      <View style={[styles.productContainer, style]}>
        {/* Product Image Skeleton */}
        <View style={styles.imageSkeleton} />

        {/* Product Info Skeleton */}
        <View style={styles.infoSkeleton}>
          <View
            style={[styles.textSkeleton, styles.titleSkeleton]}
            backgroundColor={theme.colors.skeleton}
          />
          <View
            style={[styles.textSkeleton, styles.textMedium]}
            backgroundColor={theme.colors.skeleton}
          />
        </View>
      </View>
    )
  }

  if (type === 'listItem') {
    return (
      <View style={[styles.listItemContainer, style]}>
        {/* Left content skeleton */}
        <View style={styles.listItemLeft}>
          <View style={[styles.textSkeleton, styles.textLarge]} />
          <View
            style={[styles.textSkeleton, styles.textSmall]}
            backgroundColor={theme.colors.skeleton}
          />
        </View>
        {/* Right arrow skeleton */}
        <View style={styles.listItemRight} />
      </View>
    )
  }

  if (type === 'text') {
    return (
      <View
        style={[styles.textSkeleton, { width: '100%', height: 20 }, style]}
        backgroundColor={theme.colors.skeleton}
      />
    )
  }

  if (type === 'circle') {
    return (
      <View style={[styles.circleSkeleton, style]} />
    )
  }

  return null
}

const styles = StyleSheet.create({
  productContainer: {
    width: 150,
    margin: 8,
  },
  imageSkeleton: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  infoSkeleton: {
    padding: 12,
  },
  textSkeleton: {
    borderRadius: 4,
    height: 12,
    backgroundColor: '#e0e0e0',
  },
  titleSkeleton: {
    width: '80%',
    marginBottom: 12,
  },
  textMedium: {
    width: '60%',
  },
  textSmall: {
    width: '40%',
  },
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listItemLeft: {
    flex: 1,
    gap: 8,
  },
  listItemRight: {
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#d0d0d0',
    transform: [{ rotate: '45deg' }],
  },
  textLarge: {
    width: '60%',
  },
  circleSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
})
