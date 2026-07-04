package com.printhub3.backend.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartDto {
    private Long cartId;
    private Integer totalItems;
    private BigDecimal totalPrice;
    private List<CartItemDto> items;
}
