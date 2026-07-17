package com.printhub3.backend.repository;

import com.printhub3.backend.entity.Withdrawal;
import com.printhub3.backend.entity.Withdrawal.WithdrawalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

/**
 * WithdrawalRepository — Truy vấn yêu cầu rút tiền từ ví người bán.
 */
@Repository
public interface WithdrawalRepository extends JpaRepository<Withdrawal, Long> {

    /** Yêu cầu rút của một sạp, mới nhất trước (phân trang). */
    Page<Withdrawal> findByShop_ShopIdOrderByCreatedAtDesc(Long shopId, Pageable pageable);

    /** Tất cả yêu cầu rút, mới nhất trước (phân trang). */
    Page<Withdrawal> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /** Yêu cầu rút theo trạng thái, mới nhất trước (phân trang). */
    Page<Withdrawal> findByStatusOrderByCreatedAtDesc(WithdrawalStatus status, Pageable pageable);

    /** Tổng tiền đã chi trả (trạng thái PAID) cho một sạp. */
    @Query("SELECT COALESCE(SUM(w.amount), 0) FROM Withdrawal w WHERE w.shop.shopId = ?1 AND w.status = 'PAID'")
    BigDecimal totalPaidForShop(Long shopId);

    /** Tổng tiền đang bị giữ trong các yêu cầu rút chờ duyệt (PENDING) của một sạp. */
    @Query("SELECT COALESCE(SUM(w.amount), 0) FROM Withdrawal w WHERE w.shop.shopId = ?1 AND w.status = 'PENDING'")
    BigDecimal totalPendingForShop(Long shopId);
}
