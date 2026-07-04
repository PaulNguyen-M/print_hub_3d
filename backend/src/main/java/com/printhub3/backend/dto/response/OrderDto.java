package com.printhub3.backend.dto.response;

import com.printhub3.backend.dto.response.PaymentDto;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDto {
    private Long orderId;
    private String orderNumber;
    private BigDecimal totalAmount;
    private BigDecimal shippingFee;
    private BigDecimal tax;
    private String orderStatus;
    private String shippingAddress;
    private String shippingCity;
    private String shippingStateProvince;
    private String shippingPostalCode;
    private String shippingCountry;
    private String shippingMethod;
    private String paymentMethod;
    private String trackingNumber;
    private LocalDateTime estimatedDelivery;
    private LocalDateTime deliveredAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<OrderItemDto> items;
    private List<OrderTimelineDto> timeline;
    private PaymentDto payment;
}
