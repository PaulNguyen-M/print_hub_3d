package com.printhub3.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Order Entity - Customer orders
 */
@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_orders_user_id", columnList = "user_id"),
    @Index(name = "idx_orders_order_status", columnList = "order_status"),
    @Index(name = "idx_orders_created_at", columnList = "created_at"),
    @Index(name = "idx_orders_order_number", columnList = "order_number")
})
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class Order {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Long orderId;
    
    @Column(name = "order_number", nullable = false, unique = true, length = 50)
    private String orderNumber;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;
    
    @Column(name = "shipping_address", nullable = false, columnDefinition = "TEXT")
    private String shippingAddress;
    
    @Column(name = "shipping_city", length = 100)
    private String shippingCity;
    
    @Column(name = "shipping_state_province", length = 100)
    private String shippingStateProvince;
    
    @Column(name = "shipping_postal_code", length = 20)
    private String shippingPostalCode;
    
    @Column(name = "shipping_country", length = 100)
    private String shippingCountry;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", nullable = false, columnDefinition = "VARCHAR(50)")
    private OrderStatus orderStatus = OrderStatus.PENDING;
    
    @Column(name = "shipping_method", length = 50)
    private String shippingMethod;

    /** Phí vận chuyển (tính theo shipping_method). */
    @Column(name = "shipping_fee", precision = 12, scale = 2)
    private BigDecimal shippingFee;

    /** Thuế (10% trên tạm tính). */
    @Column(name = "tax", precision = 12, scale = 2)
    private BigDecimal tax;

    /** Buyer-selected payment method: BANK_TRANSFER, MOMO, CASH. */
    @Column(name = "payment_method", length = 30)
    private String paymentMethod;

    @Column(name = "tracking_number", length = 100)
    private String trackingNumber;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "estimated_delivery")
    private LocalDateTime estimatedDelivery;
    
    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;
    
    // Relationships
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<OrderItem> items = new HashSet<>();
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Payment> payments = new HashSet<>();
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    // Enum for order status.
    // PROCESSING = paid (awaiting admin), CONFIRMED = admin confirmed (awaiting seller),
    // COMPLETED = fulfilled & paid out to seller(s).
    public enum OrderStatus {
        PENDING, PROCESSING, CONFIRMED, PRINTING, FINISHING, SHIPPING, DELIVERED, CANCELLED, COMPLETED
    }
}
