# Tài liệu Print Hub 3D — Giải thích toàn bộ chức năng

> Bộ tài liệu này giải thích **mọi chức năng** của dự án theo cách **dễ hiểu nhất cho người chưa biết gì**.
> Mỗi file mô tả 1 nhóm chức năng: *nó là gì → ai dùng → luồng chạy (sơ đồ) → từng file code làm gì → ví dụ chạy thật*.

Print Hub 3D là một **sàn thương mại điện tử về mô hình in 3D**: người dùng mua/bán file & sản phẩm in 3D,
mỗi người bán mở một "sạp" (shop), và có cả **dịch vụ in 3D theo yêu cầu**.

---

## 📚 Mục lục — đọc theo thứ tự này

| # | File | Nội dung |
|---|------|----------|
| 0 | **README.md** (file này) | Khái niệm nền tảng: kiến trúc, thuật ngữ, vai trò, bảo mật — **đọc trước tiên** |
| 1 | [01-xac-thuc-dang-nhap.md](01-xac-thuc-dang-nhap.md) | Đăng ký, đăng nhập, JWT, phân quyền |
| 2 | [luong-cho-san-pham.md](luong-cho-san-pham.md) | Chợ sản phẩm (marketplace): tìm/lọc/sắp xếp — *bản giải thích sâu nhất, nên đọc kỹ* |
| 3 | [03-chi-tiet-san-pham-danh-gia.md](03-chi-tiet-san-pham-danh-gia.md) | Trang chi tiết sản phẩm + đánh giá sao |
| 4 | [04-gio-hang-thanh-toan-don-hang.md](04-gio-hang-thanh-toan-don-hang.md) | Giỏ hàng → thanh toán → đơn hàng |
| 5 | [05-sap-nguoi-ban.md](05-sap-nguoi-ban.md) | Mở sạp, trang sạp công khai, theo dõi, đánh giá sạp |
| 6 | [06-quan-ly-ban-hang.md](06-quan-ly-ban-hang.md) | Bảng điều khiển người bán + luồng xử lý đơn + trả tiền hoa hồng |
| 7 | [07-quan-tri-admin.md](07-quan-tri-admin.md) | Trang quản trị: duyệt sản phẩm, duyệt sạp, người dùng, doanh thu |
| 8 | [08-thong-bao-va-chat.md](08-thong-bao-va-chat.md) | Thông báo + chat thời gian thực (WebSocket) |
| 9 | [09-dich-vu-in-3d-va-stl.md](09-dich-vu-in-3d-va-stl.md) | Dịch vụ in 3D theo yêu cầu + tải & xem file STL |

---

## 1. Kiến trúc tổng thể — "ai nói chuyện với ai"

Hệ thống có **2 nửa** chạy riêng, nói chuyện qua **API** (giao thức trao đổi dữ liệu qua mạng):

```
┌─────────────────────────┐         HTTP request (JSON)        ┌──────────────────────────┐
│      FRONTEND           │  ───────────────────────────────▶  │        BACKEND           │
│  (React + TypeScript)   │                                     │   (Java + Spring Boot)   │
│  Chạy trong trình duyệt │  ◀───────────────────────────────  │   Chạy trên server       │
│  = phần NGƯỜI DÙNG THẤY │         HTTP response (JSON)        │   = phần XỬ LÝ LOGIC     │
└─────────────────────────┘                                     └────────────┬─────────────┘
                                                                             │ SQL
                                                                             ▼
                                                                 ┌──────────────────────────┐
                                                                 │       DATABASE           │
                                                                 │   (MySQL) = nơi LƯU dữ   │
                                                                 │   liệu lâu dài           │
                                                                 └──────────────────────────┘
```

