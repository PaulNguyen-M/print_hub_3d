package com.printhub3.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentTransactionDto {
    private Long transactionId;
    private String transactionType;
    private BigDecimal amount;
    private String responseCode;
    private String responseMessage;
    private LocalDateTime createdAt;
}
