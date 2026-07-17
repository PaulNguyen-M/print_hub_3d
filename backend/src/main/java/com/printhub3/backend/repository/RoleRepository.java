package com.printhub3.backend.repository;

import com.printhub3.backend.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * RoleRepository — Truy vấn vai trò (role) người dùng.
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    /** Vai trò theo tên (vd "ADMIN", "BUYER"). */
    Optional<Role> findByName(String name);

    /** Tên vai trò đã tồn tại chưa. */
    boolean existsByName(String name);
}
