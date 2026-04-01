import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTheme } from 'react-native-paper'
import { AddressScreen } from '../screens/checkout/AddressScreen'
import { PaymentScreen } from '../screens/checkout/PaymentScreen'
import { ReviewScreen } from '../screens/checkout/ReviewScreen'
import { OrderSuccessScreen } from '../screens/checkout/OrderSuccessScreen'
import { OrderFailedScreen } from '../screens/checkout/OrderFailedScreen'
import type { CheckoutStackParamList } from './types'

const Stack = createNativeStackNavigator<CheckoutStackParamList>()

/**
 * CheckoutStackNavigator - Navigator cho quy trình checkout
 *
 * Flow:
 * 1. AddressScreen - Chọn/nhập địa chỉ
 * 2. PaymentScreen - Chọn phương thức thanh toán
 * 3. ReviewScreen - Xem lại đơn hàng
 * 4. CheckoutSuccess - Đặt hàng thành công
 * 5. CheckoutFailed - Đặt hàng thất bại
 */
export const CheckoutStackNavigator = () => {
  const theme = useTheme()

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 300,
      }}
    >
      <Stack.Screen
        name="CheckoutAddress"
        component={AddressScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="CheckoutPayment"
        component={PaymentScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="CheckoutReview"
        component={ReviewScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="CheckoutSuccess"
        component={OrderSuccessScreen}
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="CheckoutFailed"
        component={OrderFailedScreen}
        options={{
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  )
}
