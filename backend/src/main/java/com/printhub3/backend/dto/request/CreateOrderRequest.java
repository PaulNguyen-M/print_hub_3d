package com.printhub3.backend.dto.request;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderRequest {
    private String shippingAddress;
    private String shippingCity;
    private String shippingStateProvince;
    private String shippingPostalCode;
    private String shippingCountry;
    private String shippingMethod;
    private String paymentMethod;
    private String notes;
}
