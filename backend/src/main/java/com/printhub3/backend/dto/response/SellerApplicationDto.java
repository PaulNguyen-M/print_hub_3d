package com.printhub3.backend.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for a seller application (shop-opening request).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerApplicationDto {

    private Long applicationId;
    private Long applicantId;
    private String applicantName;
    private String applicantEmail;
    private String shopName;
    private String description;
    private String status;
    private BigDecimal openingFee;
    private Boolean feePaid;
    private String rejectionReason;
    private LocalDateTime reviewedAt;
    private Long shopId;
    private String shopSlug;
    private LocalDateTime createdAt;
}
