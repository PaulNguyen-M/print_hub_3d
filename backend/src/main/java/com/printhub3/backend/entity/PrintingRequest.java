package com.printhub3.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * PrintingRequest Entity - Custom 3D printing service requests/quotes
 */
@Entity
@Table(name = "printing_requests", indexes = {
    @Index(name = "idx_printing_requests_user_id", columnList = "user_id"),
    @Index(name = "idx_printing_requests_status", columnList = "model_status"),
    @Index(name = "idx_printing_requests_created_at", columnList = "created_at")
})
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class PrintingRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Long requestId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;
    
    @Column(name = "file_url", nullable = false, columnDefinition = "TEXT")
    private String fileUrl;
    
    @Column(name = "file_size", nullable = false)
    private Long fileSize;
    
    @Column(name = "file_format", length = 20)
    private String fileFormat;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "model_status", nullable = false, columnDefinition = "VARCHAR(50)")
    private ModelStatus modelStatus = ModelStatus.REVIEWING;
    
    @Column(name = "quote_amount", precision = 12, scale = 2)
    private BigDecimal quoteAmount;
    
    @Column(name = "quote_notes", columnDefinition = "TEXT")
    private String quoteNotes;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "requirements", columnDefinition = "TEXT")
    private String requirements;
    
    @Column(name = "quote_expiry_date")
    private LocalDateTime quoteExpiryDate;
    
    @Column(name = "estimated_printing_days")
    private Integer estimatedPrintingDays;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    // Enum for model status
    public enum ModelStatus {
        REVIEWING, QUOTED, ACCEPTED, PRINTING, COMPLETED, REJECTED
    }
}
