package com.printhub3.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * ShopPayout Entity - Records the payout to a shop for one order: gross sales of
 * that shop's items in the order, the platform commission taken, and the net
 * amount credited to the shop's balance.
 */
@Entity
@Table(name = "shop_payouts", indexes = {
    @Index(name = "idx_shop_payouts_shop_id", columnList = "shop_id"),
    @Index(name = "idx_shop_payouts_order_id", columnList = "order_id")
}, uniqueConstraints = {
    @UniqueConstraint(columnNames = {"shop_id", "order_id"})
})
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class ShopPayout {

    public enum PayoutStatus { PENDING, PAID }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payout_id")
    private Long payoutId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    /** Total sales of this shop's items in the order. */
    @Column(name = "gross_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal grossAmount;

    /** Commission rate applied (fraction, e.g. 0.15). */
    @Column(name = "commission_rate", nullable = false, precision = 5, scale = 4)
    private BigDecimal commissionRate;

    /** Platform commission taken from the gross. */
    @Column(name = "commission_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal commissionAmount;

    /** Amount credited to the shop (gross - commission). */
    @Column(name = "net_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal netAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PayoutStatus status = PayoutStatus.PAID;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
