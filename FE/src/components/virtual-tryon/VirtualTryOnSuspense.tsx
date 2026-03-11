import { lazy, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';

// Lazy load Virtual Try-On components for better performance
// These will only be loaded when the user actually uses the feature
export const VirtualTryOnView = lazy(() =>
  import('./VirtualTryOnView').then(m => ({
    default: m.VirtualTryOnView
  }))
);

// Loading fallback component
export function VirtualTryOnSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#000',
            zIndex: 9999,
          }}
        >
          <CircularProgress sx={{ color: '#2563eb' }} />
        </Box>
      }
    >
      {children}
    </Suspense>
  );
}
