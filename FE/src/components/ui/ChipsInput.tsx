import React, { useState, KeyboardEvent, useRef, useEffect } from 'react'
import { Box, Chip, ChipProps, TextField, SxProps, Theme } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useTheme } from '@mui/material/styles'

/**
 * Props for the ChipsInput component
 */
export interface ChipsInputProps {
  /**
   * Current array of chip values
   */
  value: string[]
  /**
   * Callback when chips change
   */
  onChange: (value: string[]) => void
  /**
   * Placeholder text for the input field
   * @default "Type and press Enter to add..."
   */
  placeholder?: string
  /**
   * Optional class name (uses sx prop instead)
   */
  className?: string
  /**
   * Additional MUI sx prop for custom styling
   */
  sx?: SxProps<Theme>
  /**
   * Whether duplicate chips are allowed
   * @default false
   */
  allowDuplicates?: boolean
  /**
   * Maximum number of chips allowed
   */
  maxChips?: number
  /**
   * Callback when a chip is added
   */
  onChipAdd?: (chip: string) => void
  /**
   * Callback when a chip is removed
   */
  onChipRemove?: (chip: string) => void
  /**
   * Custom props for the chips
   */
  chipProps?: Partial<ChipProps>
  /**
   * Whether the input is disabled
   */
  disabled?: boolean
  /**
   * Error state
   */
  error?: boolean
  /**
   * Helper text to display
   */
  helperText?: string
  /**
   * Label for the input
   */
  label?: string
  /**
   * Whether to show input as full width
   */
  fullWidth?: boolean
}

/**
 * ChipsInput component built with MUI
 * Allows users to input multiple values as chips
 *
 * @example
 * ```tsx
 * <ChipsInput
 *   value={chips}
 *   onChange={setChips}
 *   placeholder="Add tags..."
 *   label="Tags"
 * />
 * ```
 */
const ChipsInput: React.FC<ChipsInputProps> = ({
  value = [],
  onChange,
  placeholder = 'Type and press Enter to add...',
  className,
  sx,
  allowDuplicates = false,
  maxChips,
  onChipAdd,
  onChipRemove,
  chipProps,
  disabled = false,
  error = false,
  helperText,
  label,
  fullWidth = false,
}) => {
  const theme = useTheme()
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Focus the input when clicking on the container
  const handleContainerClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addChip()
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last chip when backspace is pressed on empty input
      removeChip(value[value.length - 1])
    }
  }

  const addChip = () => {
    const trimmed = inputValue.trim()

    // Validate: check if empty
    if (!trimmed) {
      return
    }

    // Validate: check duplicates
    if (!allowDuplicates && value.includes(trimmed)) {
      return
    }

    // Validate: check max chips
    if (maxChips !== undefined && value.length >= maxChips) {
      return
    }

    onChange([...value, trimmed])
    onChipAdd?.(trimmed)
    setInputValue('')
  }

  const removeChip = (chipToRemove: string) => {
    const newValue = value.filter((chip) => chip !== chipToRemove)
    onChange(newValue)
    onChipRemove?.(chipToRemove)
  }

  // Handle paste event to add multiple chips
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData('text')
    const items = pasteData
      .split(/[\n,\t]+/)
      .map((item) => item.trim())
      .filter(Boolean)

    if (items.length > 0) {
      const newChips = allowDuplicates
        ? items
        : items.filter((item) => !value.includes(item))

      if (maxChips !== undefined) {
        const availableSlots = maxChips - value.length
        onChange([...value, ...newChips.slice(0, availableSlots)])
        newChips.slice(0, availableSlots).forEach((chip) => onChipAdd?.(chip))
      } else {
        onChange([...value, ...newChips])
        newChips.forEach((chip) => onChipAdd?.(chip))
      }
    }
  }

  // Calculate input width based on content
  useEffect(() => {
    if (inputRef.current) {
      const textWidth = inputRef.current.value.length * 8
      inputRef.current.style.width = `${Math.max(120, textWidth)}px`
    }
  }, [inputValue])

  const defaultChipSx: SxProps<Theme> = {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.1)',
    color: theme.palette.primary.main,
    fontWeight: 600,
    fontSize: '0.75rem',
    height: 28,
    margin: '2px',
    '& .MuiChip-deleteIcon': {
      color: theme.palette.primary.main,
      '&:hover': {
        color: theme.palette.primary.dark,
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
      },
    },
    ...chipProps?.sx,
  }

  const containerSx: SxProps<Theme> = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 0.5,
    minHeight: 56,
    padding: '8px 12px',
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${error ? theme.palette.error.main : theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    transition: 'border-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: disabled ? 'not-allowed' : 'text',
    '&:hover': {
      borderColor: error ? theme.palette.error.main : theme.palette.text.primary,
    },
    '&:focus-within': {
      borderColor: error ? theme.palette.error.main : theme.palette.primary.main,
      boxShadow: `0 0 0 2px ${error ? 'rgba(239, 68, 68, 0.2)' : 'rgba(37, 99, 235, 0.2)'}`,
    },
    ...(disabled && {
      backgroundColor: theme.palette.action.disabledBackground,
      cursor: 'not-allowed',
      '& .MuiInputBase-input': {
        cursor: 'not-allowed',
      },
    }),
    ...sx,
  }

  return (
    <Box className={className} sx={fullWidth ? { width: '100%' } : undefined}>
      {label && (
        <Box
          component="label"
          sx={{
            display: 'block',
            mb: 0.5,
            fontSize: '0.875rem',
            fontWeight: 500,
            color: error ? theme.palette.error.main : 'text.primary',
          }}
        >
          {label}
        </Box>
      )}
      <Box
        ref={containerRef}
        onClick={handleContainerClick}
        sx={fullWidth ? { ...containerSx, width: '100%' } : containerSx}
      >
        {value.map((chip) => (
          <Chip
            key={chip}
            label={chip}
            size="small"
            onDelete={disabled ? undefined : () => removeChip(chip)}
            deleteIcon={<CloseIcon sx={{ fontSize: 14 }} />}
            {...chipProps}
            sx={defaultChipSx}
          />
        ))}
        <Box
          component="input"
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={addChip}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled || (maxChips !== undefined && value.length >= maxChips)}
          sx={{
            flex: 1,
            minWidth: 120,
            border: 'none',
            outline: 'none',
            fontSize: '0.875rem',
            backgroundColor: 'transparent',
            color: 'text.primary',
            '&::placeholder': {
              color: 'text.disabled',
            },
            '&:disabled': {
              cursor: 'not-allowed',
            },
          }}
        />
      </Box>
      {helperText && (
        <Box
          sx={{
            mt: 0.5,
            fontSize: '0.75rem',
            color: error ? theme.palette.error.main : 'text.secondary',
          }}
        >
          {helperText}
        </Box>
      )}
    </Box>
  )
}

export default ChipsInput
