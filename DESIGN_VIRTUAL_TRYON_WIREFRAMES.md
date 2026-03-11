# Virtual Try-On Feature - Wireframes & UI Specifications

## Design System Reference

Based on existing EyeWear platform:

| Element | Specification |
|---------|---------------|
| **Primary Color** | `#2563eb` (Blue) |
| **Secondary Color** | `#8b5cf6` (Purple) |
| **Background** | White `#ffffff` |
| **Text Primary** | `#1e293b` (Slate 800) |
| **Text Secondary** | `#64748b` (Slate 500) |
| **Font Family** | Roboto (MUI default) |
| **Border Radius** | 8px |
| **Button Height** | 40px (large: 48px) |
| **Icon Size** | 24px |

---

## 1. Entry Point - Product Detail Page (PDP)

### Desktop Wireframe

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ EYEWEAR  │  Search...  │  Categories ▼  │  Account 👤  │  Cart 🛒 (2)            │
└────────────────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────────────────┐
│  Home  >  Eyeglasses  >  Rimless  >  Titanium Rimless Glasses                     │
└────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────┐
│┌─────────────────────┐  ┌────────────────────────────────────────────────────────┐│
││                     │  │  Titanium Rimless Glasses                              ││
││   [Product Image]   │  │  ⭐⭐⭐⭐⭐ (127 reviews)                                ││
││                     │  │  SKU: EYE-TI-001                                       ││
││                     │  │                                                         ││
││   ◀    ●    ●    ▶  │  │  $189.00                                               ││
││                     │  │  or 3 x $63.00 with                                    ││
││                     │  │                                                         ││
│└─────────────────────┘  │  ✅ In Stock - Ships in 2-3 days                        ││
│                         │                                                         ││
│┌─────────────────────┐  │  ┌───────────────────────────────────────────────────┐  ││
││  Select Color:       │  │  │                                                   │  ││
││  ● Silver (Active)   │  │  │  Frame Shape:          Lens Width:   Bridge:     │  ││
││  ○ Gold              │  │  │  ┌─────────┐           52mm          18mm        │  ││
││  ○ Rose Gold         │  │  │  │ Rimless │                                    │  ││
││                      │  │  │  └─────────┘           Temple: 140mm            │  ││
││  Select Size:        │  │  │                                                   │  ││
││  ○ Small             │  │  └───────────────────────────────────────────────────┘  ││
││  ● Medium (Active)   │  │                                                         ││
││  ○ Large             │  │  ┌───────────────────────────────────────────────────┐  ││
│└─────────────────────┘  │  │  Quantity:  [-]  1  [+]                            │  ││
│                         │  └───────────────────────────────────────────────────┘  ││
│                         │                                                         ││
│                         │  ┌───────────────────────────────────────────────────┐  ││
│                         │  │  ┌─────────────────────────────────────────────┐ │  ││
│                         │  │  │  🎥 Try On Virtually                 [→]   │ │  ││
│                         │  │  └─────────────────────────────────────────────┘ │  ││
│                         │  │                                                   │  ││
│                         │  │  ┌─────────────────────────────────────────────┐ │  ││
│                         │  │  │  🛒 Add to Cart              Buy Now 💜    │ │  ││
│                         │  │  └─────────────────────────────────────────────┘ │  ││
│                         │  └───────────────────────────────────────────────────┘  ││
│                         │                                                         ││
│                         │  📦 Free Shipping  |  💎 2-Year Warranty  |  ↩️ 30-Day ││
│                         │                                                         ││
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Wireframe

```
┌──────────────────────────────┐
│  ≡    EYEWEAR         🛒(2)  │
└──────────────────────────────┘
┌──────────────────────────────┐
│ ← Titanium Rimless Glasses   │
└──────────────────────────────┘

┌──────────────────────────────┐
│                              │
│                              │
│      [Product Image]         │
│                              │
│      ◀    ●    ●    ▶        │
│                              │
└──────────────────────────────┘
┌──────────────────────────────┐
│ Titanium Rimless Glasses     │
│ ⭐⭐⭐⭐⭐ (127)              │
│                              │
│ $189.00                      │
│ ✅ In Stock                  │
└──────────────────────────────┘
┌──────────────────────────────┐
│ Color:                       │
│ ● Silver  ○ Gold  ○ Rose     │
│                              │
│ Size:                        │
│ ○ Small  ● Medium  ○ Large   │
└──────────────────────────────┘
┌──────────────────────────────┐
│ ┌────────────────────────┐   │
│ │ 🎥 Try On Virtually  → │   │
│ └────────────────────────┘   │
│                              │
│ ┌────────────────────────┐   │
│ │ 🛒 Add to Cart         │   │
│ └────────────────────────┘   │
│                              │
│ ┌────────────────────────┐   │
│ │ Buy Now 💜             │   │
│ └────────────────────────┘   │
└──────────────────────────────┘
```

