package com.printhub3.backend.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A seller wallet withdrawal, for both seller and admin listings.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WithdrawalDto {

    private Long withdrawalId;
    private BigDecimal amount;

    private String bankName;
    private String bankAccountNumber;
    private String bankAccountName;
    private String note;

    private String status;            // PENDING | PAID | REJECTED
    private String rejectionReason;

    // Shop / seller info (useful for the admin listing)
    private Long shopId;
    private String shopName;
    private String shopSlug;
    private String ownerName;

    private LocalDateTime processedAt;
    private LocalDateTime createdAt;
}
