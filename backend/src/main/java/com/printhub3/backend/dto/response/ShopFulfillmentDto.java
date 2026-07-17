package com.printhub3.backend.dto.response;

import lombok.*;

/**
 * ShopFulfillmentDto — Trạng thái xử lý của một sạp trong một đơn (dùng cho màn admin).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopFulfillmentDto {
    private Long shopId;
    private String shopName;
    /** CONFIRMED / PRINTING / FINISHING / SHIPPING / DELIVERED / AWAITING_APPROVAL / COMPLETED */
    private String fulfillmentStatus;
}
