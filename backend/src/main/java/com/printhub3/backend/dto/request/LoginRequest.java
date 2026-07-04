package com.printhub3.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * LoginRequest DTO - Request for user login
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
}
