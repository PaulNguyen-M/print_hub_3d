package com.printhub3.backend.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderTimelineDto {
    private String status;
    private String title;
    private String description;
    private LocalDateTime timestamp;
}
