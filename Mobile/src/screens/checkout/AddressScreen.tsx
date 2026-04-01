import React, { useState, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text, IconButton, Surface } from 'react-native-paper'
import { AddressForm, type Address } from '../../components/checkout/AddressForm'
import { ScreenContainer, CheckoutStepper } from '../../components'

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
    <ScreenContainer>
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerRow}>
          <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Shipping address
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </Surface>
      <CheckoutStepper currentStep={1} />
      <View style={styles.container}>
        <AddressForm onSubmit={handleAddressSubmit} loading={loading} />
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
  },
  headerSpacer: {
    width: 48,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
})
