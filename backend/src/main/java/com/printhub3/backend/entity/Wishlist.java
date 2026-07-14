package com.printhub3.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Wishlist Entity - Một người dùng "thích" một sản phẩm
 */
@Entity
@Table(name = "wishlist", indexes = {
    @Index(name = "idx_wishlists_product_id", columnList = "product_id"),
    @Index(name = "idx_wishlist_user_id", columnList = "user_id")
}, uniqueConstraints = {
    @UniqueConstraint(columnNames = {"product_id", "user_id"})
})
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class Wishlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "wishlist_id")
    private Long wishlistId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
