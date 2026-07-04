# 01 — Xác thực: Đăng ký, Đăng nhập, JWT & Phân quyền

> Chức năng này trả lời câu hỏi: **"Bạn là ai, và bạn được phép làm gì?"**
> Đây là nền móng — mọi chức năng cần đăng nhập đều dựa vào nó.

---

## 1. Chức năng là gì? Ai dùng?

- **Đăng ký** (`/auth/register`): tạo tài khoản mới → luôn là **BUYER**.
- **Đăng nhập** (`/auth/login`): kiểm tra email + mật khẩu, phát **token** để dùng cho các lần sau.
- **Làm mới token** (`/auth/refresh-token`): token đăng nhập hết hạn nhanh (vì an toàn); dùng "refresh token" để lấy token mới mà không phải đăng nhập lại.
- **Đăng xuất** (`/auth/logout`): huỷ phiên.

Ai cũng dùng được các endpoint này (chúng **công khai** — xem [WebSecurityConfig](../backend/src/main/java/com/printhub3/backend/config/WebSecurityConfig.java) dòng `"/api/v1/auth/**".permitAll()`).

---

## 2. JWT là gì? (giải thích cho người chưa biết)

**JWT (JSON Web Token)** là một **tấm vé** dạng chuỗi ký tự dài, backend cấp cho bạn khi đăng nhập thành công.

- Trong vé ghi: *bạn là ai (email/id), vai trò gì, vé hết hạn khi nào* — và có **chữ ký điện tử** của server.
- Chữ ký khiến **không ai giả mạo được** vé (sửa 1 ký tự là chữ ký sai → server từ chối).
- Từ đó, **mỗi lần** gọi API bạn **đưa vé kèm theo** (trong header `Authorization: Bearer <token>`). Server nhìn vé là biết bạn ngay, **không cần nhớ** bạn đã đăng nhập (gọi là *stateless*).

Có **2 loại vé**:
- **Access token**: vé chính, hết hạn nhanh (vài phút–giờ). Dùng cho mọi request.
- **Refresh token**: vé phụ, sống lâu hơn. Chỉ dùng để xin access token mới khi cái cũ hết hạn.

---

## 3. Sơ đồ luồng đăng nhập

```
Người dùng nhập email + mật khẩu, bấm "Đăng nhập"
        │
        ▼  POST /api/v1/auth/login  { email, password }
AuthController.login()
        │
        ▼
AuthenticationService.login()
    1. Tìm user theo email (UserRepository)
    2. So mật khẩu nhập vào với mật khẩu đã mã hoá trong DB (BCrypt)
    3. Đúng → tạo access token + refresh token (JWT)
    4. Lưu refresh token vào DB
        │
        ▼  trả về { accessToken, refreshToken, user }
Frontend lưu token vào localStorage + lưu thông tin user vào store
        │
        ▼
Từ giờ, axios tự gắn token vào MỌI request tiếp theo
```

---

## 4. Các file tham gia & ý nghĩa

| File | Vai trò |
|------|---------|
| [AuthController.java](../backend/src/main/java/com/printhub3/backend/controller/AuthController.java) | Nhận các request `/auth/*` |
| [AuthenticationService.java](../backend/src/main/java/com/printhub3/backend/service/AuthenticationService.java) | Logic đăng ký/đăng nhập/refresh, tạo & kiểm token |
| [WebSecurityConfig.java](../backend/src/main/java/com/printhub3/backend/config/WebSecurityConfig.java) | Quy định URL nào công khai / cần quyền gì |
| `security/jwt/JwtAuthenticationFilter.java` | "Người gác cổng": chặn mọi request, đọc token, xác định bạn là ai |
| `entity/User.java`, `entity/Role.java`, `entity/RefreshToken.java` | Bảng người dùng, vai trò, refresh token trong DB |
| [frontend LoginPage.tsx](../frontend/src/pages/LoginPage.tsx) / [RegisterPage.tsx](../frontend/src/pages/RegisterPage.tsx) | Form đăng nhập / đăng ký |
| [frontend api/axios.ts](../frontend/src/api/axios.ts) | Gắn token vào request, xử lý token hết hạn (401) |

### 4.1. Controller — nhận request (ý nghĩa code)

```java
@PostMapping("/login")
public ResponseEntity<ApiResponse<AuthTokenResponse>> login(@Valid @RequestBody LoginRequest request) {
    AuthTokenResponse response = authenticationService.login(request);   // giao việc cho service
    return ResponseEntity.ok(ApiResponse.success(response, "User logged in successfully"));
}
```

