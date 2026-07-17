package com.printhub3.backend.exception;

/**
 * AuthenticationException — Ném khi xác thực thất bại (sai email/mật khẩu, token hỏng...).
 */
public class AuthenticationException extends RuntimeException {

    public AuthenticationException(String message) {
        super(message);
    }

    public AuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }
}
