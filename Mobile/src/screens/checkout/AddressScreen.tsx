import React, { useState, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { AddressForm, type Address } from '../../components/checkout/AddressForm'

/**
 * AddressScreen - Checkout address entry
 *
 * Simplified for checkout flow - just collects address and passes to payment screen
 */
export const AddressScreen = () => {
  const navigation = useNavigation() as NativeStackNavigationProp<any>
  const [loading, setLoading] = useState(false)

  const handleAddressSubmit = useCallback(
    (address: Address) => {
      setLoading(true)
      try {
        navigation.navigate('CheckoutPayment' as any, {
          address,
        })
      } catch (error) {
        console.error('Address submission error:', error)
      } finally {
        setLoading(false)
      }
    },
    [navigation]
  )

  return (
    <View style={styles.container}>
      <AddressForm onSubmit={handleAddressSubmit} loading={loading} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d1fae5',
  },
})
