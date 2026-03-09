import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Fade,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import type { FaceShape } from '@/types/virtual-tryon.types';
import { FACE_SHAPE_RECOMMENDATIONS, FACE_SHAPE_ICONS } from '@/types/virtual-tryon.types';

interface FaceShapeResultProps {
  faceShape: FaceShape | null;
  open: boolean;
  onViewRecommended?: () => void;
  onDismiss?: () => void;
  autoDismissDelay?: number;
}

export function FaceShapeResult({
  faceShape,
  open,
  onViewRecommended,
  onDismiss,
  autoDismissDelay = 8000,
}: FaceShapeResultProps) {
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    setVisible(open);

    if (open && autoDismissDelay > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, autoDismissDelay);

      return () => clearTimeout(timer);
    }
  }, [open, autoDismissDelay, onDismiss]);

  if (!faceShape || !visible) return null;

  const recommendation = FACE_SHAPE_RECOMMENDATIONS[faceShape];
  const icon = FACE_SHAPE_ICONS[faceShape];

  return (
    <Fade in={visible} timeout={{ enter: 500, exit: 300 }}>
      <Paper
        elevation={8}
        sx={{
          position: 'absolute',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: 340,
          bgcolor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(8px)',
          borderRadius: 3,
          overflow: 'hidden',
          zIndex: 100,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon />
            <Typography variant="subtitle2" fontWeight={600}>
              Face Shape Detected!
            </Typography>
          </Box>
          <Box
            sx={{ cursor: 'pointer', p: 0.5 }}
            onClick={() => {
              setVisible(false);
              onDismiss?.();
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ p: 2.5, textAlign: 'center' }}>
          {/* Face Shape Badge */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Chip
              avatar={<Avatar sx={{ bgcolor: 'transparent' }}>{icon}</Avatar>}
              label={faceShape.charAt(0).toUpperCase() + faceShape.slice(1) + ' Shape'}
              sx={{
                fontSize: '1rem',
                fontWeight: 600,
                px: 1,
                py: 2,
                height: 'auto',
                bgcolor: 'success.light',
                color: 'success.dark',
              }}
            />
          </Box>

          {/* Fit Message */}
          <Box sx={{ mb: 2 }}>
            <CheckIcon
              sx={{
                color: 'success.main',
                fontSize: 32,
                mb: 1,
              }}
            />
            <Typography variant="body1" fontWeight={500}>
              {recommendation.fit}
            </Typography>
          </Box>

          {/* Recommendation */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            {recommendation.recommended}
          </Typography>

          {/* Action Button */}
          {onViewRecommended && (
            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={onViewRecommended}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              See Recommended Styles
            </Button>
          )}

          {/* Auto-dismiss indicator */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 1.5,
              display: 'block',
            }}
          >
            Auto-dismiss in {Math.ceil(autoDismissDelay / 1000)}s
          </Typography>
        </Box>
      </Paper>
    </Fade>
  );
}
