package com.printhub3.backend.repository;

import com.printhub3.backend.entity.Shop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * ShopRepository — Truy vấn sạp ("shop") của người bán.
 */
@Repository
public interface ShopRepository extends JpaRepository<Shop, Long> {

    /** Sạp theo slug (định danh trên URL). */
    Optional<Shop> findBySlug(String slug);

    /** Sạp thuộc về một chủ sở hữu (mỗi user tối đa một sạp). */
    Optional<Shop> findByOwner_UserId(Long ownerId);

    /** Người dùng đã có sạp chưa. */
    boolean existsByOwner_UserId(Long ownerId);

    /** Slug đã tồn tại chưa (đảm bảo duy nhất khi tạo sạp). */
    boolean existsBySlug(String slug);
}
