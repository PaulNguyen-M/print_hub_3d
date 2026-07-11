package com.printhub3.backend.dto.response;

import lombok.*;

/**
 * Public-facing category for the marketplace filter.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class CategoryDto {
    private Long categoryId;
    private String name;
    private String iconUrl;
}
