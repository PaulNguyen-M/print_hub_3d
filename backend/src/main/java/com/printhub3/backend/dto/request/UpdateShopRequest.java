package com.printhub3.backend.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

/**
 * Request body for a seller updating their own shop ("sạp").
 * Null fields are left unchanged.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateShopRequest {

    @Size(min = 3, max = 150, message = "Tên sạp từ 3-150 ký tự")
    private String name;

    @Size(max = 2000, message = "Mô tả tối đa 2000 ký tự")
    private String description;

    private String logoUrl;

    private String bannerUrl;

    /** Up to 6 product IDs to pin as "Nổi bật". Send empty list to clear. */
    private List<Long> featuredProductIds;
}
