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
 * AuditLogRepository — Truy vấn nhật ký hệ thống (audit log).
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /** Nhật ký theo người dùng, mới nhất trước (phân trang). */
    @Query("SELECT al FROM AuditLog al WHERE al.user.userId = ?1 ORDER BY al.createdAt DESC")
    Page<AuditLog> findByUser_UserId(Long userId, Pageable pageable);

    /** Nhật ký theo loại + id thực thể (vd Order #5). */
    @Query("SELECT al FROM AuditLog al WHERE al.entityType = ?1 AND al.entityId = ?2 ORDER BY al.createdAt DESC")
    Page<AuditLog> findByEntity(String entityType, Long entityId, Pageable pageable);

    /** Nhật ký trong một khoảng thời gian. */
    @Query("SELECT al FROM AuditLog al WHERE al.createdAt BETWEEN ?1 AND ?2 ORDER BY al.createdAt DESC")
    List<AuditLog> findByDateRange(LocalDateTime startDate, LocalDateTime endDate);
}
