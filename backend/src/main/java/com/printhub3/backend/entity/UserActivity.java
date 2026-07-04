package com.printhub3.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * UserActivity Entity - Track user activities for auditing
 */
@Entity
@Table(name = "user_activities", indexes = {
    @Index(name = "idx_user_activities_user_id", columnList = "user_id"),
    @Index(name = "idx_user_activities_created_at", columnList = "created_at")
})
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class UserActivity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "activity_id")
    private Long activityId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "activity_type", nullable = false, length = 50)
    private String activityType;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
    
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
