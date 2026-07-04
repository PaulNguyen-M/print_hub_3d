# 08 — Thông báo & Chat thời gian thực

> Hai chức năng "giao tiếp": **Thông báo** (hệ thống báo cho bạn) và **Chat** (nhắn tin trực tiếp giữa người dùng).
> Chat dùng công nghệ **WebSocket** để tin nhắn hiện **ngay lập tức** — đây là điểm kỹ thuật đáng chú ý nhất file này.

---

## PHẦN 1 — THÔNG BÁO (Notification)

### 1.1. Là gì?
Khi có sự kiện liên quan tới bạn (đơn mở sạp được duyệt, có đơn hàng mới, đã nhận tiền...), hệ thống **tạo một thông báo**
lưu vào database. Bạn xem trong chuông thông báo. Tất cả cần **đăng nhập**.

### 1.2. Endpoints ([NotificationController](../backend/src/main/java/com/printhub3/backend/controller/NotificationController.java))

| Thao tác | URL |
|----------|-----|
| Danh sách (phân trang) | `GET /notifications` |
| Đếm chưa đọc | `GET /notifications/unread-count` |
| Lọc theo loại | `GET /notifications/by-type?type=ORDER_UPDATE` |
| Đánh dấu đã đọc | `PUT /notifications/{id}/read` |
| Đánh dấu tất cả đã đọc | `PUT /notifications/read-all` |
| Xoá (mềm) | `DELETE /notifications/{id}` |

### 1.3. Thông báo được tạo ở đâu?
**Không có** endpoint "tạo thông báo" cho người dùng. Thông báo do **backend tự tạo** trong các service khi có sự kiện. Ví dụ bạn đã thấy:

```java
// SellerService khi duyệt đơn mở sạp
notify(applicant, "Đơn mở sạp được duyệt", "Chúc mừng! Sạp ... đã được duyệt.", shop.getShopId());

// OrderWorkflowService khi trả tiền
notify(shop.getOwner(), "Đã nhận thanh toán đơn hàng", "... bạn nhận được ...đ ...", orderId);
```

Mỗi `notify(...)` chỉ đơn giản là `notificationRepository.save(new Notification(...))` với `isRead = false`.

### 1.4. Đếm số chưa đọc (cho cái chuông)

```java
@GetMapping("/unread-count")
public ... countUnread(Authentication auth) {
    long count = notificationService.countUnread(currentUserId(auth));
    return ok(Map.of("unreadCount", count));   // frontend hiện con số đỏ trên chuông
}
```

---

## PHẦN 2 — CHAT THỜI GIAN THỰC (WebSocket)

### 2.1. Vì sao chat khác mọi thứ khác?

Mọi chức năng trước đều theo kiểu **"hỏi–đáp"**: frontend hỏi (request) → backend trả lời (response) → **xong kết nối**.
Kiểu này **không** phù hợp cho chat, vì tin nhắn của người kia đến **bất cứ lúc nào** — chẳng lẽ cứ vài giây lại hỏi "có tin mới không?".

**Giải pháp: WebSocket** — một "đường dây điện thoại luôn mở" giữa trình duyệt và server. Hai bên **đẩy dữ liệu cho nhau bất cứ lúc nào**, không cần hỏi lại.

```
   HTTP thường (REST)                      WebSocket (chat)
   ─────────────────                       ────────────────
   FE: "cho tôi giỏ hàng"                  FE ⇄ Server: đường dây mở suốt
   Server: "đây" → ngắt                    ai có gì → đẩy ngay cho bên kia
   (mỗi lần 1 câu hỏi)                      (không cần hỏi lại)
```

Dự án dùng **STOMP trên WebSocket** — STOMP là "luật giao tiếp" chạy trên WebSocket, có khái niệm *kênh* (topic/queue).

### 2.2. Sơ đồ gửi 1 tin nhắn

```
An gõ tin → gửi qua WebSocket tới đích "/app/chat.send"
        │
        ▼
ChatController.sendMessage()   (@MessageMapping, KHÔNG phải @GetMapping)
   1. Lấy senderId từ token
   2. Lưu tin nhắn vào DB (status = SENT)
   3. Đẩy tin tới hàng riêng của NGƯỜI NHẬN:  /user/{Bình}/queue/messages
   4. Đẩy tin tới hàng riêng của NGƯỜI GỬI:   /user/{An}/queue/messages  (để An thấy tin mình vừa gửi)
        │
        ▼
Bình (đang mở web) nhận tin NGAY, không cần load lại trang
```

### 2.3. Ý nghĩa code ([ChatController](../backend/src/main/java/com/printhub3/backend/controller/ChatController.java))

