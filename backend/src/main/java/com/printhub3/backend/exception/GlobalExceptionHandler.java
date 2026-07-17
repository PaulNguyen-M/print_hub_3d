package com.printhub3.backend.exception;

import com.printhub3.backend.dto.response.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

/**
 * GlobalExceptionHandler — Bắt ngoại lệ toàn cục và trả về JSON lỗi thống nhất (ApiResponse)
 * kèm mã HTTP phù hợp cho từng loại lỗi.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 400 — Business / Validation
    @ExceptionHandler(BusinessException.class)
    /** Lỗi nghiệp vụ → 400. */
    public ResponseEntity<ApiResponse<Object>> handleBusiness(BusinessException ex) {
        log.warn("Business error: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ApiResponse.error("400", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    /** Lỗi validate @Valid trên body → 400, gom các thông báo field. */
    public ResponseEntity<ApiResponse<Object>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining(", "));
        log.warn("Validation failure: {}", message);
        return ResponseEntity.badRequest()
                .body(ApiResponse.error("400", message));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    /** Lỗi ràng buộc (constraint) trên tham số → 400. */
    public ResponseEntity<ApiResponse<Object>> handleConstraint(ConstraintViolationException ex) {
        log.warn("Constraint violation: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ApiResponse.error("400", ex.getMessage()));
    }

    // 401 — Authentication
    @ExceptionHandler(AuthenticationException.class)
    /** Lỗi xác thực của ứng dụng → 401. */
    public ResponseEntity<ApiResponse<Object>> handleAuthentication(AuthenticationException ex) {
        log.warn("Authentication error: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("401", ex.getMessage()));
    }

    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    /** Lỗi xác thực của Spring Security → 401. */
    public ResponseEntity<ApiResponse<Object>> handleSpringAuthentication(
            org.springframework.security.core.AuthenticationException ex) {
        log.warn("Spring security authentication error: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("401", "Email hoặc mật khẩu không đúng"));
    }

    // 403 — Access Denied
    @ExceptionHandler(AccessDeniedException.class)
    /** Không đủ quyền → 403. */
    public ResponseEntity<ApiResponse<Object>> handleAccessDenied(AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("403", "Bạn không có quyền thực hiện hành động này"));
    }

    // 404 — Not Found
    @ExceptionHandler(ResourceNotFoundException.class)
    /** Không tìm thấy tài nguyên → 404. */
    public ResponseEntity<ApiResponse<Object>> handleNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("404", ex.getMessage()));
    }

    // 409 — Duplicate
    @ExceptionHandler(DuplicateResourceException.class)
    /** Tài nguyên trùng lặp → 409. */
    public ResponseEntity<ApiResponse<Object>> handleDuplicate(DuplicateResourceException ex) {
        log.warn("Duplicate resource: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error("409", ex.getMessage()));
    }

    // 500 — Unexpected
    @ExceptionHandler(Exception.class)
    /** Mọi lỗi chưa bắt riêng → 500 (ghi log để điều tra). */
    public ResponseEntity<ApiResponse<Object>> handleGeneral(Exception ex) {
        log.error("Unhandled server error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("500", "Lỗi server, vui lòng thử lại sau"));
    }
}
