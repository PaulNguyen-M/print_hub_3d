package com.printhub3.backend.repository;

import com.printhub3.backend.entity.ProductReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * ProductReviewRepository — Truy vấn đánh giá sản phẩm.
 */
@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {

    /** Đánh giá của một sản phẩm, mới nhất trước (phân trang). */
    @Query("SELECT pr FROM ProductReview pr WHERE pr.product.productId = ?1 AND pr.deletedAt IS NULL ORDER BY pr.createdAt DESC")
    Page<ProductReview> findReviewsByProductId(Long productId, Pageable pageable);

    /** Đánh giá của một người dùng cho một sản phẩm (để sửa thay vì tạo trùng). */
    @Query("SELECT pr FROM ProductReview pr WHERE pr.product.productId = ?1 AND pr.user.userId = ?2 AND pr.deletedAt IS NULL")
    Optional<ProductReview> findUserReviewForProduct(Long productId, Long userId);

    /** Đánh giá do một người dùng viết. */
    @Query("SELECT pr FROM ProductReview pr WHERE pr.user.userId = ?1 AND pr.deletedAt IS NULL ORDER BY pr.createdAt DESC")
    Page<ProductReview> findReviewsByUserId(Long userId, Pageable pageable);

    /** Đánh giá của tất cả sản phẩm thuộc một sạp. */
    @Query("SELECT pr FROM ProductReview pr WHERE pr.product.shop.shopId = ?1 AND pr.deletedAt IS NULL ORDER BY pr.createdAt DESC")
    Page<ProductReview> findReviewsByShop(Long shopId, Pageable pageable);

    /** Kết quả gộp: điểm trung bình (avg) + số lượng đánh giá (cnt). */
    interface RatingAggregate {
        Double getAvg();
        Long getCnt();
    }

    /** Điểm trung bình + số đánh giá của một sản phẩm. */
    @Query("SELECT AVG(pr.rating) AS avg, COUNT(pr) AS cnt FROM ProductReview pr " +
           "WHERE pr.product.productId = ?1 AND pr.deletedAt IS NULL")
    RatingAggregate aggregateForProduct(Long productId);

    /** Điểm trung bình + số đánh giá của toàn bộ sản phẩm một sạp. */
    @Query("SELECT AVG(pr.rating) AS avg, COUNT(pr) AS cnt FROM ProductReview pr " +
           "WHERE pr.product.shop.shopId = ?1 AND pr.deletedAt IS NULL")
    RatingAggregate aggregateForShop(Long shopId);
}
