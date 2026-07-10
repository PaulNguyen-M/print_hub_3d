package com.printhub3.backend.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Aggregated dashboard statistics for a seller's shop wallet & sales.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerStatsDto {

    /** Money available to withdraw right now (shop balance minus held requests). */
    private BigDecimal availableBalance;

    /** Lifetime net earnings credited to the wallet (after commission). */
    private BigDecimal totalEarned;

    /** Lifetime gross sales (before commission). */
    private BigDecimal totalGross;

    /** Lifetime platform commission taken. */
    private BigDecimal totalCommission;

    /** Total already successfully withdrawn. */
    private BigDecimal totalWithdrawn;

    /** Amount currently locked in pending withdrawal requests. */
    private BigDecimal pendingWithdraw;

    /** Number of completed (paid-out) orders for this shop. */
    private int totalOrders;

    /** Total product units sold. */
    private int totalProductsSold;

    /** Number of active product listings. */
    private int totalProducts;

    /** Net revenue per month for the last 6 months (chart). */
    private List<MonthlyRevenue> monthlyRevenue;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlyRevenue {
        private String month;        // e.g. "T7"
        private BigDecimal revenue;  // net earnings that month
    }
}
