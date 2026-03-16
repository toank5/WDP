import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTheme } from 'react-native-paper'
import { AddressScreen } from '../screens/checkout/AddressScreen'
import { PaymentScreen } from '../screens/checkout/PaymentScreen'
import type { CheckoutStackParamList } from './types'

const Stack = createNativeStackNavigator<CheckoutStackParamList>()

/**
 * CheckoutStackNavigator - Navigator cho quy trình checkout
 *
 * Flow:
 * 1. AddressScreen - Chọn/nhập địa chỉ
 * 2. PaymentScreen - Chọn phương thức thanh toán
 * 3. ReviewScreen - Xem lại đơn hàng
 * 4. SuccessScreen - Đặt hàng thành công
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
    </Stack.Navigator>
  )
}
