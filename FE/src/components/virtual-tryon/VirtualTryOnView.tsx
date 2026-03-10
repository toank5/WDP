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
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Close as CloseIcon,
  ShoppingCart as CartIcon,
  Settings as SettingsIcon,
  ViewInAr as ThreeDIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';

import { useVirtualTryOnStore } from '@/store/virtual-tryon.store';
import { useCameraPermission } from '@/hooks/useCameraPermission';
import { useFaceTracking } from '@/hooks/useFaceTracking';
import { useSnapshotCapture } from '@/hooks/useSnapshotCapture';
import { cartApi } from '@/lib/cart-api';
import tryOnAnalytics from '@/lib/virtual-tryon-analytics';

import { PermissionDialog } from './PermissionDialog';
import { FaceGuide } from './FaceGuide';
import { VariantCarousel } from './VariantCarousel';
import { CaptureButton } from './CaptureButton';
import { MirrorToggle } from './MirrorToggle';
import { FaceShapeResult } from './FaceShapeResult';
import { SnapshotCard } from './SnapshotCard';
import { ShareDialog } from './ShareDialog';
import { SimpleGlassesOverlay } from './Glasses3DOverlay';

import type { ProductVariant3D, FaceTrackingData, FaceShape } from '@/types/virtual-tryon.types';

// Lazy load 3D components for better performance
const Glasses3DOverlay = lazy(() =>
  import('./Glasses3DOverlay').then(m => ({ default: m.Glasses3DOverlay }))
);