### Button Specifications

**Virtual Try-On Button:**

| Property | Value |
|----------|-------|
| **Variant** | `contained` (MUI) or `default` (shadcn) |
| **Color** | Primary Blue `#2563eb` with gradient |
| **Height** | 48px (large) |
| **Icon** | `CameraAlt` or `ViewInAr` from MUI Icons |
| **Label** | "Try On Virtually" |
| **Hover** | `#1d4ed8` with scale(1.02) |
| **Position** | Above Add to Cart, full width |

**CSS (Tailwind):**
```tsx
<Button
  variant="contained"
  size="large"
  fullWidth
  startIcon={<CameraAltIcon />}
  sx={{
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    py: 2,
    mb: 1.5,
    fontSize: '1rem',
    fontWeight: 600,
  }}
>
  Try On Virtually
</Button>
```

---

## 2. Try-On Interface - Camera View

### Mobile Wireframe (Portrait)

```
┌──────────────────────────────┐
│ [✕]                    🔍    │  ← Top Bar (48px height)
└──────────────────────────────┘
│                              │
│   ┌────────────────────┐     │
│   │                    │     │
│   │   ┌──────────┐     │     │
│   │   │          │     │     │
│   │   │  👤 +    │     │     │
│   │   │ Glasses  │     │     │  ← Camera Viewport
│   │   │          │     │     │
│   │   └──────────┘     │     │
│   │                    │     │
│   │   ⬤ Guide Oval     │     │
│   │                    │     │
│   └────────────────────┘     │
│                              │
└──────────────────────────────┘
│ ┌──────────────────────────┐ │
│ │ 🔵 Face Shape Detected!  │ │  ← Notification Card (auto-dismiss)
│ │ Oval ✓ Perfect match!    │ │
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
│                              │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ │  ← Variant Carousel (80px height)
│ │ SIL ││ GOL ││ ROS ││ BLK │ │
│ │ VER ││ D   ││ E   ││     │ │
│ └────┘ └────┘ └────┘ └────┘ │
│                              │
└──────────────────────────────┘
│                              │
│           ┌──────┐           │
│           │ ⚪   │           │  ← Capture Button (64px diameter)
│           └──────┘           │
│                              │
│    🔄 ←─→ 🪞  Mirror: ON   │  ← Secondary Controls (40px height)
└──────────────────────────────┘
```

### Desktop Wireframe

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│  [✕] Close                         Face Shape: Oval ✓                    🔍 Settings│
└────────────────────────────────────────────────────────────────────────────────────┘
│                                                                                    │
│                                                                                    │
│                                                                                    │
│                                                                                    │
│                                                                                    │
│              ┌──────────────────────────────┐                                     │
│              │                              │                                     │
│              │      ┌──────────┐            │                                     │
│              │      │          │            │                                     │
│              │      │  👤 +    │            │                                     │
│              │      │ Glasses  │            │  ← Centered Camera Viewport        │
│              │      │          │            │     (max-width: 600px)             │
│              │      └──────────┘            │                                     │
│              │      ⬤ Guide                │                                     │
│              │                              │                                     │
│              └──────────────────────────────┘                                     │
│                                                                                    │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
│                                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │  Frame Colors:                                                                │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │  │
│  │  │ Silver ✓ │ │  Gold    │ │Rose Gold │ │ Black    │ │ Tortoise │           │  │
│  │  │   📷    │ │   📷    │ │   📷    │ │   📷    │ │   📷    │           │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                    │
│  ┌────────────┐     ┌──────────────┐     ┌─────────────┐     ┌───────────────┐   │
│  │   ⏪       │     │    ⚪         │     │   ⏩        │     │  Mirror: [●]  │   │
│  │  Previous  │     │   Capture    │     │   Next      │     │   ON  OFF     │   │
│  └────────────┘     └──────────────┘     └─────────────┘     └───────────────┘   │
│                                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │  💡 Tip: Keep your face centered in the oval for best results               │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### Top Bar (Header)

