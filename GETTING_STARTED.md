# Getting Started - Your New Product Management System

## What You Have Now

A complete, working product management system for your optical shop. You can:

✅ Create optical frames, lenses, and services
✅ Edit existing products
✅ Delete products (safely, with restore option)
✅ Manage product variants
✅ Upload product images
✅ See prices in Vietnamese currency (₫ VND)
✅ Get real-time notifications

## 🚀 Quick Start (5 minutes)

### 1. Find the Component
Location: `FE/src/pages/admin/ProductManagementPage.tsx`

### 2. It's Already Imported
The component is ready to use. Just import it where needed:
```typescript
import { ProductManagementPage } from '@/pages/admin/ProductManagementPage'

export function AdminDashboard() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <ProductManagementPage />
    </div>
  )
}
```

### 3. It's Ready to Run
No additional setup needed. The component:
- ✅ Automatically fetches products
- ✅ Has all validation built-in
- ✅ Connects to your backend API
- ✅ Shows loading states
- ✅ Displays notifications

## 📸 What You'll See

### On Page Load
```
Title: "Product Management"
Subtitle: "Manage optical products (Frames, Lenses, Services)"
Button: "Create New Product"

Two Tabs:
- "Active Products (5)" ← Shows your products
- "Deleted Products (0)" ← Shows deleted items
```

### Product Table
```
Name                    | Category  | Price      | Variants | Actions
Classic Round Frame     | frame     | ₫1,500,000 | 3        | [Edit] [Delete]
Blue Light Lens         | lens      | ₫800,000   | 2        | [Edit] [Delete]
Eye Test Service        | service   | ₫200,000   | 1        | [Edit] [Delete]
```

### When You Click "Create New Product"
```
Form appears with:

Category selector:  [frame ▼]

Common Fields:
- Product Name: [text input]
- Description: [text area]
- Base Price: [number input]
- Tags: [text input]

Frame-Specific Fields:
- Frame Type: [full-rim ▼]
- Shape: [round ▼]
- Material: [metal ▼]
- Gender: [unisex ▼]
- Bridge Fit: [standard ▼]

Image Upload:
[Choose Files...] (select multiple images)

Variant Management:
SKU: [text] Size: [text] Color: [Black ▼] Price: [number] Weight: [number]
[Add Variant]
✓ FR-ROUND-52-BLK - Black [X]
✓ FR-ROUND-54-GLD - Gold [X]

Buttons:
[Create Product] [Cancel]
```

## 🎮 How to Use

### Create a Product

1. **Click "Create New Product"** button
2. **Choose Category**
   - Select from: frame, lens, or service
   - Form will change based on selection
3. **Fill Common Fields**
   - Name: e.g., "Round Metal Frames"
   - Description: e.g., "Classic metal frames with round shape"
   - Base Price: e.g., "1500000" (in VND)
   - Tags: e.g., "premium, metal, durable" (comma-separated, optional)
4. **Fill Category-Specific Fields**
   - For Frames: Select type, shape, material, gender, bridge fit
   - For Lenses: Select type, enter index, add coatings, set prescription
   - For Services: Select type, enter duration, add notes
5. **Upload Images (Optional)**
   - Click file input and select multiple images
   - Selected files show as chips with delete button
6. **Add At Least One Variant**
   - Enter SKU (e.g., "FR-ROUND-52-BLK")
   - Enter Size (e.g., "52-18-140")
   - Select Color
   - Optional: Enter Price (override base price)
   - Optional: Enter Weight in grams
   - Click "Add Variant"
   - Variant appears as a chip below
7. **Submit**
   - Click "Create Product"
   - See success toast notification
   - Product appears in table
   - Form resets

### Edit a Product

1. **Find product in table**
2. **Click Edit icon** (pencil icon)
3. Form loads with all product data
4. **Modify fields** as needed
5. **Note**: Category field is disabled (cannot change category)
6. **Update variants** if needed
7. **Click "Update Product"**
8. See success notification
9. Table updates with new data

### Delete a Product

1. **Find product in table**
2. **Click Delete icon** (trash icon)
3. **Confirmation dialog appears**
   - "Are you sure you want to delete this product? You can restore it later."
4. **Click "Delete" to confirm**
5. See success notification
6. Product disappears from "Active Products" tab
7. Product appears in "Deleted Products" tab

### Restore a Deleted Product

1. **Click "Deleted Products" tab**
2. **See deleted products**
   - Message: "These products are soft-deleted and can be restored"
3. **Click "Restore" button**
4. See success notification
5. Product returns to "Active Products" tab
6. All data is intact

## 🎯 Category Details

### Frame Products
**Fields:**
- frameType: "full-rim", "half-rim", or "rimless"
- shape: "round", "square", "oval", "cat-eye", or "aviator"
- material: "metal", "plastic", or "mixed"
- gender: "men", "women", or "unisex"
- bridgeFit: "standard" or "asian-fit"

**Example:**
```
Name: Classic Round Metal Frames
Category: frame
Description: Elegant metal frames with round shape
Base Price: 1,500,000 VND
Tags: premium, metal, elegant
frameType: full-rim
shape: round
material: metal
gender: unisex
bridgeFit: standard
```

