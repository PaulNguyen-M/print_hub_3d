package com.printhub3.backend.repository;

import com.printhub3.backend.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ProductImage Repository - Data access for ProductImage entity
 */
@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    
    @Query("SELECT pi FROM ProductImage pi WHERE pi.product.productId = ?1 AND pi.deletedAt IS NULL ORDER BY pi.displayOrder ASC")
    List<ProductImage> findImagesByProductId(Long productId);
    
    @Query("SELECT pi FROM ProductImage pi WHERE pi.product.productId = ?1 AND pi.isPrimary = true AND pi.deletedAt IS NULL")
    Optional<ProductImage> findPrimaryImageByProductId(Long productId);
}
