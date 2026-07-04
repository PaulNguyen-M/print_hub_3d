package com.printhub3.backend.repository;

import com.printhub3.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * User Repository - Data access for User entity
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    @Query("SELECT u FROM User u WHERE u.isActive = true AND u.deletedAt IS NULL")
    Page<User> findAllActiveUsers(Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE u.role.name = ?1 AND u.isActive = true AND u.deletedAt IS NULL")
    Page<User> findUsersByRole(String roleName, Pageable pageable);
}
