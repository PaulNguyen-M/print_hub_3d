# 05 — Sạp & Người bán: Mở sạp, trang sạp, theo dõi, đánh giá sạp

> Nền tảng là cái **"chợ"**; mỗi người bán mở một **"sạp" (shop)**. File này giải thích: làm sao một người mua
> trở thành người bán, và trang sạp công khai hoạt động thế nào.

---

## 1. Quy tắc nghiệp vụ cốt lõi

- Khi tự đăng ký, **ai cũng là BUYER**. Muốn bán → phải **nộp đơn mở sạp** và chờ **ADMIN duyệt**.
- Phí mở sạp: **miễn phí mặc định** (có thể cấu hình `marketplace.shop.opening-fee`). Nếu có phí thì phải trả trước khi được duyệt.
- **Hoa hồng: 15%** mỗi đơn bán thành công (`commission-rate = 0.15`).
- Khi admin duyệt: hệ thống **tự tạo Shop** + **nâng vai trò người dùng lên SELLER**.

---

## 2. Sơ đồ luồng "trở thành người bán"

```
BUYER bấm "Mở sạp" → điền tên sạp + mô tả → gửi đơn
        │  POST /seller/apply
        ▼
SellerService.applyForShop()
   - kiểm tra: chưa có sạp? chưa có đơn nào đang chờ?
   - tạo SellerApplication (status = PENDING)
        │
        ▼  (chờ...)   admin xem danh sách đơn: GET /admin/seller-applications
        ▼
ADMIN bấm "Duyệt" → POST /admin/seller-applications/{id}/approve
        │
        ▼
SellerService.approveApplication()
   1. tạo Shop (slug duy nhất, hoa hồng 15%, trạng thái ACTIVE)
   2. nâng vai trò applicant: BUYER → SELLER
   3. đánh dấu đơn APPROVED, gắn shop vào đơn
   4. gửi thông báo "Đơn mở sạp được duyệt" cho người dùng
        │
        ▼
Người dùng giờ là SELLER, có sạp, vào Bảng điều khiển người bán để đăng sản phẩm (xem file 06)
```

---

## 3. Ý nghĩa code — nộp đơn ([SellerService.applyForShop](../backend/src/main/java/com/printhub3/backend/service/SellerService.java))

```java
if (shopRepository.existsByOwner_UserId(userId))
    throw new BusinessException("Bạn đã có sạp rồi, không thể đăng ký thêm");
if (applicationRepository.existsByApplicant_UserIdAndStatus(userId, PENDING))
    throw new BusinessException("Bạn đang có một đơn đăng ký mở sạp chờ duyệt");

BigDecimal openingFee = marketplaceProperties.getOpeningFee() ... ;   // phí mở sạp (mặc định 0)
boolean feePaid = openingFee.compareTo(BigDecimal.ZERO) <= 0;         // phí 0 → coi như đã trả

SellerApplication application = SellerApplication.builder()
    .applicant(user).shopName(request.getShopName())
    .status(ApplicationStatus.PENDING).openingFee(openingFee).feePaid(feePaid)
    .build();
applicationRepository.save(application);
```

- **2 câu kiểm tra đầu** = chống nộp trùng: đã có sạp, hoặc đã có đơn đang chờ thì chặn.
- `feePaid = (phí <= 0)`: nếu miễn phí thì tự động đánh dấu "đã trả" → admin duyệt được ngay.

## 4. Ý nghĩa code — duyệt đơn ([SellerService.approveApplication](../backend/src/main/java/com/printhub3/backend/service/SellerService.java))

```java
if (application.getStatus() != PENDING) throw new BusinessException("Đơn này đã được xử lý rồi");
if (Boolean.FALSE.equals(application.getFeePaid())) throw new BusinessException("...chưa thanh toán phí...");

// 1) Tạo sạp
Shop shop = Shop.builder()
    .owner(applicant).name(application.getShopName())
    .slug(uniqueSlug(SlugUtil.toSlug(application.getShopName())))   // "Sạp Rồng" → "sap-rong"
    .status(Shop.ShopStatus.ACTIVE).commissionRate(commission)      // 15%
    .build();
shop = shopRepository.save(shop);

// 2) Nâng vai trò lên SELLER
Role sellerRole = roleRepository.findByName("SELLER")...;
applicant.setRole(sellerRole);
userRepository.save(applicant);

// 3) Cập nhật đơn + 4) thông báo
application.setStatus(APPROVED); application.setShop(shop); ...
notify(applicant, "Đơn mở sạp được duyệt", "Chúc mừng! Sạp \"" + shop.getName() + "\" ...", shop.getShopId());
```

- **`slug` là gì?** Là "tên thân thiện trên URL". "Sạp Rồng Thần" → `sap-rong-than`, dùng cho địa chỉ `/shops/sap-rong-than`.
  `uniqueSlug(...)` bảo đảm không trùng (nếu trùng thì thêm `-1`, `-2`...).
- Toàn bộ hàm có `@Transactional`: **hoặc cả 4 bước cùng thành công, hoặc không gì cả**. Không thể xảy ra cảnh "tạo sạp xong mà quên nâng quyền".

---

## 5. Trang sạp công khai (`/shops/{slug}`)

