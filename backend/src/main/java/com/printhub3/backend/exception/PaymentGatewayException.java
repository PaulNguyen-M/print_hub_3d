package com.printhub3.backend.exception;

/**
 * PaymentGatewayException — Ném khi thao tác với cổng thanh toán (Stripe...) thất bại.
 */
public class PaymentGatewayException extends RuntimeException {

    private final String gateway;
    private final String operation;
    private final String errorCode;

    public PaymentGatewayException(
            String gateway,
            String operation,
            String errorCode,
            Throwable cause
    ) {
        super(gateway + " " + operation + " failed", cause);

        this.gateway = gateway;
        this.operation = operation;
        this.errorCode = errorCode;
    }

    public String getGateway() {
        return gateway;
    }

    public String getOperation() {
        return operation;
    }

    public String getErrorCode() {
        return errorCode;
    }
    
}
