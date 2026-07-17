package com.printhub3.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * MarketplaceProperties — Các mức phí cấu hình được cho hệ thống sạp/người bán.
 * Nạp từ {@code marketplace.shop.*} trong application.properties.
 */
@Component
@ConfigurationProperties(prefix = "marketplace.shop")
@Getter
@Setter
public class MarketplaceProperties {

    /** Phí mở sạp một lần, tính bằng VND. 0 = miễn phí. */
    private BigDecimal openingFee = BigDecimal.ZERO;

    /** Hoa hồng mặc định trừ trên mỗi đơn hoàn tất (dạng phân số, vd 0.15 = 15%). */
    private BigDecimal commissionRate = new BigDecimal("0.15");
}