- **Frontend** (thư mục `frontend/`): giao diện đẹp trong trình duyệt. Nó **không tự lưu dữ liệu**, mà hỏi backend.
- **Backend** (thư mục `backend/`): "bộ não". Nhận yêu cầu, kiểm tra quyền, xử lý logic, đọc/ghi database.
- **Database**: kho lưu trữ. Mọi sản phẩm, đơn hàng, người dùng... nằm ở đây.

> **Ví von:** Frontend là *nhân viên phục vụ* (nói chuyện với khách), Backend là *bếp* (nấu món),
> Database là *kho thực phẩm*. Khách không tự vào kho — phải qua phục vụ → bếp → kho.

---

## 2. Backend được chia thành 3 tầng (rất quan trọng, lặp lại ở mọi chức năng)

Mỗi chức năng ở backend đều đi qua **3 tầng** theo đúng thứ tự:

```
Controller  →  Service  →  Repository  →  Database
```

| Tầng | Tên file thường gặp | Nhiệm vụ | Ví von |
|------|--------------------|----------|--------|
| **Controller** | `XxxController.java` | Nhận request HTTP, kiểm tra quyền, gọi Service | *Lễ tân*: nhận yêu cầu, chuyển vào trong |
| **Service** | `XxxService.java` | Chứa **logic nghiệp vụ** (quy tắc kinh doanh) | *Đầu bếp*: xử lý thật sự |
| **Repository** | `XxxRepository.java` | Đọc/ghi database (không cần viết SQL tay) | *Thủ kho*: lấy/cất hàng |
| **Entity** | `Xxx.java` | Mô tả 1 bảng trong database (Product, Order...) | *Cái hộp* đựng dữ liệu |
| **DTO** | `XxxDto.java` | Dữ liệu gọn gàng gửi cho frontend | *Bản sao sạch* để đưa ra ngoài |

**Vì sao tách DTO khỏi Entity?** Entity chứa nhiều thứ nhạy cảm/nặng (mật khẩu, quan hệ vòng). DTO chỉ chứa
đúng thứ frontend cần → an toàn và nhẹ. Bạn sẽ thấy hàm `mapToXxxDto(...)` khắp nơi làm việc "sao chép sạch" này.

---

## 3. Frontend được tổ chức thế nào

```
frontend/src/
├── routes/AppRoutes.tsx     → Bảng định tuyến: URL nào → hiện trang nào
├── pages/                   → Các trang lớn (Trang chủ, Đăng nhập, Tài khoản...)
├── features/                → Các nhóm chức năng (products, shop, seller, admin, creator, chat...)
├── components/              → Mảnh ghép tái dùng (giỏ hàng, thanh toán, đơn hàng...)
├── api/axios.ts             → Cấu hình gọi backend (gắn token, xử lý lỗi 401)
├── store/                   → Bộ nhớ toàn cục phía trình duyệt (giỏ hàng, đăng nhập...) bằng Zustand
└── i18n/                    → Đa ngôn ngữ (tiếng Việt + tiếng Anh)
```

**Vài khái niệm frontend cần nhớ:**
- **Component**: một mảnh giao diện (cái nút, cái thẻ sản phẩm, cả một trang). Viết bằng file `.tsx`.
- **State (`useState`)**: bộ nhớ tạm của một trang (ví dụ: từ khoá đang gõ, trang thứ mấy). Đổi state → giao diện tự vẽ lại.
- **React Query (`useQuery`)**: thư viện chuyên **gọi API + nhớ (cache) kết quả**. Cùng dữ liệu thì không gọi lại server 2 lần.
- **React Router (`<Route>`, `<Link>`)**: đổi trang **không tải lại toàn trang** (gọi là SPA — Single Page App).

---

## 4. Các vai trò người dùng (phân quyền)

Hệ thống có 3 vai trò. Vai trò quyết định **được làm gì**:

