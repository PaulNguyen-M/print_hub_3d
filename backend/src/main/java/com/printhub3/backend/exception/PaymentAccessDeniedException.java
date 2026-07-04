package com.printhub3.backend.exception;

/**
 * Exception thrown when payment is not authorized for the current user
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
