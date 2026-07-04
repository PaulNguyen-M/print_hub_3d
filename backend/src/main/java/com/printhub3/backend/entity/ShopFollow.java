package com.printhub3.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * ShopFollow Entity - A user following a shop ("sạp").
 */
@Entity
@Table(name = "shop_follows", indexes = {
    @Index(name = "idx_shop_follows_shop_id", columnList = "shop_id"),
    @Index(name = "idx_shop_follows_user_id", columnList = "user_id")
}, uniqueConstraints = {
    @UniqueConstraint(columnNames = {"shop_id", "user_id"})
})
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class ShopFollow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "shop_follow_id")
    private Long shopFollowId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
