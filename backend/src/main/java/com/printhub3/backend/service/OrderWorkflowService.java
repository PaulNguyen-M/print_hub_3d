package com.printhub3.backend.service;

import com.printhub3.backend.dto.response.OrderItemDto;
import com.printhub3.backend.dto.response.SellerOrderDto;
import com.printhub3.backend.entity.*;
import com.printhub3.backend.entity.Order.OrderStatus;

import com.printhub3.backend.entity.OrderItem.FulfillmentStatus;

import com.printhub3.backend.exception.BusinessException;
import com.printhub3.backend.exception.ResourceNotFoundException;
import com.printhub3.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

import java.util.Map;

/**
 * OrderWorkflowService — Vòng đời đơn nhiều bên:
 * người mua thanh toán → admin xác nhận → (các) người bán xác nhận món của mình →
 * admin hoàn tất → mỗi sạp được chi trả (doanh thu − hoa hồng nền tảng).
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OrderWorkflowService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ShopRepository shopRepository;
    private final ShopPayoutRepository payoutRepository;
    private final NotificationRepository notificationRepository;
    private final ProductRepository productRepository;

    /** Chuỗi bước seller tự chuyển: CONFIRMED → PRINTING → FINISHING → SHIPPING → DELIVERED. */
    private static final List<FulfillmentStatus> SELLER_CHAIN = List.of(
            FulfillmentStatus.CONFIRMED, FulfillmentStatus.PRINTING, FulfillmentStatus.FINISHING,
            FulfillmentStatus.SHIPPING, FulfillmentStatus.DELIVERED);

    // ── Admin ───────────────────────────────────────────────────────────

    /** Admin confirms a paid order and notifies the shops involved. */
    /** (Admin) Xác nhận đơn đã thanh toán: chuyển sang CONFIRMED và báo các sạp liên quan. */
    public void adminConfirmOrder(Long orderId) {
        Order order = getOrder(orderId);
        if (order.getOrderStatus() != OrderStatus.PROCESSING && order.getOrderStatus() != OrderStatus.PENDING) {
            throw new BusinessException("Chỉ xác nhận được đơn đang chờ xử lý");
        }
        order.setOrderStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        // Đặt trạng thái xử lý ban đầu cho mọi món = CONFIRMED để các sạp bắt đầu được.
        List<OrderItem> confirmItems = orderItemRepository.findItemsByOrderId(orderId);
        confirmItems.forEach(it -> it.setFulfillmentStatus(FulfillmentStatus.CONFIRMED));
        orderItemRepository.saveAll(confirmItems);


        for (Long shopId : orderItemRepository.findShopIdsByOrder(orderId)) {
            shopRepository.findById(shopId).ifPresent(shop ->
                notify(shop.getOwner(), "Đơn hàng mới cần xác nhận",
                        "Đơn #" + order.getOrderNumber() + " có sản phẩm của sạp \"" + shop.getName()
                                + "\". Vui lòng xác nhận để xử lý.", orderId));
        }
        // Báo cho người mua biết đơn đã được xác nhận và đang xử lý.
        notify(order.getUser(), "Đơn hàng đã được xác nhận",
                "Đơn hàng #" + order.getOrderNumber() + " đã được xác nhận và đang được xử lý.", orderId);
        log.info("Order {} confirmed by admin", orderId);
    }

    /**
     * Admin completes a confirmed order: requires every shop item to be
     * seller-confirmed, then pays out each shop (gross − commission).
     */
    /** (Admin) Hoàn tất đơn: chi trả cho từng sạp (trừ hoa hồng) và đóng đơn (COMPLETED). */
    public void adminCompleteOrder(Long orderId) {
        Order order = getOrder(orderId);
        if (order.getOrderStatus() != OrderStatus.CONFIRMED) {
            throw new BusinessException("Chỉ hoàn tất được đơn đã xác nhận");
        }

        List<OrderItem> items = orderItemRepository.findItemsByOrderId(orderId);
        boolean allConfirmed = items.stream()
                .filter(it -> it.getProduct() != null && it.getProduct().getShop() != null)
                .allMatch(it -> Boolean.TRUE.equals(it.getSellerConfirmed()));
        if (!allConfirmed) {
            throw new BusinessException("Còn sản phẩm người bán chưa xác nhận");
        }

        for (Long shopId : orderItemRepository.findShopIdsByOrder(orderId)) {
            payoutShop(shopId, order);
        }

        order.setOrderStatus(OrderStatus.COMPLETED);
        orderRepository.save(order);
        // Báo cho người mua biết đơn đã hoàn tất.
        notify(order.getUser(), "Đơn hàng đã hoàn tất",
                "Đơn hàng #" + order.getOrderNumber() + " đã hoàn tất. Cảm ơn bạn đã mua sắm!", orderId);
        log.info("Order {} completed and shops paid out", orderId);
    }

        /**
     * (Admin) Duyệt hoàn tất phần hàng của MỘT sạp trong đơn (khi sạp đã xin hoàn tất):
     * chi tiền cho sạp đó; nếu mọi sạp trong đơn đã COMPLETED thì đóng đơn.
     */
    public void adminApproveShopCompletion(Long orderId, Long shopId) {
        Order order = getOrder(orderId);
        List<OrderItem> shopItems = orderItemRepository.findItemsByOrderAndShop(orderId, shopId);
        if (shopItems.isEmpty()) {
            throw new BusinessException("Đơn không có sản phẩm của sạp này");
        }
        if (shopStatus(shopItems) != FulfillmentStatus.AWAITING_APPROVAL) {
            throw new BusinessException("Sạp này chưa xin hoàn tất");
        }

        shopItems.forEach(it -> it.setFulfillmentStatus(FulfillmentStatus.COMPLETED));
        orderItemRepository.saveAll(shopItems);
        payoutShop(shopId, order); // chi tiền cho sạp này (đã chống trả trùng bên trong)

        // Nếu tất cả sạp của đơn đều COMPLETED → đóng đơn tổng.
        List<OrderItem> all = orderItemRepository.findItemsByOrderId(orderId);
        boolean allDone = all.stream()
                .filter(it -> it.getProduct() != null && it.getProduct().getShop() != null)
                .allMatch(it -> it.getFulfillmentStatus() == FulfillmentStatus.COMPLETED);
        if (allDone && order.getOrderStatus() != OrderStatus.COMPLETED) {
            order.setOrderStatus(OrderStatus.COMPLETED);
            orderRepository.save(order);
            notify(order.getUser(), "Đơn hàng đã hoàn tất",
                    "Đơn hàng #" + order.getOrderNumber() + " đã hoàn tất. Cảm ơn bạn đã mua sắm!", orderId);
        }
        log.info("Admin approved completion order {} shop {}", orderId, shopId);
    }


    /** Chi trả cho một sạp phần hàng của họ trong đơn (chống chi trả trùng, cộng vào số dư). */
    private void payoutShop(Long shopId, Order order) {
        if (payoutRepository.existsByShop_ShopIdAndOrder_OrderId(shopId, order.getOrderId())) {
            return; // already paid out
        }
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop", "id", shopId));
        List<OrderItem> shopItems = orderItemRepository.findItemsByOrderAndShop(order.getOrderId(), shopId);

        BigDecimal gross = shopItems.stream()
                .map(OrderItem::getSubtotal)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal rate = shop.getCommissionRate() != null ? shop.getCommissionRate() : new BigDecimal("0.15");
        BigDecimal commission = gross.multiply(rate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal net = gross.subtract(commission);

        payoutRepository.save(ShopPayout.builder()
                .shop(shop)
                .order(order)
                .grossAmount(gross)
                .commissionRate(rate)
                .commissionAmount(commission)
                .netAmount(net)
                .status(ShopPayout.PayoutStatus.PAID)
                .build());

        BigDecimal balance = shop.getBalance() != null ? shop.getBalance() : BigDecimal.ZERO;
        shop.setBalance(balance.add(net));
        int soldQty = shopItems.stream().mapToInt(it -> it.getQuantity() != null ? it.getQuantity() : 0).sum();
        shop.setTotalSales((shop.getTotalSales() != null ? shop.getTotalSales() : 0) + soldQty);
        shopRepository.save(shop);

        // Cộng số lượng đã bán cho từng sản phẩm để thống kê "đã bán" phản ánh đúng.
        for (OrderItem it : shopItems) {
            Product product = it.getProduct();
            if (product == null) continue;
            int qty = it.getQuantity() != null ? it.getQuantity() : 0;
            product.setTotalSold((product.getTotalSold() != null ? product.getTotalSold() : 0) + qty);
            productRepository.save(product);
        }

        notify(shop.getOwner(), "Đã nhận thanh toán đơn hàng",
                "Đơn #" + order.getOrderNumber() + " hoàn tất. Bạn nhận được "
                        + net.toPlainString() + "đ (sau " + rate.multiply(BigDecimal.valueOf(100)).stripTrailingZeros().toPlainString()
                        + "% hoa hồng).", order.getOrderId());
    }

    // ── Seller ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    /** Danh sách đơn có chứa sản phẩm của sạp (góc nhìn seller), kèm khoản thu (phân trang). */
    public Page<SellerOrderDto> getSellerOrders(Long userId, Pageable pageable) {
        Shop shop = shopRepository.findByOwner_UserId(userId)
                .orElseThrow(() -> new BusinessException("Bạn chưa có sạp"));

        List<Long> allIds = orderItemRepository.findOrderIdsByShop(shop.getShopId()); // newest first
        int total = allIds.size();
        int from = (int) pageable.getOffset();
        if (from >= total) {
            return new PageImpl<>(List.of(), pageable, total);
        }
        int to = Math.min(from + pageable.getPageSize(), total);

        List<SellerOrderDto> content = allIds.subList(from, to).stream()
                .map(id -> orderRepository.findById(id).orElse(null))
                .filter(java.util.Objects::nonNull)
                .map(order -> buildSellerOrderDto(order, shop))
                .toList();
        return new PageImpl<>(content, pageable, total);
    }

    /** Seller confirms fulfillment of all their items in an order. */
    /** Seller xác nhận đã xử lý các món của mình trong một đơn. */
    public SellerOrderDto sellerConfirmItems(Long orderId, Long userId) {
        Shop shop = shopRepository.findByOwner_UserId(userId)
                .orElseThrow(() -> new BusinessException("Bạn chưa có sạp"));
        Order order = getOrder(orderId);

        List<OrderItem> shopItems = orderItemRepository.findItemsByOrderAndShop(orderId, shop.getShopId());
        if (shopItems.isEmpty()) {
            throw new BusinessException("Đơn này không có sản phẩm của sạp bạn");
        }
        if (order.getOrderStatus() != OrderStatus.CONFIRMED) {
            throw new BusinessException("Đơn chưa được admin xác nhận hoặc đã xử lý xong");
        }

        LocalDateTime now = LocalDateTime.now();
        shopItems.forEach(it -> {
            it.setSellerConfirmed(true);
            it.setSellerConfirmedAt(now);
        });
        orderItemRepository.saveAll(shopItems);

        // Báo cho người mua biết người bán đã xác nhận chuẩn bị hàng.
        notify(order.getUser(), "Người bán đã xác nhận đơn",
                "Sạp \"" + shop.getName() + "\" đã xác nhận và đang chuẩn bị đơn #" + order.getOrderNumber() + ".", orderId);
        log.info("Seller {} confirmed items of order {}", userId, orderId);
        return buildSellerOrderDto(order, shop);
    }

    /** Seller chuyển đơn của sạp mình sang bước kế tiếp trong chuỗi CONFIRMED→…→DELIVERED. */
    public SellerOrderDto sellerAdvanceStatus(Long orderId, Long userId) {
        Shop shop = shopRepository.findByOwner_UserId(userId)
                .orElseThrow(() -> new BusinessException("Bạn chưa có sạp"));
        Order order = getOrder(orderId);
        List<OrderItem> shopItems = orderItemRepository.findItemsByOrderAndShop(orderId, shop.getShopId());
        if (shopItems.isEmpty()) {
            throw new BusinessException("Đơn này không có sản phẩm của sạp bạn");
        }

        FulfillmentStatus current = shopStatus(shopItems);
        int idx = SELLER_CHAIN.indexOf(current);
        if (idx < 0 || idx >= SELLER_CHAIN.size() - 1) {
            throw new BusinessException("Không thể chuyển bước ở trạng thái hiện tại");
        }
        FulfillmentStatus next = SELLER_CHAIN.get(idx + 1);
        shopItems.forEach(it -> it.setFulfillmentStatus(next));
        orderItemRepository.saveAll(shopItems);

        notify(order.getUser(), "Cập nhật đơn hàng",
                "Sạp \"" + shop.getName() + "\" đã chuyển đơn #" + order.getOrderNumber()
                        + " sang trạng thái: " + next.name() + ".", orderId);
        log.info("Seller {} advanced order {} (shop {}) to {}", userId, orderId, shop.getShopId(), next);
        return buildSellerOrderDto(order, shop);
    }

    /** Seller đã giao xong → xin hoàn tất (chuyển DELIVERED → AWAITING_APPROVAL để admin duyệt). */
    public SellerOrderDto sellerRequestCompletion(Long orderId, Long userId) {
        Shop shop = shopRepository.findByOwner_UserId(userId)
                .orElseThrow(() -> new BusinessException("Bạn chưa có sạp"));
        Order order = getOrder(orderId);
        List<OrderItem> shopItems = orderItemRepository.findItemsByOrderAndShop(orderId, shop.getShopId());
        if (shopItems.isEmpty()) {
            throw new BusinessException("Đơn này không có sản phẩm của sạp bạn");
        }
        if (shopStatus(shopItems) != FulfillmentStatus.DELIVERED) {
            throw new BusinessException("Chỉ xin hoàn tất khi đã giao hàng (DELIVERED)");
        }
        shopItems.forEach(it -> it.setFulfillmentStatus(FulfillmentStatus.AWAITING_APPROVAL));
        orderItemRepository.saveAll(shopItems);
        log.info("Seller {} requested completion for order {} shop {}", userId, orderId, shop.getShopId());
        return buildSellerOrderDto(order, shop);
    }


    // ── Helpers ───────────────────────────────────────────────────────────

    /** Dựng DTO đơn ở góc nhìn seller: chỉ gồm các món thuộc sạp và khoản thu tương ứng. */
    private SellerOrderDto buildSellerOrderDto(Order order, Shop shop) {
        List<OrderItem> shopItems = orderItemRepository.findItemsByOrderAndShop(order.getOrderId(), shop.getShopId());
        BigDecimal gross = shopItems.stream()
                .map(OrderItem::getSubtotal).filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal rate = shop.getCommissionRate() != null ? shop.getCommissionRate() : new BigDecimal("0.15");
        BigDecimal commission = gross.multiply(rate).setScale(2, RoundingMode.HALF_UP);
        boolean confirmed = !shopItems.isEmpty()
                && shopItems.stream().allMatch(it -> Boolean.TRUE.equals(it.getSellerConfirmed()));
        boolean paidOut = payoutRepository.existsByShop_ShopIdAndOrder_OrderId(shop.getShopId(), order.getOrderId());

        return SellerOrderDto.builder()
                .orderId(order.getOrderId())
                .orderNumber(order.getOrderNumber())
                .orderStatus(order.getOrderStatus().name())
                .buyerName(order.getUser() != null ? order.getUser().getFullName() : null)
                .shippingAddress(order.getShippingAddress())
                .shippingCity(order.getShippingCity())
                .createdAt(order.getCreatedAt())
                .items(shopItems.stream().map(this::toItemDto).toList())
                .shopSubtotal(gross)
                .commissionRate(rate)
                .commissionAmount(commission)
                .netEarning(gross.subtract(commission))
                .sellerConfirmed(confirmed)
                .paidOut(paidOut)
                .fulfillmentStatus(shopStatus(shopItems).name())
                .build();
    }

    /** Chuyển OrderItem sang DTO. */
    private OrderItemDto toItemDto(OrderItem it) {
        Product p = it.getProduct();
        String image = null;
        if (p != null && p.getImages() != null) {
            image = p.getImages().stream()
                    .filter(img -> img.getDeletedAt() == null)
                    .map(ProductImage::getImageUrl)
                    .findFirst().orElse(null);
        }
        return OrderItemDto.builder()
                .orderItemId(it.getOrderItemId())
                .productId(p != null ? p.getProductId() : null)
                .productName(p != null ? p.getName() : null)
                .productImage(image)
                .quantity(it.getQuantity())
                .unitPrice(it.getUnitPrice())
                .subtotal(it.getSubtotal())
                .build();
    }

    /** Lấy đơn theo id, ném lỗi nếu không có. */
    private Order getOrder(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
    }

    /** Trạng thái xử lý hiện tại của một sạp (các món cùng sạp đồng bộ; null → PENDING). */
    private FulfillmentStatus shopStatus(List<OrderItem> shopItems) {
        FulfillmentStatus s = shopItems.isEmpty() ? null : shopItems.get(0).getFulfillmentStatus();
        return s != null ? s : FulfillmentStatus.PENDING;
    }


    /** Gửi một thông báo liên quan đến đơn cho người dùng. */
    private void notify(User user, String title, String message, Long orderId) {
        if (user == null) return;
        notificationRepository.save(Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .notificationType(Notification.NotificationType.ORDER_UPDATE)
                .relatedEntityType("ORDER")
                .relatedEntityId(orderId)
                .isRead(false)
                .build());
    }
}
