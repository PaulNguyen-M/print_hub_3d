package com.printhub3.backend.repository;

import com.printhub3.backend.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

/**
 * Notification Repository - Data access for Notification entity
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    @Query("SELECT n FROM Notification n WHERE n.user.userId = ?1 AND n.deletedAt IS NULL ORDER BY n.createdAt DESC")
    Page<Notification> findNotificationsByUserId(Long userId, Pageable pageable);
    
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.userId = ?1 AND n.isRead = false AND n.deletedAt IS NULL")
    long countUnreadNotifications(Long userId);
    
    @Query("SELECT n FROM Notification n WHERE n.user.userId = ?1 AND n.notificationType = ?2 AND n.deletedAt IS NULL ORDER BY n.createdAt DESC")
    Page<Notification> findNotificationsByType(Long userId, Notification.NotificationType type, Pageable pageable);
}
