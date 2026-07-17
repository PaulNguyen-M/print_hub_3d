package com.printhub3.backend.repository;

import com.printhub3.backend.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * OrderItemRepository — Truy vấn dòng hàng (order item) trong đơn.
 */
@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    /** Các món (chưa bị xóa) của một đơn. */
    @Query("SELECT oi FROM OrderItem oi WHERE oi.order.orderId = ?1 AND oi.deletedAt IS NULL")
    List<OrderItem> findItemsByOrderId(Long orderId);

    /** Id các đơn có chứa ít nhất một sản phẩm của sạp cho trước (mới nhất trước). */
    @Query("SELECT DISTINCT oi.order.orderId FROM OrderItem oi WHERE oi.product.shop.shopId = ?1 " +
           "AND oi.deletedAt IS NULL ORDER BY oi.order.orderId DESC")
    List<Long> findOrderIdsByShop(Long shopId);

    /** Các món của một đơn thuộc về một sạp cụ thể (dùng khi tách đơn theo sạp). */
    @Query("SELECT oi FROM OrderItem oi WHERE oi.order.orderId = ?1 AND oi.product.shop.shopId = ?2 " +
           "AND oi.deletedAt IS NULL")
    List<OrderItem> findItemsByOrderAndShop(Long orderId, Long shopId);

    /** Id các sạp xuất hiện trong một đơn. */
    @Query("SELECT DISTINCT oi.product.shop.shopId FROM OrderItem oi WHERE oi.order.orderId = ?1 " +
           "AND oi.product.shop.shopId IS NOT NULL AND oi.deletedAt IS NULL")
    List<Long> findShopIdsByOrder(Long orderId);
}
