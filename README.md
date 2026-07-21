# Print Hub 3D — Nền tảng Mua bán & In 3D

> Đồ án/Luận văn tốt nghiệp — Marketplace mô hình 3D đa người bán (multi-seller), kết hợp dịch vụ in 3D theo yêu cầu.
> Lấy cảm hứng từ Sketchfab (3D viewer), Shopee/Etsy (marketplace đa gian hàng) và Shapeways (in 3D).

---

## 1. Giới thiệu

**Print Hub 3D** là nền tảng thương mại điện tử cho phép:

- 🛒 **Mua bán mô hình 3D / sản phẩm in 3D** — marketplace đa người bán, mỗi seller có **sạp (shop) riêng**, khách xem/tìm/lọc/mua qua giỏ hàng, thanh toán
- 🏪 **Chợ / Sạp người bán** — trang sạp công khai (ngày tham gia, đánh giá, số sản phẩm), đơn hàng nhiều sạp được tách xử lý **độc lập theo từng sạp**
- 🖨️ **Dịch vụ in 3D theo yêu cầu** — upload STL → cấu hình vật liệu/màu/độ đặc (infill) → **tính khối lượng thật từ mesh 3D** (không còn ước lượng theo dung lượng file) → báo giá tức thì → xem mô hình 3D xoay 360° → gửi yêu cầu in
- 👁️ **Xem mô hình STL 360°** ngay trên web (Three.js, không cần plugin)
- 💬 **Chat realtime** giữa buyer và seller (WebSocket/STOMP)
- ❤️ **Wishlist** (yêu thích sản phẩm)
- ⭐ **Đánh giá sản phẩm** có gắn nhãn "đã mua hàng" (verified purchase)
- 👤 **Phân quyền** ADMIN / SELLER / BUYER / PRINTER_PARTNER
- 🎨 **Creator Dashboard** — người bán upload sản phẩm (nhiều ảnh + STL), quản lý sản phẩm, tự vận hành tiến trình xử lý đơn của sạp mình, xem doanh thu
- 🧑‍💼 **Admin Panel** — duyệt sản phẩm, xác nhận thanh toán đơn, duyệt hoàn tất & giải ngân cho từng sạp, quản lý user/đơn/yêu cầu in
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
| Zustand | State management (auth, cart, wishlist, chat, theme, language) |
| TanStack Query | Data fetching / cache |
| React Router DOM 6 | Routing |
| React Hook Form + Zod | Form & validation |
| @stomp/stompjs + sockjs-client | Chat realtime qua WebSocket (STOMP over SockJS) |
| Axios | HTTP client |

### Backend
| Công nghệ | Vai trò |
|-----------|---------|
| Spring Boot 3.5 (Java 21) | REST API |
| PostgreSQL + JPA/Hibernate | Cơ sở dữ liệu |
| Spring Security + JWT (jjwt) | Xác thực, phân quyền (access + refresh token) |
| Spring WebSocket (STOMP) | Chat realtime |
| MapStruct + Lombok | DTO mapping, giảm boilerplate |
| AWS S3 SDK (fallback local) | Lưu file STL/ảnh — tự lưu local nếu chưa cấu hình S3 |
| springdoc-openapi | Swagger UI |
| Stripe SDK | *Có tích hợp sẵn nhưng chưa dùng trong luồng thanh toán thật — xem mục 10 "Giới hạn đã biết"* |

---

## 3. Cấu trúc thư mục

