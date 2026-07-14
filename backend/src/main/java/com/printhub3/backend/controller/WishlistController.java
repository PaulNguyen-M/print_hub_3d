package com.printhub3.backend.controller;

import com.printhub3.backend.dto.response.ApiResponse;
import com.printhub3.backend.dto.response.ProductDto;
import com.printhub3.backend.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class WishlistController {

    private final WishlistService wishlistService;

    /** Bật/tắt yêu thích một sản phẩm. */
    @PostMapping("/{productId}/toggle")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> toggle(
            @PathVariable Long productId, Authentication authentication) {
        boolean favorited = wishlistService.toggle(authentication.getName(), productId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("favorited", favorited),
                favorited ? "Đã thêm vào yêu thích" : "Đã bỏ yêu thích"));
    }

    /** Id các sản phẩm đã thích (để đánh dấu tym ở chợ). */
    @GetMapping("/ids")
    public ResponseEntity<ApiResponse<List<Long>>> ids(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                wishlistService.getFavoriteIds(authentication.getName()), "OK"));
    }

    /** Danh sách sản phẩm đã thích (trang Yêu Thích). */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductDto>>> list(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                wishlistService.getFavorites(authentication.getName()), "OK"));
    }
}
