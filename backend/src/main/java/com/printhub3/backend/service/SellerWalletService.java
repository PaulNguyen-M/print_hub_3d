package com.printhub3.backend.service;

import com.printhub3.backend.dto.request.WithdrawalRequest;
import com.printhub3.backend.dto.response.SellerStatsDto;
import com.printhub3.backend.dto.response.WithdrawalDto;
import com.printhub3.backend.entity.Notification;
import com.printhub3.backend.entity.Shop;
import com.printhub3.backend.entity.ShopPayout;
import com.printhub3.backend.entity.User;
import com.printhub3.backend.entity.Withdrawal;
import com.printhub3.backend.entity.Withdrawal.WithdrawalStatus;
import com.printhub3.backend.exception.BusinessException;
import com.printhub3.backend.exception.ResourceNotFoundException;
import com.printhub3.backend.repository.NotificationRepository;
import com.printhub3.backend.repository.ProductRepository;
import com.printhub3.backend.repository.ShopPayoutRepository;
import com.printhub3.backend.repository.ShopRepository;
import com.printhub3.backend.repository.UserRepository;
import com.printhub3.backend.repository.WithdrawalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * SellerWalletService — Ví của người bán: thống kê tổng quan và luồng rút tiền
 * (seller yêu cầu → admin duyệt/từ chối). Tiền yêu cầu bị giữ khỏi số dư ngay,
 * và được hoàn lại nếu bị từ chối.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SellerWalletService {

    private static final BigDecimal MIN_WITHDRAWAL = new BigDecimal("50000");

    private final ShopRepository shopRepository;
    private final WithdrawalRepository withdrawalRepository;
    private final ShopPayoutRepository payoutRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    // ── Seller: dashboard stats ─────────────────────────────────────────

    @Transactional(readOnly = true)
    /** Thống kê ví & doanh số của seller (số dư, đã rút, đang chờ rút, doanh thu theo tháng). */
    public SellerStatsDto getStats(Long userId) {
        Shop shop = requireShop(userId);
        List<ShopPayout> payouts = payoutRepository.findByShop_ShopIdOrderByCreatedAtDesc(shop.getShopId());

        BigDecimal totalGross = BigDecimal.ZERO;
        BigDecimal totalCommission = BigDecimal.ZERO;
        BigDecimal totalNet = BigDecimal.ZERO;
        for (ShopPayout p : payouts) {
            totalGross = totalGross.add(nz(p.getGrossAmount()));
            totalCommission = totalCommission.add(nz(p.getCommissionAmount()));
            totalNet = totalNet.add(nz(p.getNetAmount()));
        }

        BigDecimal totalWithdrawn = nz(withdrawalRepository.totalPaidForShop(shop.getShopId()));
        BigDecimal pendingWithdraw = nz(withdrawalRepository.totalPendingForShop(shop.getShopId()));

        return SellerStatsDto.builder()
                .availableBalance(nz(shop.getBalance()))
                .totalEarned(totalNet)
                .totalGross(totalGross)
                .totalCommission(totalCommission)
                .totalWithdrawn(totalWithdrawn)
                .pendingWithdraw(pendingWithdraw)
                .totalOrders(payouts.size())
                .totalProductsSold(shop.getTotalSales() != null ? shop.getTotalSales() : 0)
                .totalProducts((int) productRepository.countActiveByShop(shop.getShopId()))
                .monthlyRevenue(buildMonthly(payouts))
                .build();
    }

    /** Net earnings for the last 6 months (oldest → newest). */
    /** Gom các khoản chi trả (payout) theo từng tháng để vẽ biểu đồ doanh thu. */
    private List<SellerStatsDto.MonthlyRevenue> buildMonthly(List<ShopPayout> payouts) {
        Map<YearMonth, BigDecimal> byMonth = new LinkedHashMap<>();
        YearMonth current = YearMonth.now();
        // seed last 6 months in order so the chart always has 6 bars
        for (int i = 5; i >= 0; i--) {
            byMonth.put(current.minusMonths(i), BigDecimal.ZERO);
        }
        for (ShopPayout p : payouts) {
            if (p.getCreatedAt() == null) continue;
            YearMonth ym = YearMonth.from(p.getCreatedAt());
            if (byMonth.containsKey(ym)) {
                byMonth.put(ym, byMonth.get(ym).add(nz(p.getNetAmount())));
            }
        }
        List<SellerStatsDto.MonthlyRevenue> result = new ArrayList<>();
        for (Map.Entry<YearMonth, BigDecimal> e : byMonth.entrySet()) {
            result.add(SellerStatsDto.MonthlyRevenue.builder()
                    .month("T" + e.getKey().getMonthValue())
                    .revenue(e.getValue())
                    .build());
        }
        return result;
    }

    // ── Seller: withdrawals ─────────────────────────────────────────────

    /** Tạo yêu cầu rút tiền: kiểm tra số dư & hạn mức tối thiểu, giữ tiền khỏi số dư ngay và báo admin. */
    public WithdrawalDto requestWithdrawal(Long userId, WithdrawalRequest request) {
        Shop shop = requireShop(userId);
        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(MIN_WITHDRAWAL) < 0) {
            throw new BusinessException("Số tiền rút tối thiểu là 50.000đ");
        }
        BigDecimal balance = nz(shop.getBalance());
        if (amount.compareTo(balance) > 0) {
            throw new BusinessException("Số dư không đủ. Số dư khả dụng: " + balance.toPlainString() + "đ");
        }

        // Giữ tiền ngay: trừ khỏi số dư khả dụng (sẽ hoàn lại nếu bị từ chối).
        shop.setBalance(balance.subtract(amount));
        shopRepository.save(shop);

        Withdrawal withdrawal = withdrawalRepository.save(Withdrawal.builder()
                .shop(shop)
                .amount(amount)
                .bankName(request.getBankName())
                .bankAccountNumber(request.getBankAccountNumber())
                .bankAccountName(request.getBankAccountName())
                .note(request.getNote())
                .status(WithdrawalStatus.PENDING)
                .build());

        notifyAdmins("Yêu cầu rút tiền mới",
                "Sạp \"" + shop.getName() + "\" yêu cầu rút " + amount.toPlainString() + "đ. Vui lòng duyệt.",
                "WITHDRAWAL", withdrawal.getWithdrawalId());

        log.info("Withdrawal {} requested by shop {} amount {}", withdrawal.getWithdrawalId(), shop.getShopId(), amount);
        return toDto(withdrawal);
    }

    @Transactional(readOnly = true)
    /** Danh sách yêu cầu rút của seller hiện tại (phân trang). */
    public Page<WithdrawalDto> getMyWithdrawals(Long userId, Pageable pageable) {
        Shop shop = requireShop(userId);
        return withdrawalRepository.findByShop_ShopIdOrderByCreatedAtDesc(shop.getShopId(), pageable).map(this::toDto);
    }

    // ── Admin: process withdrawals ──────────────────────────────────────

    @Transactional(readOnly = true)
    /** (Admin) Danh sách tất cả yêu cầu rút, lọc theo trạng thái (phân trang). */
    public Page<WithdrawalDto> listWithdrawals(WithdrawalStatus status, Pageable pageable) {
        Page<Withdrawal> page = (status == null)
                ? withdrawalRepository.findAllByOrderByCreatedAtDesc(pageable)
                : withdrawalRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        return page.map(this::toDto);
    }

    /** (Admin) Duyệt & xác nhận đã chi trả một yêu cầu rút (tiền đã bị giữ từ trước). */
    public WithdrawalDto approveWithdrawal(Long withdrawalId, Long adminId) {
        Withdrawal w = requireWithdrawal(withdrawalId);
        if (w.getStatus() != WithdrawalStatus.PENDING) {
            throw new BusinessException("Yêu cầu này đã được xử lý rồi");
        }
        w.setStatus(WithdrawalStatus.PAID);
        w.setProcessedBy(resolveUser(adminId));
        w.setProcessedAt(java.time.LocalDateTime.now());
        withdrawalRepository.save(w);

        notify(w.getShop().getOwner(), "Yêu cầu rút tiền đã được duyệt",
                "Yêu cầu rút " + w.getAmount().toPlainString() + "đ của bạn đã được chuyển. Vui lòng kiểm tra tài khoản ngân hàng.",
                w.getWithdrawalId());
        log.info("Withdrawal {} approved by admin {}", withdrawalId, adminId);
        return toDto(w);
    }

    /** (Admin) Từ chối yêu cầu rút kèm lý do và hoàn tiền lại vào số dư của sạp. */
    public WithdrawalDto rejectWithdrawal(Long withdrawalId, Long adminId, String reason) {
        Withdrawal w = requireWithdrawal(withdrawalId);
        if (w.getStatus() != WithdrawalStatus.PENDING) {
            throw new BusinessException("Yêu cầu này đã được xử lý rồi");
        }
        // Hoàn tiền đã giữ về số dư của sạp.
        Shop shop = w.getShop();
        shop.setBalance(nz(shop.getBalance()).add(w.getAmount()));
        shopRepository.save(shop);

        w.setStatus(WithdrawalStatus.REJECTED);
        w.setRejectionReason(reason);
        w.setProcessedBy(resolveUser(adminId));
        w.setProcessedAt(java.time.LocalDateTime.now());
        withdrawalRepository.save(w);

        notify(shop.getOwner(), "Yêu cầu rút tiền bị từ chối",
                "Yêu cầu rút " + w.getAmount().toPlainString() + "đ đã bị từ chối và hoàn lại số dư."
                        + (reason != null && !reason.isBlank() ? " Lý do: " + reason : ""),
                w.getWithdrawalId());
        log.info("Withdrawal {} rejected by admin {}", withdrawalId, adminId);
        return toDto(w);
    }

    // ── Helpers ─────────────────────────────────────────────────────────

    /** Lấy sạp của người dùng, ném lỗi nếu chưa có. */
    private Shop requireShop(Long userId) {
        return shopRepository.findByOwner_UserId(userId)
                .orElseThrow(() -> new BusinessException("Bạn chưa có sạp"));
    }

    /** Lấy yêu cầu rút theo id, ném lỗi nếu không có. */
    private Withdrawal requireWithdrawal(Long id) {
        return withdrawalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Withdrawal", "id", id));
    }

    /** Lấy user theo id (null nếu không có). */
    private User resolveUser(Long id) {
        return id == null ? null : userRepository.findById(id).orElse(null);
    }

    /** Gửi một thông báo hệ thống cho người dùng. */
    private void notify(User user, String title, String message, Long relatedId) {
        if (user == null) return;
        notificationRepository.save(Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .notificationType(Notification.NotificationType.SYSTEM_ALERT)
                .relatedEntityType("WITHDRAWAL")
                .relatedEntityId(relatedId)
                .isRead(false)
                .build());
    }

    /** Notify every active admin (e.g. a new withdrawal request to review). */
    /** Gửi thông báo cho tất cả admin (vd có yêu cầu rút mới cần duyệt). */
    private void notifyAdmins(String title, String message, String relatedType, Long relatedId) {
        userRepository.findUsersByRole("ADMIN", Pageable.unpaged())
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

    /** Trả 0 nếu giá trị null (null-safe). */
    private static BigDecimal nz(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    /** Chuyển entity Withdrawal sang DTO trả về frontend. */
    private WithdrawalDto toDto(Withdrawal w) {
        Shop shop = w.getShop();
        return WithdrawalDto.builder()
                .withdrawalId(w.getWithdrawalId())
                .amount(w.getAmount())
                .bankName(w.getBankName())
                .bankAccountNumber(w.getBankAccountNumber())
                .bankAccountName(w.getBankAccountName())
                .note(w.getNote())
                .status(w.getStatus().name())
                .rejectionReason(w.getRejectionReason())
                .shopId(shop != null ? shop.getShopId() : null)
                .shopName(shop != null ? shop.getName() : null)
                .shopSlug(shop != null ? shop.getSlug() : null)
                .ownerName(shop != null && shop.getOwner() != null ? shop.getOwner().getFullName() : null)
                .processedAt(w.getProcessedAt())
                .createdAt(w.getCreatedAt())
                .build();
    }
}
