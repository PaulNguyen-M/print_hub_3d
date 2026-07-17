package com.printhub3.backend.controller;

import com.printhub3.backend.dto.response.ApiResponse;
import com.printhub3.backend.dto.response.CategoryDto;
import com.printhub3.backend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * CategoryController — Danh mục sản phẩm (công khai).
 * Cung cấp danh sách danh mục đang hoạt động cho bộ lọc ở trang chợ.
 */
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryRepository categoryRepository;

    /** Danh mục đang hoạt động, sắp theo displayOrder. Công khai (đã permitAll trong security). */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getCategoties() {
        List<CategoryDto> categories = categoryRepository.findAllActiveCategories().stream()
                .map(c -> CategoryDto.builder()
                        .categoryId(c.getCategoryId())
                        .name(c.getName())
                        .iconUrl(c.getIconUrl())
                        .build())
                .toList();
        return ResponseEntity.ok(ApiResponse.success(categories, "Categories retrieved successfully"));
    }
}