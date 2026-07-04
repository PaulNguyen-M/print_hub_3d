package com.printhub3.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * CartItem Entity - Individual items in a shopping cart
 */
@Entity
@Table(name = "cart_items", indexes = {
    @Index(name = "idx_cart_items_cart_id", columnList = "cart_id"),
    @Index(name = "idx_cart_items_product_id", columnList = "product_id")
}, uniqueConstraints = {
    @UniqueConstraint(columnNames = {"cart_id", "product_id"})
})
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class CartItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cart_item_id")
    private Long cartItemId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @Column(name = "quantity", nullable = false)
    private Integer quantity;
    
    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;
    
    // Computed field - subtotal = quantity * unit_price
    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2, 
            insertable = false, updatable = false,
            columnDefinition = "DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED")
    private BigDecimal subtotal;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
