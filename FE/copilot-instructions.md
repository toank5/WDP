# Copilot Instructions: Eyeglasses E-Commerce Frontend

## Project Overview

This is the frontend React application for the WDP Eyeglasses E-Commerce platform. The application serves multiple user roles with different interfaces and capabilities, from customer shopping to staff order management and admin dashboards.

## Business Requirements & User Interfaces

### **CUSTOMER Interface:**
- **Product Catalog:**
  - Browse frames, lenses, and services with advanced filtering (brand, color, size, price, style)
  - Search functionality with autocomplete
  - Product grid/list views with sorting options
  - Product detail pages with image galleries (2D/3D viewer for frames)
  - Variant selection (color, size) with real-time price updates
  
- **Shopping Experience:**
  - Add to cart with quantity selection
  - Cart management (update quantities, remove items)
  - Three order types:
    1. **Ready Stock:** Direct purchase of available products
    2. **Pre-order:** Reserve out-of-stock items with estimated delivery
    3. **Prescription:** Frame + prescription lens configuration
  
- **Prescription Builder:**
  - Upload/input prescription details (SPH, CYL, AXIS, PD, ADD)
  - Lens type selection (single vision, bifocal, progressive)
  - Coating/treatment options (anti-glare, blue light, transitions)
  - Price calculation based on prescription complexity
  
- **Checkout & Payment:**
  - Multi-step checkout (shipping address, payment method, review)
  - Payment gateway integration
  - Order confirmation with tracking
  
- **Account Management:**
  - Order history with status tracking
  - Returns/exchanges initiation
  - Saved addresses and payment methods
  - Profile management

### **SALES/SUPPORT STAFF Interface:**
- **Order Dashboard:**
  - Pending orders queue with filters (type, date, status)
  - Order details view with customer information
  - Prescription validation interface
  - Customer communication tools (notes, email/SMS)
  
- **Order Processing:**
  - Confirm order details
  - Validate prescriptions (flag invalid entries)
  - Assign orders to Operations staff
  - Handle customer inquiries
  
- **Returns & Support:**
  - Process return/exchange requests
  - Manage complaints and warranty claims
  - Issue refunds with reason tracking
  - Pre-order status updates

### **OPERATIONS STAFF Interface:**
- **Fulfillment Dashboard:**
  - Assigned orders queue
  - Packaging checklist interface
  - Shipping label generation
  - Real-time status updates
  
- **Prescription Orders:**
  - Lens grinding workflow
  - Assembly/fitting interface
  - Quality check forms
  - Photo documentation
  
- **Inventory Management:**
  - Pre-order stock receiving
  - Inventory level updates
  - Low stock alerts

### **MANAGER Interface:**
- **Product Management:**
  - CRUD for products (frames, lenses, services)
  - Variant management (add/edit colors, sizes)
  - Pricing and promotion configuration
  - Image upload and gallery management
  
- **Business Configuration:**
  - Return policy settings
  - Warranty terms configuration
  - Shipping rules and zones
  - Pricing rules (markups, discounts)
  
- **Staff Management:**
  - User accounts CRUD
  - Role assignment
  - Activity logs
  
- **Analytics & Reporting:**
  - Revenue dashboards with charts
  - Sales by product/category/period
  - Order status metrics
  - Customer acquisition/retention

### **SYSTEM ADMIN Interface:**
- System configuration and maintenance
- Database backups
- Logs and monitoring

## Technical Stack

- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v7
- **State Management:** 
  - React Context API + useReducer for global state
  - TanStack Query (React Query) for server state
  - Zustand for lightweight local state
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **Form Handling:** React Hook Form + Zod validation
- **API Client:** Axios with interceptors
- **Authentication:** JWT tokens (localStorage/sessionStorage)
- **File Upload:** react-dropzone
- **Date Handling:** date-fns
- **Charts:** Recharts
- **Tables:** TanStack Table
- **Notifications:** sonner (toast notifications)

## Project Structure

```
FE/
├── src/
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── common/              # Shared components (Header, Footer, Loader)
│   │   ├── customer/            # Customer-specific components
│   │   ├── staff/               # Staff-specific components
│   │   └── admin/               # Admin/Manager components
│   ├── pages/
│   │   ├── customer/            # Customer pages (Home, Products, Cart, Checkout)
│   │   ├── staff/               # Staff pages (Dashboard, Orders)
│   │   ├── operations/          # Operations pages
│   │   ├── manager/             # Manager pages
│   │   └── auth/                # Login, Register
│   ├── lib/
│   │   ├── api/                 # API client and endpoints
│   │   ├── utils.ts             # Utility functions (cn, formatters)
│   │   ├── hooks/               # Custom React hooks
│   │   └── types/               # TypeScript types/interfaces
│   ├── store/                   # State management (Context/Zustand stores)
│   ├── routes/                  # Route definitions and guards
│   ├── assets/                  # Images, icons, fonts
│   └── config/                  # App configuration constants
```

