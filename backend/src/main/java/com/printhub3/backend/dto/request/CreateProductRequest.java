package com.printhub3.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;

/**
 * Request to create a new product (creator/seller).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateProductRequest {

    @NotBlank(message = "Tên sản phẩm là bắt buộc")
    private String title;

    private String description;

    @NotNull(message = "Giá là bắt buộc")
    @Positive(message = "Giá phải lớn hơn 0")
    private BigDecimal price;

    private String category;

    private Boolean isDigital;

    private String thumbnailUrl;

    /** Danh sách link ảnh (ảnh đầu tiên là ảnh chính). */
    private java.util.List<String> images;

    /** URL file STL/3D để khách tải về (giữ cho tương thích — file đầu tiên). */
    private String stlFileUrl;

    /** Danh sách file STL/3D (mô hình nhiều bộ phận = nhiều file). */
    private java.util.List<StlFileRequest> stlFiles;

    private Integer stockQuantity;
}
