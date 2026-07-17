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
 * ReviewService — Đánh giá sản phẩm, tự động tính lại điểm trung bình của sản phẩm
 * mỗi khi có đánh giá mới/sửa. (Điểm của sạp lấy từ đánh giá sạp riêng — xem ShopService.)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReviewService {

    private final ProductReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    /** Tạo mới hoặc cập nhật đánh giá của người dùng cho một sản phẩm, rồi tính lại điểm sản phẩm. */
    public ReviewDto addOrUpdateReview(Long userId, Long productId, CreateReviewRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        if (Boolean.FALSE.equals(product.getIsActive()) || product.getDeletedAt() != null) {
            throw new BusinessException("Sản phẩm không khả dụng");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Có đánh giá cũ thì sửa, chưa có thì tạo mới
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

        // Đánh giá sản phẩm chỉ ảnh hưởng điểm của sản phẩm; điểm của sạp đến từ
        // đánh giá sạp riêng (xem ShopService).
        recalcProductRating(product);

        log.info("Review {} saved for product {} by user {}", review.getReviewId(), productId, userId);
        return toDto(review);
    }

    /** Danh sách đánh giá của một sản phẩm (phân trang). */
    @Transactional(readOnly = true)
    public Page<ReviewDto> getProductReviews(Long productId, int page, int size) {
        return reviewRepository.findReviewsByProductId(productId, PageRequest.of(page, size)).map(this::toDto);
    }

    /** Tất cả đánh giá của các sản phẩm trong một sạp, mới nhất trước. */
    @Transactional(readOnly = true)
    public Page<ReviewDto> getShopReviews(Long shopId, int page, int size) {
        return reviewRepository.findReviewsByShop(shopId, PageRequest.of(page, size)).map(this::toDto);
    }

    // ── Tính lại điểm ───────────────────────────────────────────────────

    /** Tính lại điểm trung bình + số lượng đánh giá cho một sản phẩm rồi lưu. */
    private void recalcProductRating(Product product) {
        RatingAggregate agg = reviewRepository.aggregateForProduct(product.getProductId());
        product.setRating(round(agg != null ? agg.getAvg() : null));
        product.setTotalReviews(agg != null && agg.getCnt() != null ? agg.getCnt().intValue() : 0);
        productRepository.save(product);
    }

    /** Làm tròn điểm về 2 chữ số thập phân (null → 0). */
    private BigDecimal round(Double avg) {
        if (avg == null) return BigDecimal.ZERO;
        return BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP);
    }

    /** Chuyển entity ProductReview sang DTO trả về frontend. */
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