```
print_hub_3d/
├── backend/                      # Spring Boot API
│   └── src/main/java/com/printhub3/backend/
│       ├── config/               # Security, CORS, WebSocket (STOMP), WebMvc (serve /uploads), DataInitializer
│       ├── controller/           # Auth, Product, Category, Cart, Order, Payment, Admin, Shop, Seller,
│       │                         #   Chat (WS + REST), Wishlist, Review, Notification, PrintingRequest,
│       │                         #   StlUpload, ImageUpload, FileUpload, User
│       ├── service/               # Business logic (OrderWorkflowService xử lý tiến trình theo sạp, ...)
│       ├── entity/               # JPA entities (User, Product, Shop, Order, OrderItem, Review, ...)
│       ├── repository/           # Spring Data repositories
│       ├── dto/                  # request / response DTOs
│       ├── security/jwt/         # JWT provider, filter, entry point
│       └── exception/            # Custom exceptions + GlobalExceptionHandler
│   └── uploads/                  # File STL & ảnh upload (tạo tự động khi chạy)
│
├── frontend/                     # React + Vite
│   └── src/
│       ├── api/axios.ts          # Axios instance + interceptor (401 → logout)
│       ├── components/           # layout (Navbar/Footer), cart, checkout, orders, chat, ui
│       ├── features/
│       │   ├── admin/            # Admin dashboard + quản lý (users, products, orders, duyệt sạp)
│       │   ├── creator/          # Creator (seller) dashboard — sản phẩm + tiến trình đơn của sạp
│       │   ├── seller/           # Trang đăng ký mở sạp
│       │   ├── shop/             # Trang sạp công khai (buyer xem)
│       │   ├── products/         # Marketplace + Product detail + reviews
│       │   └── stl-viewer/       # STL 3D viewer (parser, HeroScene, StlFileViewer, tính khối lượng mesh)
│       ├── pages/                # HomePage, Account, PrintingService, Login, Register...
│       ├── store/                # Zustand (auth, cart, wishlist, chat, theme, language)
│       ├── hooks/                # useChat, useToast, ...
│       ├── i18n/                 # Hệ thống đa ngôn ngữ VI/EN
│       ├── lib/queryClient.ts    # QueryClient dùng chung
│       ├── layouts/              # MainLayout, AuthLayout, ProtectedRoute, AdminRoute
│       └── routes/AppRoutes.tsx  # Định nghĩa route
│
├── database/                     # Schema SQL + tài liệu ERD
│   ├── printhub3d_schema.sql
│   ├── ERD_DOCUMENTATION.md
│   └── dbdiagram_io_code.txt
├── docs/                         # Tài liệu báo cáo luận văn
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

### Bước 2 — Cấu hình bí mật local (không commit)
Tạo file `backend/src/main/resources/application-local.properties` (đã nằm trong `.gitignore`) với giá trị thật của máy bạn:
```properties
spring.datasource.password=<mật khẩu Postgres thật>
jwt.secret=<chuỗi bí mật JWT thật, >= 32 ký tự>
```
`application.properties` chỉ chứa giá trị **mặc định giả** (`changeme`) và tự nạp thêm file trên nếu tồn tại — xem thêm `backend/.env.example` nếu muốn cấu hình qua biến môi trường thay vì file local.

### Bước 3 — Chạy Backend (terminal 1)
```bash
cd backend
mvn spring-boot:run
```
→ API tại **http://localhost:8080/api/v1**
Lần đầu chạy, `DataInitializer` tự seed 4 roles + 4 tài khoản mẫu.

### Bước 4 — Chạy Frontend (terminal 2)
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

> ⚠️ Mật khẩu hiện lưu **dạng plaintext** (không hash) — quyết định có chủ đích cho phạm vi luận văn, xem mục 10.

---

## 7. Tính năng theo vai trò

### Guest / Buyer
- Duyệt & tìm kiếm marketplace (lọc danh mục, vật liệu, giá, sort)
- Xem trang **sạp** của từng người bán (ngày tham gia, đánh giá trung bình, danh sách sản phẩm)
- Xem chi tiết sản phẩm: gallery nhiều ảnh, thông số, **tải file STL**, đánh giá có nhãn "đã mua hàng"
- **Wishlist** (lưu sản phẩm yêu thích), **chat trực tiếp** với người bán
- Giỏ hàng (gộp sản phẩm từ nhiều sạp), thanh toán, theo dõi **tiến trình đơn theo từng sạp** riêng biệt
- Trang tài khoản: hồ sơ, đổi ảnh đại diện, lịch sử đơn, **lịch sử yêu cầu in 3D**

### Seller (Creator Dashboard)
- Đăng ký mở sạp, tổng quan doanh thu (biểu đồ), thống kê
- **Đăng sản phẩm**: upload nhiều ảnh + file STL, chọn danh mục & **vật liệu** (PLA/PETG/ABS/TPU/Resin)
- Quản lý sản phẩm: xem / sửa / xóa (kiểm tra quyền sở hữu)
- **Tự vận hành tiến trình đơn hàng của sạp mình** (đang in → hoàn thiện → giao hàng), báo hoàn tất để admin duyệt & giải ngân

### Dịch vụ in 3D (mọi user đăng nhập)
- Upload STL → cấu hình (vật liệu, màu, infill, layer height, số lượng)
- **Tính khối lượng thật** bằng cách phân tích mesh STL (định lý divergence) thay vì ước lượng theo dung lượng file → báo giá chính xác hơn
- Xem mô hình 3D xoay 360° (dạng phôi) → gửi yêu cầu in → theo dõi trạng thái trong lịch sử tài khoản

### Admin
- Dashboard phân tích (users, products, orders, doanh thu)
- Duyệt sản phẩm, **xác nhận thanh toán đơn** (bước còn lại của tiến trình do từng seller tự xử lý)
- **Duyệt hoàn tất & giải ngân theo từng sạp** trong đơn hàng nhiều người bán
- Quản lý: Users (phân quyền), Products, Orders, STL Requests

---

## 8. API chính

Base URL: `http://localhost:8080/api/v1`

