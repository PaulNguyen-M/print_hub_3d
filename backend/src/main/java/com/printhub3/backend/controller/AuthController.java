package com.printhub3.backend.controller;

import com.printhub3.backend.dto.request.LoginRequest;
import com.printhub3.backend.dto.request.RegisterRequest;
import com.printhub3.backend.dto.response.ApiResponse;
import com.printhub3.backend.dto.response.AuthTokenResponse;
import com.printhub3.backend.service.AuthenticationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * AuthController — Các endpoint xác thực người dùng.
 * Gồm: đăng ký, đăng nhập, làm mới token, đăng xuất (một thiết bị / tất cả thiết bị)
 * và lấy thông tin người dùng đang đăng nhập.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Authentication and authorization endpoints")
public class AuthController {

    @Autowired
    private AuthenticationService authenticationService;

    /** Đăng ký tài khoản mới. POST /api/v1/auth/register */
    @PostMapping("/register")
    @Operation(
            summary = "Register a new user",
            description = "Create a new user account with email, password, and full name"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "201",
                    description = "User registered successfully",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Invalid request or email already exists"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "500",
                    description = "Server error"
            )
    })
    public ResponseEntity<ApiResponse<AuthTokenResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        
        log.info("Register request received for email: {}", request.getEmail());

        AuthTokenResponse response = authenticationService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        response,
                        "User registered successfully"
                ));
    }

    /** Đăng nhập: xác thực và trả về JWT (access + refresh token). POST /api/v1/auth/login */
    @PostMapping("/login")
    @Operation(
            summary = "User login",
            description = "Authenticate user with email and password. Returns JWT access token and refresh token"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Login successful",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Invalid email or password"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "500",
                    description = "Server error"
            )
    })
    public ResponseEntity<ApiResponse<AuthTokenResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        
        log.info("Login request received for email: {}", request.getEmail());

        AuthTokenResponse response = authenticationService.login(request);

        return ResponseEntity
                .ok(ApiResponse.success(
                        response,
                        "User logged in successfully"
                ));
    }

    /** Cấp access token mới bằng refresh token. POST /api/v1/auth/refresh-token */
    @PostMapping("/refresh-token")
    @Operation(
            summary = "Refresh access token",
            description = "Generate a new access token using the refresh token"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Token refreshed successfully",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Invalid or expired refresh token"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "500",
                    description = "Server error"
            )
    })
    public ResponseEntity<ApiResponse<AuthTokenResponse>> refreshToken(
            @RequestHeader(value = "X-Refresh-Token", required = true) String refreshToken) {
        
        log.info("Token refresh request received");

        AuthTokenResponse response = authenticationService.refreshToken(refreshToken);

        return ResponseEntity
                .ok(ApiResponse.success(
                        response,
                        "Token refreshed successfully"
                ));
    }

    /** Đăng xuất: thu hồi phiên hiện tại. POST /api/v1/auth/logout */
    @PostMapping("/logout")
    @Operation(
            summary = "User logout",
            description = "Logout the current user and revoke all refresh tokens"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Logged out successfully"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "500",
                    description = "Server error"
            )
    })
    public ResponseEntity<ApiResponse<Void>> logout(Authentication authentication) {
        if (authentication != null && authentication.getName() != null) {
            log.info("Logout request received for user: {}", authentication.getName());
            authenticationService.logout(authentication.getName());
        }

        return ResponseEntity
                .ok(ApiResponse.success(null, "User logged out successfully"));
    }

    /** Lấy thông tin người dùng đang đăng nhập. GET /api/v1/auth/me */
    @GetMapping("/me")
    @Operation(
            summary = "Get current authenticated user",
            description = "Returns information about the currently authenticated user"
    )
    public ResponseEntity<ApiResponse<Object>> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(
                        String.valueOf(HttpStatus.UNAUTHORIZED.value()),
                            "No authenticated user found"
                    ));
        }

        return ResponseEntity
                .ok(ApiResponse.success(
                        authentication.getPrincipal(),
                        "Current user retrieved successfully"
                ));
    }

    /** Đăng xuất khỏi mọi thiết bị (thu hồi tất cả refresh token). POST /api/v1/auth/logout-all */
    @PostMapping("/logout-all")
    @Operation(
            summary = "Logout from all devices",
            description = "Revoke all refresh tokens for the current user (logout from all devices)"
    )
    public ResponseEntity<ApiResponse<Void>> logoutFromAllDevices(Authentication authentication) {
        if (authentication != null && authentication.getName() != null) {
            log.info("Logout from all devices requested for user: {}", authentication.getName());
            authenticationService.logoutFromAllDevices(authentication.getName());
        }

        return ResponseEntity
                .ok(ApiResponse.success(null, "Logged out from all devices successfully"));
    }
}
