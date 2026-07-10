package com.printhub3.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Withdrawal Entity - A seller's request to withdraw money from their shop's
 * wallet balance. The requested amount is held (deducted from the shop balance)
 * as soon as the request is created; an admin then marks it PAID (money
 * transferred) or REJECTED (amount refunded to the balance).
 */
@Entity
@Table(name = "withdrawals", indexes = {
        @Index(name = "idx_withdrawals_shop_id", columnList = "shop_id"),
        @Index(name = "idx_withdrawals_status", columnList = "status")
})
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class Withdrawal {

    public enum WithdrawalStatus {
        PENDING,   // đang chờ admin duyệt (số dư đã được giữ)
        PAID,      // admin đã duyệt & chuyển tiền
        REJECTED   // admin từ chối, số tiền đã hoàn lại số dư
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "withdrawal_id")
    private Long withdrawalId;

    /** The shop (seller wallet) the money is withdrawn from. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    // ── Bank / payout destination provided by the seller ────────────────
    @Column(name = "bank_name", length = 120)
    private String bankName;

    @Column(name = "bank_account_number", length = 60)
    private String bankAccountNumber;

    @Column(name = "bank_account_name", length = 150)
    private String bankAccountName;

    /** Optional note from the seller. */
    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private WithdrawalStatus status = WithdrawalStatus.PENDING;

    /** Reason given by the admin when rejecting. */
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    /** The admin who approved/rejected the request. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private User processedBy;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
