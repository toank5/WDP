# V. Software Testing Documentation

## 1. Scope of Testing

### 1.1 Scopes of Test

#### A. Features & Functions to Be Tested

**1. User Authentication & Authorization**
- Login, Register, Logout
- Email verification
- Password reset (forgot/reset)
- Token refresh
- Role-based access (Customer, Operation Staff, Sale Staff, Manager, Admin)
- Account locking (failed attempts)
- Account status management (suspended, locked, active)

**2. Product & Catalog Module**
- View product catalog (Frames, Lenses, Services)
- View product details with 2D/3D images
- Filter by category, price, shape, material
- Search products
- View product variants (color, size)
- CRUD operations for managers

**3. Cart Management**
- Add item to cart
- Update item quantity
- Remove item from cart
- Clear cart
- Merge guest cart to user cart
- View cart totals
- Stock validation

**4. Order & Checkout Module**
- Checkout process
- Payment via VNPay
- Order placement (Ready, Preorder, Exchange)
- View order history
- Track order status
- Cancel order
- Order approval (staff)

**5. Inventory Management**
- Stock adjustment (increase/decrease)
- Stock reservation for orders
- Stock release (cancellation)
- Low stock alerts
- View inventory movements
- View inventory reports

**6. Return & Refund Module**
- Create return request
- Upload return photos
- Staff verification
- Refund approval/rejection
- Exchange order creation
- VNPay refund processing
- Return shipping label generation

**7. Combo Management (Frame + Lens)**
- Create combo packages
- Calculate combo pricing
- Apply combo discounts
- View active combos

**8. Promotion Management**
- Create promotion codes
- Validate promotion codes
- Apply discounts (percentage, fixed amount)
- Usage limit tracking
- Promotion statistics

**9. Favorite Management**
- Add/remove favorites
- View favorites list
- Check if product is favorited

**10. User Profile Management**
- View profile
- Update profile (name, phone, avatar)
- Manage addresses (add, update, remove, set default)
- Admin: Update user role/status

**11. Preorder Management**
- Create preorder (with deposit)
- Preorder fulfillment (stock available)
- Preorder notification

**12. Supplier & Purchase Order Module**
- Create supplier
- Create purchase order
- Receive supply (stock in)
- Track purchase orders

**13. Revenue & Analytics Module**
- Generate revenue reports
- View revenue dashboard
- Daily/monthly revenue breakdown
- Top products analysis

**14. Policy Management**
- View policies (Return, Refund, Warranty, Shipping)
- Create/update policies
- Policy versioning

**15. Media Management**
- Upload 2D images
- Upload 3D models
- Delete media
- Get media info

**16. Non-functional Requirements**
- Performance (image upload time, API response time)
- Reliability (no crash, error handling)
- Security (token validation, password hashing, RBAC)
- Usability (UI/UX clarity, responsive design)

#### B. Features Not Tested
- Advanced 3D model rendering across all devices
- Cross-platform browser compatibility (legacy browsers)
- Stress testing for 10,000+ concurrent users
- VNPay production gateway edge cases (multiple retries)
- CDN caching behavior under heavy load
- Database sharding scenarios
- AI/ML model accuracy benchmarking

---

### 1.2 Testing Level

**Unit Testing**
- In-charge: Backend + Frontend Developers
- Focus: API validation, Service layer logic, Repository CRUD, Utility functions
- Acceptance Criteria:
  - Functions return expected values
  - API status codes are correct
  - No logic-breaking errors
  - Code coverage ≥ 70%

**Integration Testing**
- In-charge: Developers + QA (Quality Assurance)
- Focus:
  - Frontend ↔ Backend API
  - Image/Video Upload ↔ Cloudinary/Storage
  - VNPay payment integration
  - Email service integration
  - Database transaction integrity
  - Redis caching behavior
- Acceptance Criteria:
  - Modules communicate correctly
  - No broken data flow
  - Upload-process-download works
  - Third-party integrations work

**System Testing**
- In-charge: QA Team
- Focus: End-to-end flow
- Acceptance Criteria:
  - All main user journeys run without error
  - System meets SRS requirements
  - Business workflows function correctly

---

### 1.3 Constraints and Assumptions

**Constraints**
Image/video upload speed dependent on network
3D model rendering depends on device capabilities
VNPay sandbox environment for testing
Email delivery may be delayed by external providers
Database hosted locally during development
Cloudinary has bandwidth limits
Redis cache server has memory limits

**Assumptions**
Users have stable internet connection
All team members can maintain test environment
Test accounts are available and functional
VNPay test credentials are available
Email service (SMTP) is configured
Redis cache server is available
PostgreSQL database is accessible
