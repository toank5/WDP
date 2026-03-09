# Virtual Try-On Feature - User Flow Diagram

## Overview
The Virtual Try-On feature bridges the gap between online shopping and in-store experience by allowing customers to virtually try on eyeglasses using their device camera.

---

## Complete User Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           VIRTUAL TRY-ON USER FLOW                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐  │
│  │  1. BROWSE   │────▶│  2. VIEW PDP │────▶│  3. CLICK    │────▶│ 4. CAMERA │  │
│  │  STORE/SEARCH│     │  (PRODUCT    │     │  "VIRTUAL    │     │  PERMISS │  │
│  │              │     │   DETAIL)    │     │   TRY-ON"    │     │           │  │
│  └──────────────┘     └──────────────┘     └──────────────┘     └────┬──────┘  │
│                                                             │               │
│                                                    ┌────────▼────────┐     │
│                                                    │  GRANTED?       │     │
│                                                    └────┬──────┬─────┘     │
│                                                         │ NO   │ YES       │
│                                                         │      │           │
│                                                    ┌────▼──┐  ┌▼──────────┐ │
│                                                    │SHOW   │  │5. LAUNCH  │ │
│                                                    │PERMISS│  │TRY-ON    │ │
│                                                    │GUIDE  │  │INTERFACE │ │
│                                                    └───────┘  └───────────┘ │
│                                                                    │        │
│                                                    ┌───────────────▼────────┐│
│                                                    │   6. FACE TRACKING     ││
│                                                    │   - Detect face        ││
│                                                    │   - Overlay glasses    ││
│                                                    │   - Show guide         ││
│                                                    └───────────┬────────────┘│
│                                                                │           │
│                                                    ┌───────────▼────────────┐│
│                                                    │   7. FACE SHAPE        ││
│                                                    │   ANALYSIS (3-5sec)    ││
│                                                    │   - Scanner animation  ││
│                                                    │   - Detect shape       ││
│                                                    │   - Show recommendation││
│                                                    └───────────┬────────────┘│
│                                                                │           │
│                                            ┌───────────────────┼───────────┤
│                                            │                   │           │
│                                    ┌───────▼──────┐   ┌───────▼──────┐   │
│                                    │8. SWITCH     │   │9. CAPTURE    │   │
│                                    │VARIANTS      │   │SNAPSHOT      │   │
│                                    │- Colors      │   │- Camera      │   │
│                                    │- Styles      │   │  shutter     │   │
│                                    └───────┬──────┘   └───────┬──────┘   │
│                                            │                   │           │
│                                            │        ┌──────────▼────────┐  │
│                                            │        │10. SNAPSHOT VIEW  │  │
│                                            │        │- Show captured    │  │
│                                            │        │  image            │  │
│                                            │        │- Action buttons   │  │
│                                            │        └─────────┬─────────┘  │
│                                            │                  │             │
│                                    ┌───────▼──────────────────▼───────┐    │
│                                    │      11. ACTION SELECTION         │    │
│                                    │  ┌──────────┐  ┌──────────┐      │    │
│                                    │  │ ADD TO   │  │ SAVE/    │      │    │
│                                    │  │ CART     │  │ SHARE    │      │    │
│                                    │  └──────────┘  └──────────┘      │    │
│                                    └──────────────────────────────────┘    │
│                                            │                  │             │
│                                    ┌───────▼─────────┐  ┌───▼──────────┐   │
│                                    │12. CONTINUE     │  │13. RETURN TO │   │
│                                    │SHOPPING / CHECK │  │TRY-ON / EXIT │   │
│                                    │OUT              │  │              │   │
│                                    └─────────────────┘  └──────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Flow Breakdown by Steps

### Step 1: Browse Store/Category
**User Action:** Navigate to eyewear categories
- Home page category selection
- Search functionality
- Filter by frame type, color, price

**Entry Points to Virtual Try-On:**
- Category listing cards
- Search results grid
- Home featured products

---

### Step 2: View Product Detail Page (PDP)
**User Action:** Click on a product to view details

**PDP Elements:**
- Product image gallery
- Product name, price, description
- Variant selectors (color, size)
- Add to Cart button
- **NEW:** Virtual Try-On button (prominent placement)

**Virtual Try-On Button Placement:**
- Position: Below variant selectors or next to Add to Cart
- Style: Primary action button with camera icon
- Label: "Try On Virtually" or "Virtual Try-On"

---

### Step 3: Click "Virtual Try-On"
**User Action:** Click the Virtual Try-On button

**System Actions:**
1. Store current product context (product ID, variant)
2. Check device camera support
3. Request camera permissions
4. Show loading state

---

### Step 4: Camera Permission Request
**User Action:** Allow or deny camera access

**If Denied:**
- Show friendly permission guide
- Explain why camera is needed
- Provide "How to enable" instructions
- Offer "Try Demo Mode" option (if available)

**If Granted:**
- Proceed to Step 5

---

### Step 5: Launch Try-On Interface
**User Action:** Camera feed activates

