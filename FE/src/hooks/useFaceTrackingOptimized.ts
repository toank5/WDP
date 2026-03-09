import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type {
  FaceTrackingData,
  FaceShape,
  Landmark,
  BoundingBox,
} from '@/types/virtual-tryon.types';

export interface UseFaceTrackingOptimizedOptions {
  videoElement: HTMLVideoElement | null;
  onFaceDetected?: (data: FaceTrackingData) => void;
  onFaceLost?: () => void;
  onFaceShapeDetected?: (shape: FaceShape) => void;
  enabled?: boolean;
  detectionThrottleMs?: number; // Throttle face detection updates
}

export interface UseFaceTrackingOptimizedReturn {
  isTracking: boolean;
  faceData: FaceTrackingData | null;
  error: Error | null;
  startTracking: () => void;
  stopTracking: () => void;
}

// Memoized face shape detection with caching
const faceShapeCache = new Map<string, FaceShape>();

function generateFaceKey(landmarks: Landmark[]): string {
  // Sample key landmarks for caching
  const keyPoints = [1, 33, 263, 152, 10];
  return keyPoints
    .map(i => `${landmarks[i]?.x.toFixed(2)},${landmarks[i]?.y.toFixed(2)}`)
    .join('|');
}

// Optimized face shape detection with caching
function analyzeFaceShapeOptimized(landmarks: Landmark[]): FaceShape {
  const cacheKey = generateFaceKey(landmarks);

  if (faceShapeCache.has(cacheKey)) {
    return faceShapeCache.get(cacheKey)!;
  }

  // Run detection logic
  const shape = analyzeFaceShape(landmarks);

  // Cache result (limit cache size)
  if (faceShapeCache.size > 100) {
    const firstKey = faceShapeCache.keys().next().value;
    faceShapeCache.delete(firstKey);
  }
  faceShapeCache.set(cacheKey, shape);

  return shape;
}

// Original algorithm
function analyzeFaceShape(landmarks: Landmark[]): FaceShape {
  if (landmarks.length < 468) return 'oval';

  const top = landmarks[10];
  const bottom = landmarks[152];
  const leftJaw = landmarks[234];
  const rightJaw = landmarks[454];
  const leftCheek = landmarks[123];
  const rightCheek = landmarks[352];

  const faceWidth = rightJaw.x - leftJaw.x;
  const faceHeight = bottom.y - top.y;
  const widthToHeightRatio = faceWidth / faceHeight;
  const cheekboneWidth = rightCheek.x - leftCheek.x;
  const jawWidth = rightJaw.x - leftJaw.x;
  const cheekToJawRatio = cheekboneWidth / jawWidth;

  if (cheekToJawRatio > 1.1 && widthToHeightRatio > 0.85) return 'diamond';
  if (widthToHeightRatio > 0.95) return 'round';
  if (widthToHeightRatio < 0.7) return 'oblong';

  const foreheadWidth = landmarks[338].x - landmarks[108].x;
  const chinWidth = landmarks[200].x - landmarks[448].x;
  const foreheadToChinRatio = foreheadWidth / chinWidth;

  if (Math.abs(foreheadToChinRatio - 1.0) < 0.1) return 'square';
  if (foreheadToChinRatio > 1.15) return 'heart';

  return 'oval';
}

// Memoized bounding box calculation
const boundingBoxCache = new WeakMap<Landmark[], BoundingBox>();

function calculateBoundingBoxOptimized(landmarks: Landmark[]): BoundingBox {
  if (boundingBoxCache.has(landmarks)) {
    return boundingBoxCache.get(landmarks)!;
  }

  let minX = 1, minY = 1, maxX = 0, maxY = 0;

  for (let i = 0; i < landmarks.length; i += 10) { // Sample every 10th landmark for performance
    const lm = landmarks[i];
    minX = Math.min(minX, lm.x);
    minY = Math.min(minY, lm.y);
    maxX = Math.max(maxX, lm.x);
    maxY = Math.max(maxY, lm.y);
  }

  const bbox: BoundingBox = {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };

  boundingBoxCache.set(landmarks, bbox);
  return bbox;
}

