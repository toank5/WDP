import { memo, useCallback, useMemo, useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Box,
  IconButton,
  Checkbox,
  Chip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import type { CapturedSnapshot } from '@/types/virtual-tryon.types';

interface SnapshotCardOptimizedProps {
  snapshot: CapturedSnapshot;
  productName?: string;
  variantName?: string;
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  showActions?: boolean;
  comparisonMode?: boolean;
}

// Memoized time formatter
const formatTime = useMemo(() => {
  const cache = new Map<number, string>();
  return (date: Date): string => {
    const timestamp = date.getTime();
    if (cache.has(timestamp)) {
      return cache.get(timestamp)!;
    }

    const now = new Date();
    const diff = now.getTime() - timestamp;
    const minutes = Math.floor(diff / 60000);

    let result: string;
    if (minutes < 1) result = 'Just now';
    else if (minutes < 60) result = `${minutes}m ago`;
    else {
      const hours = Math.floor(minutes / 60);
      result = hours < 24 ? `${hours}h ago` : date.toLocaleDateString();
    }

    cache.set(timestamp, result);
    return result;
  };
}, []);

// Memoized snapshot card component
export const SnapshotCardOptimized = memo<SnapshotCardOptimizedProps>(({
  snapshot,
  productName,
  variantName,
  selected = false,
  onSelect,
  onDelete,
  onView,
  showActions = true,
  comparisonMode = false,
}) => {
  const [imageError, setImageError] = useState(false);

  // Memoize handlers to prevent re-renders
  const handleSelect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.();
  }, [onSelect]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  }, [onDelete]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // Memoize time string
  const timeString = useMemo(
    () => formatTime(snapshot.timestamp),
    [snapshot.timestamp]
  );

  // Memoize face shape badge
  const faceShapeBadge = useMemo(() => {
    if (!snapshot.faceShape) return null;
    return (
      <Chip
        label={snapshot.faceShape}
        size="small"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          bgcolor: 'rgba(255,255,255,0.9)',
          fontSize: '0.7rem',
        }}
      />
    );
  }, [snapshot.faceShape]);

  return (
    <Card
      onClick={onView}
      sx={{
        position: 'relative',
        cursor: onView ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        border: selected ? `3px solid #2563eb` : '3px solid transparent',
        '&:hover': onView ? {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        } : {},
      }}
    >
      {/* Selected indicator for comparison mode */}
      {comparisonMode && (
        <Checkbox
          checked={selected}
          onChange={handleSelect}
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 2,
            bgcolor: 'rgba(255,255,255,0.9)',
            borderRadius: 1,
            p: 0.5,
          }}
          icon={<CheckIcon sx={{ color: 'text.secondary' }} />}
          checkedIcon={<CheckIcon sx={{ color: '#2563eb' }} />}
        />
      )}

      {/* Image */}
      <Box
        sx={{
          position: 'relative',
          paddingTop: '100%',
          bgcolor: '#f1f5f9',
        }}
      >
        {!imageError ? (
          <CardMedia
            component="img"
            image={snapshot.thumbnailUrl}
            alt={`${productName || 'Product'} - ${variantName || snapshot.variantId}`}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
            }}
          >
            No image
          </Box>
        )}

        {faceShapeBadge}
      </Box>

      {/* Content */}
      <CardContent sx={{ pt: 1.5, pb: 1 }}>
        {productName && (
          <Typography variant="body2" fontWeight={600} noWrap sx={{ mb: 0.5 }}>
            {productName}
          </Typography>
        )}
        {variantName && (
          <Typography variant="caption" color="text.secondary" display="block">
            {variantName}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          {timeString}
        </Typography>
      </CardContent>

      {/* Actions */}
      {showActions && (
        <CardActions sx={{ justifyContent: 'flex-end', pt: 0, pb: 1 }}>
          {onDelete && (
            <IconButton size="small" onClick={handleDelete} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </CardActions>
      )}
    </Card>
  );
});

SnapshotCardOptimized.displayName = 'SnapshotCardOptimized';
