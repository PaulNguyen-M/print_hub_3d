package com.printhub3.backend.repository;

import com.printhub3.backend.entity.UserActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

/**
 * UserActivityRepository — Truy vấn nhật ký hoạt động của người dùng.
 */
@Repository
public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {

    /** Hoạt động của một người dùng, mới nhất trước (phân trang). */
    @Query("SELECT ua FROM UserActivity ua WHERE ua.user.userId = ?1 ORDER BY ua.createdAt DESC")
    Page<UserActivity> findActivitiesByUserId(Long userId, Pageable pageable);

    /** Hoạt động theo loại, mới nhất trước (phân trang). */
    @Query("SELECT ua FROM UserActivity ua WHERE ua.activityType = ?1 ORDER BY ua.createdAt DESC")
    Page<UserActivity> findActivitiesByType(String activityType, Pageable pageable);
}
