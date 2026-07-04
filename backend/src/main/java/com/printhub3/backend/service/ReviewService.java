package com.printhub3.backend.service;

import com.printhub3.backend.dto.request.CreateReviewRequest;
import com.printhub3.backend.dto.response.ReviewDto;
import com.printhub3.backend.entity.Product;
import com.printhub3.backend.entity.ProductReview;
import com.printhub3.backend.entity.User;
import com.printhub3.backend.exception.BusinessException;
import com.printhub3.backend.exception.ResourceNotFoundException;
import com.printhub3.backend.repository.ProductRepository;
import com.printhub3.backend.repository.ProductReviewRepository;
import com.printhub3.backend.repository.ProductReviewRepository.RatingAggregate;
import com.printhub3.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * ReviewService - Product reviews, with automatic recalculation of both
 * product-level and shop-level ("sạp") ratings.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReviewService {

    private final ProductReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    /**
     * Create or update the current user's review for a product, then refresh
     * the product and shop ratings.
     */
    public ReviewDto addOrUpdateReview(Long userId, Long productId, CreateReviewRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        if (Boolean.FALSE.equals(product.getIsActive()) || product.getDeletedAt() != null) {
            throw new BusinessException("Sản phẩm không khả dụng");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        ProductReview review = reviewRepository.findUserReviewForProduct(productId, userId)
                .orElseGet(() -> ProductReview.builder()
                        .product(product)
                        .user(user)
                        .isVerifiedPurchase(false)
                        .helpfulCount(0)
                        .build());

        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review = reviewRepository.save(review);

        // Product reviews drive the product's rating only; the shop's own rating
        // comes from dedicated shop reviews (see ShopService).
        recalcProductRating(product);

        log.info("Review {} saved for product {} by user {}", review.getReviewId(), productId, userId);
        return toDto(review);
    }

    @Transactional(readOnly = true)
    public Page<ReviewDto> getProductReviews(Long productId, int page, int size) {
        return reviewRepository.findReviewsByProductId(productId, PageRequest.of(page, size)).map(this::toDto);
    }

    /** All reviews across a shop's products, newest first. */
    @Transactional(readOnly = true)
    public Page<ReviewDto> getShopReviews(Long shopId, int page, int size) {
        return reviewRepository.findReviewsByShop(shopId, PageRequest.of(page, size)).map(this::toDto);
    }

    // ── Recalculation ───────────────────────────────────────────────────

    private void recalcProductRating(Product product) {
        RatingAggregate agg = reviewRepository.aggregateForProduct(product.getProductId());
        product.setRating(round(agg != null ? agg.getAvg() : null));
        product.setTotalReviews(agg != null && agg.getCnt() != null ? agg.getCnt().intValue() : 0);
        productRepository.save(product);
    }

    private BigDecimal round(Double avg) {
        if (avg == null) return BigDecimal.ZERO;
        return BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP);
    }

    private ReviewDto toDto(ProductReview r) {
        User u = r.getUser();
        return ReviewDto.builder()
                .reviewId(r.getReviewId())
                .productId(r.getProduct() != null ? r.getProduct().getProductId() : null)
                .productName(r.getProduct() != null ? r.getProduct().getName() : null)
                .userId(u != null ? u.getUserId() : null)
                .userName(u != null ? u.getFullName() : null)
                .userAvatarUrl(u != null ? u.getProfileImageUrl() : null)
                .rating(r.getRating())
                .comment(r.getComment())
                .verifiedPurchase(r.getIsVerifiedPurchase())
                .helpfulCount(r.getHelpfulCount())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
