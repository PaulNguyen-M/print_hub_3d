# Print Hub 3D — Nền tảng Mua bán & In 3D

> Đồ án/Luận văn tốt nghiệp — Marketplace mô hình 3D kết hợp dịch vụ in 3D theo yêu cầu.
> Lấy cảm hứng từ Sketchfab (3D viewer), CGTrader (marketplace) và Shapeways (in 3D).

---

## 1. Giới thiệu

**Print Hub 3D** là nền tảng thương mại điện tử cho phép:

- 🛒 **Mua bán mô hình 3D / sản phẩm in 3D** — marketplace với tìm kiếm, lọc, giỏ hàng, thanh toán
- 🖨️ **Dịch vụ in 3D theo yêu cầu** — upload STL → cấu hình vật liệu/màu/độ đặc → báo giá tức thì → **xem mô hình 3D xoay 360°** (dạng phôi) → đặt in
- 👁️ **Xem mô hình STL 360°** ngay trên web (Three.js, không cần plugin)
- 👤 **Phân quyền** ADMIN / SELLER / BUYER / PRINTER_PARTNER
- 🎨 **Creator Dashboard** — người bán upload sản phẩm (nhiều ảnh + file STL), quản lý, xem doanh thu
- 🌐 **Song ngữ** Việt – Anh (toggle ngay trên thanh điều hướng)
- 🌗 **Dark / Light mode**

---

## 2. Công nghệ

### Frontend
| Công nghệ | Vai trò |
|-----------|---------|
| React 19 + TypeScript + Vite | Nền tảng SPA |
| Tailwind CSS 3 | Styling, design system |
| Three.js + React Three Fiber + Drei | Viewer STL 3D, hero 3D |
| Framer Motion + GSAP | Animation, scroll effects |
| Zustand | State management (auth, cart, theme, language) |
| TanStack Query | Data fetching / cache |
| React Router DOM 6 | Routing |
| React Hook Form + Zod | Form & validation |
| Axios | HTTP client |

### Backend
| Công nghệ | Vai trò |
|-----------|---------|
| Spring Boot 3.5 (Java 21) | REST API |
| PostgreSQL + JPA/Hibernate | Cơ sở dữ liệu |
| Spring Security + JWT | Xác thực, phân quyền (access + refresh token) |
| Stripe SDK | Thanh toán quốc tế (sandbox) |
| AWS S3 SDK (fallback local) | Lưu file STL/ảnh — tự lưu local nếu chưa cấu hình S3 |

---

## 3. Cấu trúc thư mục

```
print_hub_3d/
├── backend/                      # Spring Boot API
│   └── src/main/java/com/printhub3/backend/
│       ├── config/               # Security, CORS, WebMvc (serve /uploads), DataInitializer
│       ├── controller/           # Auth, Product, Cart, Order, Payment, Admin,
│       │                         #   StlUpload, ImageUpload, FileUpload, User, Chat
│       ├── service/              # Business logic
│       ├── entity/               # JPA entities (User, Product, Order, Cart, ...)
│       ├── repository/           # Spring Data repositories
│       ├── dto/                  # request / response DTOs
│       ├── security/jwt/         # JWT provider, filter, entry point
│       └── exception/            # Custom exceptions + GlobalExceptionHandler
│   └── uploads/                  # File STL & ảnh upload (tạo tự động khi chạy)
│
├── frontend/                     # React + Vite
│   └── src/
│       ├── api/axios.ts          # Axios instance + interceptor (401 → logout)
│       ├── components/           # layout (Navbar/Footer), cart, checkout, orders, ui
│       ├── features/
│       │   ├── admin/            # Admin dashboard + quản lý
│       │   ├── creator/          # Creator (seller) dashboard
│       │   ├── products/         # Marketplace + Product detail
│       │   └── stl-viewer/       # STL 3D viewer (HeroScene, StlFileViewer, demo)
│       ├── pages/                # HomePage, Account, PrintingService, Login, Register...
│       ├── store/                # Zustand (auth, cart, theme, language)
│       ├── i18n/                 # Hệ thống đa ngôn ngữ VI/EN
│       ├── lib/queryClient.ts    # QueryClient dùng chung
│       ├── layouts/              # MainLayout, AuthLayout, ProtectedRoute, AdminRoute
│       └── routes/AppRoutes.tsx  # Định nghĩa route
│
├── database/                     # Schema SQL + tài liệu ERD
│   ├── printhub3d_schema.sql
│   ├── ERD_DOCUMENTATION.md
│   └── dbdiagram_io_code.txt
└── README.md
```

---

## 4. Yêu cầu môi trường

- **Java 21**, **Maven 3.9+**
- **Node.js 18+**, **npm**
- **PostgreSQL 14+** (mặc định cổng `5433`, DB `print3d_db`, user `postgres`)

---

## 5. Cách chạy

