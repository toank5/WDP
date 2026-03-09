import { create } from 'zustand';
import type {
  FaceDetectionState,
  FaceShape,
  CapturedSnapshot,
} from '@/types/virtual-tryon.types';

interface VirtualTryOnState {
  // Session state
  isActive: boolean;
  productId: string | null;
  currentVariantId: string | null;

  // Camera & tracking
  cameraPermission: 'prompt' | 'granted' | 'denied' | 'unsupported';
  isCameraActive: boolean;
  faceDetectionState: FaceDetectionState;

  // Face analysis
  faceShape: FaceShape | null;
  faceShapeAnalyzed: boolean;
  faceShapeShown: boolean;

  // Snapshots
  snapshots: CapturedSnapshot[];
  selectedSnapshotId: string | null;

  // UI state
  mirrorMode: boolean;
  compareMode: boolean;

  // Loading states
  isModelLoading: boolean;
  modelLoadError: string | null;

  // Actions
  startSession: (productId: string, variantId: string) => void;
  endSession: () => void;
  setCameraPermission: (permission: 'prompt' | 'granted' | 'denied' | 'unsupported') => void;
  setIsCameraActive: (active: boolean) => void;
  setFaceDetectionState: (state: FaceDetectionState) => void;
  setFaceShape: (shape: FaceShape) => void;
  setFaceShapeShown: (shown: boolean) => void;
  addSnapshot: (snapshot: CapturedSnapshot) => void;
  removeSnapshot: (id: string) => void;
  selectSnapshot: (id: string | null) => void;
  toggleMirror: () => void;
  toggleCompare: () => void;
  setIsModelLoading: (loading: boolean) => void;
  setModelLoadError: (error: string | null) => void;
  reset: () => void;
}

export const useVirtualTryOnStore = create<VirtualTryOnState>((set, get) => ({
  // Initial state
  isActive: false,
  productId: null,
  currentVariantId: null,
  cameraPermission: 'prompt',
  isCameraActive: false,
  faceDetectionState: 'searching',
  faceShape: null,
  faceShapeAnalyzed: false,
  faceShapeShown: false,
  snapshots: [],
  selectedSnapshotId: null,
  mirrorMode: true,
  compareMode: false,
  isModelLoading: false,
  modelLoadError: null,

  // Actions
  startSession: (productId, variantId) =>
    set({
      isActive: true,
      productId,
      currentVariantId: variantId,
      faceDetectionState: 'searching',
      snapshots: [],
      selectedSnapshotId: null,
      faceShape: null,
      faceShapeAnalyzed: false,
      faceShapeShown: false,
    }),

  endSession: () =>
    set({
      isActive: false,
      isCameraActive: false,
      faceDetectionState: 'searching',
      snapshots: [],
      selectedSnapshotId: null,
      faceShape: null,
      faceShapeAnalyzed: false,
      faceShapeShown: false,
    }),

  setCameraPermission: (permission) =>
    set({ cameraPermission: permission }),

  setIsCameraActive: (active) =>
    set({ isCameraActive: active }),

  setFaceDetectionState: (state) =>
    set({ faceDetectionState: state }),

  setFaceShape: (shape) =>
    set({
      faceShape: shape,
      faceShapeAnalyzed: true,
    }),

  setFaceShapeShown: (shown) =>
    set({ faceShapeShown: shown }),

  addSnapshot: (snapshot) =>
    set((state) => ({
      snapshots: [...state.snapshots.slice(-9), snapshot],
    })),

  removeSnapshot: (id) =>
    set((state) => ({
      snapshots: state.snapshots.filter((s) => s.id !== id),
      selectedSnapshotId:
        state.selectedSnapshotId === id ? null : state.selectedSnapshotId,
    })),

  selectSnapshot: (id) =>
    set({ selectedSnapshotId: id }),

  toggleMirror: () =>
    set((state) => ({ mirrorMode: !state.mirrorMode })),

  toggleCompare: () =>
    set((state) => ({ compareMode: !state.compareMode })),

  setIsModelLoading: (loading) =>
    set({ isModelLoading: loading }),

  setModelLoadError: (error) =>
    set({ modelLoadError: error }),

  reset: () =>
    set({
      isActive: false,
      productId: null,
      currentVariantId: null,
      isCameraActive: false,
      faceDetectionState: 'searching',
      faceShape: null,
      faceShapeAnalyzed: false,
      faceShapeShown: false,
      snapshots: [],
      selectedSnapshotId: null,
      mirrorMode: true,
      compareMode: false,
      isModelLoading: false,
      modelLoadError: null,
    }),
}));
