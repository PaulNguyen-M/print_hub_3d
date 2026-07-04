package com.printhub3.backend.repository;

import com.printhub3.backend.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * RefreshToken Repository - Data access for RefreshToken entity
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);
    
    List<RefreshToken> findByUser_UserId(Long userId);
    
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.user.userId = ?1 AND rt.revokedAt IS NULL")
    List<RefreshToken> findActiveTokensByUserId(Long userId);
    
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.expiresAt < ?1")
    List<RefreshToken> findExpiredTokens(LocalDateTime now);
}
