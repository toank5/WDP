# API Reference - File Upload Endpoints

## Overview

Complete API documentation for the file upload system with Multer and Cloudinary integration.

---

## POST /products - Create Product with Files

### Description
Create a new product with variant images. Supports multipart/form-data for file uploads.

### HTTP Method
```http
POST /products
```

### Authentication
```
Authorization: Bearer {JWT_TOKEN}
```

### Content-Type
```
multipart/form-data
```

### Request Body

#### Multipart Form Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Product name (1-255 chars) |
| category | string | Yes | One of: FRAMES, LENSES, SERVICES |
| description | string | Yes | Product description (1-1000 chars) |
| basePrice | string | Yes | Price as stringified number (> 0) |
| variants | string | No | JSON stringified variant array |
| images | File[] | No | Product images (max 10, max 10MB each) |

#### Variant Schema (if provided as JSON string)
```typescript
{
  sku: string              // Required
  type: 'AVIATOR'|'ROUND'  // Required
  size: string             // Required
  color: string            // Required
  images: string[]         // Will be populated by system
}
```

### Request Example

#### Using cURL
```bash
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiI..." \
  -F "name=Aviator Frames" \
  -F "category=FRAMES" \
  -F "description=Classic aviator-style frames" \
  -F "basePrice=150" \
  -F 'variants=[{"sku":"SKU001","type":"AVIATOR","size":"L","color":"Black","images":[]}]' \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg"
```

#### Using Axios (TypeScript)
```typescript
const formData = new FormData()
formData.append('name', 'Aviator Frames')
formData.append('category', 'FRAMES')
formData.append('description', 'Classic frames')
formData.append('basePrice', '150')
formData.append('variants', JSON.stringify([{
  sku: 'SKU001',
  type: 'AVIATOR',
  size: 'L',
  color: 'Black',
  images: []
}]))
formData.append('images', imageFile1)
formData.append('images', imageFile2)

const response = await axios.post('/products', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
```

#### Using Postman
1. Method: POST
2. URL: `http://localhost:3000/products`
3. Headers:
   - Authorization: Bearer {TOKEN}
4. Body → form-data:
   - name: Aviator Frames (text)
   - category: FRAMES (text)
   - description: Classic frames (text)
   - basePrice: 150 (text)
   - variants: [{"sku":"SKU001",...}] (text)
   - images: [Select file] (file)

### Response - Success (201 Created)

```json
{
  "statusCode": 201,
  "message": "Product created successfully",
  "metadata": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Aviator Frames",
    "category": "FRAMES",
    "description": "Classic aviator-style frames",
    "basePrice": 150,
    "variants": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "sku": "SKU001",
        "type": "AVIATOR",
        "size": "L",
        "color": "Black",
        "images": [
          "https://res.cloudinary.com/cloud-name/image/upload/v1234/wdp/products/xyz.jpg",
          "https://res.cloudinary.com/cloud-name/image/upload/v1234/wdp/products/abc.jpg"
        ]
      }
    ],
    "isActive": true,
    "isDeleted": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Response - Errors

#### 400 Bad Request - Invalid JSON Variants
```json
{
  "statusCode": 400,
  "message": "Invalid variants format",
  "error": "Bad Request"
}
```

#### 413 Payload Too Large - File Size Exceeded
```json
{
  "statusCode": 413,
  "message": "Payload too large",
  "error": "Payload Too Large"
}
```

#### 415 Unsupported Media Type - Invalid File Type
```json
{
  "statusCode": 415,
  "message": "Only image files are allowed",
  "error": "Unsupported Media Type"
}
```

#### 500 Internal Server Error - Cloudinary Failed
```json
{
  "statusCode": 500,
  "message": "Failed to upload files to Cloudinary",
  "error": "Internal Server Error"
}
```

---

## PUT /products/:id - Update Product with Files

### Description
Update an existing product and optionally upload new images.

### HTTP Method
```http
PUT /products/{productId}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| productId | string | Yes | MongoDB ObjectId of product |

### Authentication
```
Authorization: Bearer {JWT_TOKEN}
```

### Content-Type
```
multipart/form-data
```

### Request Body

Same structure as POST /products, but all fields are optional.

#### Multipart Form Fields (All Optional)