| Vai trò | Là ai | Được làm gì |
|---------|-------|-------------|
| **BUYER** (người mua) | Mặc định khi đăng ký | Xem chợ, mua hàng, đánh giá, theo dõi sạp, đặt in 3D |
| **SELLER** (người bán) | BUYER **nộp đơn mở sạp** + được ADMIN duyệt | Mọi quyền của BUYER + đăng sản phẩm, quản lý sạp, nhận đơn, nhận tiền |
| **ADMIN** (quản trị) | Do hệ thống cấp | Duyệt sản phẩm, duyệt đơn mở sạp, quản lý người dùng, xử lý đơn hàng, xem doanh thu |

> **Quy tắc nghiệp vụ quan trọng:** khi tự đăng ký, **ai cũng chỉ là BUYER**. Muốn bán hàng phải xin mở sạp
> và chờ admin duyệt (xem file [05](05-sap-nguoi-ban.md)).

---

## 5. Một request đi từ đầu đến cuối như thế nào (ví dụ chung)

Giả sử người dùng bấm nút gì đó cần dữ liệu. Chuỗi sự kiện **luôn giống nhau**:

```
1. Người dùng thao tác trên FRONTEND (bấm nút / mở trang)
2. Frontend gọi API qua axios:  apiClient.get('/products')
3. axios tự gắn token đăng nhập (nếu có) vào request  →  gửi tới backend
4. BACKEND: JwtAuthenticationFilter kiểm tra token → biết bạn là ai, vai trò gì
5. Controller nhận request → (kiểm tra quyền bằng @PreAuthorize) → gọi Service
6. Service xử lý logic → gọi Repository
7. Repository chạy SQL → Database trả dữ liệu
8. Service đổi Entity → DTO → trả về Controller
9. Controller bọc trong ApiResponse { success, message, data } → trả JSON về frontend
10. Frontend nhận JSON → cập nhật giao diện
```

Bạn sẽ thấy **đúng chuỗi này lặp lại** ở mọi chức năng, chỉ khác tên file. Nắm chắc nó là hiểu cả hệ thống.

---

## 6. Bảo mật & đăng nhập (tóm tắt — chi tiết ở file 01)

- Đăng nhập xong, backend cấp một **JWT** (JSON Web Token) — một chuỗi mã chứng minh "tôi là ai".
- Frontend lưu token trong `localStorage`, và **axios tự đính kèm** vào mọi request (`Authorization: Bearer <token>`).
- File [WebSecurityConfig.java](../backend/src/main/java/com/printhub3/backend/config/WebSecurityConfig.java) quy định
  **đường dẫn nào ai được vào**:
  - **Công khai (ai cũng vào):** đăng nhập/đăng ký, xem sản phẩm (`GET /products`), xem sạp (`GET /shops`), xem file STL.
  - **Cần đăng nhập:** giỏ hàng, đơn hàng, thanh toán, thông báo.
  - **Chỉ SELLER/ADMIN:** đăng/sửa/xoá sản phẩm.
  - **Chỉ ADMIN:** mọi thứ dưới `/api/v1/admin/**`.
- Hệ thống **stateless**: server không nhớ phiên đăng nhập; mỗi request tự mang token đi. Nhờ vậy dễ mở rộng.

---

## 7. Định dạng dữ liệu chung: `ApiResponse`

**Mọi** phản hồi từ backend đều bọc trong một "phong bì" chuẩn:

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": { ... dữ liệu thật ... }
}
```

Nên ở frontend bạn hay thấy `res.data.data` — bóc 2 lớp: lớp `.data` đầu của axios, lớp `.data` sau là field trong phong bì.
Dữ liệu có **phân trang** thì `data` có dạng `{ content: [...], totalPages, totalElements, ... }`.

---

👉 **Bắt đầu đọc:** sang [01-xac-thuc-dang-nhap.md](01-xac-thuc-dang-nhap.md), rồi lần lượt theo mục lục.
Nếu chỉ muốn hiểu sâu 1 luồng mẫu, đọc [luong-cho-san-pham.md](luong-cho-san-pham.md).
