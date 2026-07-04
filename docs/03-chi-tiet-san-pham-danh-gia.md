# 03 — Trang chi tiết sản phẩm & Đánh giá sao

> Khi bấm vào một sản phẩm ở chợ, bạn tới **trang chi tiết**: xem ảnh, mô tả, giá, sạp bán,
> xem trước mô hình 3D, thêm vào giỏ, và **đánh giá (review)**. File này giải thích cả hai.

---

## 1. Chức năng là gì? Ai dùng?

- **Xem chi tiết** (`GET /products/{id}`): công khai — ai cũng xem được.
- **Đánh giá sản phẩm**:
  - Đọc đánh giá (`GET /products/{id}/reviews`): công khai.
  - Viết/sửa đánh giá (`POST /products/{id}/reviews`): **phải đăng nhập**. Mỗi người chỉ có **1 đánh giá** cho mỗi sản phẩm (viết lần 2 là *sửa* lần trước).

---

## 2. Sơ đồ luồng

```
Ở chợ, bấm 1 ProductCard  →  <Link to="/products/42">  →  URL đổi thành /products/42
        │
        ▼
Router dựng ProductDetailPage
        │
        ├──▶ GET /products/42            → thông tin sản phẩm (ProductController.getProduct)
        └──▶ GET /products/42/reviews    → danh sách đánh giá (ReviewController.getReviews)
        │
        ▼
Người dùng chọn số sao + gõ nhận xét → bấm "Gửi đánh giá"
        │
        ▼  POST /products/42/reviews  { rating: 5, comment: "..." }
ReviewController.addReview()  →  ReviewService.addOrUpdateReview()
        1. Tìm đánh giá cũ của user này cho SP này → có thì sửa, chưa có thì tạo mới
        2. Lưu đánh giá
        3. Tính lại điểm trung bình + số lượt đánh giá của sản phẩm
        │
        ▼
Frontend tải lại danh sách đánh giá → hiển thị điểm mới
```

---

## 3. Các file tham gia

| Lớp | File | Vai trò |
|-----|------|---------|
| FE trang | [ProductDetailPage.tsx](../frontend/src/features/products/ProductDetailPage.tsx) | Toàn bộ trang chi tiết |
| FE đánh giá | [ProductReviews.tsx](../frontend/src/features/products/ProductReviews.tsx) | Ô chọn sao + danh sách nhận xét (nhúng trong trang chi tiết) |
| FE gọi API | [reviewService.ts](../frontend/src/features/products/reviewService.ts) | 2 hàm: lấy & gửi đánh giá |
| BE controller SP | [ProductController.java](../backend/src/main/java/com/printhub3/backend/controller/ProductController.java) | `GET /products/{id}`, tải ZIP file STL |
| BE controller review | [ReviewController.java](../backend/src/main/java/com/printhub3/backend/controller/ReviewController.java) | `GET/POST /products/{id}/reviews` |
| BE service review | [ReviewService.java](../backend/src/main/java/com/printhub3/backend/service/ReviewService.java) | Logic lưu đánh giá + tính lại điểm |
| BE entity | `entity/ProductReview.java` | Bảng đánh giá (unique theo product + user) |

---

## 4. Ý nghĩa code — phần lấy chi tiết sản phẩm

Trong [ProductService.getProductById](../backend/src/main/java/com/printhub3/backend/service/ProductService.java):

```java
public ProductDto getProductById(Long productId) {
    Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

    // ★ chốt chặn: sản phẩm bị ẩn / xoá mềm thì coi như không tồn tại
    if (Boolean.FALSE.equals(product.getIsActive()) || product.getDeletedAt() != null) {
        throw new ResourceNotFoundException("Product not available");
    }
    return mapToProductDto(product);
}
```

- `findById(...).orElseThrow(...)`: tìm theo id; không có thì ném lỗi 404.
- **2 điều kiện ★**: dù ai đó gõ thẳng URL `/products/42`, sản phẩm chưa duyệt / đã xoá vẫn không xem được.
- `mapToProductDto`: đóng gói dữ liệu gọn cho frontend (ảnh, giá, tên sạp `shopSlug` để link về sạp, danh sách file STL...).

---

## 5. Ý nghĩa code — phần đánh giá (điểm hay nhất)

### 5.1. Gọi API ở frontend — `reviewService.ts`

```ts
addReview: async (productId, rating, comment) => {
  const res = await apiClient.post(`/products/${productId}/reviews`, { rating, comment })
  return res.data.data as Review    // bóc 2 lớp: axios.data → ApiResponse.data
}
```

