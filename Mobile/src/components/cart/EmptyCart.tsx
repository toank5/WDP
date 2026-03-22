import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text, Button, IconButton } from 'react-native-paper'
import { useTheme } from 'react-native-paper'

interface EmptyCartProps {
  onShopNow: () => void
}

/**
 * EmptyCart - Display when cart is empty
 *
 * Features:
 * - Empty cart illustration
 * - Helpful message
 * - Shop now CTA button
 */
export const EmptyCart: React.FC<EmptyCartProps> = ({ onShopNow }) => {
  const theme = useTheme()

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <IconButton
          icon="cart-off"
          size={80}
          iconColor={theme.colors.placeholder}
          style={styles.icon}
        />

        <Text variant="headlineSmall" style={styles.title}>
          Giỏ hàng của bạn đang trống
        </Text>

        <Text variant="bodyLarge" style={styles.message}>
          Hãy thêm sản phẩm vào giỏ hàng để tiến hành thanh toán
        </Text>

        <Button
          mode="contained"
          onPress={onShopNow}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Mua sắm ngay
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  icon: {
    margin: 0,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    minWidth: 200,
  },
  buttonContent: {
    paddingVertical: 8,
  },
})
