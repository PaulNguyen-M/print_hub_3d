package com.printhub3.backend.repository;

import com.printhub3.backend.entity.StlUpload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for STL upload metadata
 */
@Repository
public interface StlUploadRepository extends JpaRepository<StlUpload, Long> {
}