Rất gọn: chỉ gửi `rating` + `comment`. **Không gửi userId** — backend tự biết bạn là ai qua token.

### 5.2. "Tạo mới hay cập nhật?" — `ReviewService.addOrUpdateReview`

```java
ProductReview review = reviewRepository.findUserReviewForProduct(productId, userId)
        .orElseGet(() -> ProductReview.builder()      // chưa có → tạo bản mới
                .product(product).user(user)
                .isVerifiedPurchase(false).helpfulCount(0)
                .build());

review.setRating(request.getRating());     // dù mới hay cũ, đều gán sao + nhận xét mới
review.setComment(request.getComment());
review = reviewRepository.save(review);

recalcProductRating(product);              // ★ tính lại điểm trung bình
```

- **`findUserReviewForProduct(...).orElseGet(...)`** là mấu chốt: tìm đánh giá **cũ** của bạn cho sản phẩm này.
  - Có → sửa nó (không tạo trùng).
  - Chưa → tạo mới.
  - Nhờ vậy mỗi người chỉ có đúng **1 đánh giá / sản phẩm**.

### 5.3. Tính lại điểm trung bình — `recalcProductRating`

```java
private void recalcProductRating(Product product) {
    RatingAggregate agg = reviewRepository.aggregateForProduct(product.getProductId());
    product.setRating(round(agg != null ? agg.getAvg() : null));        // điểm TB
    product.setTotalReviews(agg != null && agg.getCnt() != null ? agg.getCnt().intValue() : 0); // số lượt
    productRepository.save(product);
}
```

- Thay vì tính tay, nó nhờ database gom số liệu: `aggregateForProduct` là truy vấn `SELECT AVG(rating), COUNT(*) ...`.
- `round(...)` làm tròn 2 chữ số (ví dụ 4.6666 → 4.67).
- **Kết quả:** điểm sao hiển thị ngoài chợ và trang chi tiết **luôn khớp** với các đánh giá thật, cập nhật ngay sau khi có người đánh giá.

> **Ghi chú nghiệp vụ:** đánh giá **sản phẩm** chỉ ảnh hưởng điểm **sản phẩm**. Điểm của **sạp** đến từ
> loại đánh giá riêng ("đánh giá sạp") — xem file [05](05-sap-nguoi-ban.md). Đây là quyết định cố ý để hai loại điểm không lẫn nhau.

---

## 6. Tải mô hình 3D (file STL) về máy

Trang chi tiết còn có nút tải file. Backend gói **tất cả** file STL của sản phẩm thành 1 file ZIP:

```java
// ProductController
@GetMapping("/{productId}/download")
public ResponseEntity<byte[]> downloadStlZip(@PathVariable Long productId) {
    ProductService.StlZip zip = productService.buildStlZip(productId);
    return ResponseEntity.ok()
        .header(CONTENT_DISPOSITION, attachment().filename(zip.fileName()).build().toString())
        .body(zip.data());
}
```

- `buildStlZip` đọc các file thật trên ổ đĩa, nén vào 1 ZIP (có **chống truy cập trái phép đường dẫn** — chỉ đọc trong thư mục `uploads/`).
- Trả về **byte thô** kèm header `Content-Disposition: attachment` → trình duyệt hiểu là "tải file xuống".

Còn phần **xem trước 3D** ngay trên web dùng thư viện Three.js — xem file [09](09-dich-vu-in-3d-va-stl.md).

---

## 7. Ví dụ chạy thật

1. Ở chợ bấm sản phẩm "Rồng thần" → `/products/42`.
2. Trang gọi song song `GET /products/42` (chi tiết) và `GET /products/42/reviews?page=0&size=10` (đánh giá).
3. Bạn chọn 5 sao, gõ "Chi tiết sắc nét!", bấm Gửi.
4. `POST /products/42/reviews { rating:5, comment:"Chi tiết sắc nét!" }` (token đính kèm).
5. `ReviewService`: bạn chưa từng đánh giá SP này → tạo mới → lưu → tính lại: giả sử giờ có 3 đánh giá (5,4,5) → điểm = 4.67, số lượt = 3.
6. Frontend tải lại danh sách → thấy nhận xét của bạn + điểm 4.67.

👉 Tiếp theo: [04-gio-hang-thanh-toan-don-hang.md](04-gio-hang-thanh-toan-don-hang.md).
