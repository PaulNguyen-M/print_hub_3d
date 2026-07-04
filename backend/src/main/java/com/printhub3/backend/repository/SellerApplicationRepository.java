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
 * SellerApplication Repository - Data access for shop-opening requests.
 */
@Repository
public interface SellerApplicationRepository extends JpaRepository<SellerApplication, Long> {

    Page<SellerApplication> findByStatusOrderByCreatedAtDesc(ApplicationStatus status, Pageable pageable);

    Page<SellerApplication> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<SellerApplication> findByApplicant_UserIdOrderByCreatedAtDesc(Long applicantId);

    /** A user can only have one open (PENDING) application at a time. */
    Optional<SellerApplication> findFirstByApplicant_UserIdAndStatus(Long applicantId, ApplicationStatus status);

    boolean existsByApplicant_UserIdAndStatus(Long applicantId, ApplicationStatus status);

    long countByStatus(ApplicationStatus status);
}
