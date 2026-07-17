package com.printhub3.backend.repository;

import com.printhub3.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * UserRepository — Truy vấn người dùng.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /** Người dùng theo email (dùng khi đăng nhập / lấy user hiện tại). */
    Optional<User> findByEmail(String email);

    /** Email đã tồn tại chưa (kiểm tra khi đăng ký). */
    boolean existsByEmail(String email);

    /** Người dùng đang hoạt động (phân trang). */
    @Query("SELECT u FROM User u WHERE u.isActive = true AND u.deletedAt IS NULL")
    Page<User> findAllActiveUsers(Pageable pageable);

    /** Người dùng theo vai trò (role). */
    @Query("SELECT u FROM User u WHERE u.role.name = ?1 AND u.isActive = true AND u.deletedAt IS NULL")
    Page<User> findUsersByRole(String roleName, Pageable pageable);

    /** Tìm người dùng theo tên hoặc email (không phân biệt hoa/thường) — dùng cho tìm kiếm ở admin. */
    @Query("SELECT u FROM User u WHERE " +
            "LOWER(u.fullName) LIKE LOWER(CONCAT('%', ?1, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', ?1, '%'))")
    Page<User> searchUsers(String searchTerm, Pageable pageable);
}