## Implementation Guidelines

### 1. Component Architecture

- **Atomic Design Pattern:**
  - Atoms: Basic UI elements (Button, Input from shadcn/ui)
  - Molecules: Simple component combinations (SearchBar, ProductCard)
  - Organisms: Complex components (ProductGrid, OrderTable)
  - Templates: Page layouts
  - Pages: Complete views

- **Component Best Practices:**
  ```typescript
  // Always use TypeScript with proper types
  interface ProductCardProps {
    product: Product
    onAddToCart: (productId: string) => void
  }

  export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
    // Component implementation
  }
  ```

### 2. Routing & Navigation

```typescript
// Use React Router v7 with role-based route guards
import { createBrowserRouter } from 'react-router-dom'

const router = createBrowserRouter([
  {
    path: '/',
    element: <CustomerLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
    ]
  },
  {
    path: '/staff',
    element: <ProtectedRoute roles={['SALES', 'SUPPORT']} />,
    children: [
      { index: true, element: <StaffDashboard /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'orders/:id', element: <OrderDetailPage /> },
    ]
  },
  // ... other role-based routes
])
```

### 3. API Integration

```typescript
// src/lib/api/client.ts
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
})

// Request interceptor for JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

```typescript
// src/lib/api/products.ts
import apiClient from './client'
import type { Product, ProductFilters } from '@/lib/types'

export const productApi = {
  getAll: (filters?: ProductFilters) => 
    apiClient.get<Product[]>('/products', { params: filters }),
  
  getById: (id: string) => 
    apiClient.get<Product>(`/products/${id}`),
  
  create: (data: Partial<Product>) => 
    apiClient.post<Product>('/products', data),
  
  update: (id: string, data: Partial<Product>) => 
    apiClient.put<Product>(`/products/${id}`, data),
}
```

### 4. State Management

**React Query for Server State:**
```typescript
// src/lib/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productApi } from '@/lib/api/products'

export const useProducts = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productApi.getAll(filters),
  })
}

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productApi.getById(id),
    enabled: !!id,
  })
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: productApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
```

**Zustand for UI State:**
```typescript
// src/store/cartStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  productId: string
  variantId?: string
  quantity: number
  price: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => set((state) => {
        const existing = state.items.find(i => i.productId === item.productId)
        if (existing) {
          return {
            items: state.items.map(i => 
              i.productId === item.productId 
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            )
          }
        }
        return { items: [...state.items, item] }
      }),
      
      removeItem: (productId) => set((state) => ({
        items: state.items.filter(i => i.productId !== productId)
      })),
      
      updateQuantity: (productId, quantity) => set((state) => ({
        items: state.items.map(i => 
          i.productId === productId ? { ...i, quantity } : i
        )
      })),
      
      clearCart: () => set({ items: [] }),
      
      total: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    { name: 'cart-storage' }
  )
)
```

### 5. Form Handling with React Hook Form + Zod

```typescript
// src/lib/validations/product.ts
import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be positive'),
  category: z.enum(['FRAME', 'LENS', 'SERVICE']),
  variants: z.array(z.object({
    color: z.string(),
    size: z.string(),
    stock: z.number().int().min(0),
  })).optional(),
})

export type ProductFormData = z.infer<typeof productSchema>
```

```typescript
// Component using the form
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productSchema, type ProductFormData } from '@/lib/validations/product'

export const ProductForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  })

  const onSubmit = (data: ProductFormData) => {
    // Handle form submission
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('name')} />
      {errors.name && <span className="text-red-500">{errors.name.message}</span>}
      {/* Other fields */}
    </form>
  )
}
```

### 6. Authentication & Authorization

```typescript
// src/lib/hooks/useAuth.ts
import { create } from 'zustand'
import { authApi } from '@/lib/api/auth'

interface User {
  id: string
  email: string
  role: 'CUSTOMER' | 'SALES' | 'OPERATIONS' | 'MANAGER' | 'ADMIN'
}

interface AuthStore {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: () => boolean
  hasRole: (roles: string[]) => boolean
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  
  login: async (email, password) => {
    const { user, token } = await authApi.login(email, password)
    localStorage.setItem('token', token)
    set({ user, token })
  },
  
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },
  
  isAuthenticated: () => !!get().token,
  
  hasRole: (roles) => {
    const user = get().user
    return user ? roles.includes(user.role) : false
  },
}))
```

### 7. Protected Routes

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/lib/hooks/useAuth'

interface ProtectedRouteProps {
  roles?: string[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles }) => {
  const { isAuthenticated, hasRole } = useAuthStore()

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  if (roles && !hasRole(roles)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
```

### 8. UI Components with shadcn/ui

```typescript
// Use shadcn/ui components consistently
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'

// Add components as needed:
// npx shadcn@latest add button card input select table dialog badge
```

