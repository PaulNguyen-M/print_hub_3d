package com.printhub3.backend.service;

import com.printhub3.backend.dto.request.LoginRequest;
import com.printhub3.backend.dto.request.RegisterRequest;
import com.printhub3.backend.dto.response.AuthTokenResponse;
import com.printhub3.backend.entity.RefreshToken;
import com.printhub3.backend.entity.Role;
import com.printhub3.backend.entity.User;
import com.printhub3.backend.exception.AuthenticationException;
import com.printhub3.backend.exception.BusinessException;
import com.printhub3.backend.exception.DuplicateResourceException;
import com.printhub3.backend.exception.ResourceNotFoundException;
import com.printhub3.backend.repository.RefreshTokenRepository;
import com.printhub3.backend.repository.RoleRepository;
import com.printhub3.backend.repository.UserRepository;
import com.printhub3.backend.security.jwt.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Authentication Service
 * Handles user authentication, registration, token refresh, and logout
 */
@Slf4j
@Service
@Transactional
public class AuthenticationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * User login - Authenticate and return JWT tokens
     */
    public AuthTokenResponse login(LoginRequest request) {
        log.info("Attempting user login for email: {}", request.getEmail());

        try {
            // Authenticate user credentials
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );

            // Generate access token
            String accessToken = jwtTokenProvider.generateAccessToken(authentication);

            // Get user details
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

            // Generate and save refresh token
            String refreshTokenValue = jwtTokenProvider.generateRefreshToken(request.getEmail());
            saveRefreshToken(user, refreshTokenValue);

            // Update last login time
            user.setLastLoginAt(LocalDateTime.now());
            userRepository.save(user);

            log.info("User successfully logged in: {}", request.getEmail());

            return buildAuthTokenResponse(accessToken, refreshTokenValue, user);

        } catch (org.springframework.security.core.AuthenticationException e) {
            log.error("Authentication failed for user: {} — {}", request.getEmail(), e.getMessage());
            throw new AuthenticationException("Email hoặc mật khẩu không đúng");
        }
    }

    /**
     * User registration - Create new user account
     */
    public AuthTokenResponse register(RegisterRequest request) {
        log.info("Attempting user registration for email: {}", request.getEmail());

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration failed - email already exists: {}", request.getEmail());
            throw new DuplicateResourceException("User", "email", request.getEmail());
        }

        // All self-service registrations are BUYER. Selling requires applying to
        // open a shop and admin approval (the role param is intentionally ignored).
        Role role = roleRepository.findByName("BUYER")
                .orElseThrow(() -> new BusinessException("Role not found: BUYER"));

        // Create new user
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(role)
                .isVerified(false)
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User successfully registered: {}", request.getEmail());

        // Generate tokens
        String accessToken = jwtTokenProvider.generateAccessToken(savedUser.getEmail());
        String refreshTokenValue = jwtTokenProvider.generateRefreshToken(savedUser.getEmail());

        // Save refresh token
        saveRefreshToken(savedUser, refreshTokenValue);

        return buildAuthTokenResponse(accessToken, refreshTokenValue, savedUser);
    }

    /**
     * Refresh access token using refresh token
     */
    public AuthTokenResponse refreshToken(String refreshToken) {
        log.info("Attempting to refresh access token");

        try {
            // Validate refresh token
            if (!jwtTokenProvider.validateToken(refreshToken)) {
                log.error("Invalid or expired refresh token");
                throw new AuthenticationException("Invalid or expired refresh token");
            }

            String email = jwtTokenProvider.getUserNameFromJwt(refreshToken);

            // Get user
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

            // Check if refresh token exists in database
            RefreshToken dbToken = refreshTokenRepository.findByTokenHash(refreshToken)
                    .orElseThrow(() -> new AuthenticationException("Refresh token not found in database"));

            // Check if token is revoked
            if (dbToken.getRevokedAt() != null) {
                log.warn("Refresh token has been revoked for user: {}", email);
                throw new AuthenticationException("Refresh token has been revoked");
            }

            // Generate new access token
            String newAccessToken = jwtTokenProvider.generateAccessToken(email);

            log.info("Access token successfully refreshed for user: {}", email);

            return buildAuthTokenResponse(newAccessToken, refreshToken, user);

        } catch (Exception e) {
            log.error("Token refresh failed: {}", e.getMessage());
            throw new AuthenticationException("Failed to refresh token: " + e.getMessage());
        }
    }

    /**
     * User logout - Revoke all refresh tokens
     */
    public void logout(String email) {
        log.info("User logout initiated for email: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        // Revoke all refresh tokens for this user
        user.getRefreshTokens().forEach(token -> {
            token.setRevokedAt(LocalDateTime.now());
        });

        refreshTokenRepository.saveAll(user.getRefreshTokens());

        log.info("User successfully logged out: {}", email);
    }

    /**
     * Logout from all devices - Revoke all refresh tokens
     */
    public void logoutFromAllDevices(String email) {
        log.info("Logout from all devices initiated for email: {}", email);
        logout(email);
    }

    /**
     * Save refresh token in database
     */
    private void saveRefreshToken(User user, String refreshToken) {
        try {
            // Hash the refresh token before saving (in production, you should hash this)
            RefreshToken token = RefreshToken.builder()
                    .user(user)
                    .tokenHash(refreshToken)  // In production, hash this: BCryptPasswordEncoder.encode(refreshToken)
                    .expiresAt(LocalDateTime.now().plusDays(7))  // 7 days expiration
                    .build();

            refreshTokenRepository.save(token);
            log.debug("Refresh token saved for user: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to save refresh token: {}", e.getMessage());
            throw new BusinessException("Failed to save refresh token");
        }
    }

    /**
     * Build AuthTokenResponse DTO
     */
    private AuthTokenResponse buildAuthTokenResponse(String accessToken, String refreshToken, User user) {
        long expiresIn = jwtTokenProvider.getTokenTtl(accessToken);

        AuthTokenResponse.UserResponse userResponse = AuthTokenResponse.UserResponse.builder()
                .id(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getName())
                .profileImageUrl(user.getProfileImageUrl())
                .createdAt(user.getCreatedAt())
                .build();

        return AuthTokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(expiresIn)
                .user(userResponse)
                .build();
    }
}
