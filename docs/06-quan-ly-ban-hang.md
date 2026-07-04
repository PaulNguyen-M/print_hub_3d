# 06 — Quản lý bán hàng: Bảng điều khiển người bán, xử lý đơn & trả hoa hồng

> Sau khi có sạp, người bán dùng **Bảng điều khiển (Creator Dashboard)** để đăng sản phẩm, chỉnh sạp,
> xử lý đơn và **nhận tiền**. File này giải thích "luồng xử lý đơn nhiều bên" — phần phức tạp và hay nhất của hệ thống.

---

## 1. Bảng điều khiển người bán có gì?

Trang [CreatorDashboardPage.tsx](../frontend/src/features/creator/CreatorDashboardPage.tsx) (route `/creator`) gồm các tab:

| Tab | Chức năng | API |
|-----|-----------|-----|
| Sản phẩm | Đăng / sửa / xoá sản phẩm của mình | `POST/PUT/DELETE /products`, `GET /products/my` |
| Sạp của tôi | Sửa tên, mô tả, logo, banner sạp; xem số dư ví | `GET/PUT /seller/shop` |
| Đơn hàng | Xem đơn có sản phẩm của mình, xác nhận đơn, xem tiền lời | `GET /seller/orders`, `POST /seller/orders/{id}/confirm` |

---

## 2. Đăng sản phẩm — sản phẩm được gắn vào sạp thế nào

Khi người bán tạo sản phẩm, hệ thống **tự gắn** nó vào sạp của họ ([ProductService.createProduct](../backend/src/main/java/com/printhub3/backend/service/ProductService.java)):

```java
com.printhub3.backend.entity.Shop shop =
        shopRepository.findByOwner_UserId(seller.getUserId()).orElse(null);   // tìm sạp của người bán

Product product = Product.builder()
        ... .seller(seller).shop(shop)          // ★ gắn vào sạp
        .isActive(false)                        // ★ CHƯA hiển thị ngay
        .status(Product.ProductStatus.PENDING)  // ★ chờ admin duyệt
        .build();
```

> **Quy tắc quan trọng:** sản phẩm mới **không lên chợ ngay**. Nó ở trạng thái `PENDING` + `isActive = false`.
> **Admin phải duyệt** thì sản phẩm mới `isActive = true` và xuất hiện ngoài chợ (xem file [07](07-quan-tri-admin.md)).
> Đây là lý do trong luồng chợ ([luong-cho-san-pham.md](luong-cho-san-pham.md)) luôn lọc `isActive = true`.

---

## 3. Luồng xử lý đơn hàng nhiều bên (trái tim của hệ thống)

Một đơn hàng có thể chứa sản phẩm của **nhiều sạp khác nhau**. Nên việc "hoàn tất đơn" cần phối hợp
**3 bên**: người mua, admin, và (các) người bán. Luồng như sau:

```
        NGƯỜI MUA trả tiền  →  đơn: PAID → PROCESSING
                                    │
                                    ▼
        ADMIN "Xác nhận đơn"   →  adminConfirmOrder()   →  đơn: CONFIRMED
                                    │  (gửi thông báo cho MỌI sạp có hàng trong đơn)
                                    ▼
        NGƯỜI BÁN "Xác nhận"   →  sellerConfirmItems()  →  đánh dấu các dòng hàng của sạp = đã xác nhận
            (mỗi sạp xác nhận phần hàng của mình)
                                    │
                                    ▼
        ADMIN "Hoàn tất & trả tiền" → adminCompleteOrder() → đơn: COMPLETED
            - điều kiện: MỌI sạp đã xác nhận
            - trả tiền từng sạp: net = tổng − 15% hoa hồng
            - cộng net vào ví (balance) của sạp
            - gửi thông báo "đã nhận tiền"
```

### Vì sao cần nhiều bước vậy?
- **Admin xác nhận**: kiểm soát chất lượng, chống đơn gian lận trước khi báo người bán.
- **Người bán xác nhận**: xác nhận "tôi có hàng, sẽ giao".
- **Admin hoàn tất**: chỉ khi tất cả sẵn sàng, mới chốt đơn và **chuyển tiền**. Tiền chỉ về tay người bán ở bước cuối.

---

## 4. Ý nghĩa code — 3 hàm chính ([OrderWorkflowService](../backend/src/main/java/com/printhub3/backend/service/OrderWorkflowService.java))

### 4.1. Admin xác nhận + báo các sạp

```java
public void adminConfirmOrder(Long orderId) {
    Order order = getOrder(orderId);
    if (order.getOrderStatus() != PROCESSING && order.getOrderStatus() != PENDING)
        throw new BusinessException("Chỉ xác nhận được đơn đang chờ xử lý");
    order.setOrderStatus(OrderStatus.CONFIRMED);
    orderRepository.save(order);

    for (Long shopId : orderItemRepository.findShopIdsByOrder(orderId)) {   // mọi sạp có hàng
        shopRepository.findById(shopId).ifPresent(shop ->
            notify(shop.getOwner(), "Đơn hàng mới cần xác nhận", "...", orderId));
    }
}
```

- `findShopIdsByOrder`: tìm **tất cả sạp** có sản phẩm trong đơn này → gửi thông báo cho từng chủ sạp.

### 4.2. Người bán xác nhận phần hàng của mình

```java
public SellerOrderDto sellerConfirmItems(Long orderId, Long userId) {
    Shop shop = shopRepository.findByOwner_UserId(userId)...;         // sạp của người đang đăng nhập
    List<OrderItem> shopItems = orderItemRepository.findItemsByOrderAndShop(orderId, shop.getShopId());
    if (shopItems.isEmpty()) throw new BusinessException("Đơn này không có sản phẩm của sạp bạn");
    if (order.getOrderStatus() != CONFIRMED) throw new BusinessException("Đơn chưa được admin xác nhận...");

    shopItems.forEach(it -> { it.setSellerConfirmed(true); it.setSellerConfirmedAt(now); });  // chỉ đánh dấu hàng CỦA MÌNH
    orderItemRepository.saveAll(shopItems);
}
```

