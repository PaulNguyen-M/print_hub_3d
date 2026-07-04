package com.printhub3.backend.repository;

import com.printhub3.backend.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * PaymentTransaction Repository - Data access for PaymentTransaction entity
 */
@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    
    @Query("SELECT pt FROM PaymentTransaction pt WHERE pt.payment.paymentId = ?1 ORDER BY pt.createdAt DESC")
    List<PaymentTransaction> findTransactionsByPaymentId(Long paymentId);
}
