package com.printhub3.backend.repository;

import com.printhub3.backend.entity.Product;
import com.printhub3.backend.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    boolean existsByUser_UserIdAndProduct_ProductId(Long userId, Long productId);

    void deleteByUser_UserIdAndProduct_ProductId(Long userId, Long productId);

    /** Id các sản phẩm user đã thích — để frontend đánh dấu tym. */
    @Query("SELECT w.product.productId FROM Wishlist w WHERE w.user.userId = ?1")
    List<Long> findProductIdsByUser(Long userId);

    /** Danh sách sản phẩm đã thích (còn tồn tại), mới nhất trước. */
    @Query("SELECT w.product FROM Wishlist w WHERE w.user.userId = ?1 " +
           "AND w.product.deletedAt IS NULL ORDER BY w.createdAt DESC")
    List<Product> findProductsByUser(Long userId);
}
