package com.printhub3.backend.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** PrintingRequestDto — Yêu cầu in 3D dưới góc nhìn của khách (chủ yêu cầu). */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrintingRequestDto {
    private Long requestId;
    private String fileName;
    private String fileUrl;
    private String fileFormat;
    private Long fileSize;
    private String modelStatus;
    private BigDecimal quoteAmount;
    private String quoteNotes;
    private String requirements;
    private LocalDateTime createdAt;
}
