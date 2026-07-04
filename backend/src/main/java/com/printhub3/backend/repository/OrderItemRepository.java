package com.printhub3.backend.repository;

import com.printhub3.backend.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * OrderItem Repository - Data access for OrderItem entity
 */
@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    
    @Query("SELECT oi FROM OrderItem oi WHERE oi.order.orderId = ?1 AND oi.deletedAt IS NULL")
    List<OrderItem> findItemsByOrderId(Long orderId);

    /** Distinct order IDs that contain at least one item from the given shop, newest first. */
    @Query("SELECT DISTINCT oi.order.orderId FROM OrderItem oi WHERE oi.product.shop.shopId = ?1 " +
           "AND oi.deletedAt IS NULL ORDER BY oi.order.orderId DESC")
    List<Long> findOrderIdsByShop(Long shopId);

    /** Items in a specific order that belong to the given shop. */
    @Query("SELECT oi FROM OrderItem oi WHERE oi.order.orderId = ?1 AND oi.product.shop.shopId = ?2 " +
           "AND oi.deletedAt IS NULL")
    List<OrderItem> findItemsByOrderAndShop(Long orderId, Long shopId);

    /** Distinct shop IDs represented in an order. */
    @Query("SELECT DISTINCT oi.product.shop.shopId FROM OrderItem oi WHERE oi.order.orderId = ?1 " +
           "AND oi.product.shop.shopId IS NOT NULL AND oi.deletedAt IS NULL")
    List<Long> findShopIdsByOrder(Long orderId);
}
