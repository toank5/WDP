# File Upload Implementation Guide

## Overview
This guide covers the complete file upload implementation using Multer for handling multipart/form-data requests and Cloudinary for cloud-based image storage.

## Architecture

### Frontend (React/TypeScript)
- **Location**: `FE/src/lib/product-api.ts`
- **Components**: `FE/src/pages/admin/ProductManagementPage.tsx`
- File selection via HTML file input
- Files attached to FormData along with product JSON
- Axios sends multipart/form-data requests

### Backend (NestJS)
- **CloudinaryService**: Cloud image storage management
- **FileUploadService**: Multer configuration provider
- **ProductController**: HTTP endpoints with file interceptors
- **ProductService**: Business logic for associating images with variants

## Setup Instructions

### 1. Install Dependencies

```bash
cd wdp-be
npm install cloudinary multer @nestjs/platform-express
npm install --save-dev @types/multer @types/express
```

### 2. Configure Environment Variables

Create a `.env` file in `wdp-be/` root:

```env
# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

To get Cloudinary credentials:
1. Visit https://cloudinary.com
2. Sign up for a free account
3. Go to Dashboard → Settings → API Keys
4. Copy Cloud Name, API Key, and API Secret

### 3. Backend Service Structure

#### CloudinaryService (`src/commons/services/cloudinary.service.ts`)
```typescript
- uploadFile(file, folder)           // Upload single file
- uploadMultipleFiles(files, folder) // Upload multiple files
- deleteFile(publicId)               // Delete from Cloudinary
```

**Key Points:**
- Uses Cloudinary v2 API
- Returns `secure_url` for each uploaded file
- Automatically stores file in specified folder
- Handles authentication via environment variables

#### FileUploadService (`src/commons/services/file-upload.service.ts`)
```typescript
- getMulterOptions()  // Returns Multer configuration
```

**Configuration:**
- Storage: Memory (buffers files in RAM)
- File Filter: Only image/* MIME types
- Size Limit: 10MB per file
- Max Files: 10 per request

### 4. Controller Endpoint

#### POST /products (Create with Files)
```typescript
@Post()
@UseInterceptors(FilesInterceptor('images', 10, ...))
async create(
  @Body() createProductDto: CreateProductDto,
  @UploadedFiles() files?: Express.Multer.File[]
)
```

**Flow:**
1. Client sends FormData with product data + files
2. FilesInterceptor extracts files from 'images' field
3. Validates files (type, size)
4. CloudinaryService uploads files
5. ProductService receives imageUrls + dto
6. ProductService distributes images to variants
7. Product saved to MongoDB with image URLs

#### PUT /products/:id (Update with Files)
Same flow as POST but updates existing product

### 5. Frontend Integration

#### API Function (`FE/src/lib/product-api.ts`)
```typescript
createProduct(payload, files)  // Send files if provided
updateProduct(id, payload, files)
```

**File Handling:**
- Accepts File[] as second parameter
- Automatically creates FormData
- Appends product data as individual fields
- Appends variants as JSON string
- Appends all files under 'images' field
- Sets multipart/form-data header

#### Component (`FE/src/pages/admin/ProductManagementPage.tsx`)
```typescript
const variantForm = {
  sku: string
  type: 'AVIATOR' | 'ROUND'
  size: string
  color: string
  imageFiles: File[]  // Changed from images: string[]
}
```

**File Selection UI:**
- File input with multiple attribute
- Accept only image files (accept="image/*")
- Displays selected files as removable chips
- Collects all files from all variants
- Passes to API function

### 6. Image Distribution to Variants

When images are uploaded:
1. **Multiple variants**: Images distributed sequentially
   - Example: 10 images, 2 variants → 5 images each variant
   - First variant gets images[0-4]
   - Second variant gets images[5-9]

2. **Single variant**: All images go to that variant

3. **No variants**: Images ignored (variant is required)

**Code Location**: `ProductService.create()` and `.update()`

## Data Flow

### Create Product with Images
```
Frontend
↓
[ProductManagementPage]
  - Select images via file input
  - Click "Save Product"
  - Collect files from all variants
  - Call createProduct(payload, files)
↓
[product-api.ts]
  - Create FormData
  - Append product fields (name, category, etc.)
  - Append variants as JSON string
  - Append all files under 'images'
  - Send POST /products (multipart/form-data)
↓
Backend
↓
[ProductController @Post()]
  - FilesInterceptor extracts files
  - Parse variants from JSON string
  - CloudinaryService.uploadMultipleFiles()
    → Returns: ['url1', 'url2', ...]
  - ProductService.create(dto, imageUrls)