Ai cũng xem được trang sạp — giống trang giới thiệu người bán trên BambuLab (banner, logo, tên, số người theo dõi, sản phẩm, đánh giá).

### Endpoints ([ShopController](../backend/src/main/java/com/printhub3/backend/controller/ShopController.java))

| Thao tác | URL | Quyền |
|----------|-----|-------|
| Xem thông tin sạp | `GET /shops/{slug}` | Công khai |
| Sản phẩm của sạp (tìm/sắp xếp) | `GET /shops/{slug}/products?sort=&search=` | Công khai |
| Đọc đánh giá sạp | `GET /shops/{slug}/reviews` | Công khai |
| Viết đánh giá sạp | `POST /shops/{slug}/reviews` | Cần đăng nhập |
| Sản phẩm nổi bật | `GET /shops/{slug}/featured` | Công khai |
| Theo dõi / bỏ theo dõi | `POST /shops/{slug}/follow` | Cần đăng nhập |

### Điểm kỹ thuật thú vị: "trạng thái theo dõi" cho endpoint công khai

```java
// ShopController
@GetMapping("/{slug}")
public ... getShop(@PathVariable String slug) {
    ShopDto shop = shopService.getShopBySlug(slug, currentUserIdOrNull());  // ← có thể null
    ...
}
```

- `GET /shops/**` là **công khai** nên khách vãng lai xem được.
- Nhưng nếu bạn **có** đăng nhập, người gác cổng vẫn nạp danh tính → `currentUserIdOrNull()` trả về id bạn → sạp biết bạn **đã theo dõi hay chưa** (`isFollowing`).
- Nếu chưa đăng nhập → `null` → `isFollowing = false`. **Một endpoint phục vụ cả 2 loại khách** một cách khéo léo.

### Theo dõi = "công tắc bật/tắt" (toggle)

```java
@PostMapping("/{slug}/follow")
public ... toggleFollow(@PathVariable String slug) {
    boolean following = shopService.toggleFollow(slug, currentUserId());
    return ... Map.of("following", following) ...;   // trả về true/false trạng thái mới
}
```

- Bấm lần 1 → theo dõi (true). Bấm lần 2 → bỏ theo dõi (false). Cùng 1 nút, đổi qua đổi lại.

---

## 6. Đánh giá **sạp** khác đánh giá **sản phẩm** thế nào?

Đây là điểm dễ nhầm — hệ thống tách **2 loại đánh giá riêng biệt**:

| | Đánh giá sản phẩm | Đánh giá sạp |
|--|------------------|--------------|
| Bảng DB | `ProductReview` | `ShopReview` |
| API | `POST /products/{id}/reviews` | `POST /shops/{slug}/reviews` |
| Ảnh hưởng | điểm **sản phẩm** | điểm **sạp** |
| Xử lý ở | [ReviewService](../backend/src/main/java/com/printhub3/backend/service/ReviewService.java) | [ShopService](../backend/src/main/java/com/printhub3/backend/service/ShopService.java) |

> **Quyết định thiết kế:** điểm của sạp **chỉ** đến từ đánh giá sạp, không cộng gộp từ đánh giá sản phẩm.
> Nhờ vậy "sạp 5 sao" nghĩa là *dịch vụ người bán* tốt, tách bạch với chất lượng từng sản phẩm.

---

## 7. Các file tham gia

| Lớp | File |
|-----|------|
| FE mở sạp | [OpenShopPage.tsx](../frontend/src/features/seller/OpenShopPage.tsx) (route `/seller/apply`) |
| FE trang sạp | [ShopPage.tsx](../frontend/src/features/shop/ShopPage.tsx) (route `/shops/:slug`) |
| FE admin duyệt | [AdminSellerApplicationsPage.tsx](../frontend/src/features/admin/AdminSellerApplicationsPage.tsx) |
| BE controller | [SellerController](../backend/src/main/java/com/printhub3/backend/controller/SellerController.java), [ShopController](../backend/src/main/java/com/printhub3/backend/controller/ShopController.java) |
| BE service | [SellerService](../backend/src/main/java/com/printhub3/backend/service/SellerService.java), [ShopService](../backend/src/main/java/com/printhub3/backend/service/ShopService.java) |
| BE entity | `Shop`, `SellerApplication`, `ShopFollow`, `ShopReview`, `ShopPayout` |
| Cấu hình | `config/MarketplaceProperties.java` (phí mở sạp, hoa hồng), `util/SlugUtil.java` |

---

## 8. Ví dụ chạy thật

1. An (BUYER) bấm "Mở sạp", điền tên "Sạp Rồng", gửi → `POST /seller/apply` → tạo đơn PENDING.
2. Admin vào `/admin/seller-applications`, thấy đơn của An, bấm **Duyệt**.
3. Backend tạo Shop `slug = sap-rong`, đổi An thành SELLER, gửi thông báo cho An.
4. An nhận thông báo, giờ có menu "Quản lý sạp", bắt đầu đăng sản phẩm.
5. Bình (khách) mở `/shops/sap-rong` → xem sản phẩm, bấm **Theo dõi**, viết đánh giá sạp 5 sao.

👉 Tiếp theo: [06-quan-ly-ban-hang.md](06-quan-ly-ban-hang.md) — người bán quản lý sạp, xử lý đơn, nhận tiền.