| Nhóm | Endpoint tiêu biểu |
|------|--------------------|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh-token` |
| Products | `GET /products`, `GET /products/{id}`, `GET /products/my`, `POST /products`, `PUT /products/{id}`, `DELETE /products/{id}` |
| Categories | `GET /categories` |
| Shops | `GET /shops/{slug}`, `GET /shops/{id}/products` |
| Seller | `POST /seller/apply`, `POST /seller/orders/{id}/advance`, `POST /seller/orders/{id}/request-completion` |
| Cart | `GET /cart`, `POST /cart/add`, `PUT /cart/item/{id}/quantity`, `DELETE /cart/item/{id}` |
| Orders | `POST /orders`, `GET /orders`, `GET /orders/{id}` |
| Reviews | `GET /products/{id}/reviews`, `POST /products/{id}/reviews` |
| Wishlist | `GET /wishlist`, `POST /wishlist/{productId}`, `DELETE /wishlist/{productId}` |
| Chat | WebSocket `/ws` (STOMP), REST `GET /chat/conversations`, `GET /chat/history/{peerId}` |
| Printing Requests | `POST /printing-requests`, `GET /printing-requests/my` |
| Upload | `POST /stl/upload`, `POST /images/upload`, `POST /files/upload` |
| User | `GET /users/me`, `PUT /users/profile`, `GET /users/creator/stats` |
| Admin | `GET /admin/dashboard`, `GET /admin/users`, `PUT /admin/users/{id}/role`, `POST /admin/orders/{id}/shops/{shopId}/approve`, ... |
| Static | `GET /uploads/**` (ảnh & file đã upload) |

Swagger UI: `http://localhost:8080/swagger-ui.html`

---

## 9. Ghi chú triển khai (deploy)

- **Lưu file**: khi chưa cấu hình AWS S3, hệ thống tự lưu vào `backend/uploads/` và phục vụ qua `/uploads/**`. Khi deploy production nên cấu hình S3 hoặc volume bền vững cho thư mục này.
- **Auth bền vững**: token + thông tin user lưu localStorage; khi đổi tài khoản hoặc token hết hạn (401), toàn bộ cache & session được dọn sạch → tránh lẫn dữ liệu giữa các tài khoản.
- **Biến môi trường frontend**: đặt `VITE_API_BASE_URL` khi deploy (mặc định trỏ `localhost:8080/api/v1`).
- **Biến môi trường backend**: production nên set `DB_PASSWORD`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS` qua biến môi trường thật thay vì file local (xem `backend/.env.example`).
- **Database**: production nên đổi `ddl-auto` về `validate` và quản lý schema bằng migration.

---

## 10. Giới hạn đã biết (định hướng phát triển tiếp)

Các điểm sau là quyết định/đánh đổi có chủ đích trong phạm vi luận văn, chưa sẵn sàng cho môi trường thật:

1. **Mật khẩu lưu plaintext** — tắt hash (`NoOpPasswordEncoder`) để đơn giản hoá khi báo cáo/demo. Cần bật lại `BCryptPasswordEncoder` trước khi triển khai thật.
2. **Chưa có "Quên mật khẩu"** — nút hiện tại chỉ thông báo "đang phát triển", chưa có luồng gửi email khôi phục.
3. **Chưa xác minh email** — trường `isVerified`/`emailVerifiedAt` tồn tại trong entity `User` nhưng chưa có luồng gửi/xác minh email thật.
4. **Stripe tích hợp sẵn nhưng chưa dùng** — luồng thanh toán thật hiện dùng chuyển khoản/MoMo/tiền mặt; code Stripe (`PaymentController`, `usePayment.ts`) còn tồn tại song song, chưa được gọi từ giao diện.

---

## 11. Điểm nhấn kỹ thuật (cho báo cáo)

1. **STL Viewer 360° + tính khối lượng thật** — tự viết parser STL (binary + ASCII), render bằng Three.js/R3F; khối lượng in được tính bằng tổng thể tích tứ diện có dấu (định lý divergence) trên mesh thật thay vì ước lượng theo dung lượng file
2. **Marketplace đa người bán** — mỗi đơn hàng có thể gồm nhiều sạp, mỗi sạp có tiến trình xử lý (`fulfillmentStatus`) độc lập; seller tự vận hành, admin chỉ xác nhận thanh toán đầu vào và duyệt giải ngân cuối
3. **Chat realtime** — WebSocket (STOMP over SockJS) giữa buyer và seller, có trạng thái online/offline
4. **RBAC** — phân quyền 4 vai trò với Spring Security + JWT (access 24h + refresh 7 ngày)
5. **i18n** — hệ thống đa ngôn ngữ tự xây toàn bộ giao diện (VI/EN)
6. **Clean architecture** — tách Controller / Service / Repository / DTO rõ ràng, MapStruct giảm boilerplate mapping, exception handler tập trung
7. **Upload đa dạng** — ảnh, file 3D, avatar; fallback lưu local khi thiếu S3

---

*Print Hub 3D © 2026 — Luận văn tốt nghiệp.*