**Mobile:**
- Height: 48px
- Padding: 12px horizontal
- Background: Transparent with semi-safe gradient
- Close button: Top-left, 32×32px
- Settings icon: Top-right, 32×32px

**Desktop:**
- Height: 56px
- Close button: Left
- Face shape indicator: Center
- Settings: Right

#### Camera Viewport

**Mobile:**
- Aspect Ratio: 3:4 (portrait optimized)
- Width: 100%
- Height: calc(100vh - 250px)
- Object-fit: cover

**Desktop:**
- Max-width: 600px
- Max-height: 70vh
- Border-radius: 12px
- Shadow: `0 20px 60px rgba(0,0,0,0.3)`

#### Face Guide Overlay

```css
.face-guide {
  position: absolute;
  width: 70%;
  aspect-ratio: 3/4;
  border: 2px dashed rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  transition: border-color 0.3s;
}

.face-guide.aligned {
  border-color: #10b981; /* Green when aligned */
  border-style: solid;
}
```

#### Variant Carousel (Bottom Sheet)

**Mobile:**
- Height: 80px
- Background: White with 8px top-radius
- Snap-to-scroll
- Active item: Scaled 1.1x, shadow

**Desktop:**
- Max-width: 700px
- Center aligned
- 120×80px thumbnails

#### Capture Button

**Mobile:**
- Diameter: 64px
- Border: 4px solid white
- Shadow: `0 4px 12px rgba(0,0,0,0.3)`
- Pulse animation when ready

**Desktop:**
- Diameter: 72px
- Label: "Capture Photo" below

```tsx
<Fab
  size="large"
  onClick={handleCapture}
  sx={{
    width: 64,
    height: 64,
    bgcolor: 'white',
    border: '4px solid #2563eb',
    '&:hover': {
      bgcolor: '#f8fafc',
    },
  }}
>
  <CameraIcon sx={{ color: '#2563eb' }} />
</Fab>
```

---

## 3. Face Shape Analysis Overlay

### Scanner Animation Wireframe

```
┌──────────────────────────────┐
│                              │
│   ┌────────────────────┐     │
│   │    ┌──────────┐     │     │
│   │    │          │     │     │
│   │    │  👤 +    │     │     │
│   │    │ Glasses  │     │     │
│   │    │          │     │     │
│   │    └──────────┘     │     │
│   │                     │     │
│   │  ════════════════   │     │  ← Scanning line animation
│   │  ▲ SCANNING... ▼    │     │     moving down face
│   │                     │     │
│   └────────────────────┘     │
│                              │
└──────────────────────────────┘
```

### Result Card Wireframe

```
┌──────────────────────────────────────┐
│                                      │
│   ┌────────────────────────────┐    │
│   │  ┌────┐                    │    │
│   │  │ ✓  │  Face Detected!    │    │
│   │  └────┘                    │    │
│   │                            │    │
│   │  ┌────────────────────┐   │    │
│   │  │                    │   │    │
│   │  │   🟢 OVAL SHAPE    │   │    │
│   │  │                    │   │    │
│   │  └────────────────────┘   │    │
│   │                            │    │
│   │  This frame fits your      │    │
│   │  face shape perfectly! ✨  │    │
│   │                            │    │
│   │  [See Recommended Styles]  │    │
│   └────────────────────────────┘    │
│                                      │
│              [Dismiss 5s]            │
│                                      │
└──────────────────────────────────────┘
```

### Card Specifications

**Dimensions:**
- Width: 90% max-width: 320px
- Background: White with 12px border-radius
- Shadow: `0 8px 24px rgba(0,0,0,0.15)`
- Padding: 20px

**Face Shape Detection Map:**

| Shape | Icon Color | Recommendation Message |
|-------|------------|------------------------|
| **Oval** | 🟢 Green | "This frame fits your face shape perfectly!" |
| **Round** | 🔵 Blue | "Angular frames complement your round face" |
| **Square** | 🟣 Purple | "Round or oval frames soften your features" |
| **Heart** | 🩷 Pink | "Frame with bottom-heavy design works best" |
| **Diamond** | 💎 Cyan | "Cat-eye or oval frames highlight your cheekbones" |
| **Oblong** | 🟡 Yellow | "Wide frames add balance to your face" |

