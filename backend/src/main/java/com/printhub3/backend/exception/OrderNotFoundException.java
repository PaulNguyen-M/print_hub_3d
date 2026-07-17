package com.printhub3.backend.exception;

/**
 * OrderNotFoundException — Ném khi không tìm thấy đơn hàng (dạng lỗi thanh toán).
 */
public class OrderNotFoundException extends PaymentException {
    public OrderNotFoundException(Long orderId) {
        super("Order not found with ID: " + orderId, "ORDER_NOT_FOUND");
    }
}
