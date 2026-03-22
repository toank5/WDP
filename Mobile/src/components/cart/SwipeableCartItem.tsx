import React, { useRef } from 'react'
import { Platform, View, StyleSheet } from 'react-native'
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  GestureHandlerRootView,
} from 'react-native-gesture-handler'
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated'
import { useTheme } from 'react-native-paper'
import { CartItem } from './CartItem'

interface SwipeableCartItemProps {
  itemId: string
  onRemove: (itemId: string) => void
  itemProps: Omit<React.ComponentProps<typeof CartItem>, 'id'>
}

const SWIPE_THRESHOLD = -100 // Pixels to swipe before showing remove button

/**
 * SwipeableCartItem - Cart item with swipe-to-remove gesture (iOS)
 *
 * Features:
 * - Swipe left to reveal remove button
 * - Swipe right to hide remove button
 * - Smooth animations
 * - Platform detection (iOS only)
 */
export const SwipeableCartItem: React.FC<SwipeableCartItemProps> = ({
  itemId,
  onRemove,
  itemProps,
}) => {
  const theme = useTheme()
  const translateX = useSharedValue(0)
  const swipeRef = useRef<View>(null)

  const handleRemove = () => {
    'worklet'
    translateX.value = withSpring(0)
    runOnJS(onRemove)(itemId)
  }

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number }
  >({
    onStart: (_, context) => {
      context.startX = translateX.value
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX

      // Prevent swiping right (positive value)
      if (translateX.value > 0) {
        translateX.value = 0
      }

      // Limit max swipe left
      if (translateX.value < SWIPE_THRESHOLD - 20) {
        translateX.value = SWIPE_THRESHOLD - 20
      }
    },
    onEnd: () => {
      if (translateX.value < SWIPE_THRESHOLD) {
        // Snap to remove button visible position
        translateX.value = withSpring(SWIPE_THRESHOLD)
      } else {
        // Snap back to closed
        translateX.value = withSpring(0)
      }
    },
  })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  const removeButtonStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < SWIPE_THRESHOLD / 2 ? 1 : 0,
  }))

  // Only render swipe functionality on iOS
  if (Platform.OS !== 'ios') {
    return <CartItem {...itemProps} id={itemId} />
  }

  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        {/* Remove Button (behind) */}
        <Animated.View style={[styles.removeButton, removeButtonStyle]}>
          <View
            style={[
              styles.removeButtonInner,
              { backgroundColor: theme.colors.error },
            ]}
          >
            <Animated.Text style={styles.removeButtonText}>Xóa</Animated.Text>
          </View>
        </Animated.View>

        {/* Cart Item (front) */}
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.itemWrapper, animatedStyle]}>
            <CartItem {...itemProps} id={itemId} />
          </Animated.View>
        </PanGestureHandler>
      </View>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  itemWrapper: {
    backgroundColor: '#fff',
  },
  removeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  removeButtonInner: {
    width: 100,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    transform: [{ rotate: '90deg' }],
  },
})
