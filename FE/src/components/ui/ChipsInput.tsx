import React, { useState, KeyboardEvent } from 'react'
import { FiX } from 'react-icons/fi'

interface ChipsInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

const ChipsInput: React.FC<ChipsInputProps> = ({
  value = [],
  onChange,
  placeholder = 'Type and press Enter to add...',
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addChip()
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last chip when backspace is pressed on empty input
      onChange(value.slice(0, -1))
    }
  }

  const addChip = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInputValue('')
  }

  const removeChip = (chipToRemove: string) => {
    onChange(value.filter((chip) => chip !== chipToRemove))
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus-within:border-blue-700 transition-all ${className}`}>
      {value.map((chip) => (
        <span
          key={chip}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg group"
        >
          {chip}
          <button
            type="button"
            onClick={() => removeChip(chip)}
            className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 transition-colors"
            tabIndex={-1}
          >
            <FiX className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addChip}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] outline-none text-sm bg-transparent placeholder:text-slate-400"
      />
    </div>
  )
}

export default ChipsInput
