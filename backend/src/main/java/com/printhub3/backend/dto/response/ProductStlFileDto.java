package com.printhub3.backend.dto.response;

import lombok.*;

/**
 * One STL/3D file of a product (public).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductStlFileDto {
    private Long id;
    private String url;
    private String fileName;
}
