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
 * SellerController - Buyer-facing endpoints for applying to open a shop.
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

    /** Submit an application to open a shop. */
    @PostMapping("/apply")
    public ResponseEntity<ApiResponse<SellerApplicationDto>> apply(
            @Valid @RequestBody SellerApplicationRequest request) {
        SellerApplicationDto dto = sellerService.applyForShop(getCurrentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(dto, "Đã gửi đơn đăng ký mở sạp, vui lòng chờ admin duyệt"));
    }

    /** The current user's most recent application (or null). */
    @GetMapping("/application")
    public ResponseEntity<ApiResponse<SellerApplicationDto>> myLatestApplication() {
        SellerApplicationDto dto = sellerService.getMyLatestApplication(getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(dto, "Lấy đơn đăng ký thành công"));
    }

    /** All of the current user's applications. */
    @GetMapping("/applications")
    public ResponseEntity<ApiResponse<List<SellerApplicationDto>>> myApplications() {
        List<SellerApplicationDto> list = sellerService.getMyApplications(getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh sách đơn đăng ký thành công"));
    }

    /** The current user's own shop (null if they don't have one yet). */
    @GetMapping("/shop")
    public ResponseEntity<ApiResponse<ShopDto>> myShop() {
        ShopDto shop = shopService.getShopByOwner(getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(shop, "Lấy thông tin sạp thành công"));
    }

    /** Update the current user's shop (name, description, logo, banner). */
    @PutMapping("/shop")
    public ResponseEntity<ApiResponse<ShopDto>> updateMyShop(
            @Valid @RequestBody com.printhub3.backend.dto.request.UpdateShopRequest request) {
        ShopDto shop = shopService.updateMyShop(getCurrentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(shop, "Cập nhật sạp thành công"));
    }

    /** Orders containing the current seller's products, with earnings. */
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<SellerOrderDto>>> myOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        org.springframework.data.domain.Page<SellerOrderDto> orders =
                orderWorkflowService.getSellerOrders(getCurrentUserId(),
                        org.springframework.data.domain.PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(orders, "Lấy đơn hàng của sạp thành công"));
    }

    /** Seller confirms fulfillment of their items in an order. */
    @PostMapping("/orders/{orderId}/confirm")
    public ResponseEntity<ApiResponse<SellerOrderDto>> confirmOrder(@PathVariable Long orderId) {
        SellerOrderDto dto = orderWorkflowService.sellerConfirmItems(orderId, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(dto, "Đã xác nhận đơn hàng"));
    }

    // ── Wallet: stats & withdrawals ─────────────────────────────────────

    /** Dashboard statistics for the current seller's wallet & sales. */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<com.printhub3.backend.dto.response.SellerStatsDto>> stats() {
        return ResponseEntity.ok(ApiResponse.success(
                sellerWalletService.getStats(getCurrentUserId()), "Lấy thống kê thành công"));
    }

    /** The current seller's withdrawal requests (paginated). */
    @GetMapping("/withdrawals")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<com.printhub3.backend.dto.response.WithdrawalDto>>> myWithdrawals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                sellerWalletService.getMyWithdrawals(getCurrentUserId(),
                        org.springframework.data.domain.PageRequest.of(page, size)),
                "Lấy danh sách rút tiền thành công"));
    }

    /** Request a withdrawal from the wallet balance. */
    @PostMapping("/withdrawals")
    public ResponseEntity<ApiResponse<com.printhub3.backend.dto.response.WithdrawalDto>> requestWithdrawal(
            @Valid @RequestBody com.printhub3.backend.dto.request.WithdrawalRequest request) {
        com.printhub3.backend.dto.response.WithdrawalDto dto =
                sellerWalletService.requestWithdrawal(getCurrentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(dto, "Đã gửi yêu cầu rút tiền, vui lòng chờ admin duyệt"));
    }

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
