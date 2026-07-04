package com.printhub3.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RevenuePointDto {
    private String period;
    private Double revenue;
}
