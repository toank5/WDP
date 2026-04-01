import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text, useTheme } from 'react-native-paper'

const steps = ['Address', 'Shipping', 'Payment', 'Review']

type Props = {
  currentStep: 1 | 2 | 3 | 4
}

export const CheckoutStepper: React.FC<Props> = ({ currentStep }) => {
  const theme = useTheme()

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const active = stepNumber <= currentStep
        const isLast = index === steps.length - 1

        return (
          <View key={step} style={styles.stepWrap}>
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.circle,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                    borderColor: active ? theme.colors.primary : theme.colors.outline,
                  },
                ]}
              >
                <Text style={[styles.circleText, { color: active ? '#fff' : theme.colors.onSurface }]}>
                  {stepNumber}
                </Text>
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: stepNumber < currentStep ? theme.colors.primary : theme.colors.outline },
                  ]}
                />
              )}
            </View>
            <Text numberOfLines={1} style={[styles.label, { color: active ? theme.colors.onSurface : theme.colors.onSurfaceDisabled }]}>
              {step}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  stepWrap: {
    flex: 1,
    alignItems: 'center',
  },
  stepRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  line: {
    flex: 1,
    height: 2,
    marginHorizontal: 6,
  },
  label: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500',
  },
})
