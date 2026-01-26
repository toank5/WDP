# System Architecture Diagrams

## 1. Complete File Upload Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                  │
│                        (ProductManagementPage)                               │
│                                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Product    │  │   Variants   │  │    File      │  │    Save      │   │
│  │    Form      │  │     List     │  │   Input      │  │   Button     │   │
│  │              │  │              │  │              │  │              │   │
│  │ • Name       │  │ • SKU        │  │ • Select     │  │   onClick    │   │
│  │ • Category   │  │ • Type       │  │   images     │  │   Handler    │   │
│  │ • Price      │  │ • Color      │  │ • Show chips │  │              │   │
│  │ • Desc       │  │ • Size       │  │ • Remove     │  │   Collect    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                               │
│  All files collected from imageFiles: File[] in each variant                 │
└────────────────────────┬─────────────────────────────────────────────────────┘
                         │ handleCreate(e: FormEvent)
                         │ └─→ createProduct(payload, files: File[])
                         ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND API LAYER                                  │
│                        (product-api.ts)                                      │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ if (files && files.length > 0) {                                   │    │
│  │   const formData = new FormData()                                  │    │
│  │   formData.append('name', payload.name)                           │    │
│  │   formData.append('category', payload.category)                   │    │
│  │   formData.append('description', payload.description)             │    │
│  │   formData.append('basePrice', payload.basePrice.toString())      │    │
│  │   formData.append('variants', JSON.stringify(payload.variants))   │    │
│  │   files.forEach(file => formData.append('images', file))          │    │
│  │   return api.post('/products', formData, {                        │    │
│  │     headers: { 'Content-Type': 'multipart/form-data' }           │    │
│  │   })                                                               │    │
│  │ }                                                                  │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  Result: FormData object with:                                              │
│  ├── name (string field)                                                    │
│  ├── category (string field)                                                │
│  ├── description (string field)                                             │
│  ├── basePrice (string field)                                               │
│  ├── variants (JSON string field)                                           │
│  └── images (File[], multiple files)                                        │
└────────────────────────┬─────────────────────────────────────────────────────┘
                         │ HTTP POST /products
                         │ Content-Type: multipart/form-data
                         ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BACKEND HTTP ENDPOINT                                   │
│                 (ProductController.create())                                │
│                                                                               │
│  @Post()                                                                     │
│  @UseInterceptors(FilesInterceptor('images', 10, ...))                      │
│  async create(                                                               │
│    @Body() createProductDto: CreateProductDto,                              │
│    @UploadedFiles() files?: Express.Multer.File[]                           │
│  )                                                                            │
└────────────────────────┬─────────────────────────────────────────────────────┘
                         │
                         ├─→ FilesInterceptor (from @nestjs/platform-express)
                         │    ├─→ Extracts files from 'images' field
                         │    ├─→ Buffers to memory
                         │    └─→ Validates MIME type & size
                         │
                         ├─→ Parse variants from JSON string
                         │
                         └─→ if (files && files.length > 0)
                             └─→ CloudinaryService.uploadMultipleFiles()
                                 ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CLOUDINARY SERVICE                                      │
│                (CloudinaryService)                                           │
│                                                                               │
│  For each file:                                                              │
│  ├─→ cloudinary.uploader.upload_stream()                                    │
│  ├─→ Configure: { folder: 'wdp/products' }                                  │
│  ├─→ Get secure_url from response                                           │
│  └─→ Return: ["url1", "url2", ...]                                          │
│                                                                               │
│  Result: Array of Cloudinary URLs                                           │
│  Example: [                                                                  │
│    'https://res.cloudinary.com/.../image1.jpg',                             │
│    'https://res.cloudinary.com/.../image2.jpg'                              │
│  ]                                                                            │
└────────────────────────┬─────────────────────────────────────────────────────┘
                         │ imageUrls: string[]
                         ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PRODUCT SERVICE                                           │
│              (ProductService.create())                                       │
│                                                                               │
│  Parameters:                                                                 │
│  ├─ createProductDto: CreateProductDto                                      │
│  └─ imageUrls: string[]                                                     │
│                                                                               │
│  Distribution Logic:                                                         │
│  ├─ If imageUrls exist AND variants exist:                                  │
│  │  ├─ Calculate: imagesPerVariant = ceil(imageUrls.length / variants.len)  │
│  │  ├─ Loop through variants:                                               │
│  │  │  ├─ Take N images for each variant                                    │
│  │  │  └─ variant.images = [url1, url2, ...]                               │
│  │  └─ Continue for next variant                                            │
│  │                                                                            │
│  │ Example: 4 images, 2 variants                                             │
│  │ ├─ imagesPerVariant = 2                                                  │
│  │ ├─ variant[0].images = [url1, url2]                                      │
│  │ └─ variant[1].images = [url3, url4]                                      │
│  │                                                                            │
│  └─ Save to MongoDB                                                          │
│     └─ Product {                                                             │
│         variants: [                                                          │
│           { sku, type, color, images: [url1, url2] },                       │
│           { sku, type, color, images: [url3, url4] }                        │
│         ]                                                                    │
│       }                                                                      │
└────────────────────────┬─────────────────────────────────────────────────────┘
                         │ Saved Product with image URLs
                         ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MONGODB DATABASE                                        │
