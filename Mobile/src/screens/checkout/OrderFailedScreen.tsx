import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native'
import {
  Text,
  Button,
  Surface,
  useTheme,
  IconButton,
  Divider,
  List,
} from 'react-native-paper'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { MaterialCommunityIcons } from '@expo/vector-icons'

/**
 * OrderFailedScreen - Order failed error handling screen
 *
 * Checklist:
 * - Displays error message clearly
 * - Shows reason for failure
 * - Provides retry option
 * - Provides option to contact support
 * - Provides option to return to cart
 * - Handles different error types (payment, inventory, validation)
 * - Preserves cart items for retry
 */
interface OrderFailedScreenProps {
  navigation: NativeStackNavigationProp<any>
  route: RouteProp<{
    CheckoutFailed?: {
      error?: string
      errorCode?: string
      errorMessage?: string
      cartItemCount?: number
    }
  }>
}

type ErrorType = 'payment' | 'inventory' | 'validation' | 'network' | 'unknown'

export const OrderFailedScreen: React.FC<OrderFailedScreenProps> = ({
  navigation,
  route,
}) => {
  const theme = useTheme()

  // Get error details from route params
  const errorCode = route.params?.errorCode || 'UNKNOWN_ERROR'
  const errorMessage = route.params?.errorMessage ||
    route.params?.error ||
    'Không thể đặt hàng. Vui lòng thử lại.'
  const cartItemCount = route.params?.cartItemCount || 0

  const [shakeAnim] = useState(new Animated.Value(0))
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    // Shake animation for error icon
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const getErrorType = (code: string): ErrorType => {
    if (code.includes('PAYMENT') || code.includes('vnpay') || code.includes('momo')) {
      return 'payment'
    }
    if (code.includes('INVENTORY') || code.includes('STOCK') || code.includes('out_of_stock')) {
      return 'inventory'
    }
    if (code.includes('VALIDATION') || code.includes('invalid')) {
      return 'validation'
    }
    if (code.includes('NETWORK') || code.includes('TIMEOUT')) {
      return 'network'
    }
    return 'unknown'
  }

  const errorType = getErrorType(errorCode)

  const getErrorTitle = (): string => {
    switch (errorType) {
      case 'payment':
        return 'Thanh toán thất bại'
      case 'inventory':
        return 'Sản phẩm hết hàng'
      case 'validation':
        return 'Thông tin không hợp lệ'
      case 'network':
        return 'Lỗi kết nối'
      default:
        return 'Đặt hàng thất bại'
    }
  }

  const getErrorDescription = (): string => {
    switch (errorType) {
      case 'payment':
        return 'Giao dịch thanh toán không thành công. Số tiền có thể được hoàn lại sau vài phút.'
      case 'inventory':
        return 'Một hoặc nhiều sản phẩm trong giỏ hàng đã hết hàng. Vui lòng kiểm tra lại.'
      case 'validation':
        return 'Thông tin đặt hàng không hợp lệ. Vui lòng kiểm tra và thử lại.'
      case 'network':
        return 'Kết nối mạng không ổn định. Vui lòng kiểm tra kết nối và thử lại.'
      default:
        return 'Đã xảy ra lỗi khi đặt hàng. Vui lòng thử lại hoặc liên hệ hỗ trợ.'
    }
  }

  const getTroubleshootingSteps = (): string[] => {
    switch (errorType) {
      case 'payment':
        return [
          'Kiểm tra số dư tài khoản/thẻ',
          'Đảm bảo thông tin thẻ chính xác',
          'Thử phương thức thanh toán khác',
          'Liên hệ ngân hàng nếu cần thiết',
        ]
      case 'inventory':
        return [
          'Xóa sản phẩm hết hàng khỏi giỏ',
          'Chọn sản phẩm thay thế',
          'Đặt lại khi có hàng',
        ]
      case 'validation':
        return [
          'Kiểm tra thông tin giao hàng',
          'Đảm bảo các trường bắt buộc đã điền',
          'Kiểm tra số điện thoại và email',
        ]
      case 'network':
        return [
          'Kiểm tra kết nối internet',
          'Thử chuyển sang WiFi/4G',
          'Đóng và mở lại ứng dụng',
        ]
      default:
        return [
          'Thử đặt hàng lại',
          'Kiểm tra giỏ hàng',
          'Liên hệ hỗ trợ khách hàng',
        ]
    }
  }

  const handleRetry = () => {
    navigation.goBack()
  }

  const handleViewCart = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' as never, params: { screen: 'CartTab' as never } }],
    })
  }

  const handleContactSupport = () => {
    navigation.navigate('Contact' as never)
  }

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' as never }],
    })
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Error Icon */}
        <View style={styles.errorContainer}>
          <Animated.View
            style={[
              styles.errorCircle,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateX: shakeAnim.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [-10, 10],
                    }),
                  },
                ],
              },
            ]}
          >
            {errorType === 'payment' ? (
              <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#f44336" />
            ) : (
              <MaterialCommunityIcons name="close-circle-outline" size={60} color="#f44336" />
            )}
          </Animated.View>
        </View>

        {/* Error Message */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text variant="headlineMedium" style={styles.errorTitle}>
            {getErrorTitle()}
          </Text>
          <Text variant="bodyLarge" style={styles.errorMessage}>
            {getErrorDescription()}
          </Text>
        </Animated.View>

        {/* Error Details Card */}
        <Surface style={styles.card} elevation={2}>
          <View style={styles.cardHeader}>
            <IconButton icon="information" size={20} iconColor="#f57c00" />
            <Text variant="titleMedium" style={styles.cardTitle}>
              Chi tiết lỗi
            </Text>
          </View>

          <View style={styles.errorDetailBox}>
            <Text variant="bodySmall" style={styles.errorCode}>
              Mã lỗi: {errorCode}
            </Text>
            <Text variant="bodyMedium" style={styles.errorDetailText}>
              {errorMessage}
            </Text>
          </View>

          {cartItemCount > 0 && (
            <View style={styles.cartInfoBox}>
              <Text variant="bodyMedium" style={styles.cartInfoText}>
                Giỏ hàng của bạn vẫn còn {cartItemCount} sản phẩm
              </Text>
            </View>
          )}
        </Surface>

        {/* Troubleshooting Steps */}
        <Surface style={styles.card} elevation={2}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Bạn có thể thử
          </Text>

          {getTroubleshootingSteps().map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepBullet}>
                <Text variant="labelSmall" style={styles.stepBulletText}>
                  {index + 1}
                </Text>
              </View>
              <Text variant="bodyMedium" style={styles.stepText}>
                {step}
              </Text>
            </View>
          ))}
        </Surface>

        {/* Contact Support Card */}
        <Surface style={[styles.card, styles.supportCard]} elevation={2}>
          <View style={styles.supportRow}>
            <View style={styles.supportIcon}>
              <MaterialCommunityIcons name="headphones" size={32} color={theme.colors.primary} />
            </View>
            <View style={styles.supportContent}>
              <Text variant="titleMedium" style={styles.supportTitle}>
                Cần hỗ trợ?
              </Text>
              <Text variant="bodyMedium" style={styles.supportText}>
                Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn
              </Text>
            </View>
          </View>
          <Button
            mode="outlined"
            onPress={handleContactSupport}
            style={styles.supportButton}
            icon="email"
          >
            Liên hệ hỗ trợ
          </Button>
        </Surface>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleRetry}
            style={styles.primaryButton}
            contentStyle={styles.primaryButtonContent}
            icon={() => <MaterialCommunityIcons name="refresh" size={20} color="#fff" />}
          >
            Thử lại
          </Button>

          <Button
            mode="outlined"
            onPress={handleViewCart}
            style={styles.secondaryButton}
            contentStyle={styles.secondaryButtonContent}
            icon="cart"
          >
            Xem giỏ hàng
          </Button>

          <Button
            mode="text"
            onPress={handleGoHome}
            style={styles.textButton}
            icon="home"
          >
            Về trang chủ
          </Button>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  errorContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  errorCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#d32f2f',
  },
  errorMessage: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 8,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontWeight: 'bold',
  },
  errorDetailBox: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorCode: {
    opacity: 0.6,
    marginBottom: 4,
  },
  errorDetailText: {
    color: '#d32f2f',
  },
  cartInfoBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 12,
  },
  cartInfoText: {
    color: '#2e7d32',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepBulletText: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
  },
  supportCard: {
    backgroundColor: '#e3f2fd',
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  supportText: {
    opacity: 0.8,
  },
  supportButton: {
    borderColor: '#1976d2',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    borderRadius: 8,
  },
  primaryButtonContent: {
    paddingVertical: 12,
  },
  secondaryButton: {
    borderRadius: 8,
  },
  secondaryButtonContent: {
    paddingVertical: 12,
  },
  textButton: {
    borderRadius: 8,
  },
})
