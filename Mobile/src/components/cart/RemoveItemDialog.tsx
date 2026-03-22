import React from 'react'
import { View, StyleSheet } from 'react-native'
import {
  Portal,
  Dialog,
  Button,
  Text,
  Surface,
} from 'react-native-paper'
import { useTheme } from 'react-native-paper'

interface RemoveItemDialogProps {
  visible: boolean
  onConfirm: () => void
  onDismiss: () => void
  itemName?: string
}

/**
 * RemoveItemDialog - Confirmation dialog for removing cart item
 *
 * Features:
 * - Display item name (optional)
 * - Confirm/Cancel buttons
 * - Portal for better z-index handling
 * - Theme-aware styling
 */
export const RemoveItemDialog: React.FC<RemoveItemDialogProps> = ({
  visible,
  onConfirm,
  onDismiss,
  itemName = 'sản phẩm này',
}) => {
  const theme = useTheme()

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Xóa sản phẩm</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">
            Bạn có chắc chắn muốn xóa <Text style={styles.itemName}>{itemName}</Text> khỏi giỏ hàng không?
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Hủy</Button>
          <Button
            onPress={onConfirm}
            mode="contained"
            buttonColor={theme.colors.error}
            textColor="#fff"
          >
            Xóa
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}

const styles = StyleSheet.create({
  itemName: {
    fontWeight: 'bold',
  },
})