| Field | Type | Description |
|-------|------|-------------|
| name | string | Updated product name |
| category | string | Updated category |
| description | string | Updated description |
| basePrice | string | Updated price |
| variants | string | Updated variants (JSON string) |
| images | File[] | New images to upload |

### Request Example

#### Using cURL
```bash
curl -X PUT http://localhost:3000/products/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiI..." \
  -F "name=Updated Aviator Frames" \
  -F "basePrice=175" \
  -F "images=@newimage1.jpg"
```

#### Using Axios
```typescript
const formData = new FormData()
formData.append('name', 'Updated Aviator Frames')
formData.append('basePrice', '175')
formData.append('images', newImageFile)

const response = await axios.put(
  `/products/507f1f77bcf86cd799439011`,
  formData,
  { headers: { 'Content-Type': 'multipart/form-data' } }
)
```

### Response - Success (200 OK)

```json
{
  "statusCode": 200,
  "message": "Product updated successfully",
  "metadata": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Updated Aviator Frames",
    "basePrice": 175,
    "variants": [
      {
        "images": [
          "https://res.cloudinary.com/.../newimage1.jpg"
        ]
      }
    ],
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

## GET /products - List All Products

### Description
Retrieve all non-deleted products.

### HTTP Method
```http
GET /products
```

### Authentication
```
Authorization: Bearer {JWT_TOKEN}
```

### Query Parameters
None

### Response - Success (200 OK)

```json
{
  "statusCode": 200,
  "message": "Products retrieved successfully",
  "metadata": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Aviator Frames",
      "category": "FRAMES",
      "description": "...",
      "basePrice": 150,
      "variants": [
        {
          "images": [
            "https://res.cloudinary.com/.../image1.jpg",
            "https://res.cloudinary.com/.../image2.jpg"
          ]
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## GET /products/:id - Get Product by ID

### Description
Retrieve a specific product by its ID.

### HTTP Method
```http
GET /products/{productId}
```

### Parameters

| Parameter | Type | Required |
|-----------|------|----------|
| productId | string | Yes |

### Response - Success (200 OK)

```json
{
  "statusCode": 200,
  "message": "Product retrieved successfully",
  "metadata": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Aviator Frames",
    "variants": [
      {
        "images": [
          "https://res.cloudinary.com/.../image1.jpg"
        ]
      }
    ]
  }
}
```

### Response - Not Found (404)

```json
{
  "statusCode": 404,
  "message": "Product not found",
  "error": "Not Found"
}
```

---

## DELETE /products/:id - Delete Product

### Description
Soft-delete a product (marks as deleted, doesn't remove from DB).

### HTTP Method
```http
DELETE /products/{productId}
```

### Authentication
```
Authorization: Bearer {JWT_TOKEN}
```

### Response - Success (200 OK)

```json
{
  "statusCode": 200,
  "message": "Product deleted successfully",
  "metadata": {
    "_id": "507f1f77bcf86cd799439011",
    "isDeleted": true,
    "updatedAt": "2024-01-15T11:15:00.000Z"
  }
}
```

---

## File Upload Specifications

### Supported File Types
```
image/jpeg
image/jpg
image/png
image/gif
image/webp
image/svg+xml
```

### File Size Limits
- **Per file**: 10 MB maximum
- **Per request**: 100 MB (10 files × 10 MB)
- **Enforced by**: Multer FileUploadService

### File Validation
✓ MIME type validation (image/* only)
✓ File size validation
✓ File count validation (max 10)
✓ Cloudinary re-validation

### File Storage Location
```
Cloudinary Folder: wdp/products/
URL Format: https://res.cloudinary.com/{cloud-name}/image/upload/{path}/{filename}
URL Type: Secure (HTTPS, signed)
Persistence: Permanent until manually deleted
```

---

## Image Distribution Rules

### Rule 1: Images with Variants
If images are uploaded with variants:
- Images distributed sequentially across variants
- Distribution: `Math.ceil(totalImages / variantCount)` per variant

### Rule 2: No Variants
If no variants provided:
- Images are not stored (variants required)

### Rule 3: No Images
If no files uploaded:
- Product created without images
- Variant.images = []

### Rule 4: Update with New Images
When updating product with new images:
- Old images remain (not auto-deleted)
- New images added to variants
- Consider manual cleanup in future

---

## Error Codes Reference

| Code | Meaning | Cause | Solution |
|------|---------|-------|----------|
| 400 | Bad Request | Invalid JSON, missing required field | Check request format |
| 401 | Unauthorized | Missing/invalid JWT token | Add valid Authorization header |
| 403 | Forbidden | User role insufficient | Use manager or admin account |
| 404 | Not Found | Product doesn't exist | Check product ID |
| 413 | Payload Too Large | File exceeds 10MB | Use smaller image files |
| 415 | Unsupported Media Type | Non-image file | Select only image files |
| 500 | Internal Server Error | Cloudinary error | Check credentials and network |

---

## Rate Limiting

Currently not implemented, but should be added for production:
- Suggested: 100 requests per minute per IP
- Consider: 50 file uploads per minute per user

---

## CORS Headers

Requests must include proper CORS headers:
```
Origin: http://localhost:3000
Access-Control-Request-Method: POST, PUT
Access-Control-Request-Headers: Content-Type, Authorization
```

---

## Example Request/Response Cycle

### 1. Create Product Request
```http
POST /products HTTP/1.1
Host: localhost:3000
Authorization: Bearer token...
Content-Type: multipart/form-data; boundary=----Boundary

------Boundary
Content-Disposition: form-data; name="name"

Test Product
------Boundary
Content-Disposition: form-data; name="images"; filename="test.jpg"
Content-Type: image/jpeg

[binary data]
------Boundary--
```

### 2. Backend Processing
```
FilesInterceptor → Extract files
FileUploadService → Validate
CloudinaryService → Upload → Return URL
ProductService → Save with URL
MongoDB → Store document
```

### 3. API Response
```json
{
  "statusCode": 201,
  "message": "Product created successfully",
  "metadata": {
    "_id": "...",
    "variants": [{
      "images": ["https://res.cloudinary.com/.../..."]
    }]
  }
}
```

### 4. Frontend Handling
```typescript
toast.success('Product created successfully')
loadProducts() // Refresh list
setFormData({...}) // Clear form
```

---

## API Versioning

Current Version: v1 (implied)

Suggested Future: `/api/v1/products`

---

## Security Considerations

1. **Authentication**: All endpoints require JWT
2. **Authorization**: Role-based (manager/admin)
3. **File Validation**: Type and size checked
4. **URL Security**: Cloudinary provides signed URLs
5. **Data Validation**: Server-side validation on all inputs

---

## Performance Tips

1. **Compress images** before upload (frontend)
2. **Batch uploads** for multiple products
3. **Cache responses** when appropriate
4. **Use CDN** URLs directly from Cloudinary
5. **Monitor file sizes** for optimization

---

## Troubleshooting

### "Invalid MIME type" Error
- Ensure file is actual image (not renamed)
- Check MIME type: `file -i image.jpg`
- Try different format: JPG → PNG

### "File too large" Error
- Reduce image dimensions
- Compress before upload
- Check file size: `ls -lh image.jpg`

### "Cloudinary upload failed"
- Verify credentials in .env
- Check Cloudinary account active
- Test upload at cloudinary.com

### "Invalid variants JSON"
- Check JSON syntax: `JSON.parse(variantsString)`
- Escape quotes properly
- Validate with JSON validator

---

## Postman Collection

Import this collection into Postman:
```json
{
  "info": {
    "name": "WDP File Upload API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Product",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "formdata",
          "formdata": [
            { "key": "name", "value": "Product" },
            { "key": "category", "value": "FRAMES" },
            { "key": "description", "value": "Desc" },
            { "key": "basePrice", "value": "100" },
            { "key": "variants", "value": "[{...}]" },
            { "key": "images", "type": "file", "src": "image.jpg" }
          ]
        },
        "url": {
          "raw": "http://localhost:3000/products",
          "host": ["localhost"],
          "port": "3000",
          "path": ["products"]
        }
      }
    }
  ]
}
```

---

## Support & Documentation

- **Full Guide**: See `FILE_UPLOAD_GUIDE.md`
- **Quick Start**: See `QUICKSTART.md`
- **Architecture**: See `ARCHITECTURE_DIAGRAMS.md`
- **Setup**: See `SETUP_CHECKLIST.md`

---

**API Status**: ✅ Ready for use
**Last Updated**: 2024-01-15
