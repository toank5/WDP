import React from 'react'
import { Avatar as RNPAvatar, useTheme } from 'react-native-paper'
import { StyleSheet, TouchableOpacity } from 'react-native'

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
  const avatar = (
    <RNPAvatar.Text
      size={size}
      label={label || '?'}
      style={[
        styles.avatar,
        { backgroundColor: backgroundColor || theme.colors.primary },
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
    return (
      <TouchableOpacity onPress={onPress}>
        {avatar}
      </TouchableOpacity>
    )
  }

  return avatar
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 50,
  },
})
