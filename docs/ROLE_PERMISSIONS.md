# Role Permissions Matrix

## User Roles

| Role | Description |
|------|-------------|
| **Customer** | End users who browse and purchase eyewear products |
| **Operation Staff** | Warehouse staff who manage inventory and process orders |
| **Sale Staff** | Sales team who approve orders and handle refunds |
| **Manager** | Operations manager who oversees revenue and suppliers |
| **Admin** | System administrator with full access |

## Permission Matrix

| Module/Feature | Customer | Operation Staff | Sale Staff | Manager | Admin |
|-----------------|----------|-----------------|------------|---------|-------|
| **Authentication** |
| Login | ✅ | ✅ | ✅ | ✅ | ✅ |
| Register | ✅ | ❌ | ❌ | ❌ | ❌ |
| Forgot Password | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Product Catalog** |
| View Products | ✅ | ✅ | ✅ | ✅ | ✅ |
| Search & Filter | ✅ | ✅ | ✅ | ✅ | ✅ |
| View 2D/3D Images | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Product | ❌ | ❌ | ❌ | ✅ | ✅ |
| Update Product | ❌ | ❌ | ❌ | ✅ | ✅ |
| Delete Product | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Cart & Checkout** |
| Add to Cart | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update Cart | ✅ | ❌ | ❌ | ❌ | ❌ |
| Checkout | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Cart | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Order Management** |
| Create Order | ✅ | ❌ | ❌ | ❌ | ❌ |
| View My Orders | ✅ | ❌ | ❌ | ✅ | ✅ |
| View All Orders | ❌ | ✅ | ✅ | ✅ | ✅ |
| Approve Order | ❌ | ❌ | ✅ | ✅ | ✅ |
| Cancel Order | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Inventory** |
| View Inventory | ❌ | ✅ | ❌ | ✅ | ✅ |
| Adjust Stock | ❌ | ✅ | ❌ | ✅ | ✅ |
| Low Stock Alerts | ❌ | ✅ | ❌ | ✅ | ✅ |
| View Movements | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Returns & Refunds** |
| Create Return | ✅ | ❌ | ❌ | ❌ | ❌ |
| View My Returns | ✅ | ❌ | ❌ | ✅ | ✅ |
| Verify Return | ❌ | ✅ | ❌ | ❌ | ✅ |
| Approve/Reject Refund | ❌ | ❌ | ✅ | ✅ | ✅ |
| Process Refund | ❌ | ❌ | ✅ | ✅ | ✅ |
| **User Management** |
| View Profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Update Own Profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Addresses | ✅ | ❌ | ❌ | ❌ | ❌ |
| View All Users | ❌ | ❌ | ❌ | ✅ | ✅ |
| Update User Role | ❌ | ❌ | ❌ | ❌ | ✅ |
| Update User Status | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Favorites** |
| Add Favorite | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Favorites | ✅ | ❌ | ❌ | ❌ | ❌ |
| Remove Favorite | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Promotions** |
| View Promotions | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Promotion | ❌ | ❌ | ❌ | ✅ | ✅ |
| Update Promotion | ❌ | ❌ | ❌ | ✅ | ✅ |
| Delete Promotion | ❌ | ❌ | ❌ | ✅ | ✅ |
| Validate Code | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Policies** |
| View Policies | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Policy | ❌ | ❌ | ❌ | ✅ | ✅ |
| Update Policy | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Supplier Management** |
| View Suppliers | ❌ | ❌ | ❌ | ✅ | ✅ |
| Create Supplier | ❌ | ❌ | ❌ | ✅ | ✅ |
| Create Purchase Order | ❌ | ❌ | ❌ | ✅ | ✅ |
| Receive Supply | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Revenue & Analytics** |
| View Dashboard | ❌ | ❌ | ❌ | ✅ | ✅ |
| Generate Reports | ❌ | ❌ | ❌ | ✅ | ✅ |
| View Revenue Charts | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Media Management** |
| Upload Images | ❌ | ❌ | ❌ | ✅ | ✅ |
| Upload 3D Models | ❌ | ❌ | ❌ | ✅ | ✅ |
| Delete Media | ❌ | ❌ | ❌ | ✅ | ✅ |

## Role Hierarchy

```
Admin (Full Access)
    │
    ├── Manager (Operations oversight)
    │   │
    │   ├── Sale Staff (Order & Refund approval)
    │   │
    │   └── Operation Staff (Inventory & Order processing)
    │
    └── Customer (End user)
```

## Access Control Summary

| Role | Key Capabilities |
|------|-----------------|
| **Customer** | Browse, Shop, Track orders, Request returns |
| **Operation Staff** | Inventory management, Order processing, Return verification |
| **Sale Staff** | Order approval, Refund processing |
| **Manager** | Revenue reports, Supplier management, Team oversight |
| **Admin** | User management, System configuration, Full access |
