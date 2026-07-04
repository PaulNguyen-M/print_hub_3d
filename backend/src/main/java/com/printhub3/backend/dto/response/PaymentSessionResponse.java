package com.printhub3.backend.dto.response;

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
public class PaymentSessionResponse {
    private Long paymentId;
    private Long orderId;
    private String checkoutUrl;
    private String sessionId;
}
