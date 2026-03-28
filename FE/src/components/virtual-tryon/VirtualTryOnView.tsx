import { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Fab,
  Switch,
  FormControlLabel,
  Grid,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  Close as CloseIcon,
  ShoppingCart as CartIcon,
  Settings as SettingsIcon,
  ViewInAr as ThreeDIcon,
  TouchApp as TouchAppIcon,
  ThreeDRotation as ThreeDRotationIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';

import { useVirtualTryOnStore } from '@/store/virtual-tryon.store';
import { useCameraPermission } from '@/hooks/useCameraPermission';
import { useFaceTracking } from '@/hooks/useFaceTracking';
import { getProductById } from '@/lib/product-api';
import tryOnAnalytics from '@/lib/virtual-tryon-analytics';

import { PermissionDialog } from './PermissionDialog';
import { FaceGuide } from './FaceGuide';
import { SimpleGlassesOverlay } from './Glasses3DOverlay';

import type { ProductVariant3D, FaceTrackingData, FaceShape } from '@/types/virtual-tryon.types';

// Lazy load 3D components for better performance
const Glasses3DOverlay = lazy(() =>
  import('./Glasses3DOverlay').then(m => ({ default: m.Glasses3DOverlay }))
);

// Demo mode glasses overlay (simplified 2D representation)
function DemoGlassesOverlay() {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 200,
        height: 80,
        pointerEvents: 'none',
      }}
    >
      <svg
        viewBox="0 0 200 80"
        style={{
          width: '100%',
          height: '100%',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
        }}
      >
        <ellipse cx="50" cy="40" rx="40" ry="30" fill="rgba(0,0,0,0.1)" stroke="#333" strokeWidth="3" />
        <ellipse cx="150" cy="40" rx="40" ry="30" fill="rgba(0,0,0,0.1)" stroke="#333" strokeWidth="3" />
        <line x1="90" y1="40" x2="110" y2="40" stroke="#333" strokeWidth="3" />
        <line x1="10" y1="35" x2="0" y2="30" stroke="#333" strokeWidth="3" />
        <line x1="190" y1="35" x2="200" y2="30" stroke="#333" strokeWidth="3" />
      </svg>
    </Box>
  );
}

