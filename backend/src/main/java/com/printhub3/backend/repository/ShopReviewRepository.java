package com.printhub3.backend.repository;

import com.printhub3.backend.entity.ShopReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

/**
 * ShopReviewRepository — Truy vấn đánh giá cấp sạp.
 */
@Repository
public interface ShopReviewRepository extends JpaRepository<ShopReview, Long> {

    /** Đánh giá của một sạp, mới nhất trước (phân trang). */
    @Query("SELECT sr FROM ShopReview sr WHERE sr.shop.shopId = ?1 AND sr.deletedAt IS NULL ORDER BY sr.createdAt DESC")
    Page<ShopReview> findReviewsByShop(Long shopId, Pageable pageable);

    /** Đánh giá của một người dùng cho một sạp (để sửa thay vì tạo trùng). */
    @Query("SELECT sr FROM ShopReview sr WHERE sr.shop.shopId = ?1 AND sr.user.userId = ?2 AND sr.deletedAt IS NULL")
    Optional<ShopReview> findUserReviewForShop(Long shopId, Long userId);

    /** Kết quả gộp: điểm trung bình (avg) + số lượng đánh giá (cnt) của một sạp. */
    interface ShopRatingAggregate {
        Double getAvg();
        Long getCnt();
    }

    /** Điểm trung bình + số đánh giá của một sạp. */
    @Query("SELECT AVG(sr.rating) AS avg, COUNT(sr) AS cnt FROM ShopReview sr " +
           "WHERE sr.shop.shopId = ?1 AND sr.deletedAt IS NULL")
    ShopRatingAggregate aggregateForShop(Long shopId);

    /** Số lượng review theo từng mức sao (1..5) của một sạp. */
    interface RatingCount{
        Integer getRating();
        Long getCnt();
    }

    /** Đếm số đánh giá theo từng mức sao (gom nhóm) của một sạp. */
    @Query("SELECT sr.rating AS rating, COUNT(sr) AS cnt FROM ShopReview sr " +
            "WHERE sr.shop.shopId = ?1 AND sr.deletedAt IS NULL " +
            "GROUP BY sr.rating")
    List<RatingCount> countByRating(Long shopId);
}
