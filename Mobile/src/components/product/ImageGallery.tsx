import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { IconButton, useTheme } from 'react-native-paper'

interface ProductImage {
  id: string
  url: string
  is3D?: boolean
  isPrimary?: boolean
}

interface ImageGalleryProps {
  images: ProductImage[]
  onImagePress?: (index: number) => void
  show3DBadge?: boolean
  autoPlay?: boolean
  autoPlayInterval?: number
}

const SCREEN_WIDTH = Dimensions.get('window').width
const IMAGE_HEIGHT = SCREEN_WIDTH // 1:1 aspect ratio

/**
 * ImageGallery - Product image gallery with swipe and 3D support
 *
 * Features:
 * - Horizontal swipe to change images
 * - Pagination indicators
 * - 3D badge display
 * - Tap to view full screen
 * - Auto-play option
 * - Zoom on tap (optional)
 */
export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  onImagePress,
  show3DBadge = true,
  autoPlay = false,
  autoPlayInterval = 3000,
}) => {
  const theme = useTheme()
  const scrollViewRef = useRef<ScrollView>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>(
    new Array(images.length).fill(false)
  )
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Handle scroll to detect current image
  const handleScroll = useCallback(
    (event: any) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x
      const index = Math.round(contentOffsetX / SCREEN_WIDTH)
      setCurrentIndex(index)
    },
    []
  )

  // Handle image press
  const handleImagePress = useCallback(
    (index: number) => {
      if (onImagePress) {
        onImagePress(index)
      }
    },
    [onImagePress]
  )

  // Navigate to specific image
  const scrollToIndex = useCallback(
    (index: number) => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: index * SCREEN_WIDTH,
          animated: true,
        })
      }
    },
    []
  )

  // Handle indicator press
  const handleIndicatorPress = useCallback(
    (index: number) => {
      scrollToIndex(index)
    },
    [scrollToIndex]
  )

  // Previous image
  const handlePrevious = useCallback(() => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1
    scrollToIndex(newIndex)
  }, [currentIndex, images.length, scrollToIndex])

  // Next image
  const handleNext = useCallback(() => {
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0
    scrollToIndex(newIndex)
  }, [currentIndex, images.length, scrollToIndex])

  // Auto-play logic
  React.useEffect(() => {
    if (autoPlay && images.length > 1) {
      autoPlayTimerRef.current = setInterval(() => {
        handleNext()
      }, autoPlayInterval)
    }

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current)
      }
    }
  }, [autoPlay, images.length, autoPlayInterval, handleNext])

  // Handle image load
  const handleImageLoad = useCallback((index: number) => {
    setImagesLoaded((prev) => {
      const newLoaded = [...prev]
      newLoaded[index] = true
      return newLoaded
    })
  }, [])

  // Handle image error
  const handleImageError = useCallback((index: number) => {
    setImagesLoaded((prev) => {
      const newLoaded = [...prev]
      newLoaded[index] = true // Mark as loaded even if error to hide loading
      return newLoaded
    })
  }, [])

  // Auto-scroll to primary image on mount
  React.useEffect(() => {
    const primaryIndex = images.findIndex((img) => img.isPrimary)
    if (primaryIndex !== -1) {
      setTimeout(() => {
        scrollToIndex(primaryIndex)
      }, 100)
    }
  }, [images, scrollToIndex])

  if (!images || images.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <IconButton icon="image-off" size={48} />
        </View>
      </View>
    )
  }

  const currentImage = images[currentIndex]
  const isFirstImage = currentIndex === 0
  const isLastImage = currentIndex === images.length - 1

  return (
    <View style={styles.container}>
      {/* Image Gallery */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {images.map((image, index) => (
          <TouchableOpacity
            key={image.id}
            style={styles.imageContainer}
            activeOpacity={1}
            onPress={() => handleImagePress(index)}
          >
            <Image
              source={{ uri: image.url }}
              style={[
                styles.image,
                !imagesLoaded[index] && styles.imagePlaceholder,
              ]}
              resizeMode="contain"
              onLoad={() => handleImageLoad(index)}
              onError={() => handleImageError(index)}
            />
            {!imagesLoaded[index] && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            )}
            {image.is3D && show3DBadge && (
              <View style={styles.badge3D}>
                <IconButton
                  icon="view-in-ar"
                  size={16}
                  iconColor="#fff"
                  style={styles.badgeIcon}
                />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          {!isFirstImage && (
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonLeft]}
              onPress={handlePrevious}
              activeOpacity={0.7}
            >
              <IconButton
                icon="chevron-left"
                size={28}
                iconColor="#fff"
                style={styles.navButtonIcon}
              />
            </TouchableOpacity>
          )}
          {!isLastImage && (
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonRight]}
              onPress={handleNext}
              activeOpacity={0.7}
            >
              <IconButton
                icon="chevron-right"
                size={28}
                iconColor="#fff"
                style={styles.navButtonIcon}
              />
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Indicators */}
      {images.length > 1 && (
        <View style={styles.indicatorsContainer}>
          {images.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => handleIndicatorPress(index)}
              activeOpacity={0.7}
            />
          ))}
        </View>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {images.length}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  scrollView: {
    height: IMAGE_HEIGHT,
  },
  scrollViewContent: {
    alignItems: 'center',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  image: {
    width: SCREEN_WIDTH * 0.9,
    height: IMAGE_HEIGHT * 0.9,
  },
  imagePlaceholder: {
    backgroundColor: '#e0e0e0',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  badge3D: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  badgeIcon: {
    margin: 0,
  },
  navButton: {
    position: 'absolute',
    top: IMAGE_HEIGHT / 2,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonLeft: {
    left: 16,
  },
  navButtonRight: {
    right: 16,
  },
  navButtonIcon: {
    margin: 0,
  },
  indicatorsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  counterContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  counterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  placeholder: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
})
