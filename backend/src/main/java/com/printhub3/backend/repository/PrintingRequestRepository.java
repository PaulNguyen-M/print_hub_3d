package com.printhub3.backend.repository;

import com.printhub3.backend.entity.PrintingRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * PrintingRequestRepository — Truy vấn yêu cầu in 3D theo yêu cầu.
 */
@Repository
public interface PrintingRequestRepository extends JpaRepository<PrintingRequest, Long> {

    /** Yêu cầu in của một người dùng, mới nhất trước (phân trang). */
    @Query("SELECT pr FROM PrintingRequest pr WHERE pr.user.userId = ?1 AND pr.deletedAt IS NULL ORDER BY pr.createdAt DESC")
    Page<PrintingRequest> findRequestsByUserId(Long userId, Pageable pageable);

    /** Yêu cầu in theo trạng thái (phân trang). */
    @Query("SELECT pr FROM PrintingRequest pr WHERE pr.modelStatus = ?1 AND pr.deletedAt IS NULL")
    Page<PrintingRequest> findRequestsByStatus(PrintingRequest.ModelStatus status, Pageable pageable);

    /** Yêu cầu đang chờ xử lý (đang duyệt hoặc đã báo giá). */
    @Query("SELECT pr FROM PrintingRequest pr WHERE pr.modelStatus = 'REVIEWING' OR pr.modelStatus = 'QUOTED' AND pr.deletedAt IS NULL")
    List<PrintingRequest> findPendingRequests();
}
