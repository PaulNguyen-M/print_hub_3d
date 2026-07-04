package com.printhub3.backend.repository;

import com.printhub3.backend.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Category Repository - Data access for Category entity
 */
@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByName(String name);
    
    @Query("SELECT c FROM Category c WHERE c.isActive = true AND c.deletedAt IS NULL ORDER BY c.displayOrder ASC")
    List<Category> findAllActiveCategories();
    
    @Query("SELECT c FROM Category c WHERE c.isActive = true AND c.deletedAt IS NULL")
    Page<Category> findAllActiveCategories(Pageable pageable);
    
    @Query("SELECT c FROM Category c WHERE c.parentCategory IS NULL AND c.isActive = true AND c.deletedAt IS NULL ORDER BY c.displayOrder ASC")
    List<Category> findTopLevelCategories();
}
