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
 * Withdrawal Repository - Data access for seller wallet withdrawals.
 */
@Repository
public interface WithdrawalRepository extends JpaRepository<Withdrawal, Long> {

    Page<Withdrawal> findByShop_ShopIdOrderByCreatedAtDesc(Long shopId, Pageable pageable);

    Page<Withdrawal> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Withdrawal> findByStatusOrderByCreatedAtDesc(WithdrawalStatus status, Pageable pageable);

    /** Total amount already paid out to a shop (successful withdrawals). */
    @Query("SELECT COALESCE(SUM(w.amount), 0) FROM Withdrawal w WHERE w.shop.shopId = ?1 AND w.status = 'PAID'")
    BigDecimal totalPaidForShop(Long shopId);

    /** Total amount currently held in pending withdrawal requests for a shop. */
    @Query("SELECT COALESCE(SUM(w.amount), 0) FROM Withdrawal w WHERE w.shop.shopId = ?1 AND w.status = 'PENDING'")
    BigDecimal totalPendingForShop(Long shopId);
}
