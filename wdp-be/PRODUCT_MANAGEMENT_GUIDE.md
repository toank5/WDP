# Product Management System - Complete Implementation Guide

## Overview

This document describes the production-ready product management system for the optical shop, supporting three product categories (Frames, Lenses, Services) with category-specific fields, variants, advanced filtering, and comprehensive validation.

## Architecture

```
commons/
├── enums/
│   └── product.enum.ts (All product enums)
├── schemas/
│   ├── product.schema.ts (Mongoose product schema with category-specific fields)
│   └── product-variant.schema.ts (Variant schema)
├── dtos/
│   └── product.dto.ts (Data transfer objects for all product types)
├── guards/
│   └── rbac.guard.ts (Role-based access control)
└── validations/
    └── product-validation.zod.ts (Zod validation schemas)

controllers/
├── manager-product.controller.ts (Manager product creation endpoint)
└── product.controller.ts (Public product endpoints)

services/
├── product.service.ts (Business logic with full validation)
└── other services...

modules/
└── manager-product.module.ts (Manager product module)
```

## Product Data Model

### Common Fields (All Products)

```typescript
{
  _id: ObjectId;
  name: string;                    // Product name (3-200 chars)
  slug: string;                    // URL-friendly unique identifier (auto-generated)
  category: "frame" | "lens" | "service";
  description: string;             // 10-2000 characters
  basePrice: number;              // Base price in VND
  images2D: string[];             // Front-facing images
  images3D: string[];             // 3D model URLs (.glb, .gltf)
  tags: string[];                 // Search/filtering tags
  isActive: boolean;              // Active status
  isDeleted: boolean;             // Soft delete flag
  createdAt: Date;
  updatedAt: Date;
}
```

### Frame-Specific Fields

```typescript
{
  frameType: "full-rim" | "half-rim" | "rimless";  // Required
  shape: "round" | "square" | "aviator" | "rectangular" | "cat-eye" | ...;  // Required
  material: "metal" | "plastic" | "titanium" | "acetate" | "mixed";  // Required
  gender?: "unisex" | "male" | "female";
  bridgeFit?: "asian-fit" | "standard" | "wide";
  variants: [
    {
      sku: string;                // Unique SKU (e.g., "FR-ROUND-52-BLK")
      size: string;               // Frame size (e.g., "52-18-140")
      color: string;              // Color name
      price: number;              // Optional price override
      weight?: number;            // Weight in grams
      images2D?: string[];
      images3D?: string[];
      isActive: boolean;
      createdAt: Date;
    }
  ];
}
```

### Lens-Specific Fields

```typescript
{
  lensType: "single-vision" | "progressive" | "computer" | ...;  // Required
  index: 1.5 - 2.0;               // Refractive index (required)
  coatings?: string[];            // e.g., ["blue-light", "anti-reflective"]
  suitableForPrescriptionRange?: {
    minSPH?: number;
    maxSPH?: number;
    minCYL?: number;
    maxCYL?: number;
  };
  isPrescriptionRequired: boolean; // Required
  variants?: [
    {
      sku: string;
      size: string;
      price: number;
      // ... other variant fields
    }
  ];
}
```

### Service-Specific Fields

```typescript
{
  serviceType: "fitting" | "cleaning" | "repair" | "eye-test" | ...;  // Required
  durationMinutes: number;        // Service duration (required)
  serviceNotes?: string;          // Service description
  // No variants for services (typically)
}
```

## API Endpoints

### Create Product (Manager/Admin Only)

**Endpoint:**
```
POST /api/manager/products
```

**Authentication:** Required (Manager or Admin role)

**Request Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Request Body (Form Data):**

#### For Frame Products:

```json
{
  "name": "Classic Round Frame",
  "category": "frame",
  "description": "Lightweight round frame for everyday wear.",
  "basePrice": 1200000,
  "images2D": ["https://.../round-front.jpg", "https://.../round-side.jpg"],
  "images3D": ["https://.../round-3d.glb"],
  "tags": ["office", "lightweight", "unisex"],
  "frameType": "full-rim",
  "shape": "round",
  "material": "metal",
  "gender": "unisex",
  "bridgeFit": "asian-fit",
  "variants": [
    {
      "sku": "FR-ROUND-52-BLK",
      "size": "52-18-140",
      "color": "black",
      "price": 1250000,
      "weight": 28,
      "isActive": true
    },
    {
      "sku": "FR-ROUND-54-GOLD",
      "size": "54-18-145",
      "color": "gold",
      "price": 1300000,
      "weight": 30,
      "isActive": true
    }
  ]
}
```

#### For Lens Products:

```json
{
  "name": "Progressive Lens 1.60",
  "category": "lens",
  "description": "High-quality progressive lens with blue light coating.",
  "basePrice": 800000,
  "images2D": ["https://.../lens-visual.jpg"],
  "images3D": [],
  "tags": ["progressive", "office", "blue-light"],
  "lensType": "progressive",
  "index": 1.60,
  "coatings": ["blue-light", "anti-reflective"],
  "suitableForPrescriptionRange": {
    "minSPH": -0.5,
    "maxSPH": -6.0,
    "minCYL": -0.5,
    "maxCYL": -2.0
  },
  "isPrescriptionRequired": true,
  "variants": [
    {
      "sku": "LNS-PROG-160-STD",
      "size": "standard",
      "color": "clear",
      "price": 800000,
      "isActive": true
    }
  ]
}
```

