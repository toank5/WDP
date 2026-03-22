import React, { useState, useCallback, useEffect, useRef } from 'react'
import { View, StyleSheet, Keyboard } from 'react-native'
import {
  Text,
  TextInput,
  IconButton,
  Chip,
  useTheme,
} from 'react-native-paper'

interface SearchBarProps {
  value: string
  onSearchChange: (query: string) => void
  onClear?: () => void
  placeholder?: string
  recentSearches?: string[]
  onRecentSearchPress?: (query: string) => void
  autoFocus?: boolean
}

/**
 * SearchBar - Product search with debounce and recent searches
 *
 * Features:
 * - Debounced search input
 * - Clear button
 * - Recent searches display
 * - Auto-focus option
 * - Keyboard dismiss handling
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onSearchChange,
  onClear,
  placeholder = 'Tìm kiếm sản phẩm...',
  recentSearches = [],
  onRecentSearchPress,
  autoFocus = false,
}) => {
  const theme = useTheme()
  const [isFocused, setIsFocused] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Sync local value with prop
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Handle text change with debounce (300ms)
  const handleTextChange = useCallback((text: string) => {
    setLocalValue(text)

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer for debounce
    debounceTimerRef.current = setTimeout(() => {
      onSearchChange(text.trim())
    }, 300)
  }, [onSearchChange])

  // Handle clear
  const handleClear = useCallback(() => {
    setLocalValue('')
    onSearchChange('')
    if (onClear) {
      onClear()
    }
  }, [onSearchChange, onClear])

  // Handle recent search press
  const handleRecentSearchPress = useCallback(
    (query: string) => {
      setLocalValue(query)
      onSearchChange(query)
      Keyboard.dismiss()
    },
    [onSearchChange]
  )

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Show recent searches when focused and no value
  const showRecentSearches =
    isFocused && !localValue.trim() && recentSearches.length > 0

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View
        style={[
          styles.searchContainer,
          isFocused && styles.searchContainerFocused,
        ]}
      >
        <TextInput
          value={localValue}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          mode="flat"
          dense
          left={<TextInput.Icon icon="magnify" size={20} />}
          right={
            localValue ? (
              <TextInput.Icon
                icon="close"
                size={20}
                onPress={handleClear}
              />
            ) : undefined
          }
          style={styles.input}
          underlineStyle={styles.underline}
          theme={{ colors: { text: theme.colors.onSurface } }}
          autoFocus={autoFocus}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={() => Keyboard.dismiss()}
        />
      </View>

      {/* Recent Searches */}
      {showRecentSearches && (
        <View style={styles.recentContainer}>
          <Text variant="bodySmall" style={styles.recentLabel}>
            Tìm kiếm gần đây
          </Text>
          <View style={styles.recentChips}>
            {recentSearches.slice(0, 5).map((query, index) => (
              <Chip
                key={index}
                mode="outlined"
                compact
                onPress={() => handleRecentSearchPress(query)}
                style={styles.recentChip}
                icon="history"
              >
                {query}
              </Chip>
            ))}
          </View>
        </View>
      )}

      {/* Search Tips */}
      {!showRecentSearches && localValue.trim() && (
        <View style={styles.tipsContainer}>
          <Text variant="bodySmall" style={styles.tipText}>
            Nhấn Enter để tìm kiếm
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchContainerFocused: {
    elevation: 4,
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  underline: {
    display: 'none',
  },
  recentContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
    padding: 12,
    elevation: 2,
  },
  recentLabel: {
    opacity: 0.7,
    marginBottom: 8,
  },
  recentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    height: 28,
  },
  tipsContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  tipText: {
    opacity: 0.5,
  },
})