│                  (Product Document)                                          │
│                                                                               │
│  {                                                                            │
│    _id: ObjectId,                                                            │
│    name: "Product Name",                                                     │
│    category: "FRAMES",                                                       │
│    description: "...",                                                       │
│    basePrice: 100,                                                           │
│    variants: [                                                               │
│      {                                                                        │
│        sku: "SKU1",                                                          │
│        type: "AVIATOR",                                                      │
│        color: "Black",                                                       │
│        size: "L",                                                            │
│        images: [                                                             │
│          "https://res.cloudinary.com/cloud/v1234/image1.jpg",               │
│          "https://res.cloudinary.com/cloud/v1234/image2.jpg"                │
│        ]                                                                     │
│      }                                                                        │
│    ],                                                                        │
│    createdAt: ISODate,                                                       │
│    updatedAt: ISODate                                                        │
│  }                                                                            │
└────────────────────────┬─────────────────────────────────────────────────────┘
                         │ Saved Product
                         ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      API RESPONSE                                            │
│                                                                               │
│  {                                                                            │
│    "statusCode": 201,                                                        │
│    "message": "Product created successfully",                                │
│    "metadata": {                                                             │
│      "_id": "507f1f77bcf86cd799439011",                                      │
│      "name": "Product Name",                                                 │
│      "variants": [                                                           │
│        {                                                                      │
│          "images": [                                                         │
│            "https://res.cloudinary.com/...",                                 │
│            "https://res.cloudinary.com/..."                                  │
│          ]                                                                   │
│        }                                                                      │
│      ]                                                                       │
│    }                                                                         │
│  }                                                                            │
└────────────────────────┬─────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND RESPONSE HANDLER                               │
│                                                                               │
│  ├─→ Success: toast.success('Product created successfully')                 │
│  ├─→ Reload products list                                                   │
│  ├─→ Clear form                                                              │
│  ├─→ Close create modal                                                      │
│  └─→ Display product in table                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. File Distribution Logic Diagram

```
SCENARIO 1: Multiple Images, Single Variant
═══════════════════════════════════════════════════════════════

Input:
  imageUrls = ["url1", "url2", "url3", "url4", "url5"]
  variants = [
    { sku: "SKU1", type: "AVIATOR" }
  ]

Logic:
  imagesPerVariant = ceil(5 / 1) = 5

Distribution:
  Variant 1: images = ["url1", "url2", "url3", "url4", "url5"]


SCENARIO 2: Multiple Images, Multiple Variants
═══════════════════════════════════════════════════════════════

Input:
  imageUrls = ["url1", "url2", "url3", "url4", "url5", "url6"]
  variants = [
    { sku: "SKU1", type: "AVIATOR" },
    { sku: "SKU2", type: "ROUND" },
    { sku: "SKU3", type: "WAYFARER" }
  ]

Logic:
  imagesPerVariant = ceil(6 / 3) = 2

Distribution Loop:
  imageIndex = 0
  
  Variant 1:
    slice(0, 0 + 2) = ["url1", "url2"]
    imageIndex = 2
  
  Variant 2:
    slice(2, 2 + 2) = ["url3", "url4"]
    imageIndex = 4
  
  Variant 3:
    slice(4, 4 + 2) = ["url5", "url6"]
    imageIndex = 6

Final Result:
  Variant 1: images = ["url1", "url2"]
  Variant 2: images = ["url3", "url4"]
  Variant 3: images = ["url5", "url6"]


SCENARIO 3: Uneven Distribution
═══════════════════════════════════════════════════════════════

Input:
  imageUrls = ["url1", "url2", "url3", "url4", "url5"]
  variants = [
    { sku: "SKU1" },
    { sku: "SKU2" }
  ]

Logic:
  imagesPerVariant = ceil(5 / 2) = 3

Distribution:
  Variant 1:
    slice(0, 0 + 3) = ["url1", "url2", "url3"]
    imageIndex = 3
  
  Variant 2:
    slice(3, 3 + 3) = ["url4", "url5"]  (only 2 remaining)
    imageIndex = 5

Result:
  Variant 1: images = ["url1", "url2", "url3"]
  Variant 2: images = ["url4", "url5"]
```

