package com.printhub3.backend.exception;

/**
 * Exception thrown when order is not found or invalid
 */
public class OrderNotFoundException extends PaymentException {
    public OrderNotFoundException(Long orderId) {
        super("Order not found with ID: " + orderId, "ORDER_NOT_FOUND");
    }
}
