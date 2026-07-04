package com.printhub3.backend.service;

import com.printhub3.backend.dto.response.OrderItemDto;
import com.printhub3.backend.dto.response.SellerOrderDto;
import com.printhub3.backend.entity.*;
import com.printhub3.backend.entity.Order.OrderStatus;
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

/**
 * OrderWorkflowService - The multi-party order lifecycle:
 * buyer pays (mock) → admin confirms → seller(s) confirm their items →
 * admin completes → each shop is paid out (gross − platform commission).
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

    // ── Admin ───────────────────────────────────────────────────────────

    /** Admin confirms a paid order and notifies the shops involved. */
    public void adminConfirmOrder(Long orderId) {
        Order order = getOrder(orderId);
        if (order.getOrderStatus() != OrderStatus.PROCESSING && order.getOrderStatus() != OrderStatus.PENDING) {
            throw new BusinessException("Chỉ xác nhận được đơn đang chờ xử lý");
        }
        order.setOrderStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        for (Long shopId : orderItemRepository.findShopIdsByOrder(orderId)) {
            shopRepository.findById(shopId).ifPresent(shop ->
                notify(shop.getOwner(), "Đơn hàng mới cần xác nhận",
                        "Đơn #" + order.getOrderNumber() + " có sản phẩm của sạp \"" + shop.getName()
                                + "\". Vui lòng xác nhận để xử lý.", orderId));
        }
        log.info("Order {} confirmed by admin", orderId);
    }

    /**
     * Admin completes a confirmed order: requires every shop item to be
     * seller-confirmed, then pays out each shop (gross − commission).
     */
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
        log.info("Order {} completed and shops paid out", orderId);
    }

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

        notify(shop.getOwner(), "Đã nhận thanh toán đơn hàng",
                "Đơn #" + order.getOrderNumber() + " hoàn tất. Bạn nhận được "
                        + net.toPlainString() + "đ (sau " + rate.multiply(BigDecimal.valueOf(100)).stripTrailingZeros().toPlainString()
                        + "% hoa hồng).", order.getOrderId());
    }

    // ── Seller ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
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

        log.info("Seller {} confirmed items of order {}", userId, orderId);
        return buildSellerOrderDto(order, shop);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

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
                .build();
    }

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

    private Order getOrder(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
    }

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
