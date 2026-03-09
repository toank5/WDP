import { useState } from 'react';
import { Fab, Box, keyframes } from '@mui/material';
import { CameraAlt } from '@mui/icons-material';

interface CaptureButtonProps {
  onCapture: () => void;
  disabled?: boolean;
  isTracking?: boolean;
}

// Shutter flash animation
const shutterFlash = keyframes`
  0% { opacity: 0; }
  10% { opacity: 1; background: white; }
  100% { opacity: 0; }
`;

interface ShutterFlashProps {
  show: boolean;
}

function ShutterFlash({ show }: ShutterFlashProps) {
  if (!show) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        animation: `${shutterFlash} 0.3s ease-out forwards`,
      }}
    />
  );
}

export function CaptureButton({ onCapture, disabled = false, isTracking = false }: CaptureButtonProps) {
  const [showFlash, setShowFlash] = useState(false);

  const handleClick = () => {
    if (disabled) return;

    // Show flash animation
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 300);

    // Trigger capture
    onCapture();
  };

  return (
    <>
      <ShutterFlash show={showFlash} />
      <Fab
        size="large"
        onClick={handleClick}
        disabled={disabled || !isTracking}
        sx={{
          width: 72,
          height: 72,
          bgcolor: 'white',
          border: '4px solid white',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          '&:hover': {
            bgcolor: '#f8fafc',
            transform: 'scale(1.05)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
          '&:disabled': {
            bgcolor: 'rgba(255,255,255,0.5)',
            border: '4px solid rgba(255,255,255,0.5)',
          },
          transition: 'all 0.2s ease',
        }}
      >
        <CameraAlt
          sx={{
            color: disabled || !isTracking ? 'rgba(0,0,0,0.3)' : '#2563eb',
            fontSize: 32,
          }}
        />
      </Fab>
    </>
  );
}
