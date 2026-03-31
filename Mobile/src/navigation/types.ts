// Navigation types for React Navigation

// Auth Stack Param List
export type AuthStackParamList = {
  Login: undefined
  Register: undefined
  ForgotPassword: undefined
  ResetPassword: { token: string }
  VerifyEmail: { token: string }
}

// Main Tab Param List
export type MainTabParamList = {
  HomeTab: undefined
  SearchTab: undefined
  CartTab: undefined
  AccountTab: undefined
}

// Checkout Stack Param List
export type CheckoutStackParamList = {
  CheckoutAddress: undefined
  CheckoutPayment: undefined
  CheckoutReview: undefined
  CheckoutSuccess: { orderId: string }
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
  AddressManagement: undefined
  AddressForm: { addressId?: string }
  ProfileSettings: undefined
  ProfileEdit: undefined
  SecuritySettings: undefined
  About: undefined
  Contact: undefined
  Favorites: undefined
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
