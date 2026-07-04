package com.printhub3.backend.repository;

import com.printhub3.backend.entity.PrintingRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * PrintingRequest Repository - Data access for PrintingRequest entity
 */
@Repository
public interface PrintingRequestRepository extends JpaRepository<PrintingRequest, Long> {
    
    @Query("SELECT pr FROM PrintingRequest pr WHERE pr.user.userId = ?1 AND pr.deletedAt IS NULL ORDER BY pr.createdAt DESC")
    Page<PrintingRequest> findRequestsByUserId(Long userId, Pageable pageable);
    
    @Query("SELECT pr FROM PrintingRequest pr WHERE pr.modelStatus = ?1 AND pr.deletedAt IS NULL")
    Page<PrintingRequest> findRequestsByStatus(PrintingRequest.ModelStatus status, Pageable pageable);
    
    @Query("SELECT pr FROM PrintingRequest pr WHERE pr.modelStatus = 'REVIEWING' OR pr.modelStatus = 'QUOTED' AND pr.deletedAt IS NULL")
    List<PrintingRequest> findPendingRequests();
}
