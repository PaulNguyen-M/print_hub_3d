package com.printhub3.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class AdminPrintingRequestDto {
    private Long requestId;
    private String userName;
    private String fileName;
    private String modelStatus;
    private BigDecimal quoteAmount;
    private LocalDateTime createdAt;
}
