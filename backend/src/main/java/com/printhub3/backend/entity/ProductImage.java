package com.printhub3.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * ProductImage Entity - Product images for display
 */
@Entity
@Table(name = "product_images", indexes = {
    @Index(name = "idx_product_images_product_id", columnList = "product_id"),
    @Index(name = "idx_product_images_is_primary", columnList = "is_primary")
})
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class ProductImage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "image_id")
    private Long imageId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @Column(name = "image_url", nullable = false, columnDefinition = "TEXT")
    private String imageUrl;
    
    @Column(name = "alt_text", length = 255)
    private String altText;
    
    @Column(name = "display_order")
    private Integer displayOrder = 0;
    
    @Column(name = "is_primary")
    private Boolean isPrimary = false;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
