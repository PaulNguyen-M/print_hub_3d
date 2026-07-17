package com.printhub3.backend.repository;

import com.printhub3.backend.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * CartRepository — Truy vấn giỏ hàng.
 */
@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {

    /** Giỏ hàng của một người dùng. */
    Optional<Cart> findByUser_UserId(Long userId);

    /** Người dùng đã có giỏ hàng chưa. */
    boolean existsByUser_UserId(Long userId);
}
