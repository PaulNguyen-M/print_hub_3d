package com.printhub3.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * PaymentTransaction Entity - Detailed payment transaction history
 */
@Entity
@Table(name = "payment_transactions", indexes = {
    @Index(name = "idx_payment_transactions_payment_id", columnList = "payment_id"),
    @Index(name = "idx_payment_transactions_created_at", columnList = "created_at")
})
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class PaymentTransaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Long transactionId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;
    
    @Column(name = "transaction_type", nullable = false, length = 50)
    private String transactionType;
    
    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;
    
    @Column(name = "response_code", length = 50)
    private String responseCode;
    
    @Column(name = "response_message", columnDefinition = "TEXT")
    private String responseMessage;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
