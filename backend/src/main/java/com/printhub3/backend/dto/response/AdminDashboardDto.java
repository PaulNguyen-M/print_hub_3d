package com.printhub3.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;



@Data
@Builder
public class AdminDashboardDto {
    private long totalUsers;
    private long activeUsers;
    private long totalProducts;
    private long totalOrders;
    private double totalRevenue;
    private long pendingOrders;
    private long pendingPrintingRequests;
    private long pendingProducts;
    private long pendingSellerApplications;
    private long pendingWithdrawals;
    /** Số người dùng đang hoạt động theo vai trò (BUYER/SELLER/PRINTER_PARTNER/ADMIN) — cho biểu đồ phân bố. */
    private Map<String, Long> roleDistribution;
    private List<RevenuePointDto> monthlyRevenue;
}
