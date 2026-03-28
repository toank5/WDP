# Product Management - Implementation Guide

## Overview
The Product Management feature handles CRUD operations for eyewear products (frames, lenses, services) with variant support, media management (2D/3D images), inventory tracking, and catalog functionality.

## Feature Scope
### Operations
| Operation | Description | Endpoint | Access |
|-----------|-------------|----------|--------|
| **Create Product** | Add new product with variants | `POST /products` | Manager/Admin |
| **List Products** | Get all products with filters | `GET /products` | Staff |
| **View Product** | Get product by ID | `GET /products/:id` | Public |
| **Update Product** | Modify product details | `PATCH /products/:id` | Manager/Admin |
| **Delete Product** | Soft delete product | `DELETE /products/:id` | Manager/Admin |
| **Restore Product** | Restore deleted product | `PATCH /products/:id/restore` | Admin |
| **Product Catalog** | Public catalog with filters | `GET /products/catalog` | Public |

## Database Schema
### Key Entities

**Product** - Located at `wdp-be/src/product/entities/product.entity.ts`
| Property | Type | Description |
|----------|------|-------------|
| `id` | string (UUID) | Primary key |
| `name` | string | Product name |
| `slug` | string | URL-friendly identifier |
| `category` | ProductCategory | FRAMES, LENSES, SERVICES |
| `description` | string | Product description |
| `basePrice` | number | Base price (VND) |
| `images2D` | string[] | 2D image URLs |
| `images3D` | string[] | 3D model URLs (GLB/OBJ) |
| `status` | ProductStatus | DRAFT, ACTIVE, OUT_OF_STOCK, INACTIVE, DELETED |
| `variants` | ProductVariant[] | Product variants |
| `frameType` | string | Frame type (for FRAMES) |
| `shape` | string | Frame shape |
| `material` | string | Frame material |
| `gender` | string | Target gender |
| `lensType` | string | Lens type (for LENSES) |
| `index` | string | Lens index |
| `coatings` | string[] | Lens coatings |
| `serviceType` | string | Service type (for SERVICES) |
| `durationMinutes` | number | Service duration |
| `soldCount` | number | Total sold |
| `viewCount` | number | Page views |
| `createdBy` | string (UUID) | Creator ID |
| `updatedBy` | string (UUID) | Last updater ID |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update |
| `deletedAt` | Date | Soft delete timestamp |

**Relationships:**
- `variants` → ProductVariant[] (One-to-Many)
- `createdBy` → User.id (Many-to-One)

**ProductVariant** - Located at `wdp-be/src/product/entities/variant.entity.ts`
| Property | Type | Description |
|----------|------|-------------|
| `id` | string (UUID) | Primary key |
| `productId` | string (UUID) | Foreign key to Product |
| `sku` | string | Unique SKU |
| `name` | string | Variant name |
| `attributes` | VariantAttributes | Color, size, etc. |
| `price` | number | Variant price override |
| `compareAtPrice` | number | Original price (if discounted) |
| `stock` | number | Available stock |
| `image` | string | Variant-specific image |
| `isDefault` | boolean | Default variant flag |

## DTOs
### CreateProductDto
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Product name |
| `category` | ProductCategory | Yes | FRAMES, LENSES, SERVICES |
| `description` | string | Yes | Product description |
| `basePrice` | number | Yes | Base price |
| `images2D` | File[] | No | 2D images |
| `images3D` | File[] | No | 3D models |
| `variants` | CreateVariantDto[] | Yes | Product variants |
| `frameType` | string | Conditional | For FRAMES |
| `shape` | string | Conditional | For FRAMES |
| `material` | string | Conditional | For FRAMES |

### UpdateProductDto
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Product name |
| `description` | string | No | Product description |
| `basePrice` | number | No | Base price |
| `images2D` | File[] | No | 2D images |
| `images3D` | File[] | No | 3D models |
| `status` | ProductStatus | No | Product status |
| `variants` | UpdateVariantDto[] | No | Variants to update |

### CatalogFiltersDto
| Field | Type | Description |
|-------|------|-------------|
| `category` | ProductCategory | Filter by category |
| `search` | string | Search in name/description |
| `minPrice` | number | Minimum price |
| `maxPrice` | number | Maximum price |
| `frameType` | string | Frame type filter |
| `shape` | string | Frame shape filter |
| `sortBy` | string | price_asc, price_desc, newest, popular |
| `page` | number | Page number |
| `limit` | number | Items per page |

## API Endpoints
### POST /products
**Description**: Create new product (Manager/Admin only)

**Request**:
```json
{
  "name": "Wayfarer Classic",
  "category": "FRAMES",
  "description": "Timeless design",
  "basePrice": 1500000,
  "frameType": "FULL_RIM",
  "shape": "RECTANGULAR",
  "material": "ACETATE",
  "gender": "UNISEX",
  "variants": [
    {
      "sku": "WF-CLASSIC-BLK",
      "name": "Black",
      "attributes": {"color": "Black"},
      "price": 1500000,
      "stock": 50,
      "isDefault": true
    }
  ]
}
```

