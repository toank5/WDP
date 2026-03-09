import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  FaceTrackingData,
  FaceShape,
  Landmark,
  BoundingBox,
} from '@/types/virtual-tryon.types';

export interface UseFaceTrackingOptions {
  videoElement: HTMLVideoElement | null;
  onFaceDetected?: (data: FaceTrackingData) => void;
  onFaceLost?: () => void;
  onFaceShapeDetected?: (shape: FaceShape) => void;
  enabled?: boolean;
}

export interface UseFaceTrackingReturn {
  isTracking: boolean;
  faceData: FaceTrackingData | null;
  error: Error | null;
  startTracking: () => void;
  stopTracking: () => void;
}

// Simulated face landmarks (center of screen)
function createSimulatedLandmarks(width: number, height: number): Landmark[] {
  const landmarks: Landmark[] = [];
  const centerX = 0.5;
  const centerY = 0.45; // Slightly above center (face area)
  const faceWidth = 0.3;
  const faceHeight = 0.4;

  // Create a simple oval-shaped face mesh
  for (let i = 0; i < 468; i++) {
    const angle = (i / 468) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * faceWidth * 0.5;
    const y = centerY + Math.sin(angle) * faceHeight * 0.5;
    const z = Math.sin(angle * 2) * 0.02; // Slight depth variation

    landmarks.push({ x, y, z });
  }

  return landmarks;
}

// Simple face shape detection based on simulated data
function detectFaceShape(landmarks: Landmark[]): FaceShape {
  // For simulation, randomly select a face shape
  // In real implementation, this would analyze landmark positions
  const shapes: FaceShape[] = ['oval', 'round', 'square', 'heart', 'diamond', 'oblong'];
  return shapes[Math.floor(Math.random() * shapes.length)];
}

export function useFaceTracking({
  videoElement,
  onFaceDetected,
  onFaceLost,
  onFaceShapeDetected,
  enabled = true,
}: UseFaceTrackingOptions): UseFaceTrackingReturn {
  const [isTracking, setIsTracking] = useState(false);
  const [faceData, setFaceData] = useState<FaceTrackingData | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const trackingIntervalRef = useRef<number | null>(null);
  const faceShapeTimeoutRef = useRef<number | null>(null);
  const hasDetectedShapeRef = useRef(false);

  // Simulate face tracking
  const startTracking = useCallback(() => {
    if (!enabled || !videoElement) {
      return;
    }

    setIsTracking(true);
    setError(null);

    // Clear any existing intervals
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
    }
    if (faceShapeTimeoutRef.current) {
      clearTimeout(faceShapeTimeoutRef.current);
    }

    // Simulate face detection updates
    trackingIntervalRef.current = window.setInterval(() => {
      if (!videoElement.videoWidth || !videoElement.videoHeight) {
        return;
      }

      const width = videoElement.videoWidth;
      const height = videoElement.videoHeight;

      // Create simulated face data
      const landmarks = createSimulatedLandmarks(width, height);
      const boundingBox: BoundingBox = {
        x: 0.35,
        y: 0.25,
        width: 0.3,
        height: 0.4,
      };

      const data: FaceTrackingData = {
        state: 'aligned', // Simulate aligned face
        confidence: 0.92,
        boundingBox,
        landmarks,
      };

      setFaceData(data);

      if (onFaceDetected) {
        onFaceDetected(data);
      }

      // Trigger face shape detection after 3 seconds
      if (!hasDetectedShapeRef.current) {
        faceShapeTimeoutRef.current = window.setTimeout(() => {
          const detectedShape = detectFaceShape(landmarks);
          hasDetectedShapeRef.current = true;

          if (onFaceShapeDetected) {
            onFaceShapeDetected(detectedShape);
          }

          // Update face data with shape
          setFaceData((prev) => prev ? { ...prev, faceShape: detectedShape } : null);

          // Clear interval after shape detection
          if (trackingIntervalRef.current) {
            clearInterval(trackingIntervalRef.current);
          }
        }, 3000);
      }
    }, 100); // Update every 100ms
  }, [enabled, videoElement, onFaceDetected, onFaceShapeDetected]);

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

    if (onFaceLost) {
      onFaceLost();
    }
  }, [onFaceLost]);

  // Cleanup on unmount
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
    faceData,
    error,
    startTracking,
    stopTracking,
  };
}
