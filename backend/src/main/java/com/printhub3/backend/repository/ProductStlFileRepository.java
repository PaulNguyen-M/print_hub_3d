package com.printhub3.backend.repository;

import com.printhub3.backend.entity.ProductStlFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ProductStlFile Repository - STL/3D files attached to a product.
 */
@Repository
public interface ProductStlFileRepository extends JpaRepository<ProductStlFile, Long> {

    List<ProductStlFile> findByProduct_ProductIdOrderByDisplayOrderAsc(Long productId);
}
