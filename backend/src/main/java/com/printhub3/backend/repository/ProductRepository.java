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
 * ProductRepository — Truy vấn sản phẩm.
 * Kế thừa JpaSpecificationExecutor để lọc động (search + danh mục + giá) ở trang chợ.
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    /** Sản phẩm đang bán theo danh mục. */
    @Query("SELECT p FROM Product p WHERE p.category.categoryId = ?1 AND p.isActive = true AND p.deletedAt IS NULL")
    Page<Product> findProductsByCategory(Long categoryId, Pageable pageable);

    /** Sản phẩm đang bán của một người bán. */
    @Query("SELECT p FROM Product p WHERE p.seller.userId = ?1 AND p.isActive = true AND p.deletedAt IS NULL")
    Page<Product> findProductsBySeller(Long sellerId, Pageable pageable);

    /** Sản phẩm đang bán của một sạp, mới nhất trước. */
    @Query("SELECT p FROM Product p WHERE p.shop.shopId = ?1 AND p.isActive = true AND p.deletedAt IS NULL ORDER BY p.createdAt DESC")
    Page<Product> findProductsByShop(Long shopId, Pageable pageable);

    /** Đếm số sản phẩm đang bán của một sạp. */
    @Query("SELECT COUNT(p) FROM Product p WHERE p.shop.shopId = ?1 AND p.isActive = true AND p.deletedAt IS NULL")
    long countActiveByShop(Long shopId);

    /** Sản phẩm theo trạng thái duyệt (PENDING/ACTIVE/REJECTED). */
    Page<Product> findByStatus(Product.ProductStatus status, Pageable pageable);

    /** Đếm sản phẩm theo trạng thái (dùng cho dashboard). */
    long countByStatus(Product.ProductStatus status);

    /** Sản phẩm của một người bán nhưng chưa gắn sạp (dùng khi tạo sạp để gán vào). */
    java.util.List<Product> findBySeller_UserIdAndShopIsNull(Long sellerId);

    /** Tìm sản phẩm theo tên (không phân biệt hoa/thường — ILIKE). */
    @Query("SELECT p FROM Product p WHERE p.name ILIKE %?1% AND p.isActive = true AND p.deletedAt IS NULL")
    Page<Product> searchProducts(String keyword, Pageable pageable);

    /** Sản phẩm trong một khoảng giá. */
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.deletedAt IS NULL AND p.price BETWEEN ?1 AND ?2")
    Page<Product> findProductsByPriceRange(BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable);

    /** Sản phẩm đánh giá cao nhất (rating rồi tới số lượt đánh giá). */
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.deletedAt IS NULL ORDER BY p.rating DESC, p.totalReviews DESC")
    Page<Product> findTopRatedProducts(Pageable pageable);

    /** Sản phẩm mới nhất. */
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.deletedAt IS NULL ORDER BY p.createdAt DESC")
    Page<Product> findLatestProducts(Pageable pageable);

    /** Sản phẩm còn hàng (stock > 0). */
    @Query("SELECT p FROM Product p WHERE p.stockQuantity > 0 AND p.isActive = true AND p.deletedAt IS NULL")
    Page<Product> findAvailableProducts(Pageable pageable);

    /** Tất cả sản phẩm đang bán. */
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.deletedAt IS NULL")
    Page<Product> findActiveProducts(Pageable pageable);
}
