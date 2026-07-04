package com.printhub3.backend.repository;

import com.printhub3.backend.entity.UserActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

/**
 * UserActivity Repository - Data access for UserActivity entity
 */
@Repository
public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {
    
    @Query("SELECT ua FROM UserActivity ua WHERE ua.user.userId = ?1 ORDER BY ua.createdAt DESC")
    Page<UserActivity> findActivitiesByUserId(Long userId, Pageable pageable);
    
    @Query("SELECT ua FROM UserActivity ua WHERE ua.activityType = ?1 ORDER BY ua.createdAt DESC")
    Page<UserActivity> findActivitiesByType(String activityType, Pageable pageable);
}
