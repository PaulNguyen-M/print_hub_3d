package com.printhub3.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * Phục vụ file tĩnh đã upload (ảnh sản phẩm, avatar) từ thư mục local 'uploads/'.
 * URL: http://localhost:8080/uploads/...
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    /** Ánh xạ URL /uploads/** tới thư mục local 'uploads/'. */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadPath = Paths.get("uploads").toAbsolutePath().toUri().toString();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPath);
    }
}
