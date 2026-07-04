package com.printhub3.backend.service;

import com.printhub3.backend.config.MarketplaceProperties;
import com.printhub3.backend.dto.request.SellerApplicationRequest;
import com.printhub3.backend.dto.response.SellerApplicationDto;
import com.printhub3.backend.entity.Notification;
import com.printhub3.backend.entity.Role;
import com.printhub3.backend.entity.SellerApplication;
import com.printhub3.backend.entity.SellerApplication.ApplicationStatus;
import com.printhub3.backend.entity.Shop;
import com.printhub3.backend.entity.User;
import com.printhub3.backend.exception.BusinessException;
import com.printhub3.backend.exception.ResourceNotFoundException;
import com.printhub3.backend.repository.NotificationRepository;
import com.printhub3.backend.repository.RoleRepository;
import com.printhub3.backend.repository.SellerApplicationRepository;
import com.printhub3.backend.repository.ShopRepository;
import com.printhub3.backend.repository.UserRepository;
import com.printhub3.backend.util.SlugUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * SellerService - Handles the "open a shop" application flow: buyers apply,
 * admins approve/reject. On approval a {@link Shop} is created and the applicant
 * is upgraded to the SELLER role.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SellerService {

    private final SellerApplicationRepository applicationRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final NotificationRepository notificationRepository;
    private final MarketplaceProperties marketplaceProperties;

    // ── Buyer-facing ────────────────────────────────────────────────────

    /**
     * Submit an application to open a shop.
     */
    public SellerApplicationDto applyForShop(Long userId, SellerApplicationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (shopRepository.existsByOwner_UserId(userId)) {
            throw new BusinessException("Bạn đã có sạp rồi, không thể đăng ký thêm");
        }
        if (applicationRepository.existsByApplicant_UserIdAndStatus(userId, ApplicationStatus.PENDING)) {
            throw new BusinessException("Bạn đang có một đơn đăng ký mở sạp chờ duyệt");
        }

        BigDecimal openingFee = marketplaceProperties.getOpeningFee() != null
                ? marketplaceProperties.getOpeningFee()
                : BigDecimal.ZERO;
        boolean feePaid = openingFee.compareTo(BigDecimal.ZERO) <= 0;

        SellerApplication application = SellerApplication.builder()
                .applicant(user)
                .shopName(request.getShopName())
                .description(request.getDescription())
                .status(ApplicationStatus.PENDING)
                .openingFee(openingFee)
                .feePaid(feePaid)
                .build();

        application = applicationRepository.save(application);
        log.info("Seller application {} submitted by user {}", application.getApplicationId(), userId);

        return toDto(application);
    }

    @Transactional(readOnly = true)
    public List<SellerApplicationDto> getMyApplications(Long userId) {
        return applicationRepository.findByApplicant_UserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toDto).toList();
    }

    /** The most recent application for the user, or null if none. */
    @Transactional(readOnly = true)
    public SellerApplicationDto getMyLatestApplication(Long userId) {
        return applicationRepository.findByApplicant_UserIdOrderByCreatedAtDesc(userId)
                .stream().findFirst().map(this::toDto).orElse(null);
    }

    // ── Admin-facing ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<SellerApplicationDto> listApplications(ApplicationStatus status, Pageable pageable) {
        Page<SellerApplication> page = (status == null)
                ? applicationRepository.findAllByOrderByCreatedAtDesc(pageable)
                : applicationRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        return page.map(this::toDto);
    }

    /**
     * Approve an application: create the shop and upgrade the applicant to SELLER.
     */
    public SellerApplicationDto approveApplication(Long applicationId, Long adminId) {
        SellerApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("SellerApplication", "id", applicationId));

        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new BusinessException("Đơn này đã được xử lý rồi");
        }
        if (Boolean.FALSE.equals(application.getFeePaid())) {
            throw new BusinessException("Người dùng chưa thanh toán phí mở sạp");
        }

        User applicant = application.getApplicant();
        if (shopRepository.existsByOwner_UserId(applicant.getUserId())) {
            throw new BusinessException("Người dùng này đã có sạp");
        }

        // Create the shop
        BigDecimal commission = marketplaceProperties.getCommissionRate() != null
                ? marketplaceProperties.getCommissionRate()
                : new BigDecimal("0.15");
        Shop shop = Shop.builder()
                .owner(applicant)
                .name(application.getShopName())
                .slug(uniqueSlug(SlugUtil.toSlug(application.getShopName())))
                .description(application.getDescription())
                .status(Shop.ShopStatus.ACTIVE)
                .commissionRate(commission)
                .build();
        shop = shopRepository.save(shop);

        // Upgrade applicant to SELLER
        Role sellerRole = roleRepository.findByName("SELLER")
                .orElseThrow(() -> new BusinessException("Role not found: SELLER"));
        applicant.setRole(sellerRole);
        userRepository.save(applicant);

        application.setStatus(ApplicationStatus.APPROVED);
        application.setShop(shop);
        application.setReviewedAt(LocalDateTime.now());
        application.setReviewedBy(resolveAdmin(adminId));
        applicationRepository.save(application);

        notify(applicant, "Đơn mở sạp được duyệt",
                "Chúc mừng! Sạp \"" + shop.getName() + "\" của bạn đã được duyệt. Bạn có thể bắt đầu đăng sản phẩm.",
                shop.getShopId());

        log.info("Application {} approved -> shop {} for user {}", applicationId, shop.getShopId(), applicant.getUserId());
        return toDto(application);
    }

    /**
     * Reject an application with a reason.
     */
    public SellerApplicationDto rejectApplication(Long applicationId, Long adminId, String reason) {
        SellerApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("SellerApplication", "id", applicationId));

        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new BusinessException("Đơn này đã được xử lý rồi");
        }

        application.setStatus(ApplicationStatus.REJECTED);
        application.setRejectionReason(reason);
        application.setReviewedAt(LocalDateTime.now());
        application.setReviewedBy(resolveAdmin(adminId));
        applicationRepository.save(application);

        notify(application.getApplicant(), "Đơn mở sạp bị từ chối",
                "Đơn đăng ký mở sạp của bạn đã bị từ chối."
                        + (reason != null && !reason.isBlank() ? " Lý do: " + reason : ""),
                application.getApplicationId());

        log.info("Application {} rejected by admin {}", applicationId, adminId);
        return toDto(application);
    }

    // ── Helpers ─────────────────────────────────────────────────────────

    private User resolveAdmin(Long adminId) {
        return adminId == null ? null : userRepository.findById(adminId).orElse(null);
    }

    private void notify(User user, String title, String message, Long relatedId) {
        notificationRepository.save(Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .notificationType(Notification.NotificationType.SYSTEM_ALERT)
                .relatedEntityType("SELLER_APPLICATION")
                .relatedEntityId(relatedId)
                .isRead(false)
                .build());
    }

    private String uniqueSlug(String base) {
        String slug = base;
        int suffix = 1;
        while (shopRepository.existsBySlug(slug)) {
            slug = base + "-" + suffix++;
        }
        return slug;
    }

    private SellerApplicationDto toDto(SellerApplication a) {
        Shop shop = a.getShop();
        return SellerApplicationDto.builder()
                .applicationId(a.getApplicationId())
                .applicantId(a.getApplicant() != null ? a.getApplicant().getUserId() : null)
                .applicantName(a.getApplicant() != null ? a.getApplicant().getFullName() : null)
                .applicantEmail(a.getApplicant() != null ? a.getApplicant().getEmail() : null)
                .shopName(a.getShopName())
                .description(a.getDescription())
                .status(a.getStatus().name())
                .openingFee(a.getOpeningFee())
                .feePaid(a.getFeePaid())
                .rejectionReason(a.getRejectionReason())
                .reviewedAt(a.getReviewedAt())
                .shopId(shop != null ? shop.getShopId() : null)
                .shopSlug(shop != null ? shop.getSlug() : null)
                .createdAt(a.getCreatedAt())
                .build();
    }
}
