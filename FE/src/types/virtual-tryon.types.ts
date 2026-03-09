// Virtual Try-On Type Definitions

export type FaceShape =
  | 'oval'
  | 'round'
  | 'square'
  | 'heart'
  | 'diamond'
  | 'oblong';

export type FaceDetectionState =
  | 'searching'
  | 'detecting'
  | 'aligned'
  | 'misaligned'
  | 'multiple'
  | 'lost';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface FaceTrackingData {
  state: FaceDetectionState;
  confidence: number;
  boundingBox: BoundingBox;
  landmarks: Landmark[];
  faceShape?: FaceShape;
}

export interface ProductVariant3D {
  id: string;
  productId: string;
  name: string;
  color: string;
  colorCode: string;
  thumbnail: string;
  model3D?: string;
  price: number;
  inStock: boolean;
}

export interface CapturedSnapshot {
  id: string;
  productId: string;
  variantId: string;
  imageUrl: string;
  thumbnailUrl: string;
  timestamp: Date;
  faceShape?: FaceShape;
  metadata: SnapshotMetadata;
}

export interface SnapshotMetadata {
  deviceInfo: string;
  modelVersion: string;
  captureSettings: {
    mirrorMode: boolean;
    lighting: 'good' | 'fair' | 'poor';
  };
}

export interface FaceShapeAnalysis {
  shape: FaceShape;
  confidence: number;
  fitScore: number;
  recommendation: string;
  recommendedStyles: string[];
  detectedAt: Date;
}

export interface FaceShapeRecommendations {
  [key: string]: {
    fit: string;
    recommended: string;
    styles: string[];
  };
}

export const FACE_SHAPE_RECOMMENDATIONS: FaceShapeRecommendations = {
  oval: {
    fit: "This frame fits your face shape perfectly!",
    recommended: "Most frames complement your oval face.",
    styles: ['Rectangular', 'Wayfarer', 'Cat-Eye']
  },
  round: {
    fit: "This frame looks good on you!",
    recommended: "Angular and rectangular frames add definition.",
    styles: ['Square', 'Rectangular', 'Geometric']
  },
  square: {
    fit: "Consider rounder frames for a softer look.",
    recommended: "Round or oval frames soften your features.",
    styles: ['Round', 'Oval', 'Cat-Eye']
  },
  heart: {
    fit: "Frame with bottom-heavy design works best.",
    recommended: "Balance your forehead with wider bottoms.",
    styles: ['Round', 'Light-Rim', 'Bottom-Heavy']
  },
  diamond: {
    fit: "Cat-eye frames highlight your cheekbones!",
    recommended: "Oval or cat-eye frames complement your shape.",
    styles: ['Cat-Eye', 'Oval', 'Rimless']
  },
  oblong: {
    fit: "Wide frames add balance to your face.",
    recommended: "Frames with decorative temples break length.",
    styles: ['Wide', 'Decorative-Temple', 'Thick-Rim']
  }
};

export const FACE_SHAPE_ICONS: Record<FaceShape, string> = {
  oval: '🟢',
  round: '🔵',
  square: '🟣',
  heart: '🩷',
  diamond: '💎',
  oblong: '🟡'
};
