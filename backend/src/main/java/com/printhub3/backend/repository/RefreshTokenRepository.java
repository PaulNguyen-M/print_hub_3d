package com.printhub3.backend.repository;

import com.printhub3.backend.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * RefreshTokenRepository — Truy vấn refresh token (phục vụ làm mới/thu hồi phiên).
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    /** Token theo giá trị hash. */
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /** Tất cả token của một người dùng. */
    List<RefreshToken> findByUser_UserId(Long userId);

    /** Token còn hiệu lực (chưa thu hồi) của một người dùng. */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.user.userId = ?1 AND rt.revokedAt IS NULL")
    List<RefreshToken> findActiveTokensByUserId(Long userId);

    /** Các token đã hết hạn (dùng để dọn dẹp định kỳ). */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.expiresAt < ?1")
    List<RefreshToken> findExpiredTokens(LocalDateTime now);
}
