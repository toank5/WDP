# Product Management API - Request/Response Examples

## Table of Contents

1. [Create Frame Product](#create-frame-product)
2. [Create Lens Product](#create-lens-product)
3. [Create Service Product](#create-service-product)
4. [Validation Error Examples](#validation-error-examples)
5. [SKU Conflict Example](#sku-conflict-example)
6. [Authorization Examples](#authorization-examples)

---

## Create Frame Product

### Request

```bash
curl -X POST http://localhost:3000/api/manager/products \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Classic Round Metal Frame",
    "category": "frame",
    "description": "Premium lightweight round frame made from high-quality titanium alloy. Perfect for office work and everyday wear. Available in multiple colors with adjustable bridge fit.",
    "basePrice": 1200000,
    "images2D": [
      "https://res.cloudinary.com/example/wdp/products/frame-front.jpg",
      "https://res.cloudinary.com/example/wdp/products/frame-side.jpg",
      "https://res.cloudinary.com/example/wdp/products/frame-top.jpg"
    ],
    "images3D": [
      "https://res.cloudinary.com/example/wdp/products/frame-3d.glb"
    ],
    "tags": [
      "office",
      "lightweight",
      "titanium",
      "unisex"
    ],
    "frameType": "full-rim",
    "shape": "round",
    "material": "titanium",
    "gender": "unisex",
    "bridgeFit": "asian-fit",
    "variants": [
      {
        "sku": "FR-ROUND-TI-52-BLK",
        "size": "52-18-140",
        "color": "black",
        "price": 1250000,
        "weight": 28,
        "images2D": [
          "https://res.cloudinary.com/example/wdp/products/fr-round-52-blk.jpg"
        ],
        "isActive": true
      },
      {
        "sku": "FR-ROUND-TI-52-GLD",
        "size": "52-18-140",
        "color": "gold",
        "price": 1300000,
        "weight": 29,
        "images2D": [
          "https://res.cloudinary.com/example/wdp/products/fr-round-52-gld.jpg"
        ],
        "isActive": true
      },
      {
        "sku": "FR-ROUND-TI-54-BLK",
        "size": "54-18-145",
        "color": "black",
        "price": 1250000,
        "weight": 30,
        "isActive": true
      },
      {
        "sku": "FR-ROUND-TI-54-SLV",
        "size": "54-18-145",
        "color": "silver",
        "price": 1350000,
        "weight": 31,
        "isActive": true
      }
    ]
  }'
```

### Successful Response (201 Created)

```json
{
  "statusCode": 201,
  "message": "Product created successfully",
  "data": {
    "_id": "65b4f8c9d7f3e4a1b2c3d4e5",
    "name": "Classic Round Metal Frame",
    "slug": "classic-round-metal-frame",
    "category": "frame",
    "basePrice": 1200000,
    "variantsCount": 4,
    "isActive": true,
    "createdAt": "2024-01-28T10:30:45.123Z"
  }
}
```

---

## Create Lens Product

### Request

```bash
curl -X POST http://localhost:3000/api/manager/products \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High-Index Progressive Lens 1.67",
    "category": "lens",
    "description": "Ultra-thin high-index progressive lens with premium anti-reflective and blue light protective coatings. Ideal for strong prescriptions. Provides seamless vision at all distances with minimal lens thickness.",
    "basePrice": 1500000,
    "images2D": [
      "https://res.cloudinary.com/example/wdp/products/lens-front.jpg",
      "https://res.cloudinary.com/example/wdp/products/lens-cross-section.jpg"
    ],
    "images3D": [],
    "tags": [
      "progressive",
      "high-index",
      "blue-light-protection",
      "anti-reflective"
    ],
    "lensType": "progressive",
    "index": 1.67,
    "coatings": [
      "blue-light",
      "anti-reflective",
      "scratch-resistant",
      "UV-protection"
    ],
    "suitableForPrescriptionRange": {
      "minSPH": -0.5,
      "maxSPH": -8.0,
      "minCYL": -0.5,
      "maxCYL": -3.0
    },
    "isPrescriptionRequired": true,
    "variants": [
      {
        "sku": "LNS-PROG-167-STD",
        "size": "standard",
        "color": "clear",
        "price": 1500000,
        "isActive": true
      },
      {
        "sku": "LNS-PROG-167-LRG",
        "size": "large",
        "color": "clear",
        "price": 1650000,
        "isActive": true
      }
    ]
  }'
```

### Successful Response (201 Created)

```json
{
  "statusCode": 201,
  "message": "Product created successfully",
  "data": {
    "_id": "65b4f9a2d7f3e4a1b2c3d4e6",
    "name": "High-Index Progressive Lens 1.67",
    "slug": "high-index-progressive-lens-167",
    "category": "lens",
    "basePrice": 1500000,
    "variantsCount": 2,
    "isActive": true,
    "createdAt": "2024-01-28T10:45:30.456Z"
  }
}
```

---

## Create Service Product

### Request

```bash
curl -X POST http://localhost:3000/api/manager/products \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Comprehensive Eye Examination & Prescription",
    "category": "service",
    "description": "Professional comprehensive eye examination including visual acuity test, color vision test, visual field assessment, and complete prescription analysis. Our certified optometrists use state-of-the-art equipment for accurate measurements.",
    "basePrice": 250000,
    "images2D": [
      "https://res.cloudinary.com/example/wdp/products/eye-exam.jpg",
      "https://res.cloudinary.com/example/wdp/products/exam-equipment.jpg"
    ],
    "images3D": [],
    "tags": [
      "eye-exam",
      "prescription",
      "health-check",
      "professional"
    ],
    "serviceType": "eye-test",
    "durationMinutes": 45,
    "serviceNotes": "Includes visual acuity assessment, refraction test, color vision check, and tonometry. Results provided in written report. Appointment required."
  }'
```

### Successful Response (201 Created)

```json
{
  "statusCode": 201,
  "message": "Product created successfully",
  "data": {
    "_id": "65b4f9b3d7f3e4a1b2c3d4e7",
    "name": "Comprehensive Eye Examination & Prescription",
    "slug": "comprehensive-eye-examination-prescription",
    "category": "service",
    "basePrice": 250000,
    "variantsCount": 0,
    "isActive": true,
    "createdAt": "2024-01-28T11:00:15.789Z"
  }
}
```

---

## Validation Error Examples

### Missing Required Frame Fields

**Request:**
```json
{
  "name": "Incomplete Frame",
  "category": "frame",
  "description": "This frame is missing required fields",
  "basePrice": 1000000,
  "images2D": ["https://example.com/image.jpg"]
  // Missing: frameType, shape, material, variants
}
```

**Response (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "path": "frameType",
      "message": "Invalid input"
    },
    {
      "path": "shape",
      "message": "Invalid input"
    },
    {
      "path": "material",
      "message": "Invalid input"
    },
    {
      "path": "variants",
      "message": "Array must contain at least 1 element(s)"
    }
  ]
}
```

### Invalid Enum Value

**Request:**
```json
{
  "name": "Invalid Frame Type",
  "category": "frame",
  "description": "This frame has invalid frameType",
  "basePrice": 1000000,
  "images2D": ["https://example.com/image.jpg"],
  "frameType": "invalid-type",
  "shape": "round",
  "material": "metal",
  "variants": [
    {
      "sku": "TEST-001",
      "size": "52-18-140",
      "color": "black",
      "price": 1000000,
      "isActive": true
    }
  ]
}
```

**Response (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "path": "frameType",
      "message": "Invalid input"
    }
  ]
}
```

### Price Validation Error

**Request:**
```json
{
  "name": "Expensive Service",
  "category": "service",
  "description": "Service with negative price",
  "basePrice": -1000,
  "images2D": ["https://example.com/image.jpg"],
  "serviceType": "eye-test",
  "durationMinutes": 30
}
```

**Response (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "path": "basePrice",
      "message": "Number must be greater than 0"
    }
  ]
}
```

### Lens Index Out of Range

**Request:**
```json
{
  "name": "Invalid Lens Index",
  "category": "lens",
  "description": "Lens with invalid index",
  "basePrice": 1000000,
  "images2D": ["https://example.com/image.jpg"],
  "lensType": "single-vision",
  "index": 2.5,
  "isPrescriptionRequired": false
}
```

**Response (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "path": "index",
      "message": "Number must be less than or equal to 2"
    }
  ]
}
```

---

## SKU Conflict Example

### First Product (Success)

**Request:**
```json
{
  "name": "Frame Model A",
  "category": "frame",
  "description": "Test frame",
  "basePrice": 1000000,
  "images2D": ["https://example.com/image.jpg"],
  "frameType": "full-rim",
  "shape": "round",
  "material": "metal",
  "variants": [
    {
      "sku": "FR-MODEL-A-001",
      "size": "52-18-140",
      "color": "black",
      "price": 1000000,
      "isActive": true
    }
  ]
}
```

**Response (201 Created):** ✅

### Second Product With Duplicate SKU (Conflict)

**Request:**
```json
{
  "name": "Frame Model B",
  "category": "frame",
  "description": "Another frame",
  "basePrice": 1200000,
  "images2D": ["https://example.com/image.jpg"],
  "frameType": "full-rim",
  "shape": "square",
  "material": "plastic",
  "variants": [
    {
      "sku": "FR-MODEL-A-001",
      "size": "54-18-145",
      "color": "blue",
      "price": 1200000,
      "isActive": true
    }
  ]
}
```

**Response (409 Conflict):**
```json
{
  "statusCode": 409,
  "message": "SKUs already exist: FR-MODEL-A-001",
  "error": "SKU_ALREADY_EXISTS"
}
```

### Multiple SKU Conflicts

**Request:**
```json
{
  "name": "Batch Frame Import",
  "category": "frame",
  "description": "Multiple variants",
  "basePrice": 1100000,
  "images2D": ["https://example.com/image.jpg"],
  "frameType": "full-rim",
  "shape": "aviator",
  "material": "metal",
  "variants": [
    {
      "sku": "FR-MODEL-A-001",
      "size": "52-18-140",
      "color": "black",
      "price": 1100000,
      "isActive": true
    },
    {
      "sku": "FR-DUPLICATE-002",
      "size": "54-18-145",
      "color": "gold",
      "price": 1200000,
      "isActive": true
    }
  ]
}
```

**Response (409 Conflict):**
```json
{
  "statusCode": 409,
  "message": "SKUs already exist: FR-MODEL-A-001, FR-DUPLICATE-002",
  "error": "SKU_ALREADY_EXISTS"
}
```

---

## Authorization Examples

### Missing Authentication Token

**Request:**
```bash
curl -X POST http://localhost:3000/api/manager/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Frame", ...}'
```

**Response (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "User not authenticated",
  "error": "UNAUTHORIZED"
}
```

### Invalid Token

**Request:**
```bash
curl -X POST http://localhost:3000/api/manager/products \
  -H "Authorization: Bearer invalid.token.here" \
  -H "Content-Type: application/json" \
  -d '{"name": "Frame", ...}'
```

**Response (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "error": "UNAUTHORIZED"
}
```

### Insufficient Permissions (Customer Role)

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI...", role: "customer"
```

**Response (403 Forbidden):**
```json
{
  "statusCode": 403,
  "message": "Access denied. Only managers and admins can create products.",
  "error": "FORBIDDEN"
}
```

### Insufficient Permissions (Sales Role)

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI...", role: "sales"
```

**Response (403 Forbidden):**
```json
{
  "statusCode": 403,
  "message": "Access denied. Only managers and admins can create products.",
  "error": "FORBIDDEN"
}
```

### Valid Manager Token (Success)

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI...", role: "manager"
```

**Response:** ✅ 201 Created

### Valid Admin Token (Success)

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI...", role: "admin"
```

**Response:** ✅ 201 Created

---

## File Upload Example (with Images)

### Using FormData

```javascript
const formData = new FormData();

// Add product data
formData.append('name', 'Premium Frame with Images');
formData.append('category', 'frame');
formData.append('description', 'Frame with uploaded images');
formData.append('basePrice', '1500000');
formData.append('frameType', 'full-rim');
formData.append('shape', 'round');
formData.append('material', 'titanium');
formData.append('gender', 'unisex');
formData.append('bridgeFit', 'asian-fit');

// Add variant data as JSON string
formData.append('variants', JSON.stringify([
  {
    sku: 'FR-UPLOAD-001',
    size: '52-18-140',
    color: 'black',
    price: 1500000,
    isActive: true
  }
]));

// Add images
const imageFile1 = document.getElementById('image1').files[0];
const imageFile2 = document.getElementById('image2').files[0];
formData.append('images', imageFile1);
formData.append('images', imageFile2);

// Send request
const response = await fetch('/api/manager/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
```

**Response (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Product created successfully with 2 uploaded images",
  "data": {
    "_id": "65b4fab5d7f3e4a1b2c3d4e8",
    "name": "Premium Frame with Images",
    "slug": "premium-frame-with-images",
    "category": "frame",
    "basePrice": 1500000,
    "variantsCount": 1,
    "isActive": true,
    "createdAt": "2024-01-28T12:00:00.000Z"
  }
}
```

---

## Testing Checklist

- [ ] Create frame product with all required fields
- [ ] Create lens product with prescription range
- [ ] Create service product with duration
- [ ] Verify SKU uniqueness validation
- [ ] Test duplicate SKUs rejection
- [ ] Verify authorization for different roles
- [ ] Test missing required fields
- [ ] Test invalid enum values
- [ ] Test price validation (positive numbers)
- [ ] Test field length constraints
- [ ] Upload images and verify Cloudinary integration
- [ ] Verify slug generation
- [ ] Test soft delete and restore
- [ ] Verify timestamps (createdAt, updatedAt)
