import React from 'react'
import { Platform, View, StyleSheet } from 'react-native'
import { GestureHandlerRootView, LongPressGestureHandler } from 'react-native-gesture-handler'
import { CartItem } from './CartItem'
import { RemoveItemDialog } from './RemoveItemDialog'

interface LongPressCartItemProps {
  itemId: string
  onRemove: (itemId: string) => void
  itemProps: Omit<React.ComponentProps<typeof CartItem>, 'id'>
}

/**
 * LongPressCartItem - Cart item with long-press-to-remove gesture (Android)
 *
 * Features:
 * - Long press to show remove confirmation
 * - Confirm dialog before removal
 * - Platform detection (Android only)
 */
export const LongPressCartItem: React.FC<LongPressCartItemProps> = ({
  itemId,
  onRemove,
  itemProps,
}) => {
  const [showRemoveDialog, setShowRemoveDialog] = React.useState(false)

  const handleLongPress = () => {
    setShowRemoveDialog(true)
  }

  const handleConfirmRemove = () => {
    setShowRemoveDialog(false)
    onRemove(itemId)
  }

  const handleDismissRemove = () => {
    setShowRemoveDialog(false)
  }

  // Only render long press functionality on Android
  if (Platform.OS !== 'android') {
    return <CartItem {...itemProps} id={itemId} />
  }

  return (
    <GestureHandlerRootView>
      <LongPressGestureHandler
        onActivated={handleLongPress}
        minDurationMs={500} // 500ms long press
      >
        <View>
          <CartItem {...itemProps} id={itemId} />
        </View>
      </LongPressGestureHandler>

      {/* Remove Confirmation Dialog */}
      <RemoveItemDialog
        visible={showRemoveDialog}
        onConfirm={handleConfirmRemove}
        onDismiss={handleDismissRemove}
        itemName={itemProps.name}
      />
    </GestureHandlerRootView>
  )
}
