package com.printhub3.backend.repository;

import com.printhub3.backend.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Order Repository - Data access for Order entity
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    Optional<Order> findByOrderNumber(String orderNumber);
    
    @Query("SELECT o FROM Order o WHERE o.user.userId = ?1 AND o.deletedAt IS NULL ORDER BY o.createdAt DESC")
    Page<Order> findOrdersByUserId(Long userId, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.user.userId = ?1 AND o.deletedAt IS NULL ORDER BY o.createdAt DESC")
    List<Order> findOrdersByUserIdDesc(Long userId);
    
    @Query("SELECT o FROM Order o WHERE o.orderStatus = ?1 AND o.deletedAt IS NULL")
    Page<Order> findOrdersByStatus(Order.OrderStatus status, Pageable pageable);
    
    @Query("SELECT o FROM Order o WHERE o.user.userId = ?1 AND o.orderStatus = ?2 AND o.deletedAt IS NULL")
    Page<Order> findUserOrdersByStatus(Long userId, Order.OrderStatus status, Pageable pageable);
    
    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN ?1 AND ?2 AND o.deletedAt IS NULL")
    List<Order> findOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("SELECT COUNT(o) FROM Order o WHERE o.orderStatus = 'PENDING' AND o.deletedAt IS NULL")
    long countPendingOrders();
}