↓
[ProductService.create()]
  - Distribute imageUrls to variants
  - Variant1: ['url1', 'url2']
  - Variant2: ['url3', 'url4']
  - Save to MongoDB
↓
Response with created product
```

## Error Handling

### Common Errors

1. **Invalid MIME Type**
   - User uploads non-image file
   - FileUploadService rejects it
   - Response: 400 Bad Request

2. **File Size Exceeded**
   - File larger than 10MB
   - Multer rejects it
   - Response: 413 Payload Too Large

3. **Cloudinary Authentication**
   - Missing environment variables
   - Invalid API key
   - Response: 500 Internal Server Error

4. **MongoDB Save Failure**
   - Validation errors in product data
   - Response: 400 Bad Request with details

### Handling in Frontend
```typescript
try {
  await createProduct(payload, files)
  toast.success('Product created successfully')
} catch (err) {
  const message = err.message
  toast.error(message)
}
```

## Testing File Uploads

### Manual Testing
```bash
# Using curl
curl -X POST http://localhost:3000/products \
  -F "name=Product Name" \
  -F "category=FRAMES" \
  -F "description=Description" \
  -F "basePrice=100" \
  -F 'variants=[{"sku":"SKU1","type":"AVIATOR","size":"L","color":"Black","images":[]}]' \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg"
```

### Using Postman
1. Create POST request to `http://localhost:3000/products`
2. Body → form-data
3. Add fields:
   - name: "Product Name" (text)
   - category: "FRAMES" (text)
   - description: "Description" (text)
   - basePrice: "100" (text)
   - variants: '[{"sku":"SKU1"...}]' (text)
   - images: [select files] (file)
4. Send

### Response Format
```json
{
  "statusCode": 201,
  "message": "Product created successfully",
  "metadata": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Product Name",
    "category": "FRAMES",
    "description": "Description",
    "basePrice": 100,
    "variants": [
      {
        "sku": "SKU1",
        "type": "AVIATOR",
        "size": "L",
        "color": "Black",
        "images": [
          "https://res.cloudinary.com/.../image1.jpg",
          "https://res.cloudinary.com/.../image2.jpg"
        ]
      }
    ],
    "isActive": true,
    "isDeleted": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

## Troubleshooting

### Files Not Uploading
1. Check file input has `accept="image/*"`
2. Verify files are added to FormData
3. Check browser console for errors
4. Verify Cloudinary credentials in .env

### Cloudinary Upload Fails
1. Check CLOUDINARY_CLOUD_NAME in .env
2. Verify API key and secret
3. Check Cloudinary account limits
4. Check file MIME type (must be image/*)

### Images Not Associated with Variants
1. Ensure variants array is sent
2. Verify JSON.stringify() of variants in product-api.ts
3. Check ProductService image distribution logic
4. Verify files are actually uploaded (check response)

## Security Considerations

1. **File Validation**: Only image MIME types accepted
2. **File Size Limit**: 10MB max per file
3. **Authentication**: All endpoints require JWT token
4. **Cloud Storage**: Cloudinary handles security
5. **Private URLs**: Consider using signed URLs for sensitive products

## Future Enhancements

1. **Image Deletion**: Delete from Cloudinary when product deleted
2. **Image Optimization**: Compress images before upload
3. **Batch Upload**: Support drag-drop file upload
4. **Image Preview**: Show thumbnail before upload
5. **Retry Logic**: Auto-retry failed uploads
6. **Progress Tracking**: Show upload progress bar
7. **Signed URLs**: Generate expiring URLs for security

## Database Schema Impact

### Product Schema
```typescript
variants: {
  images: string[]  // Array of Cloudinary URLs
}
```

### Image Storage
- Images NOT stored in MongoDB
- Only URLs stored in variants.images
- Actual files stored in Cloudinary
- Reduces database size significantly

## Performance Metrics

- **Upload Speed**: Depends on file size and internet connection
- **Cloud Storage**: Unlimited files in Cloudinary free tier
- **API Response Time**: ~200-500ms for 1-5 images
- **Database Query**: Same as before (images are URLs, not binary)

## Related Files

- `wdp-be/src/commons/services/cloudinary.service.ts` - Cloud upload service
- `wdp-be/src/commons/services/file-upload.service.ts` - Multer config
- `wdp-be/src/controllers/product.controller.ts` - HTTP endpoints
- `wdp-be/src/services/product.service.ts` - Business logic
- `FE/src/lib/product-api.ts` - Frontend API wrapper
- `FE/src/pages/admin/ProductManagementPage.tsx` - Product management UI
