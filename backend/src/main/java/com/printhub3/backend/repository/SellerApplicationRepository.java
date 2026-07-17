package com.printhub3.backend.repository;

import com.printhub3.backend.entity.SellerApplication;
import com.printhub3.backend.entity.SellerApplication.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * SellerApplicationRepository — Truy vấn đơn đăng ký mở sạp.
 */
@Repository
public interface SellerApplicationRepository extends JpaRepository<SellerApplication, Long> {

    /** Đơn theo trạng thái, mới nhất trước (phân trang). */
    Page<SellerApplication> findByStatusOrderByCreatedAtDesc(ApplicationStatus status, Pageable pageable);

    /** Tất cả đơn, mới nhất trước (phân trang). */
    Page<SellerApplication> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /** Tất cả đơn của một người nộp, mới nhất trước. */
    List<SellerApplication> findByApplicant_UserIdOrderByCreatedAtDesc(Long applicantId);

    /** Đơn đang mở (PENDING) của một người — mỗi lúc chỉ được có một. */
    Optional<SellerApplication> findFirstByApplicant_UserIdAndStatus(Long applicantId, ApplicationStatus status);

    /** Người dùng đã có đơn ở trạng thái này chưa. */
    boolean existsByApplicant_UserIdAndStatus(Long applicantId, ApplicationStatus status);

    /** Đếm đơn theo trạng thái. */
    long countByStatus(ApplicationStatus status);
}