- `@RequestBody LoginRequest`: tự đổi JSON `{ email, password }` từ frontend thành object Java.
- `@Valid`: tự kiểm tra dữ liệu hợp lệ (email đúng định dạng, không rỗng...) trước khi vào hàm.
- Controller **không tự xử lý**, chỉ gọi `authenticationService.login()` — đúng nguyên tắc 3 tầng.

### 4.2. Người gác cổng — `JwtAuthenticationFilter`

Đây là mảnh ghép **vô hình nhưng quan trọng nhất**. Nó chạy **trước** mọi controller:

1. Lấy chuỗi token từ header `Authorization: Bearer ...`.
2. Kiểm tra chữ ký + hạn dùng của token.
3. Hợp lệ → nạp thông tin bạn (id, vai trò) vào "SecurityContext" — nhờ đó khắp nơi trong backend biết `getCurrentUserId()` là ai.
4. Không có/token sai → coi như khách vãng lai. Nếu URL cần đăng nhập, bị chặn (lỗi 401).

### 4.3. Mật khẩu được lưu an toàn thế nào (BCrypt)

Trong [WebSecurityConfig](../backend/src/main/java/com/printhub3/backend/config/WebSecurityConfig.java):

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);   // băm mật khẩu, không lưu chữ gốc
}
```

- Database **không bao giờ lưu mật khẩu thật**. Nó lưu bản "băm" (hash) một chiều bằng BCrypt.
- Khi đăng nhập, hệ thống băm mật khẩu bạn nhập rồi **so hai bản băm** — trùng là đúng. Kể cả lộ database, hacker cũng không đọc ra mật khẩu gốc.

### 4.4. Frontend gắn token & xử lý hết hạn — `axios.ts`

```ts
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`   // ★ tự đính vé
  return config
})

apiClient.interceptors.response.use(ok => ok, async error => {
  if (error.response?.status === 401) {         // token hết hạn / không hợp lệ
    localStorage.removeItem('accessToken')      // dọn sạch phiên
    window.location.assign('/auth/login')       // đá về trang đăng nhập
  }
  return Promise.reject(error)
})
```

- **Request interceptor:** bạn viết `apiClient.get('/cart')` là đủ — token được đính **tự động**, không phải nhớ mỗi lần.
- **Response interceptor:** nếu server trả 401 (không được phép), tự đăng xuất để tránh hiển thị dữ liệu lỗi.

---

## 5. Phân quyền: URL nào ai được vào

Trong [WebSecurityConfig](../backend/src/main/java/com/printhub3/backend/config/WebSecurityConfig.java):

```java
.requestMatchers("/api/v1/auth/**").permitAll()                      // ai cũng vào
.requestMatchers(HttpMethod.GET, "/api/v1/products/**").permitAll()  // xem SP: công khai
.requestMatchers(HttpMethod.GET, "/api/v1/shops/**").permitAll()     // xem sạp: công khai
.requestMatchers("/api/v1/admin/**").hasRole("ADMIN")               // chỉ admin
.requestMatchers(HttpMethod.POST, "/api/v1/products").hasAnyRole("SELLER","ADMIN") // đăng SP
.requestMatchers("/api/v1/cart/**").authenticated()                 // cần đăng nhập
.anyRequest().authenticated()                                        // còn lại: cần đăng nhập
```

Ngoài ra, từng hàm còn có thể gắn `@PreAuthorize(...)`:
- `@PreAuthorize("isAuthenticated()")` — phải đăng nhập.
- `@PreAuthorize("hasRole('ADMIN')")` — phải là admin.

> **2 lớp bảo vệ:** WebSecurityConfig chặn theo *đường dẫn*, còn `@PreAuthorize` chặn theo *từng hàm*. Có cả hai cho chắc.

---

## 6. Ví dụ chạy thật: đăng nhập rồi mở giỏ hàng

1. Nhập email/mật khẩu → `POST /auth/login` → nhận `accessToken`, lưu vào `localStorage`.
2. Bấm "Giỏ hàng" → frontend gọi `apiClient.get('/cart')`.
3. axios **tự gắn** `Authorization: Bearer eyJhbGc...` vào request.
4. Backend: `JwtAuthenticationFilter` đọc token → biết bạn là user #7.
5. `WebSecurityConfig` thấy `/cart/**` yêu cầu `authenticated()` → bạn có token → cho qua.
6. `CartController` gọi `getCurrentUserId()` → lấy được `7` từ token → trả đúng giỏ hàng của bạn.

👉 Tiếp theo: [luong-cho-san-pham.md](luong-cho-san-pham.md) (chợ sản phẩm).
