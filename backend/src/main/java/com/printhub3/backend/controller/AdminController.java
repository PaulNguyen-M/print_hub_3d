package com.printhub3.backend.controller;

import com.printhub3.backend.dto.response.AdminDashboardDto;
import com.printhub3.backend.dto.response.AdminOrderDto;
import com.printhub3.backend.dto.response.AdminProductDto;
import com.printhub3.backend.dto.response.AdminPrintingRequestDto;
import com.printhub3.backend.dto.response.AdminUserDto;
import com.printhub3.backend.dto.response.ApiResponse;
import com.printhub3.backend.dto.response.RevenueStatsDto;
import com.printhub3.backend.dto.request.ReviewApplicationRequest;
import com.printhub3.backend.dto.response.SellerApplicationDto;
import com.printhub3.backend.entity.SellerApplication.ApplicationStatus;
import com.printhub3.backend.security.service.UserDetailsImpl;
import com.printhub3.backend.service.AdminService;
import com.printhub3.backend.service.OrderWorkflowService;
import com.printhub3.backend.service.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * AdminController — Trung tâm quản trị (chỉ ADMIN).
 * Gồm: dashboard, duyệt sản phẩm, quản lý đơn, quản lý người dùng, yêu cầu in 3D,
 * doanh thu, duyệt đơn mở sạp và duyệt yêu cầu rút tiền của người bán.
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final SellerService sellerService;
    private final OrderWorkflowService orderWorkflowService;
    private final com.printhub3.backend.service.SellerWalletService sellerWalletService;

    /** Số liệu tổng quan cho dashboard admin. */
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AdminDashboardDto>> getDashboardOverview() {
        AdminDashboardDto dto = adminService.getDashboardOverview();
        return ResponseEntity.ok(ApiResponse.success(dto, "Admin dashboard overview retrieved successfully"));
    }

    /** Danh sách sản phẩm cho admin duyệt (lọc theo trạng thái). */
    @GetMapping("/products")
    public ResponseEntity<ApiResponse<Page<AdminProductDto>>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction,
            @RequestParam(required = false) String status) {
        Page<AdminProductDto> products = adminService.getProducts(page, size, sortBy, direction, status);
        return ResponseEntity.ok(ApiResponse.success(products, "Products retrieved successfully"));
    }

    /** Duyệt (kích hoạt) một sản phẩm. */
    @PostMapping("/products/{productId}/approve")
    public ResponseEntity<ApiResponse<AdminProductDto>> approveProduct(@PathVariable Long productId) {
        AdminProductDto dto = adminService.approveProduct(productId);
        return ResponseEntity.ok(ApiResponse.success(dto, "Product approved"));
    }

    /** Từ chối một sản phẩm kèm lý do. */
    @PostMapping("/products/{productId}/reject")
    public ResponseEntity<ApiResponse<AdminProductDto>> rejectProduct(
            @PathVariable Long productId,
            @RequestParam(required = false, defaultValue = "") String reason) {
        AdminProductDto dto = adminService.rejectProduct(productId, reason);
        return ResponseEntity.ok(ApiResponse.success(dto, "Product rejected"));
    }

    /** Bật/tắt hiển thị (active) một sản phẩm. */
    @PutMapping("/products/{productId}/status")
    public ResponseEntity<ApiResponse<Void>> updateProductStatus(
            @PathVariable Long productId,
            @RequestParam boolean active) {
        adminService.setProductActive(productId, active);
        return ResponseEntity.ok(ApiResponse.success(null, "Product status updated successfully"));
    }

    /** Danh sách tất cả đơn hàng (phân trang). */
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<Page<AdminOrderDto>>> getOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction) {
        Page<AdminOrderDto> orders = adminService.getOrders(page, size, sortBy, direction);
        return ResponseEntity.ok(ApiResponse.success(orders, "Orders retrieved successfully"));
    }

    /** Danh sách người dùng, có tìm kiếm theo tên/email. */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<AdminUserDto>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction,
            @RequestParam(required = false) String search) {
        Page<AdminUserDto> users = adminService.getUsers(page, size, sortBy, direction, search);
        return ResponseEntity.ok(ApiResponse.success(users, "Users retrieved successfully"));
    }

    /** Khóa/mở khóa (active) một tài khoản. */
    @PutMapping("/users/{userId}/status")
    public ResponseEntity<ApiResponse<Void>> updateUserStatus(
            @PathVariable Long userId,
            @RequestParam boolean active) {
        adminService.setUserActive(userId, active);
        return ResponseEntity.ok(ApiResponse.success(null, "User status updated successfully"));
    }

    /** Đổi vai trò (role) của một người dùng. */
    @PutMapping("/users/{userId}/role")
    public ResponseEntity<ApiResponse<Void>> updateUserRole(
            @PathVariable Long userId,
            @RequestParam String role) {
        adminService.updateUserRole(userId, role);
        return ResponseEntity.ok(ApiResponse.success(null, "User role updated successfully"));
    }

    /** Cập nhật trạng thái một đơn (nhận mọi trạng thái hợp lệ). */
    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<ApiResponse<Void>> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam String status) {
        adminService.updateOrderStatus(orderId, status);
        return ResponseEntity.ok(ApiResponse.success(null, "Order status updated successfully"));
    }

    /** Xác nhận một đơn đã thanh toán và báo cho các sạp liên quan. */
    @PostMapping("/orders/{orderId}/confirm")
    public ResponseEntity<ApiResponse<Void>> confirmOrder(@PathVariable Long orderId) {
        orderWorkflowService.adminConfirmOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xác nhận đơn, đã báo người bán"));
    }

    /** Hoàn tất một đơn đã xác nhận và chi trả cho các sạp (sau khi trừ hoa hồng). */
    @PostMapping("/orders/{orderId}/complete")
    public ResponseEntity<ApiResponse<Void>> completeOrder(@PathVariable Long orderId) {
        orderWorkflowService.adminCompleteOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã hoàn tất đơn và chuyển tiền cho người bán"));
    }

    /** Duyệt hoàn tất phần hàng của MỘT sạp trong đơn và chi tiền cho sạp đó. */
    @PostMapping("/orders/{orderId}/shops/{shopId}/approve")
    public ResponseEntity<ApiResponse<Void>> approveShopCompletion(
            @PathVariable Long orderId, @PathVariable Long shopId) {
        orderWorkflowService.adminApproveShopCompletion(orderId, shopId);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã duyệt hoàn tất và chi tiền cho sạp"));
    }

    /** Danh sách yêu cầu in 3D (phân trang). */
    @GetMapping("/printing-requests")
    public ResponseEntity<ApiResponse<Page<AdminPrintingRequestDto>>> getPrintingRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction) {
        Page<AdminPrintingRequestDto> requests = adminService.getPrintingRequests(page, size, sortBy, direction);
        return ResponseEntity.ok(ApiResponse.success(requests, "Printing requests retrieved successfully"));
    }

    /** Cập nhật trạng thái một yêu cầu in 3D. */
    @PutMapping("/printing-requests/{requestId}/status")
    public ResponseEntity<ApiResponse<Void>> updatePrintingRequestStatus(
            @PathVariable Long requestId,
            @RequestParam String status) {
        adminService.updatePrintingRequestStatus(requestId, status);
        return ResponseEntity.ok(ApiResponse.success(null, "Printing request status updated successfully"));
    }

    /** Thống kê doanh thu (tổng, giá trị đơn trung bình, theo tháng). */
    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<RevenueStatsDto>> getRevenueStats() {
        RevenueStatsDto stats = adminService.getRevenueStats();
        return ResponseEntity.ok(ApiResponse.success(stats, "Revenue statistics retrieved successfully"));
    }

    // ── Seller applications (mở sạp) ────────────────────────────────────

    /** Danh sách đơn đăng ký mở sạp (lọc theo trạng thái). */
    @GetMapping("/seller-applications")
    public ResponseEntity<ApiResponse<Page<SellerApplicationDto>>> getSellerApplications(
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<SellerApplicationDto> applications =
                sellerService.listApplications(status, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(applications, "Seller applications retrieved successfully"));
    }

    /** Duyệt đơn mở sạp (tạo sạp cho người nộp). */
    @PostMapping("/seller-applications/{applicationId}/approve")
    public ResponseEntity<ApiResponse<SellerApplicationDto>> approveSellerApplication(
            @PathVariable Long applicationId) {
        SellerApplicationDto dto = sellerService.approveApplication(applicationId, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(dto, "Đã duyệt đơn mở sạp"));
    }

    /** Từ chối đơn mở sạp kèm lý do. */
    @PostMapping("/seller-applications/{applicationId}/reject")
    public ResponseEntity<ApiResponse<SellerApplicationDto>> rejectSellerApplication(
            @PathVariable Long applicationId,
            @RequestBody(required = false) ReviewApplicationRequest request) {
        String reason = request != null ? request.getRejectionReason() : null;
        SellerApplicationDto dto = sellerService.rejectApplication(applicationId, getCurrentUserId(), reason);
        return ResponseEntity.ok(ApiResponse.success(dto, "Đã từ chối đơn mở sạp"));
    }

    // ── Seller wallet withdrawals ───────────────────────────────────────

    /** Danh sách yêu cầu rút tiền của người bán (lọc theo trạng thái). */
    @GetMapping("/withdrawals")
    public ResponseEntity<ApiResponse<Page<com.printhub3.backend.dto.response.WithdrawalDto>>> getWithdrawals(
            @RequestParam(required = false) com.printhub3.backend.entity.Withdrawal.WithdrawalStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<com.printhub3.backend.dto.response.WithdrawalDto> list =
                sellerWalletService.listWithdrawals(status, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(list, "Withdrawals retrieved successfully"));
    }

    /** Duyệt & chuyển tiền cho một yêu cầu rút. */
    @PostMapping("/withdrawals/{withdrawalId}/approve")
    public ResponseEntity<ApiResponse<com.printhub3.backend.dto.response.WithdrawalDto>> approveWithdrawal(
            @PathVariable Long withdrawalId) {
        return ResponseEntity.ok(ApiResponse.success(
                sellerWalletService.approveWithdrawal(withdrawalId, getCurrentUserId()),
                "Đã duyệt & chuyển tiền"));
    }

    /** Từ chối một yêu cầu rút tiền kèm lý do. */
    @PostMapping("/withdrawals/{withdrawalId}/reject")
    public ResponseEntity<ApiResponse<com.printhub3.backend.dto.response.WithdrawalDto>> rejectWithdrawal(
            @PathVariable Long withdrawalId,
            @RequestBody(required = false) ReviewApplicationRequest request) {
        String reason = request != null ? request.getRejectionReason() : null;
        return ResponseEntity.ok(ApiResponse.success(
                sellerWalletService.rejectWithdrawal(withdrawalId, getCurrentUserId(), reason),
                "Đã từ chối yêu cầu rút tiền"));
    }

    /** Lấy id admin hiện tại từ SecurityContext. */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl userDetails) {
            return userDetails.getUserId();
        }
        return null;
    }
}
