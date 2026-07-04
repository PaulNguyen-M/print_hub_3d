package com.printhub3.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * SellerApplication Entity - A buyer's request to open a shop ("mở sạp").
 * Submitted by a BUYER, reviewed by an ADMIN. On approval a {@link Shop} is
 * created and the applicant is upgraded to the SELLER role.
 */
@Entity
@Table(name = "seller_applications", indexes = {
    @Index(name = "idx_seller_app_applicant", columnList = "applicant_id"),
    @Index(name = "idx_seller_app_status", columnList = "status")
})
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class SellerApplication {

    public enum ApplicationStatus {
        PENDING,    // awaiting admin review
        APPROVED,   // approved, shop created
        REJECTED    // declined by admin
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "application_id")
    private Long applicationId;

    /** The buyer requesting to become a seller. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applicant_id", nullable = false)
    private User applicant;

    @Column(name = "shop_name", nullable = false, length = 150)
    private String shopName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.PENDING;

    /** Opening fee snapshot at submission time (0 = free). */
    @Column(name = "opening_fee", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal openingFee = BigDecimal.ZERO;

    /** Whether the opening fee has been paid (always true when fee is 0). */
    @Column(name = "fee_paid")
    @Builder.Default
    private Boolean feePaid = false;

    /** Reference to the mock/real payment used to pay the opening fee, if any. */
    @Column(name = "fee_payment_reference", length = 120)
    private String feePaymentReference;

    /** Reason given by the admin when rejecting. */
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    /** Admin who reviewed the application. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    /** Shop created from this application once approved. */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id")
    private Shop shop;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
