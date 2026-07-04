package com.printhub3.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class AdminProductDto {
    private Long productId;
    private String name;
    private String sellerName;
    private String sellerEmail;
    private String shopName;
    private String thumbnailUrl;
    private BigDecimal price;
    private Integer stockQuantity;
    private Boolean active;
    private String status;
    private String rejectionReason;
    private LocalDateTime createdAt;
}