### Bước 1 — Tạo database
```sql
CREATE DATABASE print3d_db;
```
Cấu hình kết nối trong `backend/src/main/resources/application.properties`
(mặc định: `localhost:5433`, user `postgres`, password `290104` — đổi theo máy bạn).

### Bước 2 — Chạy Backend (terminal 1)
```bash
cd backend
mvn spring-boot:run
```
→ API tại **http://localhost:8080/api/v1**
Lần đầu chạy, `DataInitializer` tự seed 4 roles + 4 tài khoản mẫu.

### Bước 3 — Chạy Frontend (terminal 2)
```bash
cd frontend
npm install
npm run dev
```
→ Web tại **http://localhost:5173**

---

## 6. Tài khoản mẫu (seed tự động)

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Admin | `admin@printhub3d.com` | `admin123` |
| Seller | `seller@printhub3d.com` | `seller123` |
| Buyer | `buyer@printhub3d.com` | `buyer123` |
| Printer Partner | `printer@printhub3d.com` | `print123` |

---

## 7. Tính năng theo vai trò

### Guest / Buyer
- Duyệt & tìm kiếm marketplace (lọc danh mục, vật liệu, giá, sort)
- Xem chi tiết sản phẩm: gallery nhiều ảnh, thông số, **tải file STL**
- Giỏ hàng, thanh toán (VNPay / MoMo / Stripe / chuyển khoản — UI), theo dõi đơn hàng
- Trang tài khoản: hồ sơ, **đổi ảnh đại diện (upload từ máy)**, lịch sử đơn

### Seller (Creator Dashboard)
- Tổng quan doanh thu (biểu đồ), thống kê
- **Đăng sản phẩm**: upload **nhiều ảnh** + **file STL** từ máy
- Quản lý sản phẩm: **xem / sửa / xóa** (kiểm tra quyền sở hữu)

### Dịch vụ in 3D (mọi user đăng nhập)
- Upload STL → cấu hình (vật liệu, màu, infill, layer height, số lượng)
- Báo giá tức thì → **xem mô hình 3D xoay 360° (dạng phôi)** → gửi yêu cầu in

### Admin
- Dashboard phân tích (users, products, orders, doanh thu)
- Quản lý: Users (**phân quyền**), Products, Orders, STL Requests

---

## 8. API chính

Base URL: `http://localhost:8080/api/v1`

| Nhóm | Endpoint tiêu biểu |
|------|--------------------|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh-token` |
| Products | `GET /products`, `GET /products/{id}`, `GET /products/my`, `POST /products`, `PUT /products/{id}`, `DELETE /products/{id}` |
| Cart | `GET /cart`, `POST /cart/add`, `PUT /cart/item/{id}/quantity`, `DELETE /cart/item/{id}` |
| Orders | `POST /orders`, `GET /orders`, `GET /orders/{id}` |
| Upload | `POST /stl/upload`, `POST /images/upload`, `POST /files/upload` |
| User | `GET /users/me`, `PUT /users/profile`, `GET /users/creator/stats` |
| Admin | `GET /admin/dashboard`, `GET /admin/users`, `PUT /admin/users/{id}/role`, ... |
| Static | `GET /uploads/**` (ảnh & file đã upload) |

Swagger UI: `http://localhost:8080/swagger-ui.html`

---

## 9. Ghi chú triển khai (deploy)

- **Lưu file**: khi chưa cấu hình AWS S3, hệ thống tự lưu vào `backend/uploads/` và phục vụ qua `/uploads/**`. Khi deploy production nên cấu hình S3 hoặc volume bền vững cho thư mục này.
- **Auth bền vững**: token + thông tin user lưu localStorage; khi đổi tài khoản hoặc token hết hạn (401), toàn bộ cache & session được dọn sạch → tránh lẫn dữ liệu giữa các tài khoản.
- **Biến môi trường frontend**: đặt `VITE_API_BASE_URL` khi deploy (mặc định trỏ `localhost:8080/api/v1`).
- **Database**: production nên đổi `ddl-auto` về `validate` và quản lý schema bằng migration.

---

## 10. Điểm nhấn kỹ thuật (cho báo cáo)

1. **STL Viewer 360°** — tự viết parser STL (binary + ASCII), render bằng Three.js/R3F, xem ngay file vừa upload mà không cần lên server
2. **Tính giá in 3D tức thì** — ước tính khối lượng từ file → chi phí vật liệu + phí dịch vụ
3. **RBAC** — phân quyền 4 vai trò với Spring Security + JWT (access 24h + refresh 7 ngày)
4. **i18n** — hệ thống đa ngôn ngữ tự xây (~390 cụm dịch) toàn bộ giao diện
5. **Clean architecture** — tách Controller / Service / Repository / DTO rõ ràng, exception handler tập trung
6. **Upload đa dạng** — ảnh, file 3D, avatar; fallback lưu local khi thiếu S3

---

*Print Hub 3D © 2026 — Luận văn tốt nghiệp.*
