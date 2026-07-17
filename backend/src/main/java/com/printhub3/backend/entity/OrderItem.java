package com.printhub3.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * OrderItem Entity - Individual items within an order
 */
@Entity
@Table(name = "order_items", indexes = {
    @Index(name = "idx_order_items_order_id", columnList = "order_id"),
    @Index(name = "idx_order_items_product_id", columnList = "product_id")
})
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class OrderItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_item_id")
    private Long orderItemId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @Column(name = "quantity", nullable = false)
    private Integer quantity;
    
    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;
    
    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    /** Whether the seller (shop owner) has confirmed fulfillment of this item. */
    @Column(name = "seller_confirmed")
    @Builder.Default
    private Boolean sellerConfirmed = false;

    @Column(name = "seller_confirmed_at")
    private LocalDateTime sellerConfirmedAt;

    /** Trạng thái xử lý của SẠP cho món này (các món cùng sạp trong 1 đơn chia sẻ chung) */
    @Enumerated(EnumType.STRING)
    @Column(name = "fulfillment_status", length = 30)
    @Builder.Default
    private FulfillmentStatus fulfillmentStatus = FulfillmentStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * Vòng đời xử lý theo từng sạp trong một đơn:
     * PENDING (chờ admin) → CONFIRMED (admin xác nhận) → PRINTING → FINISHING →
     * SHIPPING → DELIVERED (seller tự chạy) → AWAITING_APPROVAL (seller xin hoàn tất)
     * → COMPLETED (admin duyệt & đã chi tiền cho sạp).
     */
    public enum FulfillmentStatus {
        PENDING,
        CONFIRMED,
        PRINTING,
        FINISHING,
        SHIPPING,
        DELIVERED,
        AWAITING_APPROVAL,
        COMPLETED
    }

}
