package com.printhub3.backend.repository;

import com.printhub3.backend.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * PaymentTransactionRepository — Truy vấn các giao dịch con của một thanh toán.
 */
@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    /** Các giao dịch của một thanh toán, mới nhất trước. */
    @Query("SELECT pt FROM PaymentTransaction pt WHERE pt.payment.paymentId = ?1 ORDER BY pt.createdAt DESC")
    List<PaymentTransaction> findTransactionsByPaymentId(Long paymentId);
}
