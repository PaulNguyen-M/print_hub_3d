package com.printhub3.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.time.LocalDateTime;

/**
 * ApiResponse DTO - Standardized API response wrapper
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    
    private boolean success;
    private String code;
    private String message;
    private T data;
    private LocalDateTime timestamp;
    private String path;
    
    // Constructor for success response
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .code("200")
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    // Constructor for error response
    public static <T> ApiResponse<T> error(String code, String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .code(code)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    // Constructor for created response
    public static <T> ApiResponse<T> created(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .code("201")
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
