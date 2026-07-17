package com.printhub3.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import java.util.List;

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
    
    /** Các sạp có hàng trong đơn, kèm trạng thái xử lý của từng sạp. */
    private List<ShopFulfillmentDto> shops;
}
