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
 * SellerService — Xử lý luồng "mở sạp": người mua nộp đơn, admin duyệt/từ chối.
 * Khi duyệt sẽ tạo một {@link Shop} và nâng vai trò người nộp lên SELLER.
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

    /** Nộp đơn xin mở sạp (chặn nếu đã có sạp hoặc đang có đơn chờ duyệt); báo cho admin. */
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

        notifyAdmins("Đơn mở sạp mới",
                "Người dùng " + user.getFullName() + " xin mở sạp \"" + request.getShopName() + "\". Vui lòng duyệt.",
                "SELLER_APPLICATION", application.getApplicationId());

        return toDto(application);
    }

    /** Tất cả đơn mở sạp của người dùng, mới nhất trước. */
    @Transactional(readOnly = true)
    public List<SellerApplicationDto> getMyApplications(Long userId) {
        return applicationRepository.findByApplicant_UserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toDto).toList();
    }

    /** Đơn gần nhất của người dùng, hoặc null nếu chưa có. */
    @Transactional(readOnly = true)
    public SellerApplicationDto getMyLatestApplication(Long userId) {
        return applicationRepository.findByApplicant_UserIdOrderByCreatedAtDesc(userId)
                .stream().findFirst().map(this::toDto).orElse(null);
    }

    // ── Admin-facing ────────────────────────────────────────────────────

    /** (Admin) Danh sách đơn mở sạp, lọc theo trạng thái nếu có (phân trang). */
    @Transactional(readOnly = true)
    public Page<SellerApplicationDto> listApplications(ApplicationStatus status, Pageable pageable) {
        Page<SellerApplication> page = (status == null)
                ? applicationRepository.findAllByOrderByCreatedAtDesc(pageable)
                : applicationRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        return page.map(this::toDto);
    }

    /** (Admin) Duyệt đơn: tạo sạp, nâng người nộp lên vai trò SELLER và báo cho họ. */
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

    /** (Admin) Từ chối đơn kèm lý do và báo cho người nộp. */
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

    /** Lấy entity admin theo id (null nếu không có). */
    private User resolveAdmin(Long adminId) {
        return adminId == null ? null : userRepository.findById(adminId).orElse(null);
    }

    /** Gửi một thông báo hệ thống cho một người dùng. */
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

    /** Gửi thông báo cho tất cả admin (vd có đơn mới cần duyệt). */
    private void notifyAdmins(String title, String message, String relatedType, Long relatedId) {
        userRepository.findUsersByRole("ADMIN", org.springframework.data.domain.Pageable.unpaged())
                .forEach(admin -> notificationRepository.save(Notification.builder()
                        .user(admin)
                        .title(title)
                        .message(message)
                        .notificationType(Notification.NotificationType.SYSTEM_ALERT)
                        .relatedEntityType(relatedType)
                        .relatedEntityId(relatedId)
                        .isRead(false)
                        .build()));
    }

    /** Tạo slug duy nhất cho sạp (thêm hậu tố -1, -2... nếu trùng). */
    private String uniqueSlug(String base) {
        String slug = base;
        int suffix = 1;
        while (shopRepository.existsBySlug(slug)) {
            slug = base + "-" + suffix++;
        }
        return slug;
    }

    /** Chuyển entity SellerApplication sang DTO trả về frontend. */
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
