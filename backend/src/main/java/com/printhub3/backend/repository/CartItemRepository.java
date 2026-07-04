package com.printhub3.backend.repository;

import com.printhub3.backend.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * CartItem Repository - Data access for CartItem entity
 */
@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    
    @Query("SELECT ci FROM CartItem ci WHERE ci.cart.cartId = ?1 AND ci.deletedAt IS NULL")
    List<CartItem> findItemsByCartId(Long cartId);
    
    @Query("SELECT ci FROM CartItem ci WHERE ci.cart.cartId = ?1 AND ci.product.productId = ?2 AND ci.deletedAt IS NULL")
    Optional<CartItem> findByCartAndProduct(Long cartId, Long productId);
    
    void deleteByCart_CartId(Long cartId);
}
