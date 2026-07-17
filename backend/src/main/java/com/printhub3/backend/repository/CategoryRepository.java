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
 * CategoryRepository — Truy vấn danh mục sản phẩm.
 */
@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    /** Danh mục theo tên. */
    Optional<Category> findByName(String name);

    /** Danh mục đang hoạt động, sắp theo thứ tự hiển thị. */
    @Query("SELECT c FROM Category c WHERE c.isActive = true AND c.deletedAt IS NULL ORDER BY c.displayOrder ASC")
    List<Category> findAllActiveCategories();

    /** Danh mục đang hoạt động (phân trang). */
    @Query("SELECT c FROM Category c WHERE c.isActive = true AND c.deletedAt IS NULL")
    Page<Category> findAllActiveCategories(Pageable pageable);

    /** Danh mục gốc (không có danh mục cha), sắp theo thứ tự hiển thị. */
    @Query("SELECT c FROM Category c WHERE c.parentCategory IS NULL AND c.isActive = true AND c.deletedAt IS NULL ORDER BY c.displayOrder ASC")
    List<Category> findTopLevelCategories();
}
