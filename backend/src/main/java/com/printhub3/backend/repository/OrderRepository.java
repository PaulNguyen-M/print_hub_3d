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
 * OrderRepository — Truy vấn đơn hàng.
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    /** Đơn theo mã đơn (order number). */
    Optional<Order> findByOrderNumber(String orderNumber);

    /** Đơn của một người dùng, mới nhất trước (phân trang). */
    @Query("SELECT o FROM Order o WHERE o.user.userId = ?1 AND o.deletedAt IS NULL ORDER BY o.createdAt DESC")
    Page<Order> findOrdersByUserId(Long userId, Pageable pageable);

    /** Toàn bộ đơn của một người dùng, mới nhất trước (không phân trang). */
    @Query("SELECT o FROM Order o WHERE o.user.userId = ?1 AND o.deletedAt IS NULL ORDER BY o.createdAt DESC")
    List<Order> findOrdersByUserIdDesc(Long userId);

    /** Đơn theo trạng thái (phân trang). */
    @Query("SELECT o FROM Order o WHERE o.orderStatus = ?1 AND o.deletedAt IS NULL")
    Page<Order> findOrdersByStatus(Order.OrderStatus status, Pageable pageable);

    /** Đơn của một người dùng theo trạng thái. */
    @Query("SELECT o FROM Order o WHERE o.user.userId = ?1 AND o.orderStatus = ?2 AND o.deletedAt IS NULL")
    Page<Order> findUserOrdersByStatus(Long userId, Order.OrderStatus status, Pageable pageable);

    /** Đơn trong một khoảng thời gian (dùng cho báo cáo). */
    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN ?1 AND ?2 AND o.deletedAt IS NULL")
    List<Order> findOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate);

    /** Đếm số đơn đang chờ xử lý (PENDING). */
    @Query("SELECT COUNT(o) FROM Order o WHERE o.orderStatus = 'PENDING' AND o.deletedAt IS NULL")
    long countPendingOrders();

    /** Người dùng đã có đơn (không hủy, đã thanh toán) chứa sản phẩm của sạp này chưa — dùng cho "đã mua hàng". */
    @Query("SELECT COUNT(oi) > 0 FROM OrderItem oi " +
            "WHERE oi.order.user.userId = ?1 " +
            "AND oi.product.shop.shopId = ?2 " +
            "AND oi.order.orderStatus <> 'CANCELLED' " +
            "AND oi.order.orderStatus <> 'PENDING' " +
            "AND oi.order.deletedAt IS NULL")
    boolean existsPurchaseFromShop(Long userId, Long shopId);
}
