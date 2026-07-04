package com.printhub3.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * ProductReview Entity - Customer product reviews and ratings
 */
@Entity
@Table(name = "product_reviews", indexes = {
    @Index(name = "idx_product_reviews_product_id", columnList = "product_id"),
    @Index(name = "idx_product_reviews_user_id", columnList = "user_id"),
    @Index(name = "idx_product_reviews_created_at", columnList = "created_at")
}, uniqueConstraints = {
    @UniqueConstraint(columnNames = {"product_id", "user_id"})
})
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class ProductReview {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long reviewId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "rating", nullable = false)
    private Integer rating;
    
    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;
    
    @Column(name = "is_verified_purchase")
    private Boolean isVerifiedPurchase = false;
    
    @Column(name = "helpful_count")
    private Integer helpfulCount = 0;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
