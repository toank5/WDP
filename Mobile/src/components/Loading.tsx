import React from 'react'
import { ActivityIndicator, useTheme, MD3Colors } from 'react-native-paper'
import { StyleSheet, View, Text } from 'react-native'

interface LoadingProps {
  size?: 'small' | 'large'
  color?: string
  text?: string
  overlay?: boolean
}

export function Loading({
  size = 'large',
  color,
  text,
  overlay = false,
}: LoadingProps) {
  const theme = useTheme()
  const colors = theme.colors as typeof MD3Colors

  const getSize = () => {
    switch (size) {
      case 'small':
        return 24
      default:
        return 48
    }
  }

  const loaderSize = getSize()

  const content = (
    <View style={styles.container}>
      <ActivityIndicator
        animating={true}
        size={loaderSize}
        color={color || colors.primary}
        theme={theme}
      />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  )

  if (overlay) {
    return (
      <View style={styles.overlay}>
        {content}
      </View>
    )
  }

  return content
}

export function Skeleton({ width, height, style }: { width?: number | string; height?: number | string; style?: any }) {
  return (
    <View
      style={[
        styles.skeleton,
        width !== undefined ? { width } : { width: '100%' },
        height !== undefined ? { height } : { height: 48 },
        style,
      ]}
    />
  )
}

// Product Card Skeleton - for product lists
export function ProductCardSkeleton() {
  return (
    <View style={skeletonStyles.productCard}>
      <View style={skeletonStyles.productImageSkeleton} />
      <View style={skeletonStyles.productInfo}>
        <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={14} />
      </View>
    </View>
  )
}

// Cart Item Skeleton - for cart items
export function CartItemSkeleton() {
  return (
    <View style={skeletonStyles.cartItem}>
      <View style={skeletonStyles.cartItemImage} />
      <View style={skeletonStyles.cartItemInfo}>
        <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={14} />
      </View>
      <View style={skeletonStyles.cartItemActions}>
        <Skeleton width={32} height={32} style={skeletonStyles.skeletonCircle} />
        <Skeleton width={32} height={32} style={skeletonStyles.skeletonCircle} />
      </View>
    </View>
  )
}

// Order Card Skeleton - for order history
export function OrderCardSkeleton() {
  return (
    <View style={skeletonStyles.orderCard}>
      <View style={skeletonStyles.orderHeader}>
        <Skeleton width="50%" height={16} />
        <Skeleton width={60} height={20} style={skeletonStyles.statusBadge} />
      </View>
      <View style={skeletonStyles.orderBody}>
        <Skeleton width="80%" height={14} style={{ marginBottom: 4 }} />
        <Skeleton width="60%" height={14} style={{ marginBottom: 4 }} />
        <Skeleton width="70%" height={14} />
      </View>
    </View>
  )
}

// Prescription Card Skeleton - for prescription list
export function PrescriptionCardSkeleton() {
  return (
    <View style={skeletonStyles.prescriptionCard}>
      <View style={skeletonStyles.prescriptionIcon}>
        <Skeleton width={40} height={40} style={skeletonStyles.skeletonCircle} />
      </View>
      <View style={skeletonStyles.prescriptionInfo}>
        <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={14} style={{ marginBottom: 4 }} />
        <Skeleton width="50%" height={14} />
      </View>
    </View>
  )
}

const skeletonStyles = StyleSheet.create({
  productCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  productImageSkeleton: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  cartItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  cartItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cartItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  skeletonCircle: {
    borderRadius: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    width: 60,
    height: 24,
  },
  orderBody: {
    gap: 4,
  },
  prescriptionCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  prescriptionIcon: {
    marginRight: 12,
  },
  prescriptionInfo: {
    flex: 1,
    gap: 4,
  },
})

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  skeleton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
})
