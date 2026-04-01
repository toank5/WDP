import React from 'react'
import {
  Image,
  ImageBackground,
  StyleSheet,
  View,
} from 'react-native'
import { Button, Text, useTheme } from 'react-native-paper'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../navigation/types'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

interface HeroBannerProps {
  navigation: NavigationProp
}

// Placeholder gradient background with eyeglasses emoji as fallback
const HERO_IMAGE_COLORS = ['#1e40af', '#1e3a8a', '#1e293b']

export const HeroBanner: React.FC<HeroBannerProps> = ({ navigation }) => {
  const theme = useTheme()

  const handleShopFrames = () => {
    const tabNav = navigation.getParent()
    if (tabNav) {
      ;(tabNav as any).navigate('SearchTab', { category: 'frame' })
    }
  }

  const handleExploreLenses = () => {
    const tabNav = navigation.getParent()
    if (tabNav) {
      ;(tabNav as any).navigate('SearchTab', { category: 'lens' })
    }
  }

  // Attempt to load hero image - comment out to use placeholder
  const [imageError, setImageError] = React.useState(false)
  const heroImageUrl = 'https://raw.githubusercontent.com/toank5/WDP/main/FE/public/images/hero-eyewear.webp'

  return (
    <View style={styles.container}>
      {!imageError ? (
        <ImageBackground
          source={{ uri: heroImageUrl }}
          style={styles.heroImage}
          resizeMode="cover"
          onError={() => setImageError(true)}
        >
          {/* Semi-transparent overlay */}
          <View style={styles.overlay} />

          {/* Content overlay */}
          <View style={styles.content}>
            <Text variant="titleLarge" style={styles.subtitle}>
              Premium Eyewear
            </Text>
            <Text variant="headlineLarge" style={styles.title}>
              See clearly.{'\n'}Look amazing.
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              Discover our curated collection of designer frames and lenses with 3D view technology.
            </Text>

            {/* CTA Buttons */}
            <View style={styles.buttonGroup}>
              <Button
                mode="contained"
                onPress={handleShopFrames}
                style={styles.primaryButton}
                contentStyle={styles.buttonContent}
              >
                Shop All Frames
              </Button>
              <Button
                mode="outlined"
                onPress={handleExploreLenses}
                style={styles.secondaryButton}
                contentStyle={styles.buttonContent}
              >
                Explore Lenses
              </Button>
            </View>

            {/* Trust indicators */}
            <View style={styles.trustBadges}>
              <View style={styles.trustBadge}>
                <Text style={styles.trustBadgeLabel}>✓ Free Returns</Text>
                <Text style={styles.trustBadgeText}>Within 30 days</Text>
              </View>
              <View style={styles.trustBadge}>
                <Text style={styles.trustBadgeLabel}>✓ Fast Shipping</Text>
                <Text style={styles.trustBadgeText}>2-3 business days</Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      ) : (
        <View style={[styles.heroImage, styles.fallbackBg]}>
          {/* Fallback with emoji */}
          <View style={styles.overlay} />
          <View style={styles.content}>
            <Text variant="titleLarge" style={styles.subtitle}>
              Premium Eyewear
            </Text>
            <Text variant="headlineLarge" style={styles.title}>
              See clearly.{'\n'}Look amazing.
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              Discover our curated collection of designer frames and lenses with 3D view technology.
            </Text>

            {/* CTA Buttons */}
            <View style={styles.buttonGroup}>
              <Button
                mode="contained"
                onPress={handleShopFrames}
                style={styles.primaryButton}
                contentStyle={styles.buttonContent}
              >
                Shop All Frames
              </Button>
              <Button
                mode="outlined"
                onPress={handleExploreLenses}
                style={styles.secondaryButton}
                contentStyle={styles.buttonContent}
              >
                Explore Lenses
              </Button>
            </View>

            {/* Trust indicators */}
            <View style={styles.trustBadges}>
              <View style={styles.trustBadge}>
                <Text style={styles.trustBadgeLabel}>✓ Free Returns</Text>
                <Text style={styles.trustBadgeText}>Within 30 days</Text>
              </View>
              <View style={styles.trustBadge}>
                <Text style={styles.trustBadgeLabel}>✓ Fast Shipping</Text>
                <Text style={styles.trustBadgeText}>2-3 business days</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroImage: {
    height: 400,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  fallbackBg: {
    backgroundColor: '#1e3a8a',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  content: {
    zIndex: 1,
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
    opacity: 0.9,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
    marginBottom: 12,
  },
  description: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    opacity: 0.95,
  },
  buttonGroup: {
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: '#1e88e5',
  },
  secondaryButton: {
    borderRadius: 8,
    borderColor: '#ffffff',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  trustBadges: {
    flexDirection: 'row',
    gap: 12,
  },
  trustBadge: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    padding: 8,
  },
  trustBadgeLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  trustBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    opacity: 0.8,
  },
})