export function VirtualTryOnView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get URL params
  const productId = searchParams.get('productId') || '';
  const variantId = searchParams.get('variantId') || '';

  // Store state
  const {
    isActive,
    currentVariantId,
    cameraPermission,
    faceDetectionState,
    startSession,
    endSession,
    setCameraPermission,
    setIsCameraActive,
    setFaceDetectionState,
  } = useVirtualTryOnStore();

  // Local state
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [use3D, setUse3D] = useState(false);
  const [faceData, setFaceData] = useState<FaceTrackingData | null>(null);
  const [product3DModel, setProduct3DModel] = useState<string | null>(null);
  const [interactiveMode, setInteractiveMode] = useState(false);

  // Camera permission
  const {
    permission: cameraStatus,
    stream,
    error: cameraError,
    isSupported: cameraSupported,
    requestPermission,
    stopStream,
  } = useCameraPermission();

  // Face tracking
  const { isTracking, startTracking, stopTracking } = useFaceTracking({
    videoElement: videoRef.current,
    enabled: cameraStatus === 'granted' && !demoMode,
    onFaceDetected: useCallback((data: FaceTrackingData) => {
      setFaceDetectionState(data.state);
      setFaceData(data);

      // Track face detection analytics
      if (data.state === 'aligned') {
        tryOnAnalytics.trackFaceDetected(data.confidence);
      }
    }, [setFaceDetectionState]),
    onFaceLost: useCallback(() => {
      setFaceDetectionState('lost');
      setFaceData(null);
    }, [setFaceDetectionState]),
  });

  // Default variant for frame color
  const defaultVariant: ProductVariant3D = {
    id: 'default',
    productId: productId || 'p1',
    name: 'Default',
    color: 'Black',
    colorCode: '#333333',
    price: 0,
    inStock: true,
    thumbnail: '',
  };

  // Initialize session with analytics
  useEffect(() => {
    if (productId && variantId) {
      startSession(productId, variantId);
      tryOnAnalytics.startSession(productId, variantId);
    }

    return () => {
      endSession();
      tryOnAnalytics.endSession();
      stopStream();
      stopTracking();
    };
  }, [productId, variantId, startSession, endSession, stopStream, stopTracking]);

  // Fetch product data and get 3D model URL
  useEffect(() => {
    const fetchProduct3DModel = async () => {
      if (!productId) return;

      try {
        const product = await getProductById(productId);
        console.log('[VirtualTryOn] Product loaded:', product);
        console.log('[VirtualTryOn] Product images3D:', product.images3D);
        console.log('[VirtualTryOn] Looking for variant SKU:', variantId);

        // First check product-level 3D models
        if (product.images3D && product.images3D.length > 0) {
          console.log('[VirtualTryOn] Using product-level 3D model:', product.images3D[0]);
          setProduct3DModel(product.images3D[0]);
          return;
        }

        // Find the variant with matching SKU (variantId)
        const variant = product.variants?.find((v) => v.sku === variantId);
        console.log('[VirtualTryOn] Found variant:', variant);

        if (variant?.images3D && variant.images3D.length > 0) {
          // Use the first 3D model
          console.log('[VirtualTryOn] Using variant 3D models:', variant.images3D[0]);
          setProduct3DModel(variant.images3D[0]);
        } else {
          console.log('[VirtualTryOn] No 3D models found');
        }
      } catch (error) {
        console.error('[VirtualTryOn] Failed to fetch product:', error);
      }
    };

    fetchProduct3DModel();
  }, [productId, variantId]);

  // Set up camera stream
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.error('[VirtualTryOn] Video play failed:', err);
      });
      setIsCameraActive(true);

      videoRef.current.onloadedmetadata = () => {
        if (!demoMode) {
          startTracking();
        }
      };
    }
  }, [stream, demoMode, setIsCameraActive, startTracking]);

  // Show permission dialog if denied or unsupported
  useEffect(() => {
    if (cameraStatus === 'denied' || !cameraSupported) {
      setShowPermissionDialog(true);
    }
  }, [cameraStatus, cameraSupported]);

  // Auto-request camera permission on mount when in prompt state
  useEffect(() => {
    if (cameraStatus === 'prompt' && !demoMode) {
      requestPermission();
    }
  }, [cameraStatus, demoMode, requestPermission]);

  // Esc key listener to toggle interactive mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInteractiveMode((prev) => {
          const newMode = !prev;
          toast.info(newMode ? 'Interactive mode: Use mouse to rotate/zoom the 3D model. Press Esc to exit.' : 'Normal mode: Buttons enabled. Press Esc to enable 3D interaction.', {
            duration: 3000,
          });
          return newMode;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle permission request
  const handleRequestPermission = async () => {
    setDemoMode(false);
    const result = await requestPermission();
    if (result) {
      setCameraPermission('granted');
      setShowPermissionDialog(false);
      tryOnAnalytics.trackCameraPermission(true);
    } else {
      tryOnAnalytics.trackCameraPermission(false);
    }
  };

  // Handle demo mode
  const handleDemoMode = () => {
    setDemoMode(true);
    setShowPermissionDialog(false);
    setCameraPermission('granted');
    setFaceDetectionState('aligned');
    tryOnAnalytics.trackDemoMode();
  };

  // Handle close
  const handleClose = () => {
    stopStream();
    stopTracking();
    tryOnAnalytics.endSession();
    navigate(-1);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        bgcolor: '#000',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Permission Dialog */}
      <PermissionDialog
        open={showPermissionDialog}
        error={cameraError}
        isUnsupported={!cameraSupported}
        onRequestPermission={handleRequestPermission}
        onDemoMode={handleDemoMode}
        onClose={handleClose}
      />

      {/* Top Bar */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 25,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
        }}
      >
        <IconButton onClick={handleClose} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)' }}>
          <CloseIcon />
        </IconButton>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* 3D Mode Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={use3D}
                onChange={(e) => setUse3D(e.target.checked)}
                color="primary"
                size="small"
              />
            }
            label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'white' }}>
              <ThreeDIcon fontSize="small" />
              <Typography variant="caption">3D</Typography>
            </Box>}
            sx={{ ml: 1 }}
          />
        </Box>
      </Box>

      {/* Interactive Mode Indicator */}
      <Fade in={use3D}>
        <Box
          sx={{
            position: 'absolute',
            top: 70,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          <Fade in={interactiveMode}>
            <Box
              sx={{
                bgcolor: interactiveMode ? 'rgba(16, 185, 129, 0.9)' : 'rgba(59, 130, 246, 0.8)',
                color: 'white',
                px: 2,
                py: 1,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              {interactiveMode ? (
                <>
                  <ThreeDRotationIcon fontSize="small" />
                  <Typography variant="caption" fontWeight="bold">
                    Interactive Mode - Press Esc to exit
                  </Typography>
                </>
              ) : (
                <>
                  <TouchAppIcon fontSize="small" />
                  <Typography variant="caption">
                    Press Esc to interact with 3D model
                  </Typography>
                </>
              )}
            </Box>
          </Fade>
        </Box>
      </Fade>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Camera Feed */}
        {demoMode ? (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            <Box
              sx={{
                width: 300,
                height: 400,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.1)',
                border: '2px dashed rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h6" color="white" textAlign="center">
                Demo Mode
                <br />
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Position your face here
                </Typography>
              </Typography>
            </Box>
          </Box>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'relative',
                zIndex: 1,
              }}
            />
          </>
        )}

        {/* Face Guide */}
        {!demoMode && (
          <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
            <FaceGuide aligned={faceDetectionState === 'aligned'} />
          </Box>
        )}

        {/* Glasses Overlay - 3D or 2D based on mode */}
        {(demoMode || faceDetectionState === 'aligned') && (
          <Suspense fallback={<CircularProgress sx={{ color: 'white', position: 'absolute', top: '50%', left: '50%' }} />}>
            {use3D && faceData ? (
              <Glasses3DOverlay
                faceData={faceData}
                modelUrl={product3DModel || undefined}
                frameColor={defaultVariant.colorCode}
                interactiveMode={interactiveMode}
              />
            ) : (
              <SimpleGlassesOverlay
                faceData={faceData}
                frameColor={defaultVariant.colorCode}
              />
            )}
          </Suspense>
        )}

        {/* Loading State */}
        {cameraStatus === 'prompt' && !demoMode && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: 'white',
            }}
          >
            <CircularProgress size={48} sx={{ mb: 2, color: '#2563eb' }} />
            <Typography variant="body1">Initializing camera...</Typography>
          </Box>
        )}
      </Box>

      {/* Controls */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
          pb: 4,
          pt: 8,
          px: 2,
          zIndex: 20,
          pointerEvents: interactiveMode ? 'none' : 'auto',
        }}
      />

      {/* Interactive Mode Toggle - always clickable, separate from controls */}
      {use3D && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
          }}
        >
          <Button
            variant={interactiveMode ? 'contained' : 'outlined'}
            onClick={() => setInteractiveMode(!interactiveMode)}
            startIcon={interactiveMode ? <TouchAppIcon /> : <ThreeDRotationIcon />}
            sx={{
              bgcolor: interactiveMode ? 'rgba(16, 185, 129, 0.9)' : 'transparent',
              borderColor: 'rgba(255, 255, 255, 0.5)',
              color: 'white',
              px: 3,
              pointerEvents: 'auto',
              '&:hover': {
                bgcolor: interactiveMode ? 'rgba(5, 150, 105, 0.9)' : 'rgba(255, 255, 255, 0.1)',
                borderColor: 'white',
              },
            }}
          >
            {interactiveMode ? 'Exit Interactive (Esc)' : 'Interactive Mode (Esc)'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
