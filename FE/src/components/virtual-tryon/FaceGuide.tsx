import { Box, Fade } from '@mui/material';
import { useState, useEffect } from 'react';

interface FaceGuideProps {
  visible?: boolean;
  aligned?: boolean;
  alignmentState?: 'searching' | 'detecting' | 'aligned' | 'misaligned';
}

export function FaceGuide({ visible = true, aligned = false, alignmentState = 'searching' }: FaceGuideProps) {
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    // Pulse animation when searching
    const pulseInterval = setInterval(() => {
      setShowPulse((prev) => !prev);
    }, 1500);

    return () => clearInterval(pulseInterval);
  }, []);

  if (!visible) return null;

  const guideColor = aligned ? '#10b981' : alignmentState === 'aligned' ? '#10b981' : 'rgba(255, 255, 255, 0.6)';
  const borderStyle = aligned || alignmentState === 'aligned' ? 'solid' : 'dashed';

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '70%',
        aspectRatio: '3/4',
        border: `2px ${borderStyle} ${guideColor}`,
        borderRadius: '50%',
        pointerEvents: 'none',
        transition: 'all 0.3s ease',
        ...(showPulse && !aligned && alignmentState === 'searching' && {
          boxShadow: `0 0 0 ${showPulse ? '40px' : '20px'} rgba(37, 99, 235, 0.2)`,
        }),
        ...(aligned && {
          boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.3)',
        }),
      }}
    >
      {/* Corner indicators */}
      <Box
        sx={{
          position: 'absolute',
          top: -1,
          left: -1,
          width: 20,
          height: 20,
          borderTopLeftRadius: 16,
          borderTop: `3px solid ${guideColor}`,
          borderLeft: `3px solid ${guideColor}`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: -1,
          right: -1,
          width: 20,
          height: 20,
          borderTopRightRadius: 16,
          borderTop: `3px solid ${guideColor}`,
          borderRight: `3px solid ${guideColor}`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -1,
          left: -1,
          width: 20,
          height: 20,
          borderBottomLeftRadius: 16,
          borderBottom: `3px solid ${guideColor}`,
          borderLeft: `3px solid ${guideColor}`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -1,
          right: -1,
          width: 20,
          height: 20,
          borderBottomRightRadius: 16,
          borderBottom: `3px solid ${guideColor}`,
          borderRight: `3px solid ${guideColor}`,
        }}
      />
    </Box>
  );
}
