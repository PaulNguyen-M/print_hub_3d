package com.printhub3.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * ShopReview Entity - A buyer's rating/review of a shop ("sạp") as a whole.
 * Distinct from product reviews. Drives the shop's aggregate rating.
 */
@Entity
@Table(name = "shop_reviews", indexes = {
    @Index(name = "idx_shop_reviews_shop_id", columnList = "shop_id"),
    @Index(name = "idx_shop_reviews_user_id", columnList = "user_id")
}, uniqueConstraints = {
    @UniqueConstraint(columnNames = {"shop_id", "user_id"})
})
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class ShopReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "shop_review_id")
    private Long shopReviewId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
