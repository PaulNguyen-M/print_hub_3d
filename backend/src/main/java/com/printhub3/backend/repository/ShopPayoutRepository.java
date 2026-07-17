package com.printhub3.backend.repository;

import com.printhub3.backend.entity.ShopPayout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

/**
 * ShopPayoutRepository — Truy vấn các lần chi trả cho sạp (sau khi đơn hoàn tất).
 */
@Repository
public interface ShopPayoutRepository extends JpaRepository<ShopPayout, Long> {

    /** Các lần chi trả của một sạp, mới nhất trước. */
    List<ShopPayout> findByShop_ShopIdOrderByCreatedAtDesc(Long shopId);

    /** Sạp đã được chi trả cho đơn này chưa (chống chi trả trùng). */
    boolean existsByShop_ShopIdAndOrder_OrderId(Long shopId, Long orderId);

    /** Tổng tiền thực nhận (sau hoa hồng) của một sạp. */
    @Query("SELECT COALESCE(SUM(p.netAmount), 0) FROM ShopPayout p WHERE p.shop.shopId = ?1")
    BigDecimal totalNetForShop(Long shopId);
}
