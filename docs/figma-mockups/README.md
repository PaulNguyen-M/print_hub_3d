# Mockup giao diện Print Hub 3D — Bộ file import Figma

16 file `.svg` mô phỏng giao diện hệ thống Print Hub 3D (10 màn desktop + 6 màn mobile).

---

## Cách import vào Figma

1. Mở Figma → tạo file mới (**Design file**).
2. Chọn **toàn bộ 16 file `.svg`** trong thư mục này.
3. **Kéo thả** thẳng vào canvas Figma (hoặc `Menu ☰ → File → Import…`).
4. Figma tự tạo mỗi file thành **một Frame riêng**, và **lấy tên file làm tên Frame**.

> Vì sao dùng SVG? Figma đọc SVG natively — mọi hình khối, chữ, màu đều trở thành
> **layer sửa được** (text vẫn là text layer, không phải ảnh). Figma không có định
> dạng import `.txt` thuần; SVG chính là định dạng text mà Figma hiểu.

**Sau khi import nên làm:**
- Chọn tất cả frame → `Shift + A` để gom vào Section, hoặc sắp xếp bằng
  **Tidy up** (`Ctrl/Cmd + Alt + T`).
- Font trong file là **Inter** (font mặc định có sẵn của Figma) — không cần cài thêm.
- Nếu Figma hỏi thiếu font, chọn **Replace with Inter**.

---

## Danh sách màn hình

### A. Desktop — khung 1440px

| # | Tên Frame | Màn hình | Trang nguồn trong code |
|---|-----------|----------|------------------------|
| 01 | `01-Desktop-TrangChu` | Trang chủ (hero, danh mục, mô hình nổi bật, dịch vụ in 3D, sạp nổi bật) | `pages/HomePage.tsx` |
| 02 | `02-Desktop-ChoMoHinh-Marketplace` | Chợ mô hình — lưới sản phẩm + sidebar bộ lọc + phân trang | `features/products/MarketplacePage.tsx` |
| 03 | `03-Desktop-ChiTietSanPham` | Chi tiết sản phẩm — viewer 3D, thông số, mua hàng, đánh giá | `features/products/ProductDetailPage.tsx` |
| 04 | `04-Desktop-GioHang` | Giỏ hàng — danh sách món, số lượng, mã giảm giá, tóm tắt | `components/cart/CartPage.tsx` |
| 05 | `05-Desktop-ThanhToan-Checkout` | Thanh toán — stepper, form giao hàng, phương thức thanh toán | `components/checkout/CheckoutPage.tsx` |
| 06 | `06-Desktop-TrangSap-ShopPage` | Trang sạp công khai — banner, thống kê, theo dõi, lưới sản phẩm | `features/shop/ShopPage.tsx` |
| 07 | `07-Desktop-DichVuIn3D` | Dịch vụ in 3D — upload STL, chọn vật liệu/màu/infill, ước tính giá | `pages/PrintingServicePage.tsx` |
| 08 | `08-Desktop-CreatorDashboard-SapCuaToi` | Bảng điều khiển người bán — KPI, biểu đồ doanh thu, đơn cần xử lý | `features/creator/CreatorDashboardPage.tsx` |
| 09 | `09-Desktop-AdminDashboard` | Bảng điều khiển quản trị — KPI, biểu đồ, phân bố người dùng, hàng chờ duyệt | `features/admin/AdminDashboardPage.tsx` |
| 10 | `10-Desktop-DangNhap-Login` | Đăng nhập — split layout, form, đăng nhập mạng xã hội | `pages/LoginPage.tsx` |

### B. Mobile — khung 390px (iPhone 14/15)

| # | Tên Frame | Màn hình | Ghi chú |
|---|-----------|----------|---------|
| 11 | `11-Mobile-TrangChu` | Trang chủ | Có bottom tab bar 5 mục |
| 12 | `12-Mobile-ChoMoHinh-Marketplace` | Chợ mô hình | Lưới 2 cột, chip lọc ngang |
| 13 | `13-Mobile-ChiTietSanPham` | Chi tiết sản phẩm | Viewer 3D full-bleed, thanh CTA cố định đáy |
| 14 | `14-Mobile-GioHang` | Giỏ hàng | Thanh tổng tiền + CTA cố định đáy |
| 15 | `15-Mobile-TrangSap-ShopPage` | Trang sạp công khai | Avatar sạp căn giữa, tabs |
| 16 | `16-Mobile-DangNhap-Login` | Đăng nhập | Header gradient bo góc |

> Các frame mobile cao hơn 844px là **trang có nội dung cuộn** — chiều cao thể hiện
> toàn bộ nội dung, thanh tab/CTA được ghim ở đáy frame.

---

## Design tokens (lấy đúng từ code dự án)

Nguồn: `frontend/tailwind.config.js` và `frontend/src/index.css`

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `brand-600` | `#2563eb` | Màu chủ đạo — nút chính, link, nhấn mạnh |
| `brand-700` | `#1d4ed8` | Hover, gradient đậm |
| `brand-500` | `#3b82f6` | Khối 3D, điểm nhấn phụ |
| `brand-50` | `#eff6ff` | Nền nhạt, pill, icon box |
| `cyan-500` | `#06b6d4` | Gradient phụ, dịch vụ in 3D |
| `green-500` | `#22c55e` | Trạng thái thành công, giảm giá |
| `amber-500` | `#f59e0b` | Sao đánh giá, cảnh báo |
| `red-500` | `#ef4444` | Xóa, từ chối, badge thông báo |
| `slate-50` | `#f8fafc` | Nền trang |
| `slate-900` | `#0f172a` | Chữ chính, sidebar admin |
| Font | **Inter** | Toàn hệ thống |
| Bo góc | Card `24px` · Nút `12px` · Pill `bo tròn` | |

---

## Ghi chú khi đưa vào báo cáo

- Mỗi frame tương ứng một mục trong phần **"Hệ thống màn hình"** của luận văn.
- Xuất ảnh từ Figma: chọn frame → panel **Export** bên phải → **PNG 2x** → `Export`.
- Nếu cần ảnh nhanh không qua Figma: mở thẳng file `.svg` bằng trình duyệt rồi chụp màn hình.
