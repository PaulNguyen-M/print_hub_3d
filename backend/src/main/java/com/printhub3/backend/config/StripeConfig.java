package com.printhub3.backend.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * StripeConfig — Nạp khóa bí mật của Stripe khi khởi động (nếu được cấu hình).
 */
@Slf4j
@Configuration
public class StripeConfig {

    @Value("${stripe.secret-key:}")
    private String stripeSecretKey;

    /** Khởi tạo Stripe API key lúc khởi động; cảnh báo nếu chưa cấu hình. */
    @PostConstruct
    public void init() {
        if (stripeSecretKey == null || stripeSecretKey.isBlank()) {
            log.warn("Stripe secret key is not configured. Stripe integration will not work until stripe.secret-key is set.");
            return;
        }
        Stripe.apiKey = stripeSecretKey;
        log.info("Stripe API key initialized.");
    }
}
