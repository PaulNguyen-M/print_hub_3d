package com.printhub3.backend.dto.response;

import lombok.*;
import java.time.LocalDateTime;

/**
 * AuthTokenResponse DTO - JWT token response after login/register
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthTokenResponse {
    
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private Long expiresIn;
    private UserResponse user;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserResponse {
        private Long id;
        private String email;
        private String fullName;
        private String role;
        private String profileImageUrl;
        private LocalDateTime createdAt;
    }
}
