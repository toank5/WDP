import { useCallback, useRef } from 'react';
import type { CapturedSnapshot, FaceShape } from '@/types/virtual-tryon.types';

export interface UseSnapshotCaptureOptions {
  productId: string;
  variantId: string;
  faceShape?: FaceShape;
  mirrorMode?: boolean;
}

export interface UseSnapshotCaptureReturn {
  captureSnapshot: (
    videoElement: HTMLVideoElement,
    overlayElement?: HTMLElement | null
  ) => Promise<CapturedSnapshot | null>;
  captureSnapshotFromCanvas: (canvas: HTMLCanvasElement) => Promise<CapturedSnapshot | null>;
  generateThumbnail: (blob: Blob, maxSize?: number) => Promise<string>;
}

// Generate a unique ID
function generateId(): string {
  return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Assess lighting from image data (simplified)
function assessLighting(ctx: CanvasRenderingContext2D, width: number, height: number): 'good' | 'fair' | 'poor' {
  try {
    // Sample center of image
    const imageData = ctx.getImageData(width / 2 - 50, height / 2 - 50, 100, 100);
    const data = imageData.data;

    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      totalBrightness += brightness;
    }

    const avgBrightness = totalBrightness / (data.length / 4);

    if (avgBrightness > 200) return 'good';
    if (avgBrightness > 100) return 'fair';
    return 'poor';
  } catch {
    return 'good';
  }
}

export function useSnapshotCapture({
  productId,
  variantId,
  faceShape,
  mirrorMode = false,
}: UseSnapshotCaptureOptions): UseSnapshotCaptureReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate thumbnail from blob
  const generateThumbnail = useCallback(async (blob: Blob, maxSize: number = 200): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate thumbnail size (maintain aspect ratio)
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((thumbnailBlob) => {
          URL.revokeObjectURL(url);

          if (thumbnailBlob) {
            resolve(URL.createObjectURL(thumbnailBlob));
          } else {
            reject(new Error('Could not generate thumbnail'));
          }
        }, 'image/jpeg', 0.8);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for thumbnail'));
      };

      img.src = url;
    });
  }, []);

  // Capture snapshot from video element
  const captureSnapshot = useCallback(
    async (
      videoElement: HTMLVideoElement,
      overlayElement?: HTMLElement | null
    ): Promise<CapturedSnapshot | null> => {
      if (!videoElement || videoElement.readyState < 2) {
        return null;
      }

      // Create or reuse canvas
      let canvas = canvasRef.current;
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvasRef.current = canvas;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Set canvas size to match video
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      // Draw video frame
      ctx.save();

      if (mirrorMode) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(videoElement, 0, 0);

      ctx.restore();

      // Add watermark
      ctx.font = '14px Roboto, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      const watermark = '👁️ EyeWear Virtual Try-On';
      const textWidth = ctx.measureText(watermark).width;
      const x = 20;
      const y = canvas.height - 20;

      ctx.strokeText(watermark, x, y);
      ctx.fillText(watermark, x, y);

      // Assess lighting
      const lighting = assessLighting(ctx, canvas.width, canvas.height);

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9);
      });

      if (!blob) return null;

      // Generate thumbnail
      const thumbnailUrl = await generateThumbnail(blob);

      const snapshot: CapturedSnapshot = {
        id: generateId(),
        productId,
        variantId,
        imageUrl: URL.createObjectURL(blob),
        thumbnailUrl,
        timestamp: new Date(),
        faceShape,
        metadata: {
          deviceInfo: navigator.userAgent,
          modelVersion: '1.0.0',
          captureSettings: {
            mirrorMode,
            lighting,
          },
        },
      };

      return snapshot;
    },
    [productId, variantId, faceShape, mirrorMode, generateThumbnail]
  );

  // Capture from existing canvas
  const captureSnapshotFromCanvas = useCallback(
    async (canvas: HTMLCanvasElement): Promise<CapturedSnapshot | null> => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9);
      });

      if (!blob) return null;

      // Generate thumbnail
      const thumbnailUrl = await generateThumbnail(blob);

      const snapshot: CapturedSnapshot = {
        id: generateId(),
        productId,
        variantId,
        imageUrl: URL.createObjectURL(blob),
        thumbnailUrl,
        timestamp: new Date(),
        faceShape,
        metadata: {
          deviceInfo: navigator.userAgent,
          modelVersion: '1.0.0',
          captureSettings: {
            mirrorMode,
            lighting: 'good',
          },
        },
      };

      return snapshot;
    },
    [productId, variantId, faceShape, mirrorMode, generateThumbnail]
  );

  return {
    captureSnapshot,
    captureSnapshotFromCanvas,
    generateThumbnail,
  };
}
