package com.printhub3.backend.repository;

import com.printhub3.backend.entity.ShopPayout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

/**
 * ShopPayout Repository - Data access for shop payouts.
 */
@Repository
public interface ShopPayoutRepository extends JpaRepository<ShopPayout, Long> {

    List<ShopPayout> findByShop_ShopIdOrderByCreatedAtDesc(Long shopId);

    boolean existsByShop_ShopIdAndOrder_OrderId(Long shopId, Long orderId);

    @Query("SELECT COALESCE(SUM(p.netAmount), 0) FROM ShopPayout p WHERE p.shop.shopId = ?1")
    BigDecimal totalNetForShop(Long shopId);
}
