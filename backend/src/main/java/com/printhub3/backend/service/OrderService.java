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

    /**
     * Create order from cart
     */
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

    /**
     * Get order by ID with DTO
     */
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

    /**
     * Overload: build OrderDto from Order entity (convenience for mapping)
     */
    @Transactional(readOnly = true)
    public OrderDto getOrderDto(Order order) {
        return getOrderDto(order.getOrderId());
    }

    /**
     * Get user orders with pagination
     */
    @Transactional(readOnly = true)
    public Page<OrderDto> getUserOrders(Long userId, Pageable pageable) {
        return orderRepository.findOrdersByUserId(userId, pageable)
            .map(this::getOrderDto);
    }

    /**
     * Update order status
     */
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

    /**
     * Update tracking number
     */
    public Order updateTrackingNumber(Long orderId, String trackingNumber) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        order.setTrackingNumber(trackingNumber);
        return orderRepository.save(order);
    }

    /**
     * Get order history for user
     */
    @Transactional(readOnly = true)
    public List<OrderDto> getUserOrderHistory(Long userId) {
        return orderRepository.findOrdersByUserIdDesc(userId)
            .stream()
            .map(this::getOrderDto)
            .collect(Collectors.toList());
    }

    /**
     * Build order timeline based on status changes
     */
    private List<OrderTimelineDto> buildOrderTimeline(Order order) {
        List<OrderTimelineDto> timeline = new ArrayList<>();

        timeline.add(OrderTimelineDto.builder()
                .status("PENDING")
                .title("Order Placed")
                .description("Your order has been confirmed")
                .timestamp(order.getCreatedAt())
                .build());

        if (order.getOrderStatus().ordinal() >= Order.OrderStatus.PROCESSING.ordinal()) {
            timeline.add(OrderTimelineDto.builder()
                    .status("PROCESSING")
                    .title("Order Processing")
                    .description("Your order is being processed")
                    .timestamp(order.getUpdatedAt())
                    .build());
        }

        if (order.getOrderStatus().ordinal() >= Order.OrderStatus.PRINTING.ordinal()) {
            timeline.add(OrderTimelineDto.builder()
                    .status("PRINTING")
                    .title("Printing in Progress")
                    .description("Your 3D model is being printed")
                    .timestamp(order.getUpdatedAt())
                    .build());
        }

        if (order.getOrderStatus().ordinal() >= Order.OrderStatus.FINISHING.ordinal()) {
            timeline.add(OrderTimelineDto.builder()
                    .status("FINISHING")
                    .title("Post-Processing")
                    .description("Your print is being finished and prepared for shipping")
                    .timestamp(order.getUpdatedAt())
                    .build());
        }

        if (order.getOrderStatus().ordinal() >= Order.OrderStatus.SHIPPING.ordinal()) {
            timeline.add(OrderTimelineDto.builder()
                    .status("SHIPPING")
                    .title("Shipped")
                    .description("Your order is on its way. Tracking: " + order.getTrackingNumber())
                    .timestamp(order.getUpdatedAt())
                    .build());
        }

        if (order.getOrderStatus() == Order.OrderStatus.DELIVERED) {
            timeline.add(OrderTimelineDto.builder()
                    .status("DELIVERED")
                    .title("Delivered")
                    .description("Your order has been delivered")
                    .timestamp(order.getDeliveredAt())
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

    /**
     * Map OrderItem to DTO
     */
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
                .build();
    }

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
    private String generateOrderNumber() {
        return "ORD-" + System.currentTimeMillis() + "-" + new Random().nextInt(10000);
    }
}
