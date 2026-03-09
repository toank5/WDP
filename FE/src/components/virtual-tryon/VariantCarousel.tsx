import { Box, Avatar, AvatarProps, Tooltip, useTheme } from '@mui/material';
import { Fade } from '@mui/material';

interface Variant {
  id: string;
  name: string;
  color: string;
  colorCode: string;
  thumbnail?: string;
  inStock?: boolean;
}

interface VariantCarouselProps {
  variants: Variant[];
  currentVariant: string;
  onChange: (variantId: string) => void;
  disabled?: boolean;
}

export function VariantCarousel({
  variants,
  currentVariant,
  onChange,
  disabled = false,
}: VariantCarouselProps) {
  const theme = useTheme();

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
      {variants.map((variant) => {
        const isSelected = variant.id === currentVariant;
        const isOutOfStock = !variant.inStock;

        return (
          <Tooltip
            key={variant.id}
            title={isOutOfStock ? `${variant.name} - Out of Stock` : variant.name}
            arrow
          >
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: variant.colorCode,
                border: `3px solid ${isSelected ? theme.palette.primary.main : 'transparent'}`,
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
              onClick={() => {
                if (!disabled && !isOutOfStock) {
                  onChange(variant.id);
                }
              }}
            >
              {variant.thumbnail ? (
                <img
                  src={variant.thumbnail}
                  alt={variant.name}
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
      })}
    </Box>
  );
}