### 9. Environment Variables

```env
# .env
VITE_API_URL=http://localhost:3000
VITE_UPLOAD_URL=http://localhost:3000/uploads
VITE_PAYMENT_GATEWAY_KEY=your_key_here
```

```typescript
// src/config/env.ts
export const env = {
  apiUrl: import.meta.env.VITE_API_URL,
  uploadUrl: import.meta.env.VITE_UPLOAD_URL,
  paymentKey: import.meta.env.VITE_PAYMENT_GATEWAY_KEY,
}
```

### 10. Error Handling & Loading States

```typescript
// Use React Query's built-in states
const { data, isLoading, isError, error } = useProducts()

if (isLoading) return <Loader />
if (isError) return <ErrorMessage error={error} />

return <ProductGrid products={data} />
```

## Feature Implementation Checklist

### Customer Features
- [ ] Product catalog with filtering and search
- [ ] Product detail with variant selection
- [ ] Shopping cart with persistence
- [ ] Checkout flow (multi-step)
- [ ] Prescription builder interface
- [ ] Order tracking
- [ ] Account management
- [ ] Returns/exchanges request

### Staff Features
- [ ] Order dashboard with filters
- [ ] Order detail view
- [ ] Prescription validation form
- [ ] Customer communication interface
- [ ] Returns processing
- [ ] Pre-order management

### Operations Features
- [ ] Fulfillment dashboard
- [ ] Packaging checklist
- [ ] Shipping label generation
- [ ] Prescription workflow
- [ ] Inventory updates

### Manager Features
- [ ] Product CRUD interface
- [ ] Variant management
- [ ] Pricing configuration
- [ ] Business rules settings
- [ ] User management
- [ ] Analytics dashboards

## TypeScript Types

```typescript
// src/lib/types/product.ts
export interface Product {
  _id: string
  name: string
  description: string
  category: 'FRAME' | 'LENS' | 'SERVICE'
  basePrice: number
  images: string[]
  variants: ProductVariant[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductVariant {
  _id: string
  color?: string
  size?: string
  sku: string
  price: number
  stock: number
  images?: string[]
}

export interface ProductFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  color?: string
  size?: string
  search?: string
  page?: number
  limit?: number
}
```

```typescript
// src/lib/types/order.ts
export interface Order {
  _id: string
  orderNumber: string
  customerId: string
  items: OrderItem[]
  type: 'READY_STOCK' | 'PRE_ORDER' | 'PRESCRIPTION'
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  totalAmount: number
  shippingAddress: Address
  payment: Payment
  prescription?: Prescription
  history: OrderHistory[]
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  productId: string
  variantId?: string
  quantity: number
  price: number
  name: string
}

export interface Prescription {
  rightEye: PrescriptionEye
  leftEye: PrescriptionEye
  pd: number
  lensType: 'SINGLE_VISION' | 'BIFOCAL' | 'PROGRESSIVE'
  coatings: string[]
  uploadedFile?: string
}

export interface PrescriptionEye {
  sph: number
  cyl: number
  axis: number
  add?: number
}
```

## Styling Guidelines

- Use Tailwind utility classes for all styling
- Follow shadcn/ui design system
- Responsive design: mobile-first approach
- Dark mode support via Tailwind's dark: variant
- Consistent spacing: use Tailwind's spacing scale
- Color palette: use CSS variables from index.css

```typescript
// Example: Responsive product grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {products.map(product => (
    <ProductCard key={product._id} product={product} />
  ))}
</div>
```

## Performance Optimization

- Lazy load routes with React.lazy
- Image optimization (use next-gen formats, lazy loading)
- Virtual scrolling for long lists (react-window)
- Debounce search inputs
- Memoize expensive computations with useMemo
- Optimize re-renders with React.memo
- Code splitting by route

## Testing Strategy

- Unit tests: Vitest for utility functions and hooks
- Component tests: React Testing Library
- E2E tests: Playwright (optional)
- API mocking: MSW (Mock Service Worker)

## Accessibility

- Use semantic HTML elements
- Proper ARIA labels for interactive elements
- Keyboard navigation support
- Focus management
- Screen reader friendly
- Color contrast compliance (WCAG AA)

## References

- **Backend API:** All endpoints follow the structure defined in `wdp-be/src/controllers/`
- **Types:** Mirror backend DTOs from `wdp-be/src/commons/dtos/`
- **Enums:** Match backend enums from `wdp-be/src/commons/enums/`

## Getting Started

1. Install dependencies: `npm install`
2. Set up environment variables: Copy `.env.example` to `.env`
3. Start dev server: `npm run dev`
4. Install shadcn components as needed: `npx shadcn@latest add <component>`
5. Build for production: `npm run build`

---

**Remember:** Always follow TypeScript best practices, maintain consistency with the backend API contracts, and prioritize user experience for all role-specific interfaces.
