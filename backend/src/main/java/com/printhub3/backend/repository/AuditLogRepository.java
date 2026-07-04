package com.printhub3.backend.repository;

import com.printhub3.backend.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * AuditLog Repository - Data access for AuditLog entity
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    @Query("SELECT al FROM AuditLog al WHERE al.user.userId = ?1 ORDER BY al.createdAt DESC")
    Page<AuditLog> findByUser_UserId(Long userId, Pageable pageable);
    
    @Query("SELECT al FROM AuditLog al WHERE al.entityType = ?1 AND al.entityId = ?2 ORDER BY al.createdAt DESC")
    Page<AuditLog> findByEntity(String entityType, Long entityId, Pageable pageable);
    
    @Query("SELECT al FROM AuditLog al WHERE al.createdAt BETWEEN ?1 AND ?2 ORDER BY al.createdAt DESC")
    List<AuditLog> findByDateRange(LocalDateTime startDate, LocalDateTime endDate);
}
