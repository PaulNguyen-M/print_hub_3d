package com.printhub3.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminUserDto {
    private Long userId;
    private String email;
    private String fullName;
    private String role;
    private Boolean active;
    private Boolean verified;
    private LocalDateTime createdAt;
}
