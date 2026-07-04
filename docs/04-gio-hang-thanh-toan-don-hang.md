# 04 — Giỏ hàng → Thanh toán → Đơn hàng

> Đây là "hành trình mua hàng" hoàn chỉnh: bỏ vào **giỏ**, tạo **đơn**, **thanh toán** qua cổng Stripe,
> rồi theo dõi **đơn hàng**. Cả ba đều **cần đăng nhập**.

---

## 1. Bức tranh tổng thể

```
GIỎ HÀNG          →        ĐƠN HÀNG        →      THANH TOÁN         →     THEO DÕI ĐƠN
(Cart)                     (Order)                (Payment - Stripe)       (Order history)
thêm/sửa/xoá SP            chốt địa chỉ,          trả tiền thật/thử,        xem trạng thái
                          tính tiền ở server      webhook xác nhận         PENDING→PAID→...
```

3 bảng chính trong database: **Cart** (giỏ), **Order** (đơn), **Payment** (thanh toán). Một đơn gồm nhiều **OrderItem** (dòng sản phẩm).

---

## 2. Phần A — Giỏ hàng (Cart)

### Endpoints ([CartController](../backend/src/main/java/com/printhub3/backend/controller/CartController.java))

| Thao tác | Method + URL |
|----------|--------------|
| Xem giỏ | `GET /api/v1/cart` |
| Thêm sản phẩm | `POST /api/v1/cart/add` |
| Xoá 1 sản phẩm | `DELETE /api/v1/cart/item/{productId}` |
| Đổi số lượng | `PUT /api/v1/cart/item/{productId}/quantity?quantity=3` |
| Xoá sạch giỏ | `DELETE /api/v1/cart/clear` |

Cả controller gắn `@PreAuthorize("isAuthenticated()")` ở đầu lớp → **mọi** endpoint đều cần đăng nhập.

### Ý nghĩa code — mọi endpoint đều lấy "userId từ token"

```java
private Long getCurrentUserId() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    ...
    if (principal instanceof UserDetailsImpl userDetails) return userDetails.getUserId();
    throw new IllegalStateException("User is not authenticated");
}
```

- Frontend **không gửi** userId. Backend tự lấy từ token (đã được người gác cổng nạp vào SecurityContext — xem file [01](01-xac-thuc-dang-nhap.md)).
- **Vì sao?** Nếu tin userId do client gửi, ai đó có thể xem/sửa giỏ của người khác. Lấy từ token là an toàn tuyệt đối.

### Phía frontend
Giỏ hàng còn được lưu tạm trong **store Zustand** (`store/cartStore`) để hiện số lượng ngay trên biểu tượng giỏ mà không cần gọi API liên tục. Nút "Thêm vào giỏ" ở [ProductCard](../frontend/src/features/products/MarketplacePage.tsx) gọi `addToCart(product.id, 1)`.

---

## 3. Phần B — Tạo đơn hàng (Order)

### Endpoint
`POST /api/v1/orders/create` với địa chỉ giao hàng, phương thức ship, phương thức thanh toán.

### Ý nghĩa code — [OrderService.createOrderFromCart](../backend/src/main/java/com/printhub3/backend/service/OrderService.java)

```java
// Tính tiền Ở SERVER (KHÔNG tin số client gửi lên):
BigDecimal subtotal = cart.getTotalPrice();                       // tạm tính từ giỏ
BigDecimal shippingFee = shippingFeeOf(request.getShippingMethod());  // phí ship theo phương thức
BigDecimal tax = subtotal.multiply(new BigDecimal("0.10"))...;    // thuế 10%
BigDecimal total = subtotal.add(shippingFee).add(tax);           // tổng cộng
```

> **Đây là quy tắc bảo mật cực kỳ quan trọng:** tiền **luôn tính lại ở server**. Kể cả frontend gửi "total = 1đ",
> server bỏ qua và tính đúng theo giá thật trong database. Không bao giờ tin số tiền do trình duyệt gửi.

Tiếp theo:

```java
Order order = Order.builder()
    .orderNumber(generateOrderNumber())     // mã đơn duy nhất
    .user(user).totalAmount(total)
    .orderStatus(Order.OrderStatus.PENDING) // ★ đơn mới: "chờ thanh toán"
    ... .build();
Order savedOrder = orderRepository.save(order);

for (CartItem cartItem : cartItems) {       // sao chép từng dòng giỏ → dòng đơn
    OrderItem orderItem = OrderItem.builder()
        .order(savedOrder).product(cartItem.getProduct())
        .quantity(...).unitPrice(...).subtotal(...).build();
    orderItemRepository.save(orderItem);
}

cartItemRepository.deleteByCart_CartId(cart.getCartId());  // ★ dọn sạch giỏ sau khi tạo đơn
```

- **`PENDING`** = trạng thái khởi đầu: đơn đã tạo nhưng **chưa trả tiền**.
- **Chốt giá tại thời điểm đặt:** `unitPrice` được lưu vào OrderItem. Sau này người bán có đổi giá thì đơn cũ **không đổi**.
- **Dọn giỏ** ngay sau khi tạo đơn để tránh đặt trùng.

### Vòng đời trạng thái đơn (OrderStatus)

```
PENDING → PAID → PROCESSING → CONFIRMED → COMPLETED
   │                                          
   └─(huỷ)→ CANCELLED
```

- `PENDING`: chờ thanh toán → `PAID`: đã trả tiền → `PROCESSING`: đang xử lý.
- `CONFIRMED` / `COMPLETED`: thuộc luồng xử lý của admin + người bán — xem file [06](06-quan-ly-ban-hang.md).

---

## 4. Phần C — Thanh toán qua Stripe

