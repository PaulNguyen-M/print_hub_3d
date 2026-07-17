package com.printhub3.backend.controller;

import com.printhub3.backend.dto.request.SellerApplicationRequest;
import com.printhub3.backend.dto.response.ApiResponse;
import com.printhub3.backend.dto.response.SellerApplicationDto;
import com.printhub3.backend.dto.response.SellerOrderDto;
import com.printhub3.backend.dto.response.ShopDto;
import com.printhub3.backend.security.service.UserDetailsImpl;
import com.printhub3.backend.service.OrderWorkflowService;
import com.printhub3.backend.service.SellerService;
import com.printhub3.backend.service.ShopService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * SellerController — Khu vực người bán (yêu cầu đăng nhập).
 * Gồm: đăng ký mở sạp, xem/cập nhật sạp của mình, đơn hàng của sạp, và ví
 * (thống kê + yêu cầu rút tiền).
 */
@RestController
@RequestMapping("/api/v1/seller")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class SellerController {

    private final SellerService sellerService;
    private final ShopService shopService;
    private final OrderWorkflowService orderWorkflowService;
    private final com.printhub3.backend.service.SellerWalletService sellerWalletService;

    /** Gửi đơn đăng ký mở sạp. */
    @PostMapping("/apply")
    public ResponseEntity<ApiResponse<SellerApplicationDto>> apply(
            @Valid @RequestBody SellerApplicationRequest request) {
        SellerApplicationDto dto = sellerService.applyForShop(getCurrentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(dto, "Đã gửi đơn đăng ký mở sạp, vui lòng chờ admin duyệt"));
    }

    /** Đơn đăng ký gần nhất của người dùng (hoặc null nếu chưa có). */
    @GetMapping("/application")
    public ResponseEntity<ApiResponse<SellerApplicationDto>> myLatestApplication() {
        SellerApplicationDto dto = sellerService.getMyLatestApplication(getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(dto, "Lấy đơn đăng ký thành công"));
    }

    /** Tất cả đơn đăng ký của người dùng. */
    @GetMapping("/applications")
    public ResponseEntity<ApiResponse<List<SellerApplicationDto>>> myApplications() {
        List<SellerApplicationDto> list = sellerService.getMyApplications(getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh sách đơn đăng ký thành công"));
    }

    /** Sạp của chính người dùng (null nếu chưa có sạp). */
    @GetMapping("/shop")
    public ResponseEntity<ApiResponse<ShopDto>> myShop() {
        ShopDto shop = shopService.getShopByOwner(getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(shop, "Lấy thông tin sạp thành công"));
    }

    /** Cập nhật sạp của người dùng (tên, mô tả, logo, banner, sản phẩm nổi bật). */
    @PutMapping("/shop")
    public ResponseEntity<ApiResponse<ShopDto>> updateMyShop(
            @Valid @RequestBody com.printhub3.backend.dto.request.UpdateShopRequest request) {
        ShopDto shop = shopService.updateMyShop(getCurrentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(shop, "Cập nhật sạp thành công"));
    }

    /** Đơn hàng chứa sản phẩm của seller hiện tại, kèm khoản thu. */
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<SellerOrderDto>>> myOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        org.springframework.data.domain.Page<SellerOrderDto> orders =
                orderWorkflowService.getSellerOrders(getCurrentUserId(),
                        org.springframework.data.domain.PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(orders, "Lấy đơn hàng của sạp thành công"));
    }

    /** Seller xác nhận đã xử lý các món của mình trong một đơn. */
    @PostMapping("/orders/{orderId}/confirm")
    public ResponseEntity<ApiResponse<SellerOrderDto>> confirmOrder(@PathVariable Long orderId) {
        SellerOrderDto dto = orderWorkflowService.sellerConfirmItems(orderId, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(dto, "Đã xác nhận đơn hàng"));
    }

    /** Seller chuyển đơn của sạp mình sang bước kế tiếp (PRINTING → … → DELIVERED). */
    @PostMapping("/orders/{orderId}/advance")
    public ResponseEntity<ApiResponse<SellerOrderDto>> advanceOrder(@PathVariable Long orderId) {
        SellerOrderDto dto = orderWorkflowService.sellerAdvanceStatus(orderId, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(dto, "Đã chuyển bước xử lý"));
    }

    /** Seller báo đã giao xong và xin admin duyệt hoàn tất. */
    @PostMapping("/orders/{orderId}/request-completion")
    public ResponseEntity<ApiResponse<SellerOrderDto>> requestCompletion(@PathVariable Long orderId) {
        SellerOrderDto dto = orderWorkflowService.sellerRequestCompletion(orderId, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(dto, "Đã gửi yêu cầu hoàn tất, chờ admin duyệt"));
    }

    // ── Wallet: stats & withdrawals ─────────────────────────────────────

    /** Thống kê tổng quan ví & doanh số của seller. */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<com.printhub3.backend.dto.response.SellerStatsDto>> stats() {
        return ResponseEntity.ok(ApiResponse.success(
                sellerWalletService.getStats(getCurrentUserId()), "Lấy thống kê thành công"));
    }

    /** Danh sách yêu cầu rút tiền của seller (phân trang). */
    @GetMapping("/withdrawals")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<com.printhub3.backend.dto.response.WithdrawalDto>>> myWithdrawals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                sellerWalletService.getMyWithdrawals(getCurrentUserId(),
                        org.springframework.data.domain.PageRequest.of(page, size)),
                "Lấy danh sách rút tiền thành công"));
    }

    /** Tạo yêu cầu rút tiền từ số dư ví. */
    @PostMapping("/withdrawals")
    public ResponseEntity<ApiResponse<com.printhub3.backend.dto.response.WithdrawalDto>> requestWithdrawal(
            @Valid @RequestBody com.printhub3.backend.dto.request.WithdrawalRequest request) {
        com.printhub3.backend.dto.response.WithdrawalDto dto =
                sellerWalletService.requestWithdrawal(getCurrentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(dto, "Đã gửi yêu cầu rút tiền, vui lòng chờ admin duyệt"));
    }

    /** Lấy id người dùng hiện tại từ SecurityContext. */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("User is not authenticated");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetailsImpl userDetails) {
            return userDetails.getUserId();
        }
        throw new IllegalStateException("Unable to resolve current user ID");
    }
}
