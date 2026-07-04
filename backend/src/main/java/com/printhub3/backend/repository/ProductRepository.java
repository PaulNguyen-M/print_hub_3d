package com.printhub3.backend.repository;

import com.printhub3.backend.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

/**
 * Product Repository - Data access for Product entity
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    
    @Query("SELECT p FROM Product p WHERE p.category.categoryId = ?1 AND p.isActive = true AND p.deletedAt IS NULL")
    Page<Product> findProductsByCategory(Long categoryId, Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE p.seller.userId = ?1 AND p.isActive = true AND p.deletedAt IS NULL")
    Page<Product> findProductsBySeller(Long sellerId, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.shop.shopId = ?1 AND p.isActive = true AND p.deletedAt IS NULL ORDER BY p.createdAt DESC")
    Page<Product> findProductsByShop(Long shopId, Pageable pageable);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.shop.shopId = ?1 AND p.isActive = true AND p.deletedAt IS NULL")
    long countActiveByShop(Long shopId);

    Page<Product> findByStatus(Product.ProductStatus status, Pageable pageable);

    java.util.List<Product> findBySeller_UserIdAndShopIsNull(Long sellerId);
    
    @Query("SELECT p FROM Product p WHERE p.name ILIKE %?1% AND p.isActive = true AND p.deletedAt IS NULL")
    Page<Product> searchProducts(String keyword, Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.deletedAt IS NULL AND p.price BETWEEN ?1 AND ?2")
    Page<Product> findProductsByPriceRange(BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.deletedAt IS NULL ORDER BY p.rating DESC, p.totalReviews DESC")
    Page<Product> findTopRatedProducts(Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.deletedAt IS NULL ORDER BY p.createdAt DESC")
    Page<Product> findLatestProducts(Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE p.stockQuantity > 0 AND p.isActive = true AND p.deletedAt IS NULL")
    Page<Product> findAvailableProducts(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.deletedAt IS NULL")
    Page<Product> findActiveProducts(Pageable pageable);
}