```java
@MessageMapping("/chat.send")              // ← không phải REST; đây là "đích" của WebSocket
public void sendMessage(@Payload ChatMessageRequest request, Principal principal, ...) {
    Long senderId = ...userDetails.getUserId();          // ai gửi (từ token)

    ChatMessage message = ChatMessage.builder()
        .senderId(senderId).recipientId(request.getRecipientId())
        .content(request.getContent()).messageStatus("SENT").build();
    ChatMessageDto saved = chatService.saveMessage(message);   // lưu DB

    messagingTemplate.convertAndSendToUser(                    // đẩy cho người nhận
        String.valueOf(request.getRecipientId()), "/queue/messages", saved);
    messagingTemplate.convertAndSendToUser(                    // đẩy lại cho người gửi
        String.valueOf(senderId), "/queue/messages", saved);
}
```

- **`@MessageMapping`** thay cho `@GetMapping/@PostMapping`: nó xử lý tin đến qua WebSocket chứ không qua HTTP thường.
- **`convertAndSendToUser(userId, "/queue/messages", data)`**: đẩy dữ liệu vào **hàng đợi riêng** của đúng 1 người → chỉ người đó nhận, người khác không thấy.

### 2.4. Ngoài gửi tin, chat còn có:

```java
@MessageMapping("/chat.typing")   // báo "đang gõ..." cho người kia
@MessageMapping("/chat.read")     // báo "đã xem" (read receipt)
```

- **Trạng thái online** do [PresenceService](../backend/src/main/java/com/printhub3/backend/service/PresenceService.java) + [WebSocketEventListener](../backend/src/main/java/com/printhub3/backend/config/WebSocketEventListener.java) quản lý:
  khi ai đó kết nối/ngắt WebSocket, hệ thống đẩy thông báo lên kênh chung `/topic/presence` để mọi người thấy "đang online/offline".

### 2.5. Phần REST bổ trợ cho chat ([ChatRestController](../backend/src/main/java/com/printhub3/backend/controller/ChatRestController.java))

WebSocket lo phần **real-time**, nhưng để **tải lịch sử** thì vẫn dùng HTTP thường:

| Thao tác | URL |
|----------|-----|
| Danh sách hội thoại (hộp thư) | `GET /chat/conversations` |
| Lịch sử chat với 1 người | `GET /chat/conversation/{otherUserId}` |
| Danh sách ai đang online | `GET /chat/presence` |

**Xây hộp thư** ([ChatService.getConversations](../backend/src/main/java/com/printhub3/backend/service/ChatService.java)): duyệt mọi tin của bạn,
gom theo "người đối thoại" (peer), lấy tin **mới nhất** + đếm **số chưa đọc** cho mỗi người → giống danh sách chat của Messenger.

---

## 3. Các file tham gia

| Nhóm | File |
|------|------|
| Thông báo BE | [NotificationController](../backend/src/main/java/com/printhub3/backend/controller/NotificationController.java), [NotificationService](../backend/src/main/java/com/printhub3/backend/service/NotificationService.java), `entity/Notification.java` |
| Chat BE | [ChatController](../backend/src/main/java/com/printhub3/backend/controller/ChatController.java) (WebSocket), [ChatRestController](../backend/src/main/java/com/printhub3/backend/controller/ChatRestController.java) (REST), [ChatService](../backend/src/main/java/com/printhub3/backend/service/ChatService.java), [PresenceService](../backend/src/main/java/com/printhub3/backend/service/PresenceService.java) |
| Cấu hình WebSocket | [WebSocketConfig](../backend/src/main/java/com/printhub3/backend/config/WebSocketConfig.java), [WebSocketEventListener](../backend/src/main/java/com/printhub3/backend/config/WebSocketEventListener.java), `StompAuthChannelInterceptor` |

---

## 4. Ví dụ chạy thật

1. Bình mua hàng, muốn hỏi người bán An → mở khung chat, gõ "Sản phẩm còn hàng không?".
2. Tin đi qua WebSocket → `ChatController.sendMessage` → lưu DB → đẩy tới An.
3. An (đang mở web) thấy tin **hiện ngay** + thấy "Bình đang gõ..." khi Bình soạn tiếp.
4. An trả lời → tin về Bình tức thì. Khi Bình đọc, An thấy "đã xem".
5. Song song, khi đơn của Bình được duyệt, backend tạo **thông báo** → chuông của Bình +1.

👉 Tiếp theo: [09-dich-vu-in-3d-va-stl.md](09-dich-vu-in-3d-va-stl.md).
