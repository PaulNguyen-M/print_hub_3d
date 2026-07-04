# 07 — Trang quản trị (Admin)

> Admin là "người điều hành chợ". Toàn bộ khu vực admin nằm dưới `/api/v1/admin/**` và **chỉ ADMIN** vào được
> (chặn ở cả [WebSecurityConfig](../backend/src/main/java/com/printhub3/backend/config/WebSecurityConfig.java) lẫn `@PreAuthorize("hasRole('ADMIN')")` trên [AdminController](../backend/src/main/java/com/printhub3/backend/controller/AdminController.java)).

---

## 1. Admin làm được gì?

| Nhóm | Chức năng | Endpoint |
|------|-----------|----------|
| Tổng quan | Xem số liệu tổng (người dùng, đơn, doanh thu...) | `GET /admin/dashboard` |
| Doanh thu | Biểu đồ doanh thu theo tháng | `GET /admin/revenue` |
| Sản phẩm | Duyệt / từ chối / ẩn-hiện sản phẩm | `GET /admin/products`, `POST .../approve`, `POST .../reject`, `PUT .../status` |
| Đơn hàng | Xem đơn, **xác nhận** & **hoàn tất** (trả tiền) | `GET /admin/orders`, `POST .../confirm`, `POST .../complete` |
| Người dùng | Xem, khoá/mở, đổi vai trò | `GET /admin/users`, `PUT .../status`, `PUT .../role` |
| Mở sạp | Duyệt / từ chối đơn mở sạp | `GET /admin/seller-applications`, `POST .../approve|reject` |
| In 3D | Xem & đổi trạng thái yêu cầu in | `GET /admin/printing-requests`, `PUT .../status` |

Giao diện admin là một **khu riêng** ([AdminLayout.tsx](../frontend/src/features/admin/AdminLayout.tsx)) — không có navbar/footer công khai, có menu bên trái. Route `/admin/*` được bọc bởi [AdminRoute](../frontend/src/layouts/ProtectedRoute) (chặn người không phải admin ngay ở frontend).

---

## 2. Chức năng quan trọng nhất: DUYỆT SẢN PHẨM

Nhớ ở file [06](06-quan-ly-ban-hang.md): sản phẩm mới tạo có `status = PENDING`, `isActive = false` → **chưa lên chợ**.
Admin là người "gác cổng chất lượng".

### Duyệt ([AdminService.approveProduct] → gọi từ AdminController)

```java
@PostMapping("/products/{productId}/approve")
public ... approveProduct(@PathVariable Long productId) {
    AdminProductDto dto = adminService.approveProduct(productId);   // set status=APPROVED, isActive=true
    return ok(...);
}
```

### Từ chối ([AdminService.rejectProduct](../backend/src/main/java/com/printhub3/backend/service/AdminService.java))

```java
public AdminProductDto rejectProduct(Long productId, String reason) {
    Product product = productRepository.findById(productId)...;
    product.setStatus(Product.ProductStatus.REJECTED);
    product.setIsActive(false);                 // vẫn ẩn khỏi chợ
    product.setRejectionReason(reason);         // lưu lý do để người bán biết
    return mapToAdminProductDto(productRepository.save(product));
}
```

- **Duyệt** → `isActive = true` → sản phẩm **xuất hiện ngoài chợ ngay** (vì chợ lọc `isActive = true`).
- **Từ chối** → giữ ẩn + ghi `rejectionReason` để người bán xem và sửa.

> **Chuỗi liên kết cả hệ thống:** người bán đăng (PENDING) → admin duyệt (isActive=true) → chợ hiển thị.
> Đây là lý do tại sao mọi truy vấn chợ đều lọc `isActive = true` — để hàng chưa duyệt không "lọt" ra ngoài.

---

## 3. Quản lý người dùng: khoá tài khoản & đổi vai trò

```java
public void setUserActive(Long userId, boolean active) {   // khoá / mở tài khoản
    User user = userRepository.findById(userId)...;
    user.setIsActive(active);
    userRepository.save(user);
}

public void updateUserRole(Long userId, String roleName) { // BUYER ↔ SELLER ↔ ADMIN
    Role role = roleRepository.findByName(roleName)...;
    user.setRole(role);
    userRepository.save(user);
}
```

- Admin có thể **nâng/hạ vai trò** trực tiếp (ngoài luồng duyệt đơn mở sạp), hoặc **khoá** tài khoản vi phạm.

---

## 4. Doanh thu ([AdminService.getRevenueStats](../backend/src/main/java/com/printhub3/backend/service/AdminService.java))

```java
LocalDateTime yearStart = today.withDayOfYear(1)...;                  // từ đầu năm
List<Payment> payments = paymentRepository.findPaymentsByDateRange(yearStart, today);
// ... gom nhóm theo tháng → tính tổng → trả về cho biểu đồ
```

- Đọc các bản ghi **Payment** (thanh toán) trong năm, gom theo tháng → frontend vẽ biểu đồ ([AdminRevenueChart.tsx](../frontend/src/features/admin/AdminRevenueChart.tsx)).

---

## 5. Xác nhận & hoàn tất đơn (thuộc luồng file 06)

2 nút quan trọng trên [AdminOrdersPage](../frontend/src/features/admin/AdminOrdersPage.tsx):

```java
@PostMapping("/orders/{orderId}/confirm")   // → OrderWorkflowService.adminConfirmOrder
@PostMapping("/orders/{orderId}/complete")  // → OrderWorkflowService.adminCompleteOrder (trả tiền)
```

Chi tiết logic đã giải thích ở [06-quan-ly-ban-hang.md](06-quan-ly-ban-hang.md) mục 4.

---

## 6. Các file tham gia

| Lớp | File |
|-----|------|
| FE | [AdminLayout](../frontend/src/features/admin/AdminLayout.tsx), [AdminDashboardPage](../frontend/src/features/admin/AdminDashboardPage.tsx), [AdminProductsPage](../frontend/src/features/admin/AdminProductsPage.tsx), [AdminOrdersPage](../frontend/src/features/admin/AdminOrdersPage.tsx), [AdminUsersPage](../frontend/src/features/admin/AdminUsersPage.tsx), [AdminSellerApplicationsPage](../frontend/src/features/admin/AdminSellerApplicationsPage.tsx), [AdminStlRequestsPage](../frontend/src/features/admin/AdminStlRequestsPage.tsx) |
| BE controller | [AdminController](../backend/src/main/java/com/printhub3/backend/controller/AdminController.java) |
| BE service | [AdminService](../backend/src/main/java/com/printhub3/backend/service/AdminService.java), [SellerService](../backend/src/main/java/com/printhub3/backend/service/SellerService.java), [OrderWorkflowService](../backend/src/main/java/com/printhub3/backend/service/OrderWorkflowService.java) |

---

## 7. Ví dụ chạy thật

1. Người bán đăng sản phẩm "Mô hình xe" → nằm chờ ở `PENDING`.
2. Admin vào `/admin/products`, lọc trạng thái PENDING, xem sản phẩm.
3. Bấm **Duyệt** → `POST /admin/products/5/approve` → `isActive=true`.
4. Ngay lập tức sản phẩm xuất hiện ngoài chợ cho mọi người mua.
5. Nếu sản phẩm vi phạm → bấm **Từ chối** kèm lý do → người bán thấy lý do và sửa.

👉 Tiếp theo: [08-thong-bao-va-chat.md](08-thong-bao-va-chat.md).
