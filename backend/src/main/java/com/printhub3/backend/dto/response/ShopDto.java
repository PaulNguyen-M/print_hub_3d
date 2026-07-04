package com.printhub3.backend.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Public-facing shop ("sạp") profile.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopDto {

    private Long shopId;
    private String name;
    private String slug;
    private String description;
    private String logoUrl;
    private String bannerUrl;
    private String status;

    private BigDecimal rating;
    private Integer totalReviews;
    private Integer totalProducts;
    private Integer totalSales;
    private Integer totalFollowers;

    // Owner (seller) public info
    private Long ownerId;
    private String ownerName;
    private String ownerAvatarUrl;

    /** Withdrawable balance — only populated for the shop owner, null in public view. */
    private BigDecimal balance;

    /** Whether the current viewer follows this shop (null if not authenticated). */
    private Boolean isFollowing;

    private LocalDateTime createdAt;

    /** Product IDs pinned as "Nổi bật" by the seller. */
    private List<Long> featuredProductIds;
}
