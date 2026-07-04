package com.printhub3.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentDto {
    private Long paymentId;
    private Long orderId;
    private BigDecimal amount;
    private String paymentStatus;
    private String paymentMethod;
    private String paymentGateway;
    private String gatewayTransactionId;
    private String gatewayResponseCode;
    private String gatewayResponseMessage;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<PaymentTransactionDto> transactions;
}
