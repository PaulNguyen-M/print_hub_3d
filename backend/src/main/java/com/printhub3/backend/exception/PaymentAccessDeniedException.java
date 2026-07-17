package com.printhub3.backend.exception;

/**
 * PaymentAccessDeniedException — Ném khi người dùng không có quyền với tài nguyên thanh toán.
 */
public class PaymentAccessDeniedException extends PaymentException {
    public PaymentAccessDeniedException(Long userId, Long resourceId) {
        super("User " + userId + " is not authorized to access this payment resource: " + resourceId, 
              "ACCESS_DENIED");
    }
    
    public PaymentAccessDeniedException(String message) {
        super(message, "ACCESS_DENIED");
    }
}