**Scanner Animation CSS:**
```css
@keyframes scan {
  0% {
    top: 10%;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    top: 90%;
    opacity: 0;
  }
}

.scanner-line {
  position: absolute;
  width: 80%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #2563eb, transparent);
  animation: scan 2s ease-in-out infinite;
  box-shadow: 0 0 10px #2563eb;
}

.scanner-glow {
  position: absolute;
  width: 80%;
  height: 40px;
  background: linear-gradient(180deg, transparent, rgba(37,99,235,0.1), transparent);
  animation: scan 2s ease-in-out infinite;
}
```

---

## 4. Snapshot/Gallery View

### Post-Capture View (Mobile)

```
┌──────────────────────────────┐
│ [←]               [Share] [⋮] │
└──────────────────────────────┘
│                              │
│                              │
│      ┌────────────────┐      │
│      │                │      │
│      │  📸 CAPTURED   │      │
│      │     IMAGE      │      │
│      │  + Glasses     │      │
│      │     Overlay    │      │
│      │                │      │
│      │   👁️ Watermark │      │
│      └────────────────┘      │
│                              │
└──────────────────────────────┘
│  Titanium Rimless Glasses    │
│  Silver / Medium             │
│  $189.00                     │
└──────────────────────────────┘
│  ┌────────────────────────┐  │
│  │  🛒 Add to Cart        │  │
│  └────────────────────────┘  │
│                              │
│  ┌──────────┐ ┌──────────┐  │
│  │💾 Save    │ │ 🔄 Try    │  │
│  │   Device │ │  Another  │  │
│  └──────────┘ └──────────┘  │
│                              │
│  [Compare with more frames]  │
└──────────────────────────────┘
```

### Comparison Grid View

```
┌──────────────────────────────┐
│ [←] Compare Frames      [✕]  │
└──────────────────────────────┘
│                              │
│  ┌──────────┐  ┌──────────┐  │
│  │ Frame A  │  │ Frame B  │  │
│  │  📸      │  │  📸      │  │
│  │          │  │          │  │
│  │ Silver   │  │ Gold     │  │
│  │  ✓       │  │          │  │
│  └──────────┘  └──────────┘  │
│                              │
│  ┌──────────┐  ┌──────────┐  │
│  │ Frame C  │  │ Frame D  │  │
│  │  📸      │  │  📸      │  │
│  │          │  │          │  │
│  │ Rose     │  │ Black    │  │
│  │          │  │          │  │
│  └──────────┘  └──────────┘  │
│                              │
└──────────────────────────────┘
│  Select your favorite:        │
│  [Add Selected to Cart]       │
└──────────────────────────────┘
```

### Action Buttons Specifications

**Primary Action - Add to Cart:**
```tsx
<Button
  variant="contained"
  size="large"
  fullWidth
  startIcon={<ShoppingCartIcon />}
  sx={{
    background: '#2563eb',
    py: 1.5,
    fontSize: '1.1rem',
    fontWeight: 600,
    mb: 2,
  }}
>
  Add to Cart - $189.00
</Button>
```

**Secondary Actions:**
```tsx
<Stack direction="row" spacing={2}>
  <Button
    variant="outlined"
    startIcon={<DownloadIcon />}
    sx={{ flex: 1, py: 1.5 }}
  >
    Save
  </Button>
  <Button
    variant="outlined"
    startIcon={<ShareIcon />}
    sx={{ flex: 1, py: 1.5 }}
  >
    Share
  </Button>
</Stack>
```

**Tertiary Action:**
```tsx
<Button
  variant="text"
  startIcon={<CachedIcon />}
  sx={{ mt: 2 }}
>
  Try Another Style
</Button>
```

---

## 5. Camera Permission Dialog

### Permission Denied State

