package com.printhub3.backend.service;

import com.printhub3.backend.exception.ResourceNotFoundException;

import com.printhub3.backend.dto.request.CreateOrderRequest;
import com.printhub3.backend.dto.response.OrderDto;
import com.printhub3.backend.dto.response.OrderItemDto;
import com.printhub3.backend.dto.response.OrderTimelineDto;
import com.printhub3.backend.dto.response.PaymentDto;
import com.printhub3.backend.dto.response.PaymentTransactionDto;
import com.printhub3.backend.entity.*;
import com.printhub3.backend.mapper.PaymentDtoMapper;
import com.printhub3.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * OrderService — Nghiệp vụ đơn hàng: tạo đơn từ giỏ (tính tiền ở server), dựng DTO
 * đơn kèm timeline, danh sách/lịch sử đơn, cập nhật trạng thái & mã vận đơn.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentDtoMapper paymentDtoMapper;

    /** Tạo đơn từ giỏ hàng: tính tiền ở server (tạm tính + ship + thuế 10%), tạo order-item và dọn giỏ. */
    public Order createOrderFromCart(Long userId, CreateOrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Cart cart = cartRepository.findByUser_UserId(userId)
            .orElseThrow(() -> new com.printhub3.backend.exception.BusinessException(
                    "Giỏ hàng trống, vui lòng thêm sản phẩm trước khi đặt hàng"));

        List<CartItem> cartItems = cartItemRepository.findItemsByCartId(cart.getCartId());
        if (cartItems.isEmpty()) {
            throw new com.printhub3.backend.exception.BusinessException(
                    "Giỏ hàng trống, vui lòng thêm sản phẩm trước khi đặt hàng");
        }

        // Tính tiền ở server (không tin số liệu client gửi lên):
        // tạm tính + phí ship (theo phương thức) + thuế 10%
        BigDecimal subtotal = cart.getTotalPrice() != null ? cart.getTotalPrice() : BigDecimal.ZERO;
        BigDecimal shippingFee = shippingFeeOf(request.getShippingMethod());
        BigDecimal tax = subtotal.multiply(new BigDecimal("0.10")).setScale(0, java.math.RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(shippingFee).add(tax);

        // Create order
        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .user(user)
                .totalAmount(total)
                .shippingFee(shippingFee)
                .tax(tax)
                .shippingAddress(request.getShippingAddress())
                .shippingCity(request.getShippingCity())
                .shippingStateProvince(request.getShippingStateProvince())
                .shippingPostalCode(request.getShippingPostalCode())
                .shippingCountry(request.getShippingCountry())
                .orderStatus(Order.OrderStatus.PENDING)
                .shippingMethod(request.getShippingMethod())
                .paymentMethod(request.getPaymentMethod())
                .notes(request.getNotes())
                .build();

        Order savedOrder = orderRepository.save(order);

        // Create order items from cart
        for (CartItem cartItem : cartItems) {
            if (cartItem.getDeletedAt() == null) {
                OrderItem orderItem = OrderItem.builder()
                        .order(savedOrder)
                        .product(cartItem.getProduct())
                        .quantity(cartItem.getQuantity())
                        .unitPrice(cartItem.getUnitPrice())
                        .subtotal(cartItem.getSubtotal())
                        .build();
                orderItemRepository.save(orderItem);
            }
        }

        // Clear cart
        cartItemRepository.deleteByCart_CartId(cart.getCartId());
        cart.setTotalItems(0);
        cart.setTotalPrice(BigDecimal.ZERO);
        cartRepository.save(cart);

        log.info("Order created: {} for user: {}", savedOrder.getOrderNumber(), userId);
        return savedOrder;
    }

    /** Dựng DTO chi tiết đơn theo id (kèm danh sách món, timeline trạng thái, thanh toán). */
    @Transactional(readOnly = true)
    public OrderDto getOrderDto(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        List<OrderItem> orderItems = orderItemRepository.findItemsByOrderId(orderId);
        List<OrderTimelineDto> timeline = buildOrderTimeline(order);

        return OrderDto.builder()
                .orderId(order.getOrderId())
                .orderNumber(order.getOrderNumber())
                .totalAmount(order.getTotalAmount())
                .shippingFee(order.getShippingFee())
                .tax(order.getTax())
                .orderStatus(order.getOrderStatus().toString())
                .shippingAddress(order.getShippingAddress())
                .shippingCity(order.getShippingCity())
                .shippingStateProvince(order.getShippingStateProvince())
                .shippingPostalCode(order.getShippingPostalCode())
                .shippingCountry(order.getShippingCountry())
                .shippingMethod(order.getShippingMethod())
                .paymentMethod(order.getPaymentMethod())
                .trackingNumber(order.getTrackingNumber())
                .estimatedDelivery(order.getEstimatedDelivery())
                .deliveredAt(order.getDeliveredAt())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .items(orderItems.stream()
                        .filter(item -> item.getDeletedAt() == null)
                        .map(this::mapOrderItemToDto)
                        .collect(Collectors.toList()))
                .timeline(timeline)
                .payment(paymentRepository.findByOrderId(orderId).map(this::mapPaymentToDto).orElse(null))
                .build();
    }

    /** Nạp chồng: dựng DTO từ entity Order (tiện khi đã có sẵn order). */
    @Transactional(readOnly = true)
    public OrderDto getOrderDto(Order order) {
        return getOrderDto(order.getOrderId());
    }

    /**
     * Get user orders with pagination
     */
    /** Danh sách đơn của một người dùng (phân trang). */
    @Transactional(readOnly = true)
    public Page<OrderDto> getUserOrders(Long userId, Pageable pageable) {
        return orderRepository.findOrdersByUserId(userId, pageable)
            .map(this::getOrderDto);
    }

    /** Cập nhật trạng thái đơn; tự đặt ngày giao dự kiến (PROCESSING) và ngày giao thật (DELIVERED). */
    public Order updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        Order.OrderStatus newStatus = Order.OrderStatus.valueOf(status);
        order.setOrderStatus(newStatus);

        // Set estimated delivery if status changes to PROCESSING
        if (newStatus == Order.OrderStatus.PROCESSING && order.getEstimatedDelivery() == null) {
            order.setEstimatedDelivery(LocalDateTime.now().plusDays(7)); // Default 7 days
        }

        // Set delivered date if status changes to DELIVERED
        if (newStatus == Order.OrderStatus.DELIVERED && order.getDeliveredAt() == null) {
            order.setDeliveredAt(LocalDateTime.now());
        }

        log.info("Order status updated: {} -> {}", orderId, status);
        return orderRepository.save(order);
    }

    /** Cập nhật mã vận đơn (tracking number). */
    public Order updateTrackingNumber(Long orderId, String trackingNumber) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        order.setTrackingNumber(trackingNumber);
        return orderRepository.save(order);
    }

    /** Toàn bộ lịch sử đơn của người dùng (không phân trang). */
    @Transactional(readOnly = true)
    public List<OrderDto> getUserOrderHistory(Long userId) {
        return orderRepository.findOrdersByUserIdDesc(userId)
            .stream()
            .map(this::getOrderDto)
            .collect(Collectors.toList());
    }

    /** Dựng dòng thời gian (timeline) của đơn dựa trên trạng thái hiện tại. */
    private List<OrderTimelineDto> buildOrderTimeline(Order order) {
        List<OrderTimelineDto> timeline = new ArrayList<>();

        timeline.add(OrderTimelineDto.builder()
                .status("PENDING")
                .title("Đơn hàng đã được đặt.")
                .description("Đơn hàng của bạn đã được xác nhận.")
                .timestamp(order.getCreatedAt())
                .build());

        if (order.getOrderStatus().ordinal() >= Order.OrderStatus.PROCESSING.ordinal()) {
            timeline.add(OrderTimelineDto.builder()
                    .status("PROCESSING")
                    .title("Xử lý đơn hàng.")
                    .description("Đơn hàng của bạn đang được xử lý.")
                    .timestamp(order.getUpdatedAt())
                    .build());
        }

        // Tiến trình chi tiết (in ấn / hoàn thiện / giao hàng) giờ theo dõi RIÊNG cho từng sạp
        // (order.orderStatus không còn đi qua PRINTING/FINISHING/SHIPPING/DELIVERED nữa —
        // xem khối "Tiến trình theo sạp" ở OrderItemDto.fulfillmentStatus).
        if (order.getOrderStatus() == Order.OrderStatus.CONFIRMED
                || order.getOrderStatus() == Order.OrderStatus.COMPLETED) {
            timeline.add(OrderTimelineDto.builder()
                    .status("CONFIRMED")
                    .title("Đã xác nhận — Đang được hoàn thành.")
                    .description("Người bán đang xử lý đơn hàng của bạn. Xem tiến độ theo từng cửa hàng bên dưới.")
                    .timestamp(order.getUpdatedAt())
                    .build());
        }

        if (order.getOrderStatus() == Order.OrderStatus.COMPLETED) {
            timeline.add(OrderTimelineDto.builder()
                    .status("COMPLETED")
                    .title("Hoàn thành.")
                    .description("Đơn hàng của bạn đã được hoàn tất. Cảm ơn bạn đã mua sắm!")
                    .timestamp(order.getUpdatedAt())
                    .build());
        }


        if (order.getOrderStatus() == Order.OrderStatus.CANCELLED) {
            timeline.add(OrderTimelineDto.builder()
                    .status("CANCELLED")
                    .title("Order Cancelled")
                    .description("Your order has been cancelled")
                    .timestamp(order.getUpdatedAt())
                    .build());
        }

        return timeline;
    }

    /** Chuyển OrderItem sang DTO (kèm ảnh chính của sản phẩm). */
    private OrderItemDto mapOrderItemToDto(OrderItem item) {
        return OrderItemDto.builder()
                .orderItemId(item.getOrderItemId())
                .productId(item.getProduct().getProductId())
                .productName(item.getProduct().getName())
                .productImage(item.getProduct().getImages().stream()
                    .filter(img -> img.getIsPrimary() && img.getDeletedAt() == null)
                    .map(ProductImage::getImageUrl)
                    .findFirst()
                    .orElse(null))
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .subtotal(item.getSubtotal())
                .shopId(item.getProduct().getShop() != null ? item.getProduct().getShop().getShopId() : null)
                .shopName(item.getProduct().getShop() != null ? item.getProduct().getShop().getName() : null)
                .fulfillmentStatus(item.getFulfillmentStatus() != null ? item.getFulfillmentStatus().name() : "PENDING")
                .build();
    }


    /** Chuyển Payment sang DTO (ủy quyền cho PaymentDtoMapper). */
    private PaymentDto mapPaymentToDto(Payment payment) {
        return paymentDtoMapper.mapPaymentToDto(payment);
    }

    /** Phí vận chuyển theo phương thức (đồng bộ với frontend). */
    private BigDecimal shippingFeeOf(String method) {
        if (method == null) return BigDecimal.ZERO;
        return switch (method) {
            case "EXPRESS" -> new BigDecimal("30000");
            case "OVERNIGHT" -> new BigDecimal("60000");
            default -> BigDecimal.ZERO; // STANDARD
        };
    }

    /**
     * Generate unique order number
     */
    /** Sinh mã đơn duy nhất dạng ORD-<timestamp>-<số ngẫu nhiên>. */
    private String generateOrderNumber() {
        return "ORD-" + System.currentTimeMillis() + "-" + new Random().nextInt(10000);
    }
}
