// Navigation types for React Navigation
import type { Address } from '../components/checkout/AddressForm'
import type { PaymentMethod, ShippingMethod } from '../screens/checkout/PaymentScreen'
import type { OrderTotals } from '../screens/checkout/ReviewScreen'

// Auth Stack Param List
export type AuthStackParamList = {
  Login: undefined
  Register: undefined
  ForgotPassword: undefined
  ResetPassword: { token: string }
  VerifyEmail: { token?: string; email?: string }
}

// Main Tab Param List
export type MainTabParamList = {
  HomeTab: undefined
  SearchTab: undefined
  CartTab: undefined
  OrdersTab: undefined
  AccountTab: undefined
}

// Checkout Stack Param List
export type CheckoutStackParamList = {
  CheckoutAddress: undefined
  CheckoutPayment: { address?: Address }
  CheckoutReview: {
    address?: Address
    shippingAddress?: Address
    paymentMethod?: PaymentMethod
    shippingMethod?: ShippingMethod
    totals?: OrderTotals
    customerInfo?: {
      fullName?: string
      phone?: string
      email?: string
      address?: string
      ward?: string
      district?: string
      province?: string
    }
    appliedPromotion?: {
      code: string
      name: string
      type: 'percentage' | 'fixed_amount'
      value: number
      description?: string
      minOrderValue: number
      discountAmount: number
    }
  }
  CheckoutSuccess: { orderId?: string; orderNumber?: string; total?: number; estimatedDelivery?: string }
  CheckoutFailed: { error?: string; errorCode?: string; errorMessage?: string; cartItemCount?: number }
}

// Root Stack Param List
export type RootStackParamList = {
  Auth: undefined
  Main: undefined
  Home: undefined
  ProductDetail: { slug: string; productId: string }
  ProductList: { category?: string }
  Cart: undefined
  Checkout: undefined
  CheckoutAddress: undefined
  CheckoutPayment: undefined
  CheckoutReview: undefined
  OrderDetail: { orderId: string }
  OrderHistory: undefined
  ReturnRequest: { orderId: string }
  AddressManagement: undefined
  AddressForm: { addressId?: string }
  ProfileSettings: undefined
  ProfileEdit: undefined
  SecuritySettings: undefined
  Settings: undefined
  About: undefined
  Contact: undefined
  Favorites: undefined
  PolicyDetail: { type: 'shipping' | 'return' | 'privacy' | 'terms' }
  ReviewList: { productId: string; productName: string; productImage?: string }
  VirtualTryOn: { productId: string }
}

// Navigation types combining all navigators
export type NavigationType = {
  Auth: AuthStackParamList
  Main: MainTabParamList
  Root: RootStackParamList
}

// Type aliases for convenience
export type RootStackNavigation = import('@react-navigation/native-stack').NativeStackNavigationProp<RootStackParamList>
export type RootStackRouteProps = import('@react-navigation/native-stack').RouteProp<RootStackParamList>

export type MainTabNavigation = import('@react-navigation/bottom-tabs').BottomTabNavigationProp<MainTabParamList>
export type MainTabRouteProps = import('@react-navigation/bottom-tabs').RouteProp<MainTabParamList>

export type AuthStackNavigation = import('@react-navigation/native-stack').NativeStackNavigationProp<AuthStackParamList>
export type AuthStackRouteProps = import('@react-navigation/native-stack').RouteProp<AuthStackParamList>

export type CheckoutStackNavigation = import('@react-navigation/native-stack').NativeStackNavigationProp<CheckoutStackParamList>
export type CheckoutStackRouteProps = import('@react-navigation/native-stack').RouteProp<CheckoutStackParamList>
