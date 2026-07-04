package com.printhub3.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class RevenueStatsDto {
    private double totalRevenue;
    private double averageOrderValue;
    private long orderCount;
    private List<RevenuePointDto> monthlyRevenue;
}
