package com.printhub3.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Configurable marketplace fees for the shop / seller system.
 * Bound from {@code marketplace.shop.*} in application.properties.
 */
@Component
@ConfigurationProperties(prefix = "marketplace.shop")
@Getter
@Setter
public class MarketplaceProperties {

    /** One-time fee to open a shop, in VND. 0 = free. */
    private BigDecimal openingFee = BigDecimal.ZERO;

    /** Default commission taken from each completed sale (fraction, e.g. 0.15 = 15%). */
    private BigDecimal commissionRate = new BigDecimal("0.15");
}
