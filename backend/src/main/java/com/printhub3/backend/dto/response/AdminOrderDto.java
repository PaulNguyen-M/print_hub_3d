package com.printhub3.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class AdminOrderDto {
    private Long orderId;
    private String orderNumber;
    private String customerName;
    private BigDecimal totalAmount;
    private String orderStatus;
    private String paymentMethod;
    private String trackingNumber;
    private LocalDateTime createdAt;
}
