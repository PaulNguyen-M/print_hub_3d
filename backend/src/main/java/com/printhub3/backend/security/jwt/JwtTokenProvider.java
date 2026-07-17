package com.printhub3.backend.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * JwtTokenProvider — Dịch vụ JWT: sinh token (access/refresh), kiểm tra hợp lệ,
 * và trích xuất thông tin (username, hạn dùng) từ token.
 */
@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpirationMs;

    @Value("${jwt.refresh-expiration:604800000}")
    private long jwtRefreshExpirationMs;

    /** Tạo khóa ký từ chuỗi bí mật (jwt.secret). */
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    /** Sinh access token từ Authentication (lấy username). */
    public String generateAccessToken(Authentication authentication) {
        return generateAccessToken(authentication.getName());
    }

    /** Sinh access token cho một username (hạn theo jwt.expiration). */
    public String generateAccessToken(String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /** Sinh refresh token cho một username (hạn dài hơn access token). */
    public String generateRefreshToken(String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtRefreshExpirationMs);

        return Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /** Lấy username (subject) từ token. */
    public String getUserNameFromJwt(String token) {
        Claims claims = Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();

        return claims.getSubject();
    }

    /** Lấy toàn bộ claims từ token. */
    public Claims getClaims(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    /** Lấy ngày hết hạn của token. */
    public Date getExpirationDate(String token) {
        return getClaims(token).getExpiration();
    }

    /** Token đã hết hạn chưa. */
    public boolean isTokenExpired(String token) {
        try {
            Date expiration = getExpirationDate(token);
            return expiration.before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        }
    }

    /** Kiểm tra token hợp lệ (chữ ký + chưa hết hạn); trả false nếu lỗi/không hợp lệ. */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);

            if (isTokenExpired(token)) {
                log.debug("JWT token is expired");
                return false;
            }

            return true;
        } catch (MalformedJwtException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("Expired JWT token: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("Unsupported JWT token: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
        } catch (Exception e) {
            log.error("JWT token validation failed: {}", e.getMessage());
        }
        return false;
    }

    /** Tách token khỏi chuỗi "Bearer &lt;token&gt;". */
    public String extractTokenFromBearer(String bearerToken) {
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return bearerToken;
    }

    /** Thời gian còn lại của token (TTL) tính bằng giây. */
    public long getTokenTtl(String token) {
        try {
            Date expirationDate = getExpirationDate(token);
            long currentTime = System.currentTimeMillis();
            long expirationTime = expirationDate.getTime();
            return (expirationTime - currentTime) / 1000; // Convert to seconds
        } catch (Exception e) {
            log.error("Error getting token TTL: {}", e.getMessage());
            return 0;
        }
    }
}
