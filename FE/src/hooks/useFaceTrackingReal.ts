import { useState, useCallback, useRef, useEffect } from 'react';
import { FaceMesh, Results, Options } from '@mediapipe/face-mesh';
import type {
  FaceTrackingData,
  FaceShape,
  Landmark,
  BoundingBox,
} from '@/types/virtual-tryon.types';

export interface UseFaceTrackingRealOptions {
  videoElement: HTMLVideoElement | null;
  onFaceDetected?: (data: FaceTrackingData) => void;
  onFaceLost?: () => void;
  onFaceShapeDetected?: (shape: FaceShape) => void;
  enabled?: boolean;
  modelOptions?: Partial<Options>;
}

export interface UseFaceTrackingRealReturn {
  isTracking: boolean;
  isModelLoaded: boolean;
  faceData: FaceTrackingData | null;
  error: Error | null;
  startTracking: () => void;
  stopTracking: () => void;
}

// Face shape detection algorithm using facial landmarks
function analyzeFaceShape(landmarks: Landmark[]): FaceShape {
  if (landmarks.length < 468) {
    return 'oval'; // Default
  }

  // Key landmark indices from MediaPipe Face Mesh
  // Face outline: 10 (top), 152 (bottom), 234 (left jaw), 454 (right jaw)
  // Cheekbones: 123, 352
  // Forehead: 10, 338
  // Chin: 152, 200
  // Nose bridge: 6, 19

  const top = landmarks[10];
  const bottom = landmarks[152];
  const leftJaw = landmarks[234];
  const rightJaw = landmarks[454];
  const leftCheek = landmarks[123];
  const rightCheek = landmarks[352];
  const forehead = landmarks[10];
  const chin = landmarks[152];

  // Calculate measurements (normalized 0-1)
  const faceWidth = rightJaw.x - leftJaw.x;
  const faceHeight = bottom.y - top.y;
  const widthToHeightRatio = faceWidth / faceHeight;

  // Cheekbone width relative to jaw width
  const cheekboneWidth = rightCheek.x - leftCheek.x;
  const jawWidth = rightJaw.x - leftJaw.x;
  const cheekToJawRatio = cheekboneWidth / jawWidth;

  // Forehead to chin ratio
  const foreheadWidth = landmarks[338].x - landmarks[108].x;
  const chinWidth = landmarks[200].x - landmarks[448].x;
  const foreheadToChinRatio = foreheadWidth / chinWidth;

  // Classification logic based on facial proportions
  if (cheekToJawRatio > 1.1 && widthToHeightRatio > 0.85) {
    return 'diamond'; // Wide cheekbones, narrow chin
  }

  if (widthToHeightRatio > 0.95) {
    return 'round'; // Almost equal width and height
  }

  if (widthToHeightRatio < 0.7) {
    return 'oblong'; // Significantly taller than wide
  }

  if (Math.abs(foreheadToChinRatio - 1.0) < 0.1) {
    return 'square'; // Equal forehead and chin width
  }

  if (foreheadToChinRatio > 1.15) {
    return 'heart'; // Wider forehead
  }

  // Default to oval for balanced proportions
  return 'oval';
}

// Calculate bounding box from landmarks
function calculateBoundingBox(landmarks: Landmark[]): BoundingBox {
  if (landmarks.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = 1, minY = 1, maxX = 0, maxY = 0;

  for (const landmark of landmarks) {
    minX = Math.min(minX, landmark.x);
    minY = Math.min(minY, landmark.y);
    maxX = Math.max(maxX, landmark.x);
    maxY = Math.max(maxY, landmark.y);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function useFaceTrackingReal({
  videoElement,
  onFaceDetected,
  onFaceLost,
  onFaceShapeDetected,
  enabled = true,
  modelOptions = {},
}: UseFaceTrackingRealOptions): UseFaceTrackingRealReturn {
  const [isTracking, setIsTracking] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [faceData, setFaceData] = useState<FaceTrackingData | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const faceMeshRef = useRef<FaceMesh | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const faceShapeDetectedRef = useRef(false);

  // Process face detection results
  const handleResults = useCallback(
    (results: Results) => {
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        // Convert MediaPipe landmarks to our format
        const convertedLandmarks: Landmark[] = landmarks.map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z || 0,
        }));

        // Calculate bounding box
        const boundingBox = calculateBoundingBox(convertedLandmarks);

        // Determine face shape (once per session)
        let faceShape: FaceShape | undefined;
        if (!faceShapeDetectedRef.current && onFaceShapeDetected) {
          faceShape = analyzeFaceShape(convertedLandmarks);
          faceShapeDetectedRef.current = true;
          setTimeout(() => {
            onFaceShapeDetected(faceShape!);
          }, 3000); // Trigger after 3 seconds of tracking
        }

        const data: FaceTrackingData = {
          state: 'aligned',
          confidence: 0.9, // MediaPipe doesn't provide per-face confidence
          boundingBox,
          landmarks: convertedLandmarks,
          faceShape,
        };

        setFaceData(data);
        onFaceDetected?.(data);
      } else {
        setFaceData(null);
        onFaceLost?.();
      }
    },
    [onFaceDetected, onFaceLost, onFaceShapeDetected]
  );

  // Initialize MediaPipe FaceMesh
  useEffect(() => {
    if (!enabled) return;

    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face-mesh/${file}`;
      },
    });

    const options: Options = {
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      ...modelOptions,
    };

    faceMesh.setOptions(options);
    faceMesh.onResults(handleResults);

    faceMesh
      .initialize()
      .then(() => {
        faceMeshRef.current = faceMesh;
        setIsModelLoaded(true);
        console.log('MediaPipe FaceMesh initialized successfully');
      })
      .catch((err) => {
        setError(err as Error);
        console.error('Failed to initialize MediaPipe FaceMesh:', err);
      });

    return () => {
      faceMesh.close();
      faceMeshRef.current = null;
    };
  }, [enabled, handleResults, modelOptions]);

  // Send video frames to MediaPipe
  const processFrame = useCallback(async () => {
    if (
      !videoElement ||
      !faceMeshRef.current ||
      !isTracking ||
      videoElement.readyState < 2
    ) {
      return;
    }

    try {
      await faceMeshRef.current.send({ image: videoElement });
    } catch (err) {
      console.error('Error processing frame:', err);
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [videoElement, isTracking]);

  // Start tracking
  const startTracking = useCallback(() => {
    if (!enabled || !videoElement || !faceMeshRef.current) {
      return;
    }

    setIsTracking(true);
    faceShapeDetectedRef.current = false;
  }, [enabled, videoElement]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    faceShapeDetectedRef.current = false;
    setFaceData(null);

    onFaceLost?.();
  }, [onFaceLost]);

  // Process frames when tracking
  useEffect(() => {
    if (isTracking) {
      processFrame();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isTracking, processFrame]);

  return {
    isTracking,
    isModelLoaded,
    faceData,
    error,
    startTracking,
    stopTracking,
  };
}
