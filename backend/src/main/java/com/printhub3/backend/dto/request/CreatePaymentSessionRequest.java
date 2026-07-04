package com.printhub3.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePaymentSessionRequest {
    private Long orderId;
    private String paymentMethod;
    private String successUrl;
    private String cancelUrl;
}
