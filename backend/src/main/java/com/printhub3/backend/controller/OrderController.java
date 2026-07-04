package com.printhub3.backend.controller;

import com.printhub3.backend.dto.request.CreateOrderRequest;
import com.printhub3.backend.dto.response.ApiResponse;
import com.printhub3.backend.dto.response.OrderDto;
import com.printhub3.backend.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.printhub3.backend.security.service.UserDetailsImpl;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class OrderController {

    private final OrderService orderService;

    /**
     * Create order from cart
     */
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<OrderDto>> createOrder(@RequestBody CreateOrderRequest request) {
        Long userId = getCurrentUserId();
        var order = orderService.createOrderFromCart(userId, request);
        OrderDto orderDto = orderService.getOrderDto(order.getOrderId());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(orderDto, "Order created successfully"));
    }

    /**
     * Get order by ID
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderDto>> getOrder(@PathVariable Long orderId) {
        OrderDto order = orderService.getOrderDto(orderId);
        return ResponseEntity.ok(ApiResponse.success(order, "Order retrieved successfully"));
    }

    /**
     * Get user's orders with pagination
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<OrderDto>>> getUserOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction) {
        Long userId = getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<OrderDto> orders = orderService.getUserOrders(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(orders, "Orders retrieved successfully"));
    }

    /**
     * Get order history (all orders for user)
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getOrderHistory() {
        Long userId = getCurrentUserId();
        List<OrderDto> orders = orderService.getUserOrderHistory(userId);
        return ResponseEntity.ok(ApiResponse.success(orders, "Order history retrieved successfully"));
    }

    /**
     * Update order status (Admin only)
     */
    @PutMapping("/{orderId}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SELLER')")
    public ResponseEntity<ApiResponse<OrderDto>> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam String status) {
        var order = orderService.updateOrderStatus(orderId, status);
        OrderDto orderDto = orderService.getOrderDto(order.getOrderId());
        return ResponseEntity.ok(ApiResponse.success(orderDto, "Order status updated successfully"));
    }

    /**
     * Update tracking number
     */
    @PutMapping("/{orderId}/tracking")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SELLER')")
    public ResponseEntity<ApiResponse<OrderDto>> updateTrackingNumber(
            @PathVariable Long orderId,
            @RequestParam String trackingNumber) {
        var order = orderService.updateTrackingNumber(orderId, trackingNumber);
        OrderDto orderDto = orderService.getOrderDto(order.getOrderId());
        return ResponseEntity.ok(ApiResponse.success(orderDto, "Tracking number updated successfully"));
    }

    /**
     * Get current user ID from security context
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("User is not authenticated");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetailsImpl userDetails) {
            return userDetails.getUserId();
        }

        throw new IllegalStateException("Unable to resolve current user ID");
    }
}
