# File Upload Implementation - Setup Checklist

## Completed ✅

### Backend Components Created
- [x] **CloudinaryService** (`wdp-be/src/commons/services/cloudinary.service.ts`)
  - `uploadFile()` - Upload single file
  - `uploadMultipleFiles()` - Upload multiple files
  - `deleteFile()` - Delete from Cloudinary
  - Uses ConfigService for environment variables

- [x] **FileUploadService** (`wdp-be/src/commons/services/file-upload.service.ts`)
  - `getMulterOptions()` - Returns Multer configuration
  - Memory storage for temporary buffering
  - File type validation (image/* only)
  - File size limit (10MB per file)

- [x] **ProductController Updated** (`wdp-be/src/controllers/product.controller.ts`)
  - @Post() with FilesInterceptor for file uploads
  - @Put() with FilesInterceptor for file updates
  - JSON string parsing for FormData variants
  - Cloudinary integration for image upload
  - Passes imageUrls to ProductService

- [x] **ProductService Updated** (`wdp-be/src/services/product.service.ts`)
  - `create()` accepts imageUrls parameter
  - `update()` accepts imageUrls parameter
  - Image distribution logic to variants
  - Sequential distribution for multiple variants

- [x] **App Module Updated** (`wdp-be/src/app.module.ts`)
  - Imported ProductController
  - Imported ProductService
  - Imported CloudinaryService
  - Imported FileUploadService
  - Imported Product schema
  - Registered all in module

### Frontend Components Updated
- [x] **product-api.ts** (`FE/src/lib/product-api.ts`)
  - Added `CreateProductWithFilesPayload` type
  - Updated `createProduct()` to handle File[]
  - Updated `updateProduct()` to handle File[]
  - FormData construction for multipart uploads
  - Automatic variants JSON stringification

- [x] **ProductManagementPage** (`FE/src/pages/admin/ProductManagementPage.tsx`)
  - Changed `VariantFormData.imageFiles` from `string` to `File[]`
  - Updated `handleCreate()` to collect files from variants
  - Updated `handleUpdate()` to collect files from variants
  - File input UI with multiple file selection
  - Visual display of selected files as removable chips

### Documentation
- [x] **FILE_UPLOAD_GUIDE.md** - Comprehensive implementation guide
- [x] **.env.example** - Environment variable template

## TODO - Before Testing

### 1. Install Dependencies
```bash
cd wdp-be
npm install cloudinary
npm install multer @nestjs/platform-express
npm install --save-dev @types/multer @types/express
```

### 2. Setup Environment Variables
```bash
# Create .env file in wdp-be/ root with:
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Other required variables:
MONGODB_URI=mongodb://localhost:27017/wdp
JWT_SECRET=your_secret_here
JWT_EXPIRATION=3600
PORT=3000
```

### 3. Get Cloudinary Credentials
1. Visit https://cloudinary.com
2. Sign up (free tier available)
3. Dashboard → Account → API Keys
4. Copy Cloud Name, API Key, API Secret
5. Add to .env file

### 4. Test Backend (Optional)
```bash
# Start backend
npm run start

# In another terminal, test with curl:
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=Test Product" \
  -F "category=FRAMES" \
  -F "description=Test" \
  -F "basePrice=100" \
  -F 'variants=[{"sku":"SKU1","type":"AVIATOR","size":"L","color":"Black","images":[]}]' \
  -F "images=@image.jpg"
```

### 5. Test Frontend (Manual)
1. Start both frontend and backend
2. Login to admin account (role: MANAGER)
3. Navigate to Dashboard → Products
4. Click "Add Product"
5. Fill in product details:
   - Name: "Test Product"
   - Category: "FRAMES"
   - Description: "Test description"
   - Base Price: "100"
6. Add a variant:
   - SKU: "SKU001"
   - Type: "AVIATOR"
   - Size: "L"
   - Color: "Black"
   - Click file input and select 1-2 images
7. Click "Save Product"
8. Verify:
   - No errors in browser console
   - Product appears in table
   - Navigate to product details
   - Verify images loaded from Cloudinary URLs

## Key Features

### Image Distribution
- **Single Variant**: All uploaded images → variant.images
- **Multiple Variants**: Images distributed sequentially
  - Example: 6 images, 2 variants → 3 images each
  - Example: 5 images, 2 variants → 3 to first, 2 to second

### API Request Format (FormData)
```
POST /products
Content-Type: multipart/form-data

Form Fields:
- name: string
- category: string
- description: string
- basePrice: string (stringified number)
- variants: JSON string (stringified array)
- images: File[] (multiple files)
```

### API Response Format
```json
{
  "statusCode": 201,
  "message": "Product created successfully",
  "metadata": {
    "_id": "...",
    "name": "...",
    "variants": [
      {
        "images": [
          "https://res.cloudinary.com/.../image1.jpg",
          "https://res.cloudinary.com/.../image2.jpg"
        ]
      }
    ]
  }
}
```

## Troubleshooting

### 409 Module Not Found Errors
- Check all imports in app.module.ts are correct
- Verify ProductService exists at `wdp-be/src/services/product.service.ts`
- Verify CloudinaryService exists at `wdp-be/src/commons/services/cloudinary.service.ts`

### Files Not Uploading
- Check browser DevTools Console for errors
- Verify FormData is correctly built in product-api.ts
- Check files array is not empty before calling API

### Cloudinary Errors
- Check CLOUDINARY_CLOUD_NAME in .env
- Verify API Key and Secret are correct
- Check Cloudinary account is active
- Check file type is image/* (not application/json)

### Mongoose Validation Errors
- Verify all required fields are provided
- Check variant structure matches schema
- Verify basePrice is a number

## File Location Reference

```
wdp-be/
├── src/
│   ├── app.module.ts ...................... [UPDATED]
│   ├── controllers/
│   │   └── product.controller.ts ........... [UPDATED]
│   ├── services/
│   │   └── product.service.ts ............. [UPDATED]
│   └── commons/
│       ├── services/
│       │   ├── cloudinary.service.ts ....... [NEW]
│       │   └── file-upload.service.ts ...... [NEW]
│       ├── dtos/
│       │   └── product.dto.ts ............. [NO CHANGE]
│       └── schemas/
│           └── product.schema.ts .......... [NO CHANGE]
├── .env.example ........................... [NEW]
└── FILE_UPLOAD_GUIDE.md ................... [NEW]

FE/
├── src/
│   ├── lib/
│   │   └── product-api.ts ................. [UPDATED]
│   └── pages/
│       └── admin/
│           └── ProductManagementPage.tsx ... [UPDATED]
└── (other files unchanged)
```

## Next Steps After Setup

1. **Delete Images When Product Deleted**
   - Update ProductService.remove() to delete images from Cloudinary
   - Store publicId in Product schema for easy deletion

2. **Add Image Optimization**
   - Compress images before upload
   - Generate thumbnails for preview

3. **Batch Upload UI**
   - Add drag-drop file upload
   - Show upload progress
   - Display image previews

4. **Security Enhancements**
   - Sign Cloudinary URLs
   - Add expiration times
   - Restrict download permissions

5. **Performance**
   - Implement lazy loading for images
   - Add CDN optimization
   - Cache image URLs

## Support

For issues or questions:
1. Check FILE_UPLOAD_GUIDE.md for detailed documentation
2. Review error messages in browser console
3. Check backend logs for stack traces
4. Verify Cloudinary account and credentials
