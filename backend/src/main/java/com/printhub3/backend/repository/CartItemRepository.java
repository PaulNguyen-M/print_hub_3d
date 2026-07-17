package com.printhub3.backend.repository;

import com.printhub3.backend.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * CartItemRepository — Truy vấn các món trong giỏ hàng.
 */
@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    /** Các món (chưa bị xóa) trong một giỏ. */
    @Query("SELECT ci FROM CartItem ci WHERE ci.cart.cartId = ?1 AND ci.deletedAt IS NULL")
    List<CartItem> findItemsByCartId(Long cartId);

    /** Món theo giỏ + sản phẩm (dùng để gộp số lượng khi thêm trùng sản phẩm). */
    @Query("SELECT ci FROM CartItem ci WHERE ci.cart.cartId = ?1 AND ci.product.productId = ?2 AND ci.deletedAt IS NULL")
    Optional<CartItem> findByCartAndProduct(Long cartId, Long productId);

    /** Xóa toàn bộ món của một giỏ (khi dọn giỏ). */
    void deleteByCart_CartId(Long cartId);
}
