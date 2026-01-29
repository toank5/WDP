# Phân tích đề & Danh sách trang còn thiếu

Đối chiếu yêu cầu theo vai trò (Customer, Sales/Support, Operations, Manager, System Admin) với codebase FE hiện tại và backend (schemas/controllers).

---

## 1. Trạng thái hiện có

### 1.1 Trang đã có

| Trang | Route | Vai trò | Ghi chú |
|-------|--------|---------|--------|
| HomePage | `/` | Public | Landing, hero, catalog (static), prescription (static), process, support |
| LoginPage | `/login` | Public | |
| RegisterPage | `/register` | Public | |
| AdminDashboardLayout | `/dashboard` | Staff/Admin | Layout chung cho khu quản trị |
| DashboardOverview | `/dashboard` | Staff/Admin | Overview cards, chưa có doanh thu / đơn hàng thật |
| UserManagementPage | `/dashboard/users` | Admin | CRUD user ✅ |
| PolicyManagementPage | `/dashboard/policies` | Manager | CRUD policy (Return, Warranty, Promotion) ✅ |
| ProductManagementPage | `/dashboard/products` | Manager | CRUD product + variants ✅ |

### 1.2 Route có nhưng chưa có page

- `/dashboard/settings` — Menu "Settings" trỏ tới đây nhưng **chưa có trang** → 404 khi vào.

### 1.3 Backend hỗ trợ

- **API có:** Auth, User, Policy, Product.
- **Schema có (chưa có controller/API):** Order, Cart, OrderItem, OrderPrescription, OrderTracking, OrderPayment, OrderHistory, Inventory, Address.  
→ Các trang Order/Cart/Checkout/Inventory cần **đồng bộ với backend** khi API order/cart/inventory được làm.

---

## 2. Danh sách trang còn thiếu theo vai trò

### 2.1 Customer

| # | Trang | Mô tả ngắn | Ghi chú |
|---|-------|------------|--------|
| 1 | **Product Catalog / Shop** | Duyệt danh mục, lọc, tìm kiếm sản phẩm kính, lens, dịch vụ | Hiện HomePage chỉ có section catalog tĩnh, chưa list sản phẩm thật, filter, search. |
| 2 | **Product Detail** | Xem chi tiết: kiểu gọng, size, màu, giá, hình 2D/3D | Chưa có. Cần gallery 2D/3D, chọn variant, add to cart. |
| 3 | **Cart** | Quản lý giỏ hàng | Chưa có. Cần API cart (backend đã có schema). |
| 4 | **Checkout** | Checkout & thanh toán | Chưa có. Gắn với Cart, địa chỉ, payment. |
| 5 | **Prescription Order Flow** | Đặt mua kính + làm tròng theo đơn kính: upload Rx, chọn lens, PD, coatings… | Có thể là luồng con trong Checkout hoặc trang riêng. Backend có `order-prescription` schema. |
| 6 | **Order Type Selection** | Chọn loại đơn: Có sẵn / Pre-order / Prescription | Có thể là bước đầu Checkout hoặc trang trung gian trước khi vào catalog/checkout. |
| 7 | **Account / Profile** | Quản lý tài khoản (thông tin, địa chỉ, đổi mật khẩu…) | Chưa có. Customer cần dashboard/màn “Tài khoản” riêng. |
| 8 | **Order History** | Lịch sử đơn hàng, theo dõi trạng thái | Chưa có. Backend có `order-history`, `order-tracking` schema. |
| 9 | **Return / Exchange Requests** | Tạo và theo dõi yêu cầu đổi, trả | Chưa có. Liên quan Policy (đổi trả), backend sẽ cần API khiếu nại/return. |

**Tóm tắt Customer:** 9 trang/luồng còn thiếu (Catalog, Detail, Cart, Checkout, Prescription flow, Order type, Account, Order history, Đổi/trả).

---

### 2.2 Sales / Support Staff

| # | Trang | Mô tả ngắn | Ghi chú |
|---|-------|------------|--------|
| 10 | **Order Management (Sales)** | Tiếp nhận, xử lý đơn; kiểm tra prescription; xác nhận, chuyển Operations; xử lý pre-order | Chưa có. Khác với “Order history” của Customer — đây là workspace xử lý đơn cho staff. |
| 11 | **Order Detail (Staff)** | Chi tiết đơn để kiểm tra Rx, liên hệ hỗ trợ, cập nhật trạng thái, ghi chú | Thường là modal hoặc trang con của Order Management. |
| 12 | **Complaints / Returns & Refunds** | Xử lý khiếu nại: đổi trả, bảo hành, hoàn tiền | Chưa có. Có thể tách trang riêng hoặc tab trong Order Management. |

**Tóm tắt Sales/Support:** 3 nhóm trang (Order Management, Order Detail, Khiếu nại/đổi trả/hoàn tiền).

---

### 2.3 Operations Staff

| # | Trang | Mô tả ngắn | Ghi chú |
|---|-------|------------|--------|
| 13 | **Order Fulfillment (Operations)** | Đóng gói, tạo vận đơn, cập nhật tracking; pre-order: nhận hàng, cập nhật kho, đóng gói, vận chuyển; prescription: gia công, lắp tròng; cập nhật trạng thái | Chưa có. Có thể dùng chung “Order Management” với Sales nhưng view/hành động khác (role-based). |
| 14 | **Inventory / Stock** | Nhận hàng pre-order, cập nhật tồn kho | Có thể là trang riêng hoặc màn hình trong Order Fulfillment. Backend có `inventory` schema. |

**Tóm tắt Operations:** 2 nhóm (Order Fulfillment, Inventory) — có thể gộp một phần vào Order Management với phân quyền.

