package com.printhub3.backend.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * A seller's view of an order: only the items belonging to their shop, plus the
 * earnings they will receive (gross minus platform commission).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerOrderDto {

    private Long orderId;
    private String orderNumber;
    private String orderStatus;
    private String buyerName;
    private String shippingAddress;
    private String shippingCity;
    private LocalDateTime createdAt;

    private List<OrderItemDto> items;

    /** Total of this shop's items in the order. */
    private BigDecimal shopSubtotal;
    private BigDecimal commissionRate;
    private BigDecimal commissionAmount;
    private BigDecimal netEarning;

    /** Whether the seller has confirmed all their items. */
    private Boolean sellerConfirmed;

    /** Whether this shop has already been paid out for this order. */
    private Boolean paidOut;
}
