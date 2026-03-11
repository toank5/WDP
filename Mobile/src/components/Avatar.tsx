import React from 'react'
import { Avatar as RNPAvatar, useTheme, MD3Colors } from 'react-native-paper'
import { StyleSheet, View } from 'react-native'

interface AvatarProps {
  uri?: string
  label?: string
  size?: number
  backgroundColor?: string
  style?: any
  onPress?: () => void
}

export function CustomAvatar({
  uri,
  label,
  size = 40,
  backgroundColor,
  style,
  onPress,
}: AvatarProps) {
  const theme = useTheme()
  const colors = theme.colors as MD3Colors

  const avatar = (
    <RNPAvatar.Text
      size={size}
      label={label || '?'}
      style={[
        styles.avatar,
        { backgroundColor: backgroundColor || colors.primary },
        style,
      ]}
      theme={theme}
    >
      {uri ? (
        <RNPAvatar.Image
          size={size}
          source={{ uri }}
          theme={theme}
        />
      ) : null}
    </RNPAvatar.Text>
  )

  if (onPress) {
    return <View onPress={onPress}>{avatar}</View>
  }

  return avatar
}

const styles = StyleSheet.create({
  avatar: {
    overflow: 'hidden',
  },
})
