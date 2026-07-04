package com.printhub3.backend.dto.response;

import lombok.*;

import java.time.LocalDateTime;

/**
 * Public-facing product review.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewDto {

    private Long reviewId;
    private Long productId;
    private String productName;
    private Long userId;
    private String userName;
    private String userAvatarUrl;
    private Integer rating;
    private String comment;
    private Boolean verifiedPurchase;
    private Integer helpfulCount;
    private LocalDateTime createdAt;
}