#### For Service Products:

```json
{
  "name": "Eye Test with Prescription",
  "category": "service",
  "description": "Professional eye examination with complete prescription assessment.",
  "basePrice": 200000,
  "images2D": ["https://.../eye-test.jpg"],
  "images3D": [],
  "tags": ["eye-test", "prescription"],
  "serviceType": "eye-test",
  "durationMinutes": 30,
  "serviceNotes": "Includes comprehensive eye examination and prescription analysis."
}
```

**File Upload:**
Images can be uploaded as files in `images` field, which will be stored in Cloudinary automatically.

### Success Response (201 Created)

```json
{
  "statusCode": 201,
  "message": "Product created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Classic Round Frame",
    "slug": "classic-round-frame",
    "category": "frame",
    "basePrice": 1200000,
    "variantsCount": 2,
    "isActive": true,
    "createdAt": "2024-01-28T10:30:00Z"
  }
}
```

### Error Responses

#### Validation Error (400)

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "path": "variants",
      "message": "At least one variant is required"
    },
    {
      "path": "frameType",
      "message": "frameType is required for frame products"
    }
  ]
}
```

#### SKU Conflict (409)

```json
{
  "statusCode": 409,
  "message": "SKUs already exist: FR-ROUND-52-BLK, FR-ROUND-54-GOLD",
  "error": "SKU_ALREADY_EXISTS"
}
```

#### Unauthorized (401)

```json
{
  "statusCode": 401,
  "message": "User not authenticated",
  "error": "UNAUTHORIZED"
}
```

#### Forbidden (403)

```json
{
  "statusCode": 403,
  "message": "Access denied. Only managers and admins can create products.",
  "error": "FORBIDDEN"
}
```

## Validation Rules

### Common Validation

- **name**: Required, 3-200 characters
- **category**: Required, must be "frame", "lens", or "service"
- **description**: Required, 10-2000 characters
- **basePrice**: Required, positive number
- **images2D**: Required, at least one valid URL
- **images3D**: Optional, valid URLs
- **tags**: Optional, max 50 characters each

### Frame-Specific Validation

- **frameType**: Required, must be one of: full-rim, half-rim, rimless
- **shape**: Required, must be valid frame shape
- **material**: Required, must be valid material
- **gender**: Optional
- **bridgeFit**: Optional
- **variants**: Required, 1-50 variants
  - Each variant must have: sku, size, color, price
  - SKU must be globally unique
  - Price must be positive

### Lens-Specific Validation

- **lensType**: Required, must be valid lens type
- **index**: Required, 1.5-2.0
- **isPrescriptionRequired**: Required, boolean
- **coatings**: Optional
- **suitableForPrescriptionRange**: Optional prescription range

### Service-Specific Validation

- **serviceType**: Required, must be valid service type
- **durationMinutes**: Required, positive integer
- **serviceNotes**: Optional, max 1000 characters

## SKU Uniqueness

All SKUs must be globally unique across the entire product database:

1. **Check Within Product**: Reject if duplicate SKUs within same product
2. **Check Database**: Reject if SKU already exists in any other product
3. **Return Error**: 409 Conflict with detailed SKU list

```typescript
// Example validation result
{
  "statusCode": 409,
  "message": "SKUs already exist: FR-ROUND-52-BLK",
  "error": "SKU_ALREADY_EXISTS"
}
```

## Database Indexes

Optimized for fast filtering and search:

```
- { category: 1, isActive: 1 }
- { shape: 1, material: 1 }
- { variants.sku: 1 }
- { tags: 1 }
- { lensType: 1 }
- { serviceType: 1 }
- { slug: 1 } (unique)
- { isDeleted: 0 } (sparse)
```

## Role-Based Access Control (RBAC)

### Allowed Roles

```typescript
enum UserRole {
  ADMIN = "admin",           // Full access
  MANAGER = "manager",       // Create/update products
  OPERATIONS = "operations", // View only
  SALES = "sales",          // View only
  CUSTOMER = "customer"      // View active products only
}
```

### Endpoint Authorization

- **POST /api/manager/products**: Manager, Admin
- **GET /api/products**: Public (filters by isActive, isDeleted)
- **PUT /api/manager/products/{id}**: Manager, Admin
- **DELETE /api/manager/products/{id}**: Manager, Admin

## Image Handling

### 2D Images (images2D)

- Required for all products
- At least one image recommended
- Stored in Cloudinary `wdp/products` folder
- URLs returned and stored in database

### 3D Models (images3D)

- Optional for all product types
- Supported formats: .glb, .gltf
- Useful for virtual try-on features
- Stored in Cloudinary

## Search & Filter Example

### By Category

```bash
GET /api/products?category=frame
```

### By Frame Properties

```bash
GET /api/products?category=frame&shape=round&material=metal
```

### By Price Range

```bash
GET /api/products?minPrice=1000000&maxPrice=2000000
```

### By Tags

```bash
GET /api/products?tags=office,lightweight
```

## Example Complete Request

### Using cURL

```bash
curl -X POST http://localhost:3000/api/manager/products \
  -H "Authorization: Bearer your_token" \
  -F "name=Classic Round Frame" \
  -F "category=frame" \
  -F "description=Lightweight round frame for everyday wear" \
  -F "basePrice=1200000" \
  -F "frameType=full-rim" \
  -F "shape=round" \
  -F "material=metal" \
  -F "gender=unisex" \
  -F "bridgeFit=asian-fit" \
  -F "tags=office" \
  -F "tags=lightweight" \
  -F 'variants=[{"sku":"FR-ROUND-52-BLK","size":"52-18-140","color":"black","price":1250000,"isActive":true}]' \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

