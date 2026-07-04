package com.printhub3.backend.repository;

import com.printhub3.backend.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Cart Repository - Data access for Cart entity
 */
@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUser_UserId(Long userId);    
    boolean existsByUser_UserId(Long userId);
}
