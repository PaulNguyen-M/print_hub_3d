package com.printhub3.backend.dto.response;

import com.printhub3.backend.entity.Order.OrderStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemDto {
    private Long orderItemId;
    private Long productId;
    private String productName;
    private String productImage;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    /** Sạp bán sản phẩm này (null nếu sản phẩm không thuộc sạp nào). */
    private Long shopId;
    private String shopName;
    /** Trạng thái xử lý của SẠP cho món này: CONFIRMED/PRINTING/.../DELIVERED/AWAITING_APPROVAL/COMPLETED. */
    private String fulfillmentStatus;
}
