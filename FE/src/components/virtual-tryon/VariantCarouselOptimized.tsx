import { memo, useCallback, useMemo } from 'react';
import { Box, Avatar, Tooltip } from '@mui/material';
import type { ProductVariant3D } from '@/types/virtual-tryon.types';

interface VariantCarouselOptimizedProps {
  variants: ProductVariant3D[];
  currentVariant: string;
  onChange: (variantId: string) => void;
  disabled?: boolean;
}

// Memoized variant item component
const VariantItem = memo<{
  variant: ProductVariant3D;
  isSelected: boolean;
  isOutOfStock: boolean;
  disabled: boolean;
  onSelect: () => void;
}>(({ variant, isSelected, isOutOfStock, disabled, onSelect }) => {
  const handleClick = useCallback(() => {
    if (!disabled && !isOutOfStock) {
      onSelect();
    }
  }, [disabled, isOutOfStock, onSelect]);

  return (
    <Tooltip
      title={isOutOfStock ? `${variant.name} - Out of Stock` : variant.name}
      arrow
    >
      <Avatar
        onClick={handleClick}
        sx={{
          width: 56,
          height: 56,
          bgcolor: variant.colorCode,
          border: `3px solid ${isSelected ? '#2563eb' : 'transparent'}`,
          boxShadow: isSelected
            ? `0 4px 12px rgba(37, 99, 235, 0.4)`
            : '0 2px 4px rgba(0,0,0,0.2)',
          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
          transition: 'all 0.2s ease',
          cursor: disabled || isOutOfStock ? 'not-allowed' : 'pointer',
          opacity: isOutOfStock ? 0.5 : 1,
          '&:hover': !disabled && !isOutOfStock ? {
            transform: 'scale(1.15)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          } : {},
        }}
      >
        {variant.thumbnail ? (
          <img
            src={variant.thumbnail}
            alt={variant.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              bgcolor: variant.colorCode,
            }}
          />
        )}
      </Avatar>
    </Tooltip>
  );
});

VariantItem.displayName = 'VariantItem';

// Memoized carousel component
export const VariantCarouselOptimized = memo<VariantCarouselOptimizedProps>(({
  variants,
  currentVariant,
  onChange,
  disabled = false,
}) => {
  // Memoize variant selection handlers
  const handlers = useMemo(() => {
    const map = new Map<string, () => void>();
    variants.forEach((variant) => {
      map.set(variant.id, () => onChange(variant.id));
    });
    return map;
  }, [variants, onChange]);

  if (variants.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 160,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: 1.5,
        px: 2,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
      }}
    >
      {variants.map((variant) => (
        <VariantItem
          key={variant.id}
          variant={variant}
          isSelected={variant.id === currentVariant}
          isOutOfStock={!variant.inStock}
          disabled={disabled}
          onSelect={handlers.get(variant.id)!}
        />
      ))}
    </Box>
  );
});

VariantCarouselOptimized.displayName = 'VariantCarouselOptimized';