Hệ thống dùng **Stripe** — một cổng thanh toán quốc tế thật. Cách hoạt động dùng **"phiên thanh toán" (checkout session)**:

```
Frontend: POST /payments/create-session { orderId }
        │
        ▼
PaymentService.createPaymentSession()
   1. Tìm đơn, kiểm tra đơn này ĐÚNG là của bạn (chống trả tiền hộ / xem trộm)
   2. Kiểm tra đơn chưa bị huỷ
   3. Gọi Stripe tạo 1 phiên → nhận về đường link trang trả tiền của Stripe
        │
        ▼
Frontend chuyển hướng người dùng sang trang Stripe để nhập thẻ
        │
        ▼  (người dùng trả tiền xong trên Stripe)
Stripe gọi NGƯỢC về backend:  POST /payments/webhook   ← "webhook"
        │
        ▼
PaymentService.handleWebhook()  → cập nhật Payment = thành công, Order = PAID
```

### Ý nghĩa code — kiểm tra chủ sở hữu đơn ([PaymentService](../backend/src/main/java/com/printhub3/backend/service/PaymentService.java))

```java
Order order = orderRepository.findById(request.getOrderId())
        .orElseThrow(() -> new OrderNotFoundException(request.getOrderId()));

if (!order.getUser().getUserId().equals(userId)) {          // ★ đơn này có phải của bạn không?
    throw new PaymentAccessDeniedException(userId, order.getOrderId());
}
if (order.getOrderStatus() == Order.OrderStatus.CANCELLED) { // không trả cho đơn đã huỷ
    throw new InvalidPaymentStateException("Cannot create payment session for cancelled order");
}
```

### Webhook là gì? (khái niệm quan trọng)

- Bình thường **frontend hỏi → backend trả lời**. Nhưng khi trả tiền, người dùng đang ở **trang của Stripe**, không phải web của ta.
- Nên **Stripe chủ động gọi về** backend qua URL `/payments/webhook` để báo "đơn này đã trả tiền xong".
- Vì webhook đến từ bên ngoài, backend **kiểm tra chữ ký** (`Stripe-Signature`) để chắc chắn đúng là Stripe gọi, không phải kẻ giả mạo. Đây là lý do `/payments/webhook` được để **công khai** trong [WebSecurityConfig](../backend/src/main/java/com/printhub3/backend/config/WebSecurityConfig.java) — nhưng vẫn an toàn nhờ chữ ký.

> **Vì sao không tin frontend báo "đã trả tiền"?** Vì frontend có thể bị giả mạo. Chỉ **webhook có chữ ký từ Stripe**
> mới là bằng chứng đáng tin để chuyển đơn sang `PAID`.

---

## 5. Phần D — Theo dõi đơn hàng

### Endpoints ([OrderController](../backend/src/main/java/com/printhub3/backend/controller/OrderController.java))

| Thao tác | URL |
|----------|-----|
| Xem 1 đơn | `GET /api/v1/orders/{orderId}` |
| Danh sách đơn (phân trang) | `GET /api/v1/orders?page=&size=` |
| Lịch sử đơn | `GET /api/v1/orders/history` |
| (SELLER/ADMIN) đổi trạng thái | `PUT /api/v1/orders/{orderId}/status?status=...` |
| (SELLER/ADMIN) cập nhật mã vận đơn | `PUT /api/v1/orders/{orderId}/tracking?trackingNumber=...` |

Trang chi tiết đơn ([OrderDetailPage](../frontend/src/components/orders/OrderDetailPage.tsx)) hiển thị **timeline** (các mốc trạng thái) — backend dựng sẵn danh sách mốc trong `buildOrderTimeline(order)`.

---

## 6. Các file tham gia (tổng hợp)

| Lớp | Giỏ hàng | Đơn hàng | Thanh toán |
|-----|----------|----------|------------|
| FE trang | [CartPage](../frontend/src/components/cart/CartPage.tsx) | [OrderHistoryPage](../frontend/src/components/orders/OrderHistoryPage.tsx), [OrderDetailPage](../frontend/src/components/orders/OrderDetailPage.tsx) | [CheckoutPage](../frontend/src/components/checkout/CheckoutPage.tsx) |
| Controller | [CartController](../backend/src/main/java/com/printhub3/backend/controller/CartController.java) | [OrderController](../backend/src/main/java/com/printhub3/backend/controller/OrderController.java) | [PaymentController](../backend/src/main/java/com/printhub3/backend/controller/PaymentController.java) |
| Service | [CartService](../backend/src/main/java/com/printhub3/backend/service/CartService.java) | [OrderService](../backend/src/main/java/com/printhub3/backend/service/OrderService.java) | [PaymentService](../backend/src/main/java/com/printhub3/backend/service/PaymentService.java) |
| Entity | `Cart`, `CartItem` | `Order`, `OrderItem` | `Payment`, `PaymentTransaction` |

---

## 7. Ví dụ chạy thật

1. Thêm "Rồng thần" (200.000đ) vào giỏ → `POST /cart/add`.
2. Vào giỏ, bấm Thanh toán → điền địa chỉ → `POST /orders/create`.
3. Server tính: tạm tính 200.000 + ship 30.000 + thuế 10% (20.000) = **250.000đ**, tạo đơn `PENDING`, dọn giỏ.
4. `POST /payments/create-session { orderId }` → nhận link Stripe → chuyển sang trang Stripe.
5. Trả tiền xong → Stripe gọi `POST /payments/webhook` (có chữ ký) → backend đặt đơn `PAID`.
6. Vào "Đơn hàng của tôi" → thấy đơn ở trạng thái đã thanh toán, kèm timeline.

👉 Tiếp theo: [05-sap-nguoi-ban.md](05-sap-nguoi-ban.md) — cách mở sạp và bán hàng.
