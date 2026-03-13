import React from 'react'
import { TextInput as RNPTextInput, useTheme, HelperText, MD3Colors } from 'react-native-paper'
import { StyleSheet, View, Text } from 'react-native'

interface InputProps {
  label?: string
  placeholder?: string
  value?: string
  onChangeText?: (text: string) => void
  onBlur?: () => void
  onFocus?: () => void
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'
  multiline?: boolean
  numberOfLines?: number
  error?: string
  disabled?: boolean
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
  onRightIconPress?: () => void
  style?: any
  containerStyle?: any
  maxLength?: number
}

export function CustomInput({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  onFocus,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  error,
  disabled = false,
  icon,
  rightIcon,
  onRightIconPress,
  style,
  containerStyle,
  maxLength,
}: InputProps) {
  const theme = useTheme()
  const colors = theme.colors as MD3Colors

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <RNPTextInput
        label={label ? ' ' : undefined}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        onFocus={onFocus}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        disabled={disabled}
        mode="outlined"
        outlineStyle={error ? 'solid' : 'dashed'}
        outlineColor={error ? colors.error : colors.outline}
        activeOutlineColor={colors.primary}
        theme={theme}
        style={[styles.input, style]}
        right={rightIcon ? (
          <RNPTextInput.Icon
            name="close"
            onPress={() => {
              onChangeText?.('')
              onRightIconPress?.()
            }}
          />
        ) : icon}
        left={icon}
        maxLength={maxLength}
      />
      {error && (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  input: {
    backgroundColor: '#ffffff',
    fontSize: 16,
  },
})
