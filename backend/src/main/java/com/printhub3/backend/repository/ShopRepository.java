package com.printhub3.backend.repository;

import com.printhub3.backend.entity.Shop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Shop Repository - Data access for the Shop ("sạp") entity.
 */
@Repository
public interface ShopRepository extends JpaRepository<Shop, Long> {

    Optional<Shop> findBySlug(String slug);

    Optional<Shop> findByOwner_UserId(Long ownerId);

    boolean existsByOwner_UserId(Long ownerId);

    boolean existsBySlug(String slug);
}