## 3. Component Communication Diagram

```
ProductManagementPage (React Component)
│
├─ State:
│  ├─ formData: ProductFormData
│  ├─ variants: VariantFormData[]
│  ├─ variantForm.imageFiles: File[]
│  └─ loading: boolean
│
├─ Handlers:
│  ├─ handleAddVariant()
│  │  └─→ Add new variant to formData.variants
│  │
│  ├─ handleAddFile(files: FileList)
│  │  └─→ variantForm.imageFiles = [...files]
│  │
│  └─ handleCreate(e)
│     ├─→ Collect files from all variants
│     ├─→ Create payload: CreateProductPayload
│     └─→ Call createProduct(payload, allFiles)
│
└─→ product-api.ts (API Layer)
   │
   ├─ createProduct(payload, files?)
   │  ├─ If files exist:
   │  │  ├─→ new FormData()
   │  │  ├─→ Append fields
   │  │  ├─→ Append files
   │  │  └─→ POST /products (FormData)
   │  │
   │  └─ Else:
   │     └─→ POST /products (JSON)
   │
   └─→ HTTP Request
      │
      └─→ ProductController
         │
         ├─ FilesInterceptor
         │  ├─→ Extract files
         │  ├─→ Validate (MIME type, size)
         │  └─→ Buffer to memory
         │
         ├─ Parse variants JSON
         │
         └─ CloudinaryService.uploadMultipleFiles()
            │
            └─→ ProductService.create(dto, imageUrls)
               │
               └─→ MongoDB.save(product)
```

## 4. Service Dependency Injection Diagram

```
app.module.ts
│
├─ Providers:
│  ├─ ProductService
│  │  └─ Depends on: @InjectModel(Product.name)
│  │
│  ├─ CloudinaryService
│  │  └─ Depends on: ConfigService
│  │
│  └─ FileUploadService
│     └─ No dependencies (returns config object)
│
└─ Controllers:
   └─ ProductController
      ├─ Depends on: ProductService
      ├─ Depends on: CloudinaryService
      └─ Depends on: FileUploadService

Injection Flow:
───────────────

ProductController Constructor
│
├─ @Inject() ProductService
│  │
│  └─→ ProductService()
│     │
│     └─→ @InjectModel(Product.name)
│
├─ @Inject() CloudinaryService
│  │
│  └─→ CloudinaryService(ConfigService)
│     │
│     └─→ ConfigService.get('CLOUDINARY_*')
│
└─ @Inject() FileUploadService
   │
   └─→ FileUploadService()
```

## 5. File Upload Request Structure

```
POST /products HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiI...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="name"

Product Name
------WebKitFormBoundary
Content-Disposition: form-data; name="category"

FRAMES
------WebKitFormBoundary
Content-Disposition: form-data; name="description"

Product description
------WebKitFormBoundary
Content-Disposition: form-data; name="basePrice"

100
------WebKitFormBoundary
Content-Disposition: form-data; name="variants"

[{"sku":"SKU1","type":"AVIATOR","size":"L","color":"Black","images":[]}]
------WebKitFormBoundary
Content-Disposition: form-data; name="images"; filename="image1.jpg"
Content-Type: image/jpeg

[binary data]
------WebKitFormBoundary
Content-Disposition: form-data; name="images"; filename="image2.jpg"
Content-Type: image/jpeg

[binary data]
------WebKitFormBoundary--
```

## 6. Error Handling Flow

```
Create Product Request
│
├─ FilesInterceptor
│  │
│  ├─ Validate MIME type
│  │  └─ If not image/*
│  │     └─→ 415 Unsupported Media Type
│  │
│  └─ Validate file size
│     └─ If > 10MB
│        └─→ 413 Payload Too Large
│
├─ Parse variants JSON
│  └─ If invalid JSON
│     └─→ BadRequestException
│        └─→ 400 Bad Request
│
├─ CloudinaryService.uploadMultipleFiles()
│  └─ If Cloudinary error
│     └─→ Catch & throw
│        └─→ 500 Internal Server Error
│
├─ ProductService.create()
│  └─ If MongoDB validation fails
│     └─→ Throw mongoose.ValidationError
│        └─→ 400 Bad Request
│
└─ Success
   └─→ 201 Created
      └─→ Return product with image URLs

Frontend Error Handling:
───────────────────────

try {
  await createProduct(payload, files)
  toast.success('Product created successfully')
} catch (error) {
  const message = error.message
  toast.error(message)
  console.error(error)
}
```

These diagrams provide a complete visual understanding of the file upload system architecture and data flow.
