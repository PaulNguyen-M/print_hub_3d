package com.printhub3.backend.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class StripeConfig {

    @Value("${stripe.secret-key:}")
    private String stripeSecretKey;

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
