package com.printhub3.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Public-facing product response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {
    private Long id;
    private String title;
    private String description;
    private double price;
    private String thumbnailUrl;
    private String imageUrl;
    private String material;
    private String category;
    private String sellerName;
    private Long shopId;
    private String shopName;
    private String shopSlug;
    private Double rating;
    private Integer reviewCount;
    private Integer stockQuantity;
    private Integer totalSold;
    private String createdAt;
    private java.util.List<String> images;
    private String stlFileUrl;
    private java.util.List<ProductStlFileDto> stlFiles;
    private String status;
    private String rejectionReason;
}
