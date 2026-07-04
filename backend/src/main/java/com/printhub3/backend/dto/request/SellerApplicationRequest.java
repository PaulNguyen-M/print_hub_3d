package com.printhub3.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Request body for a buyer applying to open a shop ("mở sạp").
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerApplicationRequest {

    @NotBlank(message = "Tên sạp là bắt buộc")
    @Size(min = 3, max = 150, message = "Tên sạp từ 3-150 ký tự")
    private String shopName;

    @Size(max = 2000, message = "Mô tả tối đa 2000 ký tự")
    private String description;
}
