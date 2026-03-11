import { useState } from 'react';
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
  ZoomIn as ZoomInIcon,
} from '@mui/icons-material';
import type { CapturedSnapshot } from '@/types/virtual-tryon.types';

interface SnapshotCardProps {
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

export function SnapshotCard({
  snapshot,
  productName,
  variantName,
  selected = false,
  onSelect,
  onDelete,
  onView,
  showActions = true,
  comparisonMode = false,
}: SnapshotCardProps) {
  const [imageError, setImageError] = useState(false);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card
      sx={{
        position: 'relative',
        cursor: onView ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        border: selected ? `3px solid #2563eb` : '3px solid transparent',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
      onClick={onView}
    >
      {/* Selected indicator for comparison mode */}
      {comparisonMode && (
        <Checkbox
          checked={selected}
          onChange={onSelect}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
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
          paddingTop: '100%', // 1:1 aspect ratio
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
            onError={() => setImageError(true)}
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

        {/* Face shape badge */}
        {snapshot.faceShape && (
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
        )}
      </Box>

      {/* Content */}
      <CardContent sx={{ pt: 1.5, pb: 1 }}>
        {productName && (
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
            sx={{ mb: 0.5 }}
          >
            {productName}
          </Typography>
        )}
        {variantName && (
          <Typography variant="caption" color="text.secondary" display="block">
            {variantName}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          {formatTime(snapshot.timestamp)}
        </Typography>
      </CardContent>

      {/* Actions */}
      {showActions && (
        <CardActions sx={{ justifyContent: 'flex-end', pt: 0, pb: 1 }}>
          {onDelete && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </CardActions>
      )}
    </Card>
  );
}