// Demo mode glasses overlay (simplified 2D representation)
function DemoGlassesOverlay({ mirrorMode }: { mirrorMode: boolean }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scaleX(${mirrorMode ? -1 : 1})`,
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
    faceShape,
    faceShapeAnalyzed,
    faceShapeShown,
    snapshots,
    selectedSnapshotId,
    mirrorMode,
    compareMode,
    startSession,
    endSession,
    setCameraPermission,
    setIsCameraActive,
    setFaceDetectionState,
    setFaceShape,
    setFaceShapeShown,
    addSnapshot,
    removeSnapshot,
    selectSnapshot,
    toggleMirror,
  } = useVirtualTryOnStore();

  // Local state
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedSnapshotForShare, setSelectedSnapshotForShare] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [use3D, setUse3D] = useState(false);
  const [faceData, setFaceData] = useState<FaceTrackingData | null>(null);

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
    onFaceShapeDetected: useCallback((shape: FaceShape) => {
      setFaceShape(shape);
      tryOnAnalytics.trackFaceShapeDetected(shape, 0.9);
    }, [setFaceShape]),
  });

  // Snapshot capture
  const { captureSnapshot } = useSnapshotCapture({
    productId,
    variantId: currentVariantId || variantId,
    faceShape: faceShape || undefined,
    mirrorMode,
  });

  // Demo variants
  const demoVariants: ProductVariant3D[] = [
    { id: 'v1', productId: 'p1', name: 'Silver', color: 'Silver', colorCode: '#C0C0C0', price: 189, inStock: true, thumbnail: '/images/silver-glasses.jpg' },
    { id: 'v2', productId: 'p1', name: 'Gold', color: 'Gold', colorCode: '#FFD700', price: 189, inStock: true, thumbnail: '/images/gold-glasses.jpg' },
    { id: 'v3', productId: 'p1', name: 'Rose Gold', color: 'Rose Gold', colorCode: '#B76E79', price: 189, inStock: true, thumbnail: '/images/rosegold-glasses.jpg' },
    { id: 'v4', productId: 'p1', name: 'Black', color: 'Black', colorCode: '#1a1a1a', price: 189, inStock: true, thumbnail: '/images/black-glasses.jpg' },
  ];

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

  // Set up camera stream
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
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

  // Handle variant change
  const handleVariantChange = (newVariantId: string) => {
    const variant = demoVariants.find((v) => v.id === newVariantId);
    if (variant) {
      tryOnAnalytics.trackVariantSwitch(variant);
    }
  };

  // Handle snapshot capture
  const handleCapture = async () => {
    if (!videoRef.current || isCapturing) return;

    setIsCapturing(true);

    try {
      const snapshot = await captureSnapshot(videoRef.current);
      if (snapshot) {
        addSnapshot(snapshot);
        tryOnAnalytics.trackCapture(snapshot);
        toast.success('Snapshot captured!', {
          description: 'View in your gallery',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Capture failed:', error);
      toast.error('Failed to capture snapshot');
    } finally {
      setIsCapturing(false);
    }
  };

  // Handle add to cart
  const handleAddToCart = async (snapshotId?: string) => {
    const selected = snapshotId || selectedSnapshotId;
    if (!selected) {
      toast.error('Please select a snapshot first');
      return;
    }

    const snapshot = snapshots.find((s) => s.id === selected);
    if (!snapshot) return;

    try {
      await cartApi.addItem({
        productId: snapshot.productId,
        variantSku: snapshot.variantId,
        quantity: 1,
      });

      tryOnAnalytics.trackAddToCart(snapshot.productId, snapshot.variantId, snapshot.id);

      toast.success('Added to cart!', {
        description: 'Continue shopping or proceed to checkout',
        duration: 4000,
        action: {
          label: 'View Cart',
          onClick: () => navigate('/cart'),
        },
      });
    } catch (error) {
      console.error('Add to cart failed:', error);
      toast.error('Failed to add to cart');
    }
  };

  // Handle mirror toggle with analytics
  const handleMirrorToggle = () => {
    toggleMirror();
    tryOnAnalytics.trackMirrorToggle(!mirrorMode);
  };

  // Handle close
  const handleClose = () => {
    stopStream();
    stopTracking();
    tryOnAnalytics.endSession();
    navigate(-1);
  };

  // Handle share
  const handleShare = (platform: string) => {
    tryOnAnalytics.trackShare(platform);
  };

  // Handle view recommended styles
  const handleViewRecommended = () => {
    navigate(`/store?faceShape=${faceShape}`);
  };

  const currentVariant = demoVariants.find((v) => v.id === currentVariantId) || demoVariants[0];
  const hasSnapshots = snapshots.length > 0;

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

      {/* Share Dialog */}
      <ShareDialog
        open={showShareDialog}
        onClose={() => {
          setShowShareDialog(false);
          setSelectedSnapshotForShare(null);
        }}
        snapshotUrl={selectedSnapshotForShare ? snapshots.find((s) => s.id === selectedSnapshotForShare)?.imageUrl || '' : ''}
        productName="Eyeglasses"
        productUrl={productId ? `${window.location.origin}/product/${productId}` : undefined}
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
          zIndex: 10,
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

          {hasSnapshots && (
            <Button
              variant="contained"
              size="small"
              startIcon={<CartIcon />}
              onClick={() => navigate('/cart')}
              sx={{
                bgcolor: 'rgba(37, 99, 235, 0.9)',
                '&:hover': { bgcolor: 'rgba(29, 78, 216, 0.9)' },
              }}
            >
              Cart
            </Button>
          )}
        </Box>
      </Box>

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
                transform: mirrorMode ? 'scaleX(-1)' : 'scaleX(1)',
              }}
            />
          </>
        )}

        {/* Face Guide */}
        {!demoMode && <FaceGuide aligned={faceDetectionState === 'aligned'} />}

        {/* Glasses Overlay - 3D or 2D based on mode */}
        {(demoMode || faceDetectionState === 'aligned') && (
          <Suspense fallback={<CircularProgress sx={{ color: 'white', position: 'absolute', top: '50%', left: '50%' }} />}>
            {use3D && faceData ? (
              <Glasses3DOverlay
                faceData={faceData}
                frameColor={currentVariant.colorCode}
                mirrorMode={mirrorMode}
              />
            ) : (
              <SimpleGlassesOverlay
                faceData={faceData}
                frameColor={currentVariant.colorCode}
                mirrorMode={mirrorMode}
              />
            )}
          </Suspense>
        )}

        {/* Face Shape Result */}
        <FaceShapeResult
          faceShape={faceShape}
          open={faceShapeAnalyzed && !faceShapeShown}
          onDismiss={() => setFaceShapeShown(true)}
          onViewRecommended={handleViewRecommended}
        />

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
        }}
      >
        {/* Variant Carousel */}
        <VariantCarousel
          variants={demoVariants}
          currentVariant={currentVariantId || variantId}
          onChange={handleVariantChange}
        />

        {/* Capture Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CaptureButton
            onCapture={handleCapture}
            disabled={isCapturing}
            isTracking={demoMode || isTracking}
          />
        </Box>

        {/* Mirror Toggle */}
        <MirrorToggle enabled={mirrorMode} onChange={handleMirrorToggle} />

        {/* Snapshots Gallery */}
        {hasSnapshots && (
          <Box
            sx={{
              mt: 3,
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            <Typography variant="subtitle2" color="white" sx={{ mb: 1, textAlign: 'center' }}>
              Your Snapshots ({snapshots.length})
            </Typography>
            <Grid container spacing={1} columns={4}>
              {snapshots.slice(0, 4).map((snapshot) => (
                <Grid size={{ xs: 1 }} key={snapshot.id}>
                  <SnapshotCard
                    snapshot={snapshot}
                    variantName={currentVariant.name}
                    selected={selectedSnapshotId === snapshot.id}
                    onSelect={() => selectSnapshot(snapshot.id)}
                    onView={() => setSelectedSnapshotForShare(snapshot.id)}
                    showActions={false}
                  />
                </Grid>
              ))}
            </Grid>

            {selectedSnapshotId && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleAddToCart()}
                  sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                >
                  Add Selected to Cart
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSelectedSnapshotForShare(selectedSnapshotId);
                    setShowShareDialog(true);
                  }}
                  sx={{ color: 'white', borderColor: 'white' }}
                >
                  Share
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