- Người bán **chỉ** xác nhận được các dòng hàng thuộc sạp mình (`findItemsByOrderAndShop`). Không đụng được hàng của sạp khác.

### 4.3. Admin hoàn tất + trả tiền (quan trọng nhất)

```java
public void adminCompleteOrder(Long orderId) {
    Order order = getOrder(orderId);
    if (order.getOrderStatus() != CONFIRMED) throw new BusinessException("Chỉ hoàn tất được đơn đã xác nhận");

    // ★ điều kiện: MỌI dòng hàng (có sạp) đều đã được người bán xác nhận
    boolean allConfirmed = items.stream()
        .filter(it -> it.getProduct() != null && it.getProduct().getShop() != null)
        .allMatch(it -> Boolean.TRUE.equals(it.getSellerConfirmed()));
    if (!allConfirmed) throw new BusinessException("Còn sản phẩm người bán chưa xác nhận");

    for (Long shopId : orderItemRepository.findShopIdsByOrder(orderId))
        payoutShop(shopId, order);        // trả tiền từng sạp

    order.setOrderStatus(OrderStatus.COMPLETED);
    orderRepository.save(order);
}
```

### 4.4. Tính tiền trả cho một sạp — `payoutShop`

```java
if (payoutRepository.existsByShop_ShopIdAndOrder_OrderId(shopId, order.getOrderId())) return; // ★ chống trả 2 lần

BigDecimal gross = shopItems.stream().map(OrderItem::getSubtotal).reduce(ZERO, add); // tổng tiền hàng của sạp
BigDecimal rate  = shop.getCommissionRate();               // 0.15
BigDecimal commission = gross.multiply(rate)...;           // hoa hồng = 15% × tổng
BigDecimal net = gross.subtract(commission);               // người bán thực nhận

payoutRepository.save(ShopPayout.builder()                 // ghi 1 phiếu chi
    .shop(shop).order(order).grossAmount(gross)
    .commissionAmount(commission).netAmount(net).status(PAID).build());

shop.setBalance(shop.getBalance().add(net));               // ★ cộng tiền vào ví sạp
shopRepository.save(shop);
notify(shop.getOwner(), "Đã nhận thanh toán đơn hàng", "... bạn nhận được " + net + "đ ...", orderId);
```

- **`gross`** = tổng tiền các sản phẩm của **riêng sạp này** trong đơn.
- **`commission`** = 15% × gross (tiền nền tảng giữ lại).
- **`net`** = gross − commission = tiền người bán thực nhận, được **cộng vào ví `balance`** của sạp.
- **`existsByShop...` ở đầu** = chống trả tiền trùng (nếu lỡ bấm hoàn tất 2 lần).
- Mỗi lần trả tạo một bản ghi `ShopPayout` = "hoá đơn chi" để đối soát về sau.

---

## 5. Số dư ví (`balance`) — ai thấy được?

Trong `ShopDto`, trường `balance` **chỉ trả về cho chủ sạp** (không lộ cho khách xem trang sạp).
Người bán thấy số dư này ở tab "Đơn hàng / Ví" trong Bảng điều khiển.

---

## 6. Các file tham gia

| Lớp | File |
|-----|------|
| FE bảng điều khiển | [CreatorDashboardPage.tsx](../frontend/src/features/creator/CreatorDashboardPage.tsx) |
| FE sửa sạp | [ShopCustomizePage.tsx](../frontend/src/features/seller/ShopCustomizePage.tsx) |
| BE controller | [SellerController](../backend/src/main/java/com/printhub3/backend/controller/SellerController.java) (đơn của người bán), [AdminController](../backend/src/main/java/com/printhub3/backend/controller/AdminController.java) (xác nhận/hoàn tất) |
| BE service | [OrderWorkflowService](../backend/src/main/java/com/printhub3/backend/service/OrderWorkflowService.java), [ShopService](../backend/src/main/java/com/printhub3/backend/service/ShopService.java), [ProductService](../backend/src/main/java/com/printhub3/backend/service/ProductService.java) |
| BE entity | `ShopPayout` (phiếu chi), `OrderItem` (có cờ `sellerConfirmed`), `Shop` (có `balance`) |

---

## 7. Ví dụ chạy thật

Đơn #A100 gồm: 2 sản phẩm của **Sạp Rồng** (tổng 300.000đ) + 1 sản phẩm của **Sạp Mèo** (100.000đ). Đã thanh toán.

1. Admin bấm **Xác nhận đơn** → đơn `CONFIRMED`, Sạp Rồng và Sạp Mèo đều nhận thông báo.
2. Chủ Sạp Rồng bấm **Xác nhận** → 2 dòng hàng của Rồng = đã xác nhận.
3. Chủ Sạp Mèo bấm **Xác nhận** → 1 dòng hàng của Mèo = đã xác nhận.
4. Admin bấm **Hoàn tất & trả tiền**:
   - Sạp Rồng: net = 300.000 − 15% (45.000) = **255.000đ** → cộng vào ví Rồng.
   - Sạp Mèo: net = 100.000 − 15% (15.000) = **85.000đ** → cộng vào ví Mèo.
   - Đơn → `COMPLETED`. Cả 2 sạp nhận thông báo "đã nhận tiền".

👉 Tiếp theo: [07-quan-tri-admin.md](07-quan-tri-admin.md) — góc nhìn của admin.
