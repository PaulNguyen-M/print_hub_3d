package com.printhub3.backend.repository;

import com.printhub3.backend.entity.ProductReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * ProductReview Repository - Data access for ProductReview entity
 */
@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
    
    @Query("SELECT pr FROM ProductReview pr WHERE pr.product.productId = ?1 AND pr.deletedAt IS NULL ORDER BY pr.createdAt DESC")
    Page<ProductReview> findReviewsByProductId(Long productId, Pageable pageable);
    
    @Query("SELECT pr FROM ProductReview pr WHERE pr.product.productId = ?1 AND pr.user.userId = ?2 AND pr.deletedAt IS NULL")
    Optional<ProductReview> findUserReviewForProduct(Long productId, Long userId);
    
    @Query("SELECT pr FROM ProductReview pr WHERE pr.user.userId = ?1 AND pr.deletedAt IS NULL ORDER BY pr.createdAt DESC")
    Page<ProductReview> findReviewsByUserId(Long userId, Pageable pageable);

    @Query("SELECT pr FROM ProductReview pr WHERE pr.product.shop.shopId = ?1 AND pr.deletedAt IS NULL ORDER BY pr.createdAt DESC")
    Page<ProductReview> findReviewsByShop(Long shopId, Pageable pageable);

    /** Average rating + review count aggregate. */
    interface RatingAggregate {
        Double getAvg();
        Long getCnt();
    }

    @Query("SELECT AVG(pr.rating) AS avg, COUNT(pr) AS cnt FROM ProductReview pr " +
           "WHERE pr.product.productId = ?1 AND pr.deletedAt IS NULL")
    RatingAggregate aggregateForProduct(Long productId);

    @Query("SELECT AVG(pr.rating) AS avg, COUNT(pr) AS cnt FROM ProductReview pr " +
           "WHERE pr.product.shop.shopId = ?1 AND pr.deletedAt IS NULL")
    RatingAggregate aggregateForShop(Long shopId);
}
