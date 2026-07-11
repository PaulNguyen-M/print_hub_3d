package com.printhub3.backend.dto.response;

import lombok.*;

import java.time.LocalDateTime;

/**
 * A buyer's review of a shop.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopReviewDto {

    private Long shopReviewId;
    private Long userId;
    private String userName;
    private String userAvatarUrl;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
    /** Người đánh giá đã thực sự mua hàng tại sạp (tính động, không lưu DB). */
    private Boolean verifiedPurchase;
}
