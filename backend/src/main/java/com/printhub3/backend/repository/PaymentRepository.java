package com.printhub3.backend.repository;

import com.printhub3.backend.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * PaymentRepository — Truy vấn thanh toán.
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    /** Thanh toán của một đơn. */
    @Query("SELECT p FROM Payment p WHERE p.order.orderId = ?1 AND p.deletedAt IS NULL")
    Optional<Payment> findByOrderId(Long orderId);

    /** Thanh toán theo trạng thái (phân trang). */
    @Query("SELECT p FROM Payment p WHERE p.paymentStatus = ?1 AND p.deletedAt IS NULL")
    Page<Payment> findPaymentsByStatus(Payment.PaymentStatus status, Pageable pageable);

    /** Thanh toán theo mã giao dịch của cổng (Stripe...). */
    @Query("SELECT p FROM Payment p WHERE p.gatewayTransactionId = ?1 AND p.deletedAt IS NULL")
    Optional<Payment> findByGatewayTransactionId(String transactionId);

    /** Thanh toán theo người dùng (truy qua đơn hàng). */
    @Query("SELECT p FROM Payment p WHERE p.order.user.userId = ?1 AND p.deletedAt IS NULL")
    Page<Payment> findPaymentsByUserId(Long userId, Pageable pageable);

    /** Thanh toán trong một khoảng thời gian (dùng để tính doanh thu). */
    @Query("SELECT p FROM Payment p WHERE p.createdAt BETWEEN ?1 AND ?2 AND p.deletedAt IS NULL")
    List<Payment> findPaymentsByDateRange(LocalDateTime startDate, LocalDateTime endDate);
}
