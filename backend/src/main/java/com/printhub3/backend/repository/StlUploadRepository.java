package com.printhub3.backend.repository;

import com.printhub3.backend.entity.StlUpload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * StlUploadRepository — Truy vấn metadata các file STL đã tải lên.
 */
@Repository
public interface StlUploadRepository extends JpaRepository<StlUpload, Long> {
}
