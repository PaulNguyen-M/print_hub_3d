package com.printhub3.backend.exception;

/**
 * BusinessException — Ném khi vi phạm một quy tắc nghiệp vụ (vd đã có sạp, chưa mua hàng...).
 */
public class BusinessException extends RuntimeException {

    private String code;

    public BusinessException(String message) {
        super(message);
    }

    public BusinessException(String code, String message) {
        super(message);
        this.code = code;
    }

    public BusinessException(String message, Throwable cause) {
        super(message, cause);
    }

    public String getCode() {
        return code;
    }
}
