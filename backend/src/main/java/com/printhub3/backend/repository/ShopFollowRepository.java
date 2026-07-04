package com.printhub3.backend.repository;

import com.printhub3.backend.entity.ShopFollow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * ShopFollow Repository - Data access for shop follows.
 */
@Repository
public interface ShopFollowRepository extends JpaRepository<ShopFollow, Long> {

    boolean existsByShop_ShopIdAndUser_UserId(Long shopId, Long userId);

    void deleteByShop_ShopIdAndUser_UserId(Long shopId, Long userId);

    long countByShop_ShopId(Long shopId);
}
