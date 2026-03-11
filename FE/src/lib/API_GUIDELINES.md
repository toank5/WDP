# API Usage Guidelines

This document explains how to correctly use the API layer in this project.

## Important Rules

### 1. Authentication is Automatic ⚠️

**DO NOT** manually add authentication headers to your API requests. The `api-client` interceptor handles this automatically.

```typescript
// ❌ WRONG - Don't do this!
import { useAuthStore } from '@/store/auth-store'

class MyAPI {
  private get authHeader() {
    const state = useAuthStore.getState()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async getData() {
    return api.get('/data', { headers: this.authHeader })  // DON'T!
  }
}

// ✅ CORRECT - Just use the api directly
import { api } from './api-client'

class MyAPI {
  async getData() {
    return api.get('/data')  // Auth is added automatically by interceptor
  }
}
```

### 2. The `api-client` Interceptor

The `api-client.ts` file has a request interceptor that automatically:
- Adds the `Authorization: Bearer <token>` header to all requests
- Handles 401 responses by auto-logging out the user

```typescript
// From api-client.ts
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})
```

### 3. When to Use Custom Headers

Only use custom headers for:
- **Content-Type**: When sending files (`multipart/form-data`)
- **Other API-specific headers**: Never for authentication

```typescript
// ✅ CORRECT - multipart/form-data for file uploads
async uploadFile(file: File) {
  const formData = new FormData()
  formData.append('image', file)

  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// ✅ CORRECT - No auth header needed (handled by interceptor)
async getData() {
  return api.get('/data')
}
```

## API File Structure

### Core Files

| File | Purpose | Usage |
|------|---------|-------|
| `api-client.ts` | **Core** - Axios instance with interceptors | Import this, don't modify |
| `api.ts` | Main API exports | Use this for helper functions |
| `auth-api.ts` | Authentication endpoints | Login, register, logout |

### Domain APIs

| File | Purpose | Example |
|------|---------|---------|
| `cart-api.ts` | Shopping cart operations | `cartApi.getCart()`, `cartApi.addItem()` |
| `order-api.ts` | Order management | `orderApi.checkout()`, `orderApi.getMyOrders()` |
| `product-api.ts` | Product catalog | `getAllProducts()`, `createProduct()` |
| `user-api.ts` | User management | User profile, preferences |
| `wishlist-api.ts` | Wishlist operations | Add, remove, get items |
| `inventory-api.ts` | Stock management | Check stock, update inventory |
| `supplier-api.ts` | Supplier management | CRUD for suppliers |
| `media-api.ts` | File uploads | Upload images, media |
| `vnpay-api.ts` | VNPay payment | Payment URL generation, verification |

### API Client Features

The `api-client.ts` provides:

1. **Automatic Authentication** - Adds Bearer token to all requests
2. **401 Auto-Logout** - Logs user out on 401 responses
3. **Error Handling Helpers** - `extractApiMessage()`, `handleApiError()`
4. **Type-Safe Responses** - Proper TypeScript types for all responses

## Common Patterns

### Creating a New API Module

```typescript
// my-api.ts
import { api } from './api-client'
import { extractApiMessage } from './api-client'

export interface MyData {
  id: string
  name: string
}

class MyAPI {
  async getData(): Promise<MyData[]> {
    try {
      const response = await api.get('/my-endpoint')
      return response.data.data
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  async createData(data: Omit<MyData, 'id'>): Promise<MyData> {
    try {
      const response = await api.post('/my-endpoint', data)
      return response.data.data
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  async updateData(id: string, data: Partial<MyData>): Promise<MyData> {
    try {
      const response = await api.patch(`/my-endpoint/${id}`, data)
      return response.data.data
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }

  async deleteData(id: string): Promise<void> {
    try {
      await api.delete(`/my-endpoint/${id}`)
    } catch (error) {
      const message = extractApiMessage(error)
      throw new Error(message)
    }
  }
}

export const myApi = new MyAPI()
```

### Error Handling Pattern

```typescript
import { extractApiMessage } from './api-client'

async myOperation() {
  try {
    const response = await api.get('/endpoint')
    return response.data.data
  } catch (error) {
    // Extract user-friendly error message
    const message = extractApiMessage(error)

    // You can either:
    // 1. Throw for components to handle
    throw new Error(message)

    // 2. Return fallback data
    return []

    // 3. Show snackbar/notification
    showNotification(message, 'error')
  }
}
```

## Common Mistakes to Avoid

### ❌ Don't: Manual auth headers
```typescript
// DON'T DO THIS
headers: { Authorization: `Bearer ${token}` }
```

### ❌ Don't: Use localStorage directly for tokens
```typescript
// DON'T DO THIS
const token = localStorage.getItem('access_token')
```

### ✅ Do: Trust the interceptor
```typescript
// Just use api directly - auth is automatic
api.get('/endpoint')
api.post('/endpoint', data)
api.patch('/endpoint', data)
api.delete('/endpoint')
```

## File Upload Pattern

For file uploads, you need to specify Content-Type:

```typescript
async uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('image', file)

  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return response.data.data.url
}
```

## Testing APIs

When testing API modules, ensure the auth store has a valid token:

```typescript
import { useAuthStore } from '@/store/auth-store'

// Before testing
useAuthStore.getState().setAuth({
  accessToken: 'test-token',
  user: { email: 'test@example.com', /* ... */ }
})
```

## Summary

1. **Always** use the `api` import from `api-client.ts`
2. **Never** manually add `Authorization` headers
3. **Only** add custom headers for specific purposes (like `Content-Type` for uploads)
4. **Use** `extractApiMessage()` for user-friendly error messages
5. **Let** the interceptor handle authentication automatically
