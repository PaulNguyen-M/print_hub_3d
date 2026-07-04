package com.printhub3.backend.controller;

import com.printhub3.backend.dto.request.CreateReviewRequest;
import com.printhub3.backend.dto.response.ApiResponse;
import com.printhub3.backend.dto.response.ReviewDto;
import com.printhub3.backend.security.service.UserDetailsImpl;
import com.printhub3.backend.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * ReviewController - Product reviews (public read, authenticated write).
 */
@RestController
@RequestMapping("/api/v1/products/{productId}/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /** Public: list reviews for a product. */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ReviewDto>>> getReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ReviewDto> reviews = reviewService.getProductReviews(productId, page, size);
        return ResponseEntity.ok(ApiResponse.success(reviews, "Reviews retrieved successfully"));
    }

    /** Authenticated: create or update the current user's review. */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReviewDto>> addReview(
            @PathVariable Long productId,
            @Valid @RequestBody CreateReviewRequest request) {
        ReviewDto dto = reviewService.addOrUpdateReview(getCurrentUserId(), productId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(dto, "Đã gửi đánh giá"));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl userDetails) {
            return userDetails.getUserId();
        }
        throw new IllegalStateException("User is not authenticated");
    }
}
