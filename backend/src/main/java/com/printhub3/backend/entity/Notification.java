package com.printhub3.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Notification Entity - User notifications system
 */
@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notifications_user_id", columnList = "user_id"),
    @Index(name = "idx_notifications_is_read", columnList = "is_read"),
    @Index(name = "idx_notifications_type", columnList = "notification_type"),
    @Index(name = "idx_notifications_created_at", columnList = "created_at")
})
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "title", nullable = false, length = 255)
    private String title;
    
    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, columnDefinition = "VARCHAR(50)")
    private NotificationType notificationType;
    
    @Column(name = "related_entity_type", length = 50)
    private String relatedEntityType;
    
    @Column(name = "related_entity_id")
    private Long relatedEntityId;
    
    @Column(name = "is_read")
    private Boolean isRead = false;
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    // Enum for notification type
    public enum NotificationType {
        ORDER_CONFIRMATION,
        ORDER_UPDATE,
        PAYMENT_CONFIRMATION,
        MODEL_QUOTE,
        MODEL_STATUS_UPDATE,
        CHAT_MESSAGE,
        PROMOTION,
        SYSTEM_ALERT
    }
}
