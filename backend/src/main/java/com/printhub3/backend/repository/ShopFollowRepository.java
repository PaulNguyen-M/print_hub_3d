package com.printhub3.backend.repository;

import com.printhub3.backend.entity.ShopFollow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * ShopFollowRepository — Truy vấn lượt theo dõi sạp.
 */
@Repository
public interface ShopFollowRepository extends JpaRepository<ShopFollow, Long> {

    /** Người dùng có đang theo dõi sạp này không. */
    boolean existsByShop_ShopIdAndUser_UserId(Long shopId, Long userId);

    /** Bỏ theo dõi (xóa bản ghi follow). */
    void deleteByShop_ShopIdAndUser_UserId(Long shopId, Long userId);

    /** Đếm số người theo dõi một sạp. */
    long countByShop_ShopId(Long shopId);
}
