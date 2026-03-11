# Virtual Try-On Feature - Functional Requirements

## Document Information

| Field | Value |
|-------|-------|
| **Project** | EyeWear E-Commerce Platform |
| **Feature** | Virtual Try-On (AR Glasses) |
| **Version** | 1.0 |
| **Status** | Design Phase |
| **Last Updated** | 2026-03-06 |

---

## Table of Contents

1. [Overview](#1-overview)
2. [User Stories](#2-user-stories)
3. [Functional Requirements](#3-functional-requirements)
4. [Technical Requirements](#4-technical-requirements)
5. [API Specifications](#5-api-specifications)
6. [State Management](#6-state-management)
7. [Third-Party Integrations](#7-third-party-integrations)
8. [Analytics & Tracking](#8-analytics--tracking)
9. [Testing Requirements](#9-testing-requirements)
10. [Launch Checklist](#10-launch-checklist)

---

## 1. Overview

### 1.1 Purpose

The Virtual Try-On feature enables customers to visualize eyeglasses on their face using Augmented Reality (AR) technology via their device camera. This reduces purchase uncertainty and increases conversion rates.

### 1.2 Goals

- **Primary Goal:** Increase conversion rate by 15% for eyewear products
- **Secondary Goals:**
  - Reduce return rate by providing better fit visualization
  - Increase average time on site
  - Generate social shares from captured snapshots
  - Collect face shape data for personalization

### 1.3 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Try-On adoption rate | 20% of PDP visitors | % who click Try-On button |
| Capture rate | 60% of Try-On sessions | % who take at least 1 snapshot |
| Add-to-cart from Try-On | 25% higher than PDP baseline | Conversion lift |
| Average session duration | 45+ seconds | Time in Try-On mode |
| Share rate | 10% of captures | % who share snapshots |

---

## 2. User Stories

### Epic 1: Product Discovery & Entry

| ID | Story | Priority |
|----|-------|----------|
| **US-001** | As a customer browsing products, I want to easily identify which products support Virtual Try-On so I can prioritize trying them on. | P0 |
| **US-002** | As a customer viewing a product, I want a prominent "Try On Virtually" button that clearly indicates this feature is available. | P0 |
| **US-003** | As a mobile customer, I want the Try-On button placed in an easily accessible position (thumb-friendly zone). | P1 |

### Epic 2: Camera & Permissions

| ID | Story | Priority |
|----|-------|----------|
| **US-004** | As a first-time user, I want clear guidance when camera permissions are requested so I understand why it's needed. | P0 |
| **US-005** | As a user who denies camera access, I want helpful instructions on how to enable permissions or an alternative demo mode. | P0 |
| **US-006** | As a user on a device without a camera, I want to upload a photo to try on glasses virtually. | P1 |

### Epic 3: Try-On Experience

| ID | Story | Priority |
|----|-------|----------|
| **US-007** | As a customer, I want to see glasses accurately overlaid on my face in real-time. | P0 |
| **US-008** | As a customer, I want visual feedback (alignment guide) to help me position my face correctly. | P0 |
| **US-009** | As a customer, I want to toggle mirror view ON/OFF to see how glasses look from my perspective vs. others' perspective. | P1 |
| **US-010** | As a customer, I want to switch between different frame colors instantly without leaving the camera view. | P0 |

### Epic 4: Face Shape Analysis

| ID | Story | Priority |
|----|-------|----------|
| **US-011** | As a customer, I want to know my face shape so I can make better purchasing decisions. | P1 |
| **US-012** | As a customer, I want personalized frame recommendations based on my detected face shape. | P1 |
| **US-013** | As a customer, I want the option to browse more frames recommended for my face shape. | P2 |

### Epic 5: Capture & Share

| ID | Story | Priority |
|----|-------|----------|
| **US-014** | As a customer, I want to capture photos of myself wearing different frames to compare them. | P0 |
| **US-015** | As a customer, I want to compare multiple frames side-by-side to decide which looks best. | P1 |
| **US-016** | As a customer, I want to save captured photos to my device. | P1 |
| **US-017** | As a customer, I want to share my captured photos via social media or messaging apps. | P1 |
| **US-018** | As a customer, I want to add the tried-on product to my cart directly from the capture view. | P0 |

### Epic 6: Comparison & Decision

| ID | Story | Priority |
|----|-------|----------|
| **US-019** | As a customer, I want to view my captured snapshots in a gallery to review my options. | P1 |
| **US-020** | As a customer, I want to select my favorite frame from multiple captures and add it to cart. | P1 |

---

## 3. Functional Requirements

### FR-001: PDP Integration

**Requirement:** The Product Detail Page must display a Virtual Try-On entry point.

**Specification:**

| Element | Specification |
|---------|---------------|
| **Button Label** | "Try On Virtually" |
| **Button Style** | Primary contained, gradient blue |
| **Icon** | CameraAlt or ViewInAr (MUI) |
| **Position** | Above Add to Cart button |
| **Visibility** | Show only for products with 3D models available |
| **Badge** | Optional "New" badge for first 30 days |

**Acceptance Criteria:**
- [ ] Button appears on all eyewear product pages with 3D models
- [ ] Button is full-width on mobile, min-width: 200px on desktop
- [ ] Clicking button navigates to `/virtual-tryon?productId={id}`
- [ ] Current product variant is pre-selected in Try-On
- [ ] Loading state shown while 3D model initializes

---

### FR-002: Camera Permission Flow

**Requirement:** Request and handle camera permissions gracefully.

**Specification:**

```typescript
interface CameraPermissionState {
  status: 'prompt' | 'granted' | 'denied' | 'unsupported';
  canRequestAgain: boolean;
  lastRequestTime: Date;
}

interface CameraPermissionHandlers {
  onRequest: () => Promise<boolean>;
  onGranted: () => void;
  onDenied: () => void;
  onUnsupported: () => void;
}
```

**Acceptance Criteria:**
- [ ] Check camera support on page load
- [ ] Show permission dialog on first access
- [ ] Store permission decision in session storage
- [ ] Show helpful guide if permission denied
- [ ] Offer "Try Demo Mode" if camera unavailable
- [ ] Retry button available after permission change

---

### FR-003: Face Tracking & Glasses Overlay

**Requirement:** Accurately track face and overlay 3D glasses model.

**Specification:**

| Parameter | Value |
|-----------|-------|
| **Tracking Technology** | MediaPipe Face Mesh or compatible AR library |
| **Detection Rate** | Minimum 30 FPS |
| **Landmarks** | 468 face landmarks |
| **Overlay Accuracy** | Nose bridge ±5px |
| **Latency** | < 100ms from detection to render |

**Face States:**

```typescript
type FaceDetectionState =
  | 'searching'     // No face detected
  | 'detecting'     // Face found, initializing
  | 'aligned'       // Face properly positioned
  | 'misaligned'    // Face too close/far/off-center
  | 'multiple'      // Multiple faces detected
  | 'lost';         // Face lost during tracking

interface FaceTrackingData {
  state: FaceDetectionState;
  confidence: number;        // 0-1
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks: Array<{x: number, y: number, z: number}>;
  faceShape?: FaceShape;
}
```

**Alignment Guide Logic:**

```typescript
function checkAlignment(face: FaceTrackingData): boolean {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const faceCenterX = face.boundingBox.x + face.boundingBox.width / 2;
  const faceCenterY = face.boundingBox.y + face.boundingBox.height / 2;

  const distanceX = Math.abs(faceCenterX - centerX);
  const distanceY = Math.abs(faceCenterY - centerY);
  const threshold = Math.min(window.innerWidth, window.innerHeight) * 0.1;

  return distanceX < threshold && distanceY < threshold;
}
```

**Acceptance Criteria:**
- [ ] Face detection initializes within 2 seconds
- [ ] Glasses overlay follows face movement smoothly
- [ ] Alignment guide turns green when face is centered
- [ ] Show feedback message when face is too close/far
- [ ] Handle multiple faces with "Please show only one face" message
- [ ] Face mesh updates at minimum 30 FPS

---

### FR-004: Variant Switching

**Requirement:** Allow instant switching between frame variants.

**Specification:**

```typescript
interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  color: string;
  colorCode: string;        // Hex for UI
  thumbnail: string;        // 2D image
  model3D: string;          // URL to 3D model file
  price: number;
  inStock: boolean;
}

interface VariantCarouselProps {
  variants: ProductVariant[];
  currentVariant: string;
  onVariantChange: (variantId: string) => void;
  layout: 'horizontal' | 'grid';
}
```

**Variant Thumbnail:**

```typescript
// Thumbnail component specs
const VARIANT_THUMBNAIL = {
  width: 80,        // px
  height: 80,       // px
  borderRadius: 8,  // px
  selected: {
    scale: 1.1,
    borderWidth: 3,
    borderColor: '#2563eb',
    shadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
  }
};
```

**Acceptance Criteria:**
- [ ] Carousel shows all available variants for current product
- [ ] Active variant is highlighted with blue border
- [ ] Clicking variant instantly updates 3D model (no page reload)
- [ ] Model loading skeleton shown during variant switch
- [ ] Variant thumbnail shows frame color/style preview
- [ ] Carousel is horizontally scrollable on mobile
- [ ] Out-of-stock variants are dimmed with label

---

### FR-005: Face Shape Detection

**Requirement:** Analyze face shape and provide recommendations.

**Specification:**

```typescript
type FaceShape =
  | 'oval'
  | 'round'
  | 'square'
  | 'heart'
  | 'diamond'
  | 'oblong';

interface FaceShapeAnalysis {
  shape: FaceShape;
  confidence: number;           // 0-1
  fitScore: number;             // 0-100 for current frame
  recommendation: string;       // Human-readable message
  recommendedStyles: string[];  // Array of frame style names
  detectedAt: Date;
}

interface FaceShapeResult {
  analysis: FaceShapeAnalysis;
  showRecommendation: boolean;
}
```

**Detection Algorithm:**

```typescript
function analyzeFaceShape(landmarks: Array<{x, y, z}>): FaceShapeAnalysis {
  // Key measurements
  const faceWidth = measureWidth(landmarks);
  const faceLength = measureLength(landmarks);
  const jawlineWidth = measureJawline(landmarks);
  const foreheadWidth = measureForehead(landmarks);
  const cheekboneWidth = measureCheekbones(landmarks);

  const widthToLengthRatio = faceWidth / faceLength;
  const jawToForeheadRatio = jawlineWidth / foreheadWidth;

  // Classification logic
  let shape: FaceShape;
  let confidence: number;

  if (widthToLengthRatio > 0.9 && widthToLengthRatio < 1.1) {
    shape = jawToForeheadRatio < 0.9 ? 'heart' : 'oval';
  } else if (widthToLengthRatio >= 1.1) {
    shape = 'round';
  } else {
    shape = 'oblong';
  }

  // Additional checks for square/diamond
  if (Math.abs(jawlineWidth - foreheadWidth) < 10) {
    shape = 'square';
  } else if (cheekboneWidth > jawlineWidth && cheekboneWidth > foreheadWidth) {
    shape = 'diamond';
  }

  return {
    shape,
    confidence: 0.85, // Placeholder
    fitScore: calculateFitScore(shape, currentFrame),
    recommendation: getRecommendation(shape),
    recommendedStyles: getRecommendedStyles(shape),
    detectedAt: new Date(),
  };
}
```

**Recommendation Messages:**

```typescript
const RECOMMENDATIONS: Record<FaceShape, {
  fit: string;
  recommended: string;
  styles: string[];
}> = {
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
```

**Scanner Animation:**

```typescript
// Scanner component
const FaceScanner: React.FC<{onComplete: (result: FaceShapeAnalysis) => void}> = ({
  onComplete
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          onComplete(analyzeFaceShape());
          return 100;
        }
        return prev + 2; // 50 seconds = 5000ms
      });
    }, 50);

    return () => clearInterval(timer);
  }, []);

  return (
    <Box className="scanner-container">
      <div className="scanner-line" style={{ top: `${progress}%` }} />
      <div className="scanner-glow" style={{ top: `${progress}%` }} />
      <Typography variant="body2">Scanning face shape...</Typography>
    </Box>
  );
};
```

**Acceptance Criteria:**
- [ ] Face shape analysis triggers after 3-5 seconds of stable tracking
- [ ] Scanner animation plays during analysis
- [ ] Result card displays detected face shape
- [ ] Fit recommendation message is shown
- [ ] "See Recommended Styles" button navigates to filtered product list
- [ ] Result card auto-dismisses after 10 seconds or on user interaction
- [ ] Analysis results are cached for the session

---

### FR-006: Snapshot Capture

**Requirement:** Capture and save try-on snapshots.

**Specification:**

```typescript
interface CapturedSnapshot {
  id: string;
  productId: string;
  variantId: string;
  imageUrl: string;           // Data URL or blob URL
  thumbnailUrl: string;
  timestamp: Date;
  faceShape?: FaceShape;
  metadata: {
    deviceInfo: string;
    modelVersion: string;
    captureSettings: {
      mirrorMode: boolean;
      lighting: 'good' | 'fair' | 'poor';
    };
  };
}

interface SnapshotCaptureProps {
  onCapture: (snapshot: CapturedSnapshot) => void;
  maxSnapshots: number;
  captureQuality: 'low' | 'medium' | 'high';
}
```

**Capture Function:**

```typescript
async function captureSnapshot(
  videoElement: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  glassesOverlay: HTMLElement
): Promise<CapturedSnapshot> {
  // Setup canvas
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d')!;

  // Draw video frame
  ctx.drawImage(videoElement, 0, 0);

  // Draw glasses overlay (if using canvas rendering)
  // Otherwise composite the DOM overlay

  // Add watermark
  ctx.font = '16px Roboto';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText('👁️ EyeWear Virtual Try-On', 20, canvas.height - 20);

  // Convert to blob
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9);
  });

  return {
    id: generateId(),
    productId: currentProduct.id,
    variantId: currentVariant.id,
    imageUrl: URL.createObjectURL(blob),
    thumbnailUrl: await generateThumbnail(blob),
    timestamp: new Date(),
    faceShape: detectedFaceShape,
    metadata: {
      deviceInfo: navigator.userAgent,
      modelVersion: '1.0.0',
      captureSettings: {
        mirrorMode: isMirrorMode,
        lighting: assessLighting(ctx)
      }
    }
  };
}
```

**Shutter Animation:**

```css
@keyframes shutter {
  0% { opacity: 0; }
  10% { opacity: 1; background: white; }
  100% { opacity: 0; }
}

.shutter-flash {
  position: fixed;
  inset: 0;
  pointer-events: none;
  animation: shutter 0.3s ease-out;
  z-index: 9999;
}
```

**Acceptance Criteria:**
- [ ] Capture button triggers camera + glasses composite
- [ ] Shutter flash animation plays on capture
- [ ] Snapshot includes both camera feed and glasses overlay
- [ ] Watermark is added to captured image
- [ ] Snapshot is stored in session memory (max 10 per session)
- [ ] Captures persist across variant switches
- [ ] Thumbnail generated for gallery view
- [ ] Audio feedback (shutter sound) plays (can be disabled)

---

### FR-007: Gallery & Comparison

**Requirement:** View and compare captured snapshots.

**Specification:**

```typescript
interface SnapshotGalleryProps {
  snapshots: CapturedSnapshot[];
  onSelect: (snapshot: CapturedSnapshot) => void;
  onDelete: (id: string) => void;
  compareMode: boolean;
}

interface ComparisonGridProps {
  snapshots: CapturedSnapshot[];  // Max 4
  onSelectFavorite: (id: string) => void;
}
```

**Gallery Layout:**

```typescript
// Mobile: Horizontal scroll
<GalleryScroll>
  {snapshots.map(snapshot => (
    <SnapshotCard
      key={snapshot.id}
      snapshot={snapshot}
      selected={selectedId === snapshot.id}
      onClick={() => onSelect(snapshot)}
    />
  ))}
</GalleryScroll>

// Desktop: Grid
<Grid container spacing={2}>
  {snapshots.map(snapshot => (
    <Grid item xs={6} md={3} key={snapshot.id}>
      <SnapshotCard snapshot={snapshot} />
    </Grid>
  ))}
</Grid>
```

**Comparison View:**

```typescript
function ComparisonGrid({ snapshots, onSelectFavorite }: ComparisonGridProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  return (
    <Box className="comparison-container">
      <Grid container spacing={2} columns={2}>
        {snapshots.map(snapshot => (
          <Grid item key={snapshot.id}>
            <ComparisonCard
              snapshot={snapshot}
              isFavorite={favorites.has(snapshot.id)}
              onToggle={() => toggleFavorite(snapshot.id)}
              onSelect={() => onSelectFavorite(snapshot.id)}
            />
          </Grid>
        ))}
      </Grid>

      <Button
        variant="contained"
        size="large"
        fullWidth
        disabled={favorites.size === 0}
        onClick={() => addToCartFromFavorites(favorites)}
      >
        Add Selected to Cart
      </Button>
    </Box>
  );
}
```

**Acceptance Criteria:**
- [ ] Gallery displays all captured snapshots
- [ ] Snapshot cards show thumbnail, variant name, timestamp
- [ ] Clicking snapshot opens full-size view
- [ ] Compare mode available when 2+ snapshots exist
- [ ] Comparison grid shows 2-4 snapshots side-by-side
- [ ] User can select favorite from comparison
- [ ] "Add Selected to Cart" adds all selected favorites
- [ ] Delete option available for individual snapshots

---

### FR-008: Save & Share

**Requirement:** Allow users to save snapshots to device and share them.

**Specification:**

```typescript
interface ShareOptions {
  platforms: ('native' | 'facebook' | 'instagram' | 'twitter' | 'whatsapp')[];
  includeProductLink: boolean;
  includeDiscount: boolean;
}

interface ShareHandlers {
  saveToDevice: (snapshot: CapturedSnapshot) => Promise<void>;
  shareNative: (snapshot: CapturedSnapshot) => Promise<void>;
  shareToSocial: (platform: string, snapshot: CapturedSnapshot) => Promise<void>;
}
```

**Save to Device:**

```typescript
async function saveToDevice(snapshot: CapturedSnapshot): Promise<void> {
  // Create download link
  const link = document.createElement('a');
  link.href = snapshot.imageUrl;
  link.download = `eyewear-tryon-${snapshot.id}.jpg`;

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Show success toast
  toast.success('Image saved to your device!');
}
```

**Native Share:**

```typescript
async function shareNative(snapshot: CapturedSnapshot): Promise<void> {
  // Convert blob to file
  const response = await fetch(snapshot.imageUrl);
  const blob = await response.blob();
  const file = new File([blob], 'tryon.jpg', { type: 'image/jpeg' });

  // Get product URL
  const productUrl = `${window.location.origin}/product/${snapshot.productId}`;

  // Use Web Share API
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Check out these glasses on EyeWear!',
        text: 'I tried these on virtually and love them!',
        url: productUrl,
        files: [file]
      });
    } catch (err) {
      // User cancelled or share failed
      console.log('Share cancelled:', err);
    }
  } else {
    // Fallback: Copy link to clipboard
    await navigator.clipboard.writeText(productUrl);
    toast.success('Link copied to clipboard!');
  }
}
```

**Social Share:**

```typescript
const SOCIAL_SHARE_URLS = {
  facebook: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  twitter: (url: string, text: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  pinterest: (url: string, description: string) => `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(description)}`,
  whatsapp: (url: string) => `https://wa.me/?text=${encodeURIComponent(url)}`,
};

async function shareToSocial(
  platform: keyof typeof SOCIAL_SHARE_URLS,
  snapshot: CapturedSnapshot
): Promise<void> {
  const productUrl = `${window.location.origin}/product/${snapshot.productId}`;
  const shareUrl = SOCIAL_SHARE_URLS[platform](productUrl);

  // Open in new window
  window.open(shareUrl, '_blank', 'width=600,height=400');
}
```

**Acceptance Criteria:**
- [ ] Save to device downloads image with filename
- [ ] Native share uses Web Share API when available
- [ ] Fallback to clipboard copy when native share unavailable
- [ ] Social share buttons open share intent in new window
- [ ] Shared content includes product link
- [ ] Optional discount code in share message
- [ ] Success feedback shown after share/save

---

### FR-009: Add to Cart Integration

**Requirement:** Seamlessly add tried products to cart.

**Specification:**

```typescript
interface TryOnCartItem {
  productId: string;
  variantId: string;
  quantity: number;
  snapshotId?: string;        // Reference to captured look
  metadata: {
    source: 'virtual-tryon';
    faceShape?: FaceShape;
    tryOnDuration: number;    // Seconds spent in try-on
  };
}
```

**Cart Integration:**

```typescript
async function addToCartFromTryOn(item: TryOnCartItem) {
  // Add to existing cart state
  const { cart, addToCart } = useCart();

  await addToCart({
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
    metadata: item.metadata
  });

  // Show success message with snapshot preview
  toast.success(
    <CartSuccessToast
      productName={currentProduct.name}
      variant={currentVariant}
      snapshot={item.snapshotId ? getSnapshot(item.snapshotId) : null}
    />,
    { duration: 5000 }
  );

  // Track conversion
  analytics.track('try_on_add_to_cart', {
    productId: item.productId,
    variantId: item.variantId,
    faceShape: item.metadata.faceShape,
    duration: item.metadata.tryOnDuration,
    snapshotsTaken: snapshots.length
  });
}
```

**Post-Add Actions:**

```typescript
interface PostAddActions {
  continueShopping: () => void;
  viewCart: () => void;
  proceedToCheckout: () => void;
}

function AddToCartSuccess({ onAction }: { onAction: (action: PostAddActions) => void }) {
  return (
    <Dialog open>
      <DialogContent>
        <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h6">Added to Cart!</Typography>

        <Stack spacing={2} sx={{ mt: 3 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => onAction('proceedToCheckout')}
          >
            Proceed to Checkout
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => onAction('viewCart')}
          >
            View Cart
          </Button>
          <Button
            variant="text"
            fullWidth
            onClick={() => onAction('continueShopping')}
          >
            Continue Shopping
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
```

**Acceptance Criteria:**
- [ ] Add to Cart button includes current variant
- [ ] Cart item includes metadata about try-on session
- [ ] Success dialog shows added product with snapshot
- [ ] Multiple action options: Checkout, View Cart, Continue Shopping
- [ ] Cart badge updates immediately
- [ ] Navigation to cart/checkout works correctly

---

### FR-010: Mirror View Toggle

**Requirement:** Allow users to toggle mirror mode.

**Specification:**

```typescript
interface MirrorViewProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  position: 'top-left' | 'top-right' | 'bottom-right';
}
```

**Implementation:**

```typescript
function MirrorToggle({ enabled, onToggle }: MirrorViewProps) {
  return (
    <FormControlLabel
      control={
        <Switch
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          color="primary"
        />
      }
      label="Mirror View"
      sx={{
        position: 'absolute',
        bottom: 120,
        right: 16,
        bgcolor: 'rgba(255,255,255,0.9)',
        px: 2,
        py: 1,
        borderRadius: 2,
      }}
    />
  );
}

// Apply mirror transform to video
const videoStyle = {
  transform: isMirrorMode ? 'scaleX(-1)' : 'scaleX(1)',
};
```

**Acceptance Criteria:**
- [ ] Toggle switch positioned in bottom-right corner
- [ ] Default state: ON (mirror enabled)
- [ ] Toggle updates video transform in real-time
- [ ] State persists during session
- [ ] Glasses overlay mirrors with video

---

## 4. Technical Requirements

### TR-001: Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial Load Time | < 3 seconds | Time to first frame |
| Model Load Time | < 2 seconds | 3D model download + parse |
| Face Detection FPS | ≥ 30 FPS | Frames per second |
| Tracking Latency | < 100ms | Detection to render |
| Capture Speed | < 500ms | Button click to saved |
| Memory Usage | < 200MB | Peak memory during session |

### TR-002: Browser Support

| Browser | Min Version | Notes |
|---------|-------------|-------|
| Chrome | 90+ | Full support |
| Safari | 14+ | Full support |
| Firefox | 88+ | Full support |
| Edge | 90+ | Full support |
| Mobile Safari | 14+ | Full support |
| Chrome Mobile | 90+ | Full support |

**Required APIs:**
- `getUserMedia` (Camera access)
- `WebGL` (3D rendering)
- `Web Workers` (Face detection)
- `Canvas API` (Image capture)
- `Web Share API` (Native sharing - progressive enhancement)

### TR-003: Device Support

| Device Type | Min Requirements |
|-------------|------------------|
| **Desktop** | Webcam, 4GB RAM, WebGL support |
| **Tablet** | Front-facing camera, 2GB RAM |
| **Mobile** | Front-facing camera, 2GB RAM, iOS 14+ / Android 10+ |

**Graceful Degradation:**
- No camera: Offer photo upload option
- Low performance: Reduce detection quality
- No WebGL: Show 2D overlay fallback

### TR-004: 3D Model Format

```typescript
interface Model3D {
  format: 'glb' | 'gltf' | 'obj';
  url: string;
  thumbnails: {
    front: string;
    side: string;
    angle: string;
  };
  metadata: {
    version: string;
    fileSize: number;          // Max 5MB
    polygonCount: number;       // Max 50k polygons
    textureCount: number;
    boneCount: number;
  };
}
```

**Model Specifications:**
- Format: GLB/GLTF (preferred) or OBJ
- Max file size: 5MB per model
- Max polygons: 50,000
- Textures: JPEG/WebP, max 1MB each
- Rigging: Single bone for nose bridge attachment

---

## 5. API Specifications

### API-001: Product Models Endpoint

**Endpoint:** `GET /api/products/{id}/models`

**Response:**

```typescript
interface ProductModelsResponse {
  productId: string;
  models: {
    variantId: string;
    model3D: {
      url: string;            // CDN URL to GLB file
      format: 'glb' | 'gltf';
      version: string;
      fileSize: number;
    };
    thumbnail: string;
  }[];
}
```

### API-002: Analytics Tracking

**Endpoint:** `POST /api/analytics/try-on`

**Request:**

```typescript
interface TryOnAnalyticsEvent {
  eventType: 'session_start' | 'session_end' | 'capture' | 'add_to_cart' | 'share';
  productId: string;
  variantId?: string;
  metadata: {
    deviceType: 'mobile' | 'tablet' | 'desktop';
    browser: string;
    sessionDuration?: number;
    snapshotsCount?: number;
    faceShape?: FaceShape;
    variantsTried: number;
  };
  timestamp: Date;
}
```

### API-003: Face Shape Recommendations

**Endpoint:** `GET /api/products/recommended?faceShape={shape}`

**Response:**

```typescript
interface RecommendedProductsResponse {
  faceShape: FaceShape;
  products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    thumbnail: string;
    matchScore: number;        // 0-100
  }[];
}
```

---

## 6. State Management

### State Structure (Zustand)

```typescript
interface VirtualTryOnStore {
  // Session state
  isActive: boolean;
  productId: string | null;
  currentVariantId: string | null;

  // Camera & tracking
  cameraPermission: 'prompt' | 'granted' | 'denied';
  isCameraActive: boolean;
  faceDetectionState: FaceDetectionState;

  // Face analysis
  faceShape: FaceShape | null;
  faceShapeAnalyzed: boolean;

  // Snapshots
  snapshots: CapturedSnapshot[];
  selectedSnapshotId: string | null;

  // UI state
  mirrorMode: boolean;
  compareMode: boolean;

  // Actions
  startSession: (productId: string, variantId: string) => void;
  endSession: () => void;
  setCameraPermission: (permission: CameraPermissionState) => void;
  setFaceShape: (shape: FaceShape) => void;
  addSnapshot: (snapshot: CapturedSnapshot) => void;
  removeSnapshot: (id: string) => void;
  selectSnapshot: (id: string) => void;
  toggleMirror: () => void;
  toggleCompare: () => void;
  reset: () => void;
}
```

---

## 7. Third-Party Integrations

### Integration Options

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **MediaPipe Face Mesh** | Google's ML kit | Free, accurate, fast | Large download (~5MB) |
| **Face-api.js** | TensorFlow.js based | Lightweight | Less accurate |
| **Banuba SDK** | Commercial AR SDK | Optimized, support | Expensive ($500+/mo) |
| **DeepAR** | Commercial AR SDK | Good tracking | Expensive |
| **Custom Build** | Build in-house | Full control | High dev cost |

### Recommendation

**Phase 1 (MVP):** Use MediaPipe Face Mesh
- Open source, free
- Proven in production
- 468 landmark detection
- < 100ms latency

**Phase 2 (Scale):** Evaluate commercial SDKs based on:
- Session volume
- User feedback on accuracy
- Performance metrics
- Budget considerations

### MediaPipe Integration

```typescript
import { FaceMesh, Results } from '@mediapipe/face-mesh';

class FaceTrackingService {
  private faceMesh: FaceMesh;

  constructor() {
    this.faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face-mesh/${file}`;
      }
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
  }

  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    await this.faceMesh.initialize();
    await this.faceMesh.send({ image: videoElement });
  }

  onResults(callback: (results: Results) => void): void {
    this.faceMesh.onResults(callback);
  }
}
```

---

## 8. Analytics & Tracking

### Events to Track

```typescript
interface AnalyticsEvents {
  // Entry events
  'try_on_button_view': { productId: string; variantId: string };
  'try_on_button_click': { productId: string; variantId: string };

  // Session events
  'try_on_session_start': {
    productId: string;
    variantId: string;
    deviceType: string;
    browser: string;
  };
  'try_on_session_end': {
    duration: number;
    snapshotsCount: number;
    variantsTried: number;
    faceShape?: FaceShape;
  };

  // Interaction events
  'try_on_variant_switch': { fromVariant: string; toVariant: string };
  'try_on_mirror_toggle': { enabled: boolean };
  'try_on_capture': { snapshotId: string; variantId: string };
  'try_on_face_shape_detected': { shape: FaceShape; confidence: number };

  // Conversion events
  'try_on_add_to_cart': {
    productId: string;
    variantId: string;
    faceShape?: FaceShape;
    sessionDuration: number;
  };
  'try_on_share': {
    platform: string;
    snapshotId: string;
    productId: string;
  };
  'try_on_save': { snapshotId: string; productId: string };
}
```

### Funnel Analysis

```
PDP Viewers (100%)
    ↓
Try-On Button Click (Target: 20%)
    ↓
Camera Permission Granted (Target: 90%)
    ↓
Face Tracking Active (Target: 95%)
    ↓
Face Shape Detected (Target: 80%)
    ↓
Snapshot Captured (Target: 60%)
    ↓
Add to Cart (Target: 25% of captures)
```

---

## 9. Testing Requirements

### Unit Tests

```typescript
describe('VirtualTryOnStore', () => {
  it('should start session with product', () => {
    const store = useVirtualTryOnStore.getState();
    store.startSession('prod-1', 'var-1');
    expect(store.isActive).toBe(true);
    expect(store.productId).toBe('prod-1');
  });

  it('should add snapshot to store', () => {
    const store = useVirtualTryOnStore.getState();
    const snapshot = createMockSnapshot();
    store.addSnapshot(snapshot);
    expect(store.snapshots).toHaveLength(1);
  });
});
```

### Integration Tests

```typescript
describe('Virtual Try-On Flow', () => {
  it('should complete full try-on journey', async () => {
    // 1. Navigate to PDP
    render(<ProductDetailPage />);
    await waitFor(() => screen.getByText('Try On Virtually'));

    // 2. Click Try-On button
    fireEvent.click(screen.getByText('Try On Virtually'));
    await waitFor(() => screen.getByText('Allow camera access'));

    // 3. Grant permissions
    mockCameraPermission('granted');
    await waitFor(() => screen.getByTestId('camera-view'));

    // 4. Simulate face detection
    mockFaceDetection(true);
    await waitFor(() => screen.getByText('Face Shape Detected'));

    // 5. Capture snapshot
    fireEvent.click(screen.getByTestId('capture-button'));
    await waitFor(() => screen.getByText('Add to Cart'));

    // 6. Add to cart
    fireEvent.click(screen.getByText('Add to Cart'));
    await waitFor(() => screen.getByText('Added to Cart'));
  });
});
```

### E2E Tests (Playwright)

```typescript
test('Virtual Try-On happy path', async ({ page }) => {
  await page.goto('/product/titanium-rimless');
  await page.click('[data-testid="try-on-button"]');

  // Mock camera for testing
  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = async () => mockVideoStream;
  });

  await page.click('button:has-text("Allow Camera")');
  await page.waitForSelector('[data-testid="camera-view"]');

  // Wait for face detection
  await page.waitForSelector('text=Face Shape Detected');

  // Capture
  await page.click('[data-testid="capture-button"]');
  await page.waitForSelector('text=Add to Cart');

  // Add to cart
  await page.click('button:has-text("Add to Cart")');
  await page.waitForSelector('text=Added to Cart');
});
```

### Performance Tests

```typescript
describe('Virtual Try-On Performance', () => {
  it('should load 3D model in under 2 seconds', async () => {
    const startTime = performance.now();
    await loadModel3D('model-url.glb');
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(2000);
  });

  it('should maintain 30 FPS during tracking', async () => {
    const fps = await measureFPS(() => trackFace(videoStream));
    expect(fps).toBeGreaterThanOrEqual(30);
  });
});
```

---

## 10. Launch Checklist

### Pre-Launch

- [ ] All P0 requirements implemented and tested
- [ ] 3D models created for top 20 best-selling frames
- [ ] Camera permission flow tested on all target browsers
- [ ] Face detection accuracy validated across diverse faces
- [ ] Performance benchmarks met (load time, FPS, latency)
- [ ] Analytics events implemented and tested
- [ ] Error handling and edge cases covered
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Security review passed (no data leaks, permissions)
- [ ] Legal review (privacy policy, terms updated)

### Beta Launch

- [ ] Deploy to staging environment
- [ ] Internal testing with diverse team members
- [ ] Beta test with selected customers (100 users)
- [ ] Collect feedback on:
  - [ ] Face detection accuracy
  - [ ] 3D model realism
  - [ ] UI/UX flow
  - [ ] Performance
- [ ] Analyze beta metrics
- [ ] Address critical issues

### Production Launch

- [ ] Deploy to production
- [ ] Feature flag for gradual rollout (10% → 50% → 100%)
- [ ] Monitor error rates and performance
- [ ] Set up alerts for anomalies
- [ ] A/B test Try-On button placement
- [ ] Monitor conversion metrics
- [ ] Collect user feedback via surveys
- [ ] Iterate based on data

### Post-Launch

- [ ] Weekly performance reviews
- [ ] Monthly feature enhancements
- [ ] Quarterly 3D model library expansion
- [ ] Ongoing A/B testing
- [ ] User feedback analysis
- [ ] Competitive analysis

---

## Appendix A: Component Library

### New Components Required

| Component | Priority | Props |
|-----------|----------|-------|
| `TryOnButton` | P0 | `productId`, `variantId` |
| `CameraView` | P0 | `onFaceDetected`, `onFaceLost` |
| `FaceGuide` | P0 | `alignment`, `visible` |
| `VariantCarousel` | P0 | `variants`, `current`, `onChange` |
| `CaptureButton` | P0 | `onCapture`, `disabled` |
| `SnapshotCard` | P0 | `snapshot`, `onSelect` |
| `GalleryView` | P1 | `snapshots`, `mode` |
| `ComparisonGrid` | P1 | `snapshots`, `maxItems` |
| `FaceShapeResult` | P1 | `shape`, `recommendation` |
| `ShareDialog` | P1 | `snapshot`, `platforms` |
| `PermissionDialog` | P0 | `onRetry`, `onDemo` |
| `MirrorToggle` | P1 | `enabled`, `onChange` |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **AR** | Augmented Reality - overlaying digital content on real-world view |
| **PDP** | Product Detail Page - page showing individual product information |
| **Face Mesh** | 3D representation of face with landmarks |
| **Landmarks** | Key points on face (eyes, nose, mouth, etc.) used for tracking |
| **Mirror Mode** | Horizontal flip of camera feed for natural reflection |
| **GLB/GLTF** | File format for 3D models (GL Transmission Format) |
| **FPS** | Frames Per Second - measure of animation smoothness |
| **Latency** | Time delay between action and visual response |

---

## Appendix C: References

- [MediaPipe Face Mesh Documentation](https://google.github.io/mediapipe/solutions/face_mesh.html)
- [WebGL Specifications](https://www.khronos.org/webgl/)
- [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API)
- [MUI Component Library](https://mui.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
