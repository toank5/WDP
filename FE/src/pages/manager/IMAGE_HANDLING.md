# Product Management - Image File Handling

## Overview
The product management system now handles images as **file uploads** instead of URLs. Managers upload image files when creating or editing product variants.

## Frontend Changes
- **File Input**: Managers select image files (PNG, JPG, GIF, etc.) from their computer
- **Multiple Images**: Each variant can have multiple images
- **File Display**: Shows selected file names as chips with delete option
- **Data Structure**: `imageFiles: File[]` in variant form

## Backend Implementation Notes
When implementing the backend file upload handler:

### Product Creation/Update with Files
1. Accept multipart/form-data requests
2. Parse product data (JSON) and image files separately
3. Process images:
   - Validate file types (image/* only)
   - Validate file size limits
   - Save files to storage (local, S3, etc.)
   - Store file paths/URLs in `ProductVariant.images` array

### File Storage Options
- **Local Storage**: Save to `/public/uploads/products/` directory
- **Cloud Storage**: Use AWS S3, Google Cloud Storage, or similar
- **CDN**: Serve images through CDN for better performance

### API Endpoint
```
POST /products (with image files)
Content-Type: multipart/form-data

Body:
- product: JSON object with name, category, description, basePrice, variants
- files: Image files for variants
```

### Example Backend Code Structure
```typescript
@Post()
@UseInterceptors(FileInterceptor('files'))
async create(
  @Body() createProductDto: CreateProductDto,
  @UploadedFiles() files: Express.Multer.File[]
) {
  // Save files to storage
  // Update variant images array with file paths
  // Save product to database
}
```

## Frontend API Integration
The `product-api.ts` should be updated to send `FormData` instead of JSON:
```typescript
const formData = new FormData()
formData.append('product', JSON.stringify(payload))
files.forEach((file) => formData.append('files', file))

return api.post('/products', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
```

## Security Considerations
- ✅ Validate file MIME types on frontend and backend
- ✅ Limit file size (e.g., 10MB per image)
- ✅ Generate unique filenames to prevent overwriting
- ✅ Store files outside public web root if needed
- ✅ Sanitize file paths to prevent directory traversal