**Response** (201 CREATED):
```json
{
  "id": "uuid",
  "name": "Wayfarer Classic",
  "slug": "wayfarer-classic",
  "status": "DRAFT",
  "variants": [...]
}
```

### GET /products/catalog
**Description**: Public product catalog with filters

**Query Parameters**: `category`, `search`, `minPrice`, `maxPrice`, `frameType`, `shape`, `sortBy`, `page`, `limit`

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Wayfarer Classic",
      "slug": "wayfarer-classic",
      "basePrice": 1500000,
      "images2D": ["url1", "url2"],
      "images3D": ["model_url"],
      "status": "ACTIVE",
      "inStock": true,
      "variants": [...]
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "filters": {
    "applied": {...},
    "available": {...}
  }
}
```

### PATCH /products/:id
**Description**: Update product (Manager/Admin only)

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Updated Wayfarer Classic",
  "status": "ACTIVE"
}
```

### DELETE /products/:id
**Description**: Soft delete product (Manager/Admin only)

**Response** (200 OK):
```json
{
  "message": "Product deleted successfully"
}
```

## Implementation Requirements
### 1. Controller Implementation
Located at `wdp-be/src/controllers/product.controller.ts`

**Required Methods:**
- `create()` - RBAC for MANAGER/ADMIN, handle file uploads
- `findAll()` - RBAC for STAFF+, return with filters
- `findOne()` - Public endpoint, increment view count
- `update()` - RBAC for MANAGER/ADMIN, handle image replacement
- `remove()` - RBAC for MANAGER/ADMIN, soft delete
- `restore()` - RBAC for ADMIN only
- `getCatalog()` - Public endpoint, complex filtering

### 2. Service Implementation
Located at `wdp-be/src/services/product.service.ts`

**Category-Specific Validation:**

**FRAMES:**
- Required: frameType, shape, material
- Optional: gender, bridgeFit

**LENSES:**
- Required: lensType, index
- Optional: coatings

**SERVICES:**
- Required: serviceType, durationMinutes

**Media Handling:**
- 2D Images: jpg, png, webp (max 5MB each)
- 3D Models: glb, obj (max 20MB each)
- Upload to Cloudinary CDN
- Delete old images on update

**Status Management:**
| Stock Level | Status |
|-------------|--------|
| > 0 | ACTIVE (when published) |
| = 0 | OUT_OF_STOCK |
| Published manually | ACTIVE/INACTIVE |

**Cache Strategy:**
- Cache catalog results by filter hash
- TTL: 15 minutes
- Invalidate on product update/create/delete

### 3. Search & Filtering
**Search Fields:**
- Product name (ILIKE)
- Description (ILIKE)
- SKU (exact match)

**Filter Combinations:**
- Category + Price Range
- Category + Frame Type + Shape
- Search + Category + Price
- Any combination supported

**Sort Options:**
- `price_asc`: Lowest price first
- `price_desc`: Highest price first
- `newest`: Recently added
- `popular`: Most sold

### 4. 3D Model Support
**Supported Formats:**
- GLB (GL Transmission Format Binary)
- OBJ (Wavefront OBJ)

**Model Processing:**
- Center model at origin
- Scale to normalized size
- Optimize mesh for web
- Generate thumbnail preview

### 5. State Transitions
| From | To | Trigger |
|------|-----|---------|
| DRAFT | ACTIVE | Publish + Stock > 0 |
| DRAFT | OUT_OF_STOCK | Publish + Stock = 0 |
| ACTIVE | OUT_OF_STOCK | Stock reaches 0 |
| ACTIVE | INACTIVE | Manual deactivate |
| OUT_OF_STOCK | ACTIVE | Stock replenished |
| OUT_OF_STOCK | INACTIVE | Manual deactivate |
| INACTIVE | ACTIVE | Manual activate |
| * | DELETED | Soft delete |
| DELETED | ACTIVE | Restore (Admin only) |

## Diagrams
- State Machine: `diagrams/state-machine/product.state.puml`
- Sequence Diagrams:
  - Create: `diagrams/details/product-management/sequence-create.puml`
  - Update: `diagrams/details/product-management/sequence-update.puml`
  - Catalog: `diagrams/details/product-management/sequence-catalog.puml`
- Class Diagram: `diagrams/details/product-management/class-diagram.puml`

## Error Handling
| Status Code | Scenario |
|-------------|----------|
| 400 | Invalid category, missing required fields, invalid image type |
| 401 | Missing/invalid JWT |
| 403 | Insufficient permissions |
| 404 | Product not found |
| 409 | Duplicate slug, duplicate SKU |
| 413 | File too large |
| 415 | Unsupported media type |
| 500 | Upload error, database error |
