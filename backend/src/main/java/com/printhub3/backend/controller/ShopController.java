package com.printhub3.backend.controller;

import com.printhub3.backend.dto.request.CreateReviewRequest;
import com.printhub3.backend.dto.response.ApiResponse;
import com.printhub3.backend.dto.response.ProductDto;
import com.printhub3.backend.dto.response.ShopDto;
import com.printhub3.backend.dto.response.ShopReviewDto;
import com.printhub3.backend.security.service.UserDetailsImpl;
import com.printhub3.backend.service.ProductService;
import com.printhub3.backend.service.ShopService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * ShopController - Public shop ("sạp") profiles, products, reviews and follow.
 */
@RestController
@RequestMapping("/api/v1/shops")
@RequiredArgsConstructor
public class ShopController {

    private final ShopService shopService;
    private final ProductService productService;

    /** Public shop profile by slug (includes follow state when authenticated). */
    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<ShopDto>> getShop(@PathVariable String slug) {
        ShopDto shop = shopService.getShopBySlug(slug, currentUserIdOrNull());
        return ResponseEntity.ok(ApiResponse.success(shop, "Shop retrieved successfully"));
    }

    /** Products belonging to a shop, with optional search + sort. */
    @GetMapping("/{slug}/products")
    public ResponseEntity<ApiResponse<Page<ProductDto>>> getShopProducts(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(required = false) String search) {
        ShopDto shop = shopService.getShopBySlug(slug, null);
        Page<ProductDto> products = productService.getProductsByShop(shop.getShopId(), page, size, sort, search);
        return ResponseEntity.ok(ApiResponse.success(products, "Shop products retrieved successfully"));
    }

    /** Shop-level reviews. */
    @GetMapping("/{slug}/reviews")
    public ResponseEntity<ApiResponse<Page<ShopReviewDto>>> getShopReviews(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<ShopReviewDto> reviews = shopService.getShopReviews(slug, page, size);
        return ResponseEntity.ok(ApiResponse.success(reviews, "Shop reviews retrieved successfully"));
    }

    /** Create or update the current user's review of a shop. */
    @PostMapping("/{slug}/reviews")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ShopReviewDto>> reviewShop(
            @PathVariable String slug,
            @Valid @RequestBody CreateReviewRequest request) {
        ShopReviewDto dto = shopService.addOrUpdateReview(slug, currentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(dto, "Đã gửi đánh giá sạp"));
    }

    /** Featured ("nổi bật") products pinned by the shop owner. */
    @GetMapping("/{slug}/featured")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getFeaturedProducts(@PathVariable String slug) {
        List<ProductDto> featured = shopService.getFeaturedProducts(slug);
        return ResponseEntity.ok(ApiResponse.success(featured, "Featured products retrieved"));
    }

    /** Toggle following a shop. Returns { following: true|false }. */
    @PostMapping("/{slug}/follow")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> toggleFollow(@PathVariable String slug) {
        boolean following = shopService.toggleFollow(slug, currentUserId());
        return ResponseEntity.ok(ApiResponse.success(Map.of("following", following),
                following ? "Đã theo dõi sạp" : "Đã bỏ theo dõi sạp"));
    }

    // ── helpers ─────────────────────────────────────────────────────────

    private Long currentUserId() {
        Long id = currentUserIdOrNull();
        if (id == null) throw new IllegalStateException("User is not authenticated");
        return id;
    }

    private Long currentUserIdOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UserDetailsImpl details) {
            return details.getUserId();
        }
        return null;
    }
}
