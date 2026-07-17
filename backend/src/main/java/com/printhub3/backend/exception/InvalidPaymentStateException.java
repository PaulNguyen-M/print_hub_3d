package com.printhub3.backend.exception;

/**
 * InvalidPaymentStateException — Ném khi thao tác thanh toán không hợp lệ ở trạng thái hiện tại.
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