**Interface Components:**
- Full-screen camera view
- Face alignment guide (oval overlay)
- Initial glasses model (current variant)
- Loading skeleton for 3D model
- Bottom control bar
- Top close button

---

### Step 6: Face Tracking Active
**User Action:** Position face in guide

**System Actions:**
- Detect face landmarks
- Track face position
- Overlay glasses model on nose bridge
- Show alignment feedback (green when aligned)
- Mirror view toggle (default: ON)

**User Controls:**
- Toggle mirror view ON/OFF
- Close (X) button

---

### Step 7: Face Shape Analysis
**Trigger:** After 3-5 seconds of stable tracking

**Animation:**
- Scanner line moving down face
- Subtle glow effect

**Result Display:**
- Detected face shape (Oval, Round, Square, Heart, Diamond)
- Fit message:
  - ✅ "This frame fits your face shape perfectly!"
  - ⚠️ "We recommend Round frames for your Square face"
- Action: "See Recommended Styles" button

---

### Step 8: Switch Variants
**User Action:** Browse and select different frame colors/styles

**Variant Carousel:**
- Horizontal scrollable list
- Thumbnail images of each variant
- Current variant highlighted
- Instant switching (no page reload)

**Carousel Items:**
- Frame color swatches
- Different frame styles (if available)
- Related products (similar styles)

---

### Step 9: Capture Snapshot
**User Action:** Press circular shutter button

**System Actions:**
- Freeze current frame
- Capture camera feed + glasses overlay
- Play shutter sound/animation
- Transition to snapshot view

---

### Step 10: Snapshot View
**Display:** Captured image with glasses

**User Actions Available:**
- Preview the captured look
- Compare with other snapshots (if multiple taken)
- Access action buttons

---

### Step 11: Action Selection

**Available Actions:**

| Button | Action | Destination |
|--------|--------|-------------|
| **Add to Cart** | Add current variant with snapshot reference | Cart page |
| **Save to Device** | Download image to device gallery | Device storage |
| **Share** | Native share sheet or social share | Share modal |
| **Try Another Style** | Return to camera view | Try-On interface |
| **Compare** | View 2-4 snapshots side-by-side | Comparison grid |

---

### Step 12: Add to Cart Flow
**User Action:** Click "Add to Cart"

**System Actions:**
1. Add product variant to cart
2. Store snapshot reference (optional)
3. Show success confirmation
4. Offer navigation options:
   - Continue Shopping
   - View Cart
   - Proceed to Checkout

---

### Step 13: Return to Try-On / Exit
**User Actions:**
- **Return to Try-On:** Go back to camera view
- **Close (X):** Return to PDP
- **Breadcrumb:** Navigate to store/categories

---

## Alternative Flows

### A. Direct Access via URL
**Scenario:** User has direct link or bookmark

```
URL: /virtual-tryon?productId=123&variantId=456
         │
         ▼
    ┌─────────┐
    │ PRODUCT │
    │ PRELOAD │
    └────┬────┘
         │
         ▼
    Step 4: Permissions
```

---

### B. Compare Mode Flow
**Scenario:** User wants to compare multiple frames

```
Try-On Interface
         │
    ┌────▼────┐
    │ CAPTURE │ 1st frame
    │ Frame A │
    └────┬────┘
         │
    ┌────▼────┐
    │ SWITCH  │ to Frame B
    │ VARIANT │
    └────┬────┘
         │
    ┌────▼────┐
    │ CAPTURE │ 2nd frame
    │ Frame B │
    └────┬────┘
         │
    ┌────▼─────────────┐
    │ CLICK COMPARE    │
    │ (2-4 snapshots)  │
    └────┬─────────────┘
         │
         ▼
    ┌─────────────────┐
    │ COMPARISON GRID │
    │  [A]  [B]  [C]  │
    │ Select favorite │
    └─────────────────┘
```

---

### C. No Camera / Permission Denied Flow
```
    ┌─────────────────┐
    │ CAMERA BLOCKED  │
    └────────┬────────┘
             │
    ┌────────▼─────────────┐
    │ SHOW HELPFUL MESSAGE │
    │ "Enable camera in    │
    │  browser settings"   │
    │  [How to Guide]      │
    │  [Try Demo Mode]     │
    │  [Return to Store]   │
    └──────────────────────┘
```

---

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| No camera detected | Show message, offer static try-on with uploaded photo |
| Poor lighting | Show "Improve lighting" tip |
| Multiple faces detected | "Please ensure only one face in frame" |
| Face too far/close | "Move closer/farther from camera" |
| 3D model loading failed | Show fallback 2D overlay |
| Slow connection | Show loading skeleton with progress |

---

## Success Metrics

**Engagement Metrics:**
- % of PDP visitors who click Try-On
- Average time spent in Try-On mode
- % of users who try multiple variants

**Conversion Metrics:**
- Add to Cart rate from Try-On vs. from PDP
- Snapshot capture rate
- Share/Save rate

**Technical Metrics:**
- Camera permission grant rate
- Face tracking accuracy
- 3D model load time
- Mobile vs. desktop usage
