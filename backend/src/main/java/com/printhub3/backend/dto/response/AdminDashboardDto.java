package com.printhub3.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

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
    private List<RevenuePointDto> monthlyRevenue;
}