// Create simulated landmarks (optimized)
const simulatedLandmarksCache: Landmark[] | null = null;

function createSimulatedLandmarksOptimized(width: number, height: number): Landmark[] {
  if (simulatedLandmarksCache) {
    return simulatedLandmarksCache;
  }

  const landmarks: Landmark[] = [];
  const centerX = 0.5;
  const centerY = 0.45;
  const faceWidth = 0.3;
  const faceHeight = 0.4;

  for (let i = 0; i < 468; i++) {
    const angle = (i / 468) * Math.PI * 2;
    landmarks.push({
      x: centerX + Math.cos(angle) * faceWidth * 0.5,
      y: centerY + Math.sin(angle) * faceHeight * 0.5,
      z: Math.sin(angle * 2) * 0.02,
    });
  }

  (simulatedLandmarksCache as any) = landmarks;
  return landmarks;
}

export function useFaceTrackingOptimized({
  videoElement,
  onFaceDetected,
  onFaceLost,
  onFaceShapeDetected,
  enabled = true,
  detectionThrottleMs = 100, // Throttle updates to every 100ms
}: UseFaceTrackingOptimizedOptions): UseFaceTrackingOptimizedReturn {
  const [isTracking, setIsTracking] = useState(false);
  const [faceData, setFaceData] = useState<FaceTrackingData | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const trackingIntervalRef = useRef<number | null>(null);
  const faceShapeTimeoutRef = useRef<number | null>(null);
  const hasDetectedShapeRef = useRef(false);
  const lastUpdateRef = useRef<number>(0);

  // Memoize face data to prevent unnecessary re-renders
  const memoizedFaceData = useMemo(() => faceData, [faceData?.state, faceData?.confidence]);

  // Process frame (throttled)
  const processFrame = useCallback(() => {
    const now = Date.now();
    if (now - lastUpdateRef.current < detectionThrottleMs) {
      return; // Throttle updates
    }
    lastUpdateRef.current = now;

    if (!videoElement || !enabled || videoElement.readyState < 2) {
      return;
    }

    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;

    const landmarks = createSimulatedLandmarksOptimized(width, height);
    const boundingBox = calculateBoundingBoxOptimized(landmarks);

    const data: FaceTrackingData = {
      state: 'aligned',
      confidence: 0.92,
      boundingBox,
      landmarks,
    };

    setFaceData(data);
    onFaceDetected?.(data);

    // Trigger face shape detection after 3 seconds (throttled)
    if (!hasDetectedShapeRef.current) {
      faceShapeTimeoutRef.current = window.setTimeout(() => {
        const detectedShape = analyzeFaceShapeOptimized(landmarks);
        hasDetectedShapeRef.current = true;
        onFaceShapeDetected?.(detectedShape);
        setFaceData(prev => prev ? { ...prev, faceShape: detectedShape } : null);

        if (trackingIntervalRef.current) {
          clearInterval(trackingIntervalRef.current);
        }
      }, 3000);
    }
  }, [videoElement, enabled, detectionThrottleMs, onFaceDetected, onFaceShapeDetected]);

  // Start tracking
  const startTracking = useCallback(() => {
    if (!enabled || !videoElement) return;

    setIsTracking(true);
    setError(null);
    lastUpdateRef.current = Date.now();

    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
    }

    trackingIntervalRef.current = window.setInterval(processFrame, detectionThrottleMs);
  }, [enabled, videoElement, processFrame, detectionThrottleMs]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false);

    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }

    if (faceShapeTimeoutRef.current) {
      clearTimeout(faceShapeTimeoutRef.current);
      faceShapeTimeoutRef.current = null;
    }

    hasDetectedShapeRef.current = false;
    setFaceData(null);
    onFaceLost?.();
  }, [onFaceLost]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      if (faceShapeTimeoutRef.current) {
        clearTimeout(faceShapeTimeoutRef.current);
      }
    };
  }, []);

  return {
    isTracking,
    faceData: memoizedFaceData,
    error,
    startTracking,
    stopTracking,
  };
}
