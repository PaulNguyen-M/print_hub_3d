package com.printhub3.backend.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Shop Entity - A seller's stall ("sạp") inside the marketplace ("chợ").
 * Created when an admin approves a seller's application. Each seller owns
 * exactly one shop; all of their products belong to it.
 */
@Entity
@Table(name = "shops", indexes = {
    @Index(name = "idx_shops_owner_id", columnList = "owner_id"),
    @Index(name = "idx_shops_slug", columnList = "slug"),
    @Index(name = "idx_shops_status", columnList = "status")
})
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class Shop {

    public enum ShopStatus {
        ACTIVE,      // open for business
        SUSPENDED,   // temporarily disabled by admin
        CLOSED       // permanently closed
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "shop_id")
    private Long shopId;

    /** The seller who owns this shop (one shop per user). */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false, unique = true)
    private User owner;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    /** URL-friendly unique identifier, e.g. /shops/{slug}. */
    @Column(name = "slug", nullable = false, unique = true, length = 180)
    private String slug;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    @Column(name = "banner_url", columnDefinition = "TEXT")
    private String bannerUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ShopStatus status = ShopStatus.ACTIVE;

    // ── Aggregated stats ────────────────────────────────────────────────
    @Column(name = "rating", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(name = "total_reviews")
    @Builder.Default
    private Integer totalReviews = 0;

    @Column(name = "total_products")
    @Builder.Default
    private Integer totalProducts = 0;

    @Column(name = "total_sales")
    @Builder.Default
    private Integer totalSales = 0;

    @Column(name = "total_followers")
    @Builder.Default
    private Integer totalFollowers = 0;

    // ── Fees & wallet ───────────────────────────────────────────────────
    /** Per-shop commission rate (fraction, e.g. 0.15 = 15%). Snapshot of platform default at creation. */
    @Column(name = "commission_rate", precision = 5, scale = 4)
    @Builder.Default
    private BigDecimal commissionRate = new BigDecimal("0.15");

    /** Withdrawable balance accumulated from completed payouts (after commission). */
    @Column(name = "balance", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /** IDs of products pinned as "Nổi bật" by the seller (max 6). */
    @Type(JsonType.class)
    @Column(name = "featured_product_ids", columnDefinition = "jsonb")
    @Builder.Default
    private List<Long> featuredProductIds = new ArrayList<>();
}