---

### 2.4 Manager

| # | Trang | Mô tả ngắn | Ghi chú |
|---|-------|------------|--------|
| 15 | **Pricing / Combo / Promotion** | Quản lý giá bán gọng/tròng/dịch vụ, combo (gọng+tròng), khuyến mãi | Sản phẩm có `basePrice`; chưa có trang quản lý giá, combo, promotion riêng. |
| 16 | **Revenue / Analytics** | Quản lý doanh thu, báo cáo | DashboardOverview chỉ có cards tĩnh; chưa có trang doanh thu, chart, báo cáo. |

**Tóm tắt Manager:** 2 trang (Pricing/Combo/Promotion, Revenue/Analytics). Policy đã có; Product đã có.

---

### 2.5 System Admin

| # | Trang | Mô tả ngắn | Ghi chú |
|---|-------|------------|--------|
| 17 | **System Settings / Admin Config** | Cấu hình và quản trị chức năng hệ thống | Route `/dashboard/settings` có trong menu nhưng **chưa có page**. |

**Tóm tắt Admin:** 1 trang (System Settings).

---

### 2.6 Nâng cao (tuỳ chọn)

| # | Trang / Tính năng | Mô tả ngắn | Ghi chú |
|---|-------------------|------------|--------|
| 18 | **Virtual Try-On** | Thử kính ảo; gợi ý mẫu/size phù hợp khuôn mặt | Có thể là trang riêng hoặc tích hợp vào Product Detail. |

---

## 3. Tổng hợp trang còn thiếu

| Nhóm | Số trang | Danh sách |
|------|----------|-----------|
| **Customer** | 9 | Catalog, Product Detail, Cart, Checkout, Prescription flow, Order type, Account, Order history, Đổi/trả |
| **Sales/Support** | 3 | Order Management, Order Detail (staff), Complaints/Returns & Refunds |
| **Operations** | 2 | Order Fulfillment, Inventory (có thể gộp với Order Management) |
| **Manager** | 2 | Pricing/Combo/Promotion, Revenue/Analytics |
| **System Admin** | 1 | System Settings |
| **Nâng cao** | 1 | Virtual Try-On |
| **Tổng** | **18** | (một số có thể gộp thành ít trang hơn) |

---

## 4. Gợi ý thứ tự triển khai

### Phase 1 — Customer core (mua sắm cơ bản)

1. **Product Catalog** — list, filter, search (dùng Product API có sẵn).  
2. **Product Detail** — chi tiết, variant, hình 2D (3D sau).  
3. **Cart** — cần Cart API từ backend.  
4. **Checkout** — địa chỉ, thanh toán (cần Order API).

### Phase 2 — Customer account & đơn hàng

5. **Account / Profile** — thông tin, địa chỉ (User API có thể mở rộng).  
6. **Order History** — cần Order API.  
7. **Order Type Selection** + **Prescription flow** — khi backend hỗ trợ order types và prescription.  
8. **Return / Exchange Requests** — khi có API khiếu nại/đổi trả.

### Phase 3 — Staff (Sales, Support, Operations)

9. **Order Management** — list đơn, filter theo trạng thái/loại, role-based view.  
10. **Order Detail (staff)** — xem/kiểm tra Rx, cập nhật trạng thái, chuyển Ops.  
11. **Complaints / Returns & Refunds** — xử lý đổi trả, bảo hành, hoàn tiền.  
12. **Order Fulfillment** (Ops) — đóng gói, vận đơn, tracking, pre-order, prescription.  
13. **Inventory** — khi có Inventory API.

### Phase 4 — Manager & Admin

14. **Pricing / Combo / Promotion** — giá, combo, khuyến mãi.  
15. **Revenue / Analytics** — doanh thu, báo cáo.  
16. **System Settings** — cấu hình hệ thống (dùng sẵn route `/dashboard/settings`).

### Phase 5 — Nâng cao

17. **Virtual Try-On** — khi đã chốt công nghệ (WebGL/Camera, v.v.).

---

## 5. Mapping route gợi ý (để tham khảo)

| Trang | Route gợi ý | Protected | Role |
|-------|----------------|-----------|------|
| Product Catalog | `/shop` hoặc `/catalog` | No | — |
| Product Detail | `/shop/:productId` hoặc `/products/:id` | No | — |
| Cart | `/cart` | Optional (guest cart) | — |
| Checkout | `/checkout` | Yes | Customer |
| Prescription flow | `/checkout/prescription` hoặc `/prescription` | Yes | Customer |
| Account | `/account` hoặc `/dashboard/account` | Yes | Customer |
| Order History | `/account/orders` hoặc `/orders` | Yes | Customer |
| Return/Exchange | `/account/returns` hoặc `/returns` | Yes | Customer |
| Order Management (Staff) | `/dashboard/orders` | Yes | Sale, Operation, Manager, Admin |
| Complaints / R&R | `/dashboard/complaints` hoặc `/dashboard/returns` | Yes | Sale, Manager, Admin |
| Inventory | `/dashboard/inventory` | Yes | Operation, Manager, Admin |
| Pricing / Promo | `/dashboard/pricing` hoặc `/dashboard/promotions` | Yes | Manager, Admin |
| Revenue / Analytics | `/dashboard/analytics` hoặc `/dashboard/revenue` | Yes | Manager, Admin |
| System Settings | `/dashboard/settings` | Yes | Admin |
| Virtual Try-On | `/try-on` hoặc trong Product Detail | No | — |

---

*Tài liệu này bám sát yêu cầu nghiệp vụ theo role và cấu trúc FE/BE hiện tại. Cập nhật khi thêm/xoá trang hoặc API.*
