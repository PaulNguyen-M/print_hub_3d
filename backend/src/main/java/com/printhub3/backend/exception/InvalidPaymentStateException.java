package com.printhub3.backend.exception;

/**
 * Exception thrown when a payment operation is not allowed in current state
 */
public class InvalidPaymentStateException extends PaymentException {
    public InvalidPaymentStateException(String message) {
        super(message, "INVALID_PAYMENT_STATE");
    }
    
    public InvalidPaymentStateException(String paymentStatus, String operation) {
        super("Cannot perform " + operation + " on payment with status: " + paymentStatus, 
              "INVALID_PAYMENT_STATE");
    }
}
