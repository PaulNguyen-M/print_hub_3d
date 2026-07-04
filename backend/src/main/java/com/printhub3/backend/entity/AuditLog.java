package com.printhub3.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import org.hibernate.annotations.Type;
import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDateTime;

/**
 * AuditLog Entity - System-wide audit trail for compliance and debugging
 */
@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_logs_user_id", columnList = "user_id"),
    @Index(name = "idx_audit_logs_entity_type_id", columnList = "entity_type,entity_id"),
    @Index(name = "idx_audit_logs_created_at", columnList = "created_at")
})
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class AuditLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(name = "action", nullable = false, length = 100)
    private String action;
    
    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;
    
    @Column(name = "entity_id", nullable = false)
    private Long entityId;
    
    @Type(JsonType.class)
    @Column(name = "old_values", columnDefinition = "jsonb")
    private JsonNode oldValues;
    
    @Type(JsonType.class)
    @Column(name = "new_values", columnDefinition = "jsonb")
    private JsonNode newValues;
    
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
    
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
