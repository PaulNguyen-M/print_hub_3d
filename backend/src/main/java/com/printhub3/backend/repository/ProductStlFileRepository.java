package com.printhub3.backend.repository;

import com.printhub3.backend.entity.ProductStlFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ProductStlFileRepository — File STL/3D đính kèm một sản phẩm.
 */
@Repository
public interface ProductStlFileRepository extends JpaRepository<ProductStlFile, Long> {

    /** Các file STL của một sản phẩm, sắp theo thứ tự hiển thị. */
    List<ProductStlFile> findByProduct_ProductIdOrderByDisplayOrderAsc(Long productId);
}