```
┌──────────────────────────────────────┐
│                                      │
│         ┌────────────────┐           │
│         │                │           │
│         │   📷 🚫        │           │
│         │   Camera icon  │           │
│         │   with X       │           │
│         │                │           │
│         └────────────────┘           │
│                                      │
│      Camera Access Required          │
│                                      │
│   To use the Virtual Try-On feature, │
│   we need access to your camera.     │
│                                      │
│   Your camera is only used locally   │
│   to overlay glasses on your face.   │
│   No photos are stored or shared.    │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  How to Enable:                │ │
│  │  1. Click the lock/info icon   │ │
│  │     in your address bar        │ │
│  │  2. Find "Camera" permission   │ │
│  │  3. Change to "Allow"          │ │
│  │  4. Refresh the page           │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌──────────────────────────────┐  │
│  │  I've Enabled Camera [Retry] │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  Try Demo Mode (No Camera)   │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  Return to Store             │  │
│  └──────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

### Dialog Component (MUI)

```tsx
<Dialog
  open={permissionDenied}
  maxWidth="sm"
  fullWidth
  PaperProps={{
    sx: {
      borderRadius: 3,
      p: 2,
    }
  }}
>
  <DialogTitle textAlign="center">
    <CameraAltIcon
      sx={{
        fontSize: 64,
        color: 'error.main',
        mb: 2
      }}
    />
    <Typography variant="h5">Camera Access Required</Typography>
  </DialogTitle>
  <DialogContent>
    <Typography color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
      To use the Virtual Try-On feature, we need access to your camera.
      Your camera is only used locally. No photos are stored.
    </Typography>

    <Alert severity="info" sx={{ mb: 3 }}>
      <Typography variant="body2">
        <strong>How to Enable:</strong><br/>
        1. Click the lock/info icon in your address bar<br/>
        2. Find "Camera" permission<br/>
        3. Change to "Allow"<br/>
        4. Refresh the page
      </Typography>
    </Alert>

    <Stack spacing={2}>
      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleRetry}
      >
        I've Enabled Camera - Retry
      </Button>
      <Button
        variant="outlined"
        size="large"
        fullWidth
        onClick={handleDemoMode}
      >
        Try Demo Mode (No Camera)
      </Button>
      <Button
        variant="text"
        fullWidth
        onClick={handleReturn}
      >
        Return to Store
      </Button>
    </Stack>
  </DialogContent>
</Dialog>
```

---

## 6. Loading States

### 3D Model Loading Skeleton

```
┌──────────────────────────────┐
│ [✕]                    🔍    │
└──────────────────────────────┘
│                              │
│   ┌────────────────────┐     │
│   │                    │     │
│   │   ┌──────────┐     │     │
│   │   │ ░░░░░░░░ │     │     │  ← Skeleton placeholder
│   │   │ ░░░░░░░░ │     │     │     for glasses model
│   │   │ ░░░░░░░░ │     │     │
│   │   └──────────┘     │     │
│   │                    │     │
│   │   ⬤ Guide          │     │
│   │                    │     │
│   └────────────────────┘     │
│                              │
└──────────────────────────────┘
│  Loading glasses model...    │
│  ████░░░░░░░░░ 60%           │
└──────────────────────────────┘
```

### Loading Component

```tsx
<Box
  sx={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
  }}
>
  <CircularProgress
    size={48}
    sx={{
      color: '#2563eb',
      mb: 2,
    }}
  />
  <Typography variant="body2" color="text.secondary">
    Loading glasses model...
  </Typography>
  <LinearProgress
    variant="determinate"
    value={loadingProgress}
    sx={{
      mt: 2,
      width: 200,
      mx: 'auto',
    }}
  />
</Box>
```

---

## Responsive Breakpoints

| Breakpoint | Width (px) | Layout Changes |
|------------|-----------|----------------|
| **Mobile** | < 640 | Single column, full-width buttons, bottom controls |
| **Tablet** | 640 - 1024 | Centered viewport, 600px max-width |
| **Desktop** | > 1024 | Side-by-side layout possible, larger thumbnails |

---

## Accessibility Features

| Feature | Implementation |
|---------|---------------|
| **Keyboard Navigation** | Tab through all controls, Escape to close |
| **Screen Reader** | ARIA labels for all buttons, live regions for status |
| **High Contrast** | Ensure minimum 4.5:1 contrast ratio |
| **Touch Targets** | Minimum 44×44px for all interactive elements |
| **Focus Indicators** | Visible focus rings on all controls |
| **Motion Reduction** | Respect `prefers-reduced-motion` media query |

---

## Performance Considerations

1. **Lazy Loading:** Load 3D models on-demand
2. **Web Worker:** Run face detection in Web Worker
3. **Canvas Optimization:** Use GPU-accelerated canvas
4. **Image Optimization:** Compress captured snapshots before saving
5. **Progressive Loading:** Show low-res model first, then high-res