### Lens Products
**Fields:**
- lensType: "single-vision", "bifocal", "progressive", or "photochromic"
- index: 1.5 to 2.0 (refractive index)
- coatings: e.g., "anti-glare", "UV protection"
- isPrescriptionRequired: yes or no
- minSPH & maxSPH: minimum and maximum sphere power

**Example:**
```
Name: Blue Light Blocking Lens
Category: lens
Description: Anti-blue light protective lens
Base Price: 800,000 VND
Tags: protection, tech
lensType: single-vision
index: 1.6
coatings: anti-glare, UV protection, blue-light blocking
isPrescriptionRequired: no
minSPH: 0
maxSPH: 0
```

### Service Products
**Fields:**
- serviceType: "eye-test", "lens-cutting", "frame-adjustment", or "cleaning"
- durationMinutes: How long the service takes
- serviceNotes: Additional details (optional)

**Example:**
```
Name: Professional Eye Test
Category: service
Description: Comprehensive eye examination by licensed optometrist
Base Price: 200,000 VND
Tags: professional, healthcare
serviceType: eye-test
durationMinutes: 30
serviceNotes: Includes vision check and eye health assessment
```

## 🎨 Visual Feedback

### Success Notifications (Green Toast)
```
✓ "Product created successfully"
✓ "Product updated successfully"
✓ "Product deleted successfully"
✓ "Product restored successfully"
```

### Error Notifications (Red Toast)
```
✗ "Please fill all required fields and add at least one variant"
✗ "Failed to load products"
✗ "[Error from backend]"
```

### Loading State
```
Circular spinner in center of screen while loading products
```

## 💡 Tips & Tricks

### Color Options for Variants
- Black
- White
- Red
- Blue
- Green
- Yellow
- Gray
- Brown
- Gold
- Silver

### SKU Best Practices
```
Good: FR-ROUND-52-BLK    (Format: CATEGORY-TYPE-SIZE-COLOR)
Good: LENS-BLUE-1-6      (Format: CATEGORY-TYPE-INDEX)
Good: SERVICE-TEST-30    (Format: CATEGORY-TYPE-DURATION)
```

### Price Entry
- Enter as whole numbers (no decimals)
- Example: 1500000 (not 1,500,000 or 1500000.00)
- Will display as: ₫1,500,000 (formatted)

### Multiple Images
- Click file input
- Select multiple files at once (Ctrl+Click or Shift+Click)
- Or click multiple times to add more
- See file names as chips
- Remove by clicking X on chip

### Editing Variants
- Click on any variant chip to edit it
- Form fields populate with variant data
- Make changes
- Click "Update Variant" to save
- Click "Cancel" to discard changes

## 🔄 Keyboard Shortcuts

(Not implemented yet, but form fields are keyboard-accessible)
- Tab: Move between fields
- Enter: Submit form (if focus is on submit button)
- Escape: Close dialog (on many UIs)

## 🚨 Important

### What You Cannot Do (By Design)
- Change product category after creation (prevents data corruption)
- Have a product without at least 1 variant
- Create duplicate SKUs (enforced by backend)

### What Gets Deleted (When You Delete)
- Product is marked as deleted (soft delete)
- All data is still in database
- You can restore it anytime
- Deleted products don't show in "Active Products" tab
- Deleted products show in "Deleted Products" tab with restore button

### Data Persistence
- Changes are saved immediately
- Refresh page to see latest products
- Form resets after successful submission
- No unsaved changes warning (changes are auto-saved)

## 📱 Responsive Design

- ✅ Works on desktop
- ✅ Works on tablet
- ✅ Works on mobile (form adapts to screen size)
- ✅ Material-UI handles responsiveness automatically

## 🆘 What If Something Goes Wrong?

### Product Doesn't Appear
1. Refresh the page
2. Check browser console for errors (F12 > Console)
3. Verify backend API is running
4. Check auth token is valid

### Form Won't Submit
1. Check all required fields are filled
2. At least 1 variant must be added
3. Base price must be > 0
4. Check browser console for validation errors

### Delete Confirmation Doesn't Show
1. Reload page
2. Try again
3. Check browser console

### Images Not Uploading
1. Check file is actually an image
2. Check Cloudinary is configured
3. Check auth token is valid

## 📞 Need Help?

### For Frontend Issues
→ See `FRONTEND_IMPLEMENTATION_COMPLETE.md`

### For Backend/API Issues
→ See `PRODUCT_API_EXAMPLES.md`

### For Architecture Questions
→ See `VISUAL_OVERVIEW.md`

### For Feature Details
→ See `IMPLEMENTATION_REPORT.md`

---

## ✅ You're Ready!

Everything is set up and ready to go. Just:
1. Import the component
2. Add it to your admin page
3. Start creating products!

The system handles all the complexity for you:
- ✅ Form management
- ✅ Validation
- ✅ API calls
- ✅ Image uploads
- ✅ Error handling
- ✅ User notifications

**Enjoy your product management system!** 🎉