### Using JavaScript/Axios

```typescript
const formData = new FormData();
formData.append('name', 'Classic Round Frame');
formData.append('category', 'frame');
formData.append('description', 'Lightweight round frame for everyday wear');
formData.append('basePrice', 1200000);
formData.append('frameType', 'full-rim');
formData.append('shape', 'round');
formData.append('material', 'metal');
formData.append('gender', 'unisex');
formData.append('bridgeFit', 'asian-fit');
formData.append('tags', 'office');
formData.append('variants', JSON.stringify([
  {
    sku: 'FR-ROUND-52-BLK',
    size: '52-18-140',
    color: 'black',
    price: 1250000,
    isActive: true
  }
]));

// Add image files
imageFiles.forEach(file => formData.append('images', file));

const response = await axios.post(
  'http://localhost:3000/api/manager/products',
  formData,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  }
);
```

## Error Handling

### Types of Errors

| Status | Error | Description |
|--------|-------|-------------|
| 400 | VALIDATION_ERROR | Invalid request data |
| 401 | UNAUTHORIZED | Missing authentication |
| 403 | FORBIDDEN | Insufficient permissions |
| 409 | SKU_ALREADY_EXISTS | Duplicate SKU found |
| 500 | INTERNAL_ERROR | Server error |

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Human-readable error message",
  "error": "ERROR_CODE",
  "errors": [
    {
      "path": "field.name",
      "message": "Field-specific error"
    }
  ]
}
```

## Best Practices

1. **SKU Convention**: Use format like `FR-SHAPE-SIZE-COLOR` or `LNS-TYPE-INDEX`
2. **Prices**: Store in VND (Vietnamese Dong) without decimal places
3. **Images**: Use high-quality images (min 1000x1000 for 2D)
4. **Descriptions**: Be descriptive and customer-friendly
5. **Tags**: Use consistent, lowercase tags for filtering
6. **Soft Delete**: Products are soft-deleted, not permanently removed

## Files Modified/Created

1. ✅ `src/commons/enums/product.enum.ts` - Enhanced with all enums
2. ✅ `src/commons/schemas/product.schema.ts` - Full schema with category-specific fields
3. ✅ `src/commons/schemas/product-variant.schema.ts` - Updated variant schema
4. ✅ `src/commons/dtos/product.dto.ts` - Complete DTOs
5. ✅ `src/commons/validations/product-validation.zod.ts` - Zod validation schemas
6. ✅ `src/commons/guards/rbac.guard.ts` - RBAC implementation
7. ✅ `src/services/product.service.ts` - Enhanced service with validation
8. ✅ `src/controllers/manager-product.controller.ts` - Manager endpoints
9. ✅ `src/modules/manager-product.module.ts` - Product module

## Testing

### Test Frame Creation

```json
POST /api/manager/products
{
  "name": "Test Frame",
  "category": "frame",
  "description": "A test frame product for validation",
  "basePrice": 1000000,
  "images2D": ["https://example.com/image.jpg"],
  "frameType": "full-rim",
  "shape": "round",
  "material": "metal",
  "variants": [
    {
      "sku": "TEST-FRAME-001",
      "size": "52-18-140",
      "color": "black",
      "price": 1000000,
      "isActive": true
    }
  ]
}
```

### Test Lens Creation

```json
POST /api/manager/products
{
  "name": "Test Lens",
  "category": "lens",
  "description": "A test lens product for validation",
  "basePrice": 500000,
  "images2D": ["https://example.com/lens.jpg"],
  "lensType": "single-vision",
  "index": 1.60,
  "isPrescriptionRequired": true
}
```

### Test Service Creation

```json
POST /api/manager/products
{
  "name": "Test Service",
  "category": "service",
  "description": "A test service product for validation",
  "basePrice": 200000,
  "images2D": ["https://example.com/service.jpg"],
  "serviceType": "eye-test",
  "durationMinutes": 30
}
```

## Troubleshooting

### Common Issues

1. **SKU Already Exists**: Ensure all SKUs are globally unique
2. **Validation Failed**: Check field types and enums match exactly
3. **Missing Required Fields**: Verify all category-specific fields are present
4. **Image Upload Fails**: Check Cloudinary credentials and file size
5. **Unauthorized**: Verify JWT token and user role
